import {NextFunction, Request, Response, Router} from "express";
import { SignupProof, Prover } from '@unirep/circuits'
import { ethers } from 'ethers'
import {Synchronizer, UserState} from '@unirep/core'
import authToken from "../middleware/authToken";
import {defaultProver} from "@unirep/circuits/provers/defaultProver";
import { SQLiteConnector } from 'anondb/node.js'
import MyUser from "../models/MyUser";
import {Identity} from "@semaphore-protocol/identity";
import { stringifyBigInts } from '@unirep/utils'
import {sendError} from "../common/SendError";
import {SERVER} from "../config";
import {DataProof} from "../DataProof";

const UNIREP_ADDRESS = '0x4D137bb44553d55AE6B28B5391c6f537b06C9cc3'
const APP_ADDRESS = '0x9A676e781A523b5d0C0e43731313A708CB607508'
const ETH_PROVIDER_URL = 'http://127.0.0.1:8545'
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const providerURL = 'http://127.0.0.1:8545'
const provider = new ethers.providers.JsonRpcProvider(providerURL);

export const uniUserStatus = {} as {
  [userId: string]: {
    userState: UserState,
    hasSignedUp?: boolean,
    latestTransitionedEpoch?: number,
    data?: bigint[],
    provableData?: bigint[],
  }
}

// MyUser.find({}).then((users) => {
//   users.forEach((user) => {
//     user.uniRepId = new Identity().toString()
//     user.save().then(async () => {
//       await uniRepLoad(user.userId)
//       await uniRepSignUp(user.userId)
//     })
//   })
// });

export const uniRepLoad = async (userId: string) => {
  try {
    const user = await MyUser.findOne({userId: userId})
    if (!user) {
      throw new Error('user not found')
    }

    const identity = new Identity(user.uniRepId)
    const userState = new UserState({
      provider,
      prover: defaultProver,
      unirepAddress: UNIREP_ADDRESS,
      attesterId: BigInt(APP_ADDRESS),
      id: identity,
    })

    await userState.sync.start()
    const hasSignedUp = await userState.hasSignedUp()
    uniUserStatus[userId] = {
      userState: userState,
      hasSignedUp: hasSignedUp,
    }
    await userState.waitForSync()

    if (hasSignedUp) {
      await loadData(userId)
      uniUserStatus[userId].latestTransitionedEpoch = await uniUserStatus[userId].userState.latestTransitionedEpoch()
    }
  } catch (e) {
    throw e;
  }
};

async function loadData(userId: string) {
  if (!uniUserStatus[userId].userState) throw new Error('user state not initialized')

  uniUserStatus[userId].data = await uniUserStatus[userId].userState.getData()
  uniUserStatus[userId].provableData = await uniUserStatus[userId].userState.getProvableData()
}

export const uniRepSignUp = async (userId: string) => {
  try {
    const userState = uniUserStatus[userId].userState
    if (!userState) throw new Error('user state not initialized')

    const signupProof = await userState.genUserSignUpProof()
    const data = await fetch(`${SERVER}/api/signup`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicSignals: signupProof.publicSignals.map((n) =>
          n.toString()
        ),
        proof: signupProof.proof,
      }),
    }).then((r) => r.json())
    await provider.waitForTransaction(data.hash)
    await userState.waitForSync()

    uniUserStatus[userId].hasSignedUp = await userState.hasSignedUp()
    uniUserStatus[userId].latestTransitionedEpoch = userState.sync.calcCurrentEpoch()
  } catch (e) {
    throw e;
  }
}

export const uniRepTransition = async (userId: string) => {
  try {
    const userState = uniUserStatus[userId].userState
    if (!userState) throw new Error('user state not initialized')

    await userState.waitForSync()
    const signupProof = await userState.genUserStateTransitionProof()
    const data = await fetch(`${SERVER}/api/transition`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicSignals: signupProof.publicSignals.map((n) =>
          n.toString()
        ),
        proof: signupProof.proof,
      }),
    }).then((r) => r.json())
    await provider.waitForTransaction(data.hash)
    await userState.waitForSync()
    await loadData(userId)
    uniUserStatus[userId].latestTransitionedEpoch = await userState.latestTransitionedEpoch()
  } catch (e) {
    throw e;
  }
}

export const uniRepAttest = async (userId: string, reqData: any, epkNonce: number) => {
  try {
    const userState = uniUserStatus[userId].userState
    if (!userState) throw new Error('user state not initialized')
    if (userState && userState.sync.calcCurrentEpoch() !== (await userState.latestTransitionedEpoch())) {
      await uniRepTransition(userId)
    }

    for (const key of Object.keys(reqData)) {
      if (reqData[+key] === '') {
        delete reqData[+key]
        continue
      }
    }
    if (Object.keys(reqData).length === 0) {
      throw new Error('No data in the attestation')
    }
    const epochKeyProof = await userState.genEpochKeyProof({
      nonce: epkNonce,
    })
    const publicSignals = epochKeyProof.publicSignals.map((n) =>
      n.toString()
    )
    const payload = JSON.stringify(
      stringifyBigInts({
        reqData,
        publicSignals: publicSignals,
        proof: epochKeyProof.proof,
      }));
    const data = await fetch(`${SERVER}/api/request`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: payload
    }).then((r) => r.json())
    await provider.waitForTransaction(data.hash)
    await userState.waitForSync()
    await loadData(userId)

    return data
  } catch (e) {
    throw e;
  }
}

export const uniRepProve = async (userId: string, proveData: any) => {
  try {
    const userState = uniUserStatus[userId].userState
    if (!userState) throw new Error('user state not initialized')

    const epoch = await userState.sync.loadCurrentEpoch()
    const stateTree = await userState.sync.genStateTree(epoch)
    const index = await userState.latestStateTreeLeafIndex(epoch)
    const stateTreeProof = stateTree.createProof(index)
    const provableData = await userState.getProvableData()
    const sumFieldCount = userState.sync.settings.sumFieldCount
    const values = Array(sumFieldCount).fill(0)
    for (let [key, value] of Object.entries(proveData)) {
      values[Number(key)] = value
    }
    const attesterId = userState.sync.attesterId
    const circuitInputs = stringifyBigInts({
      identity_secret: userState.id.secret,
      state_tree_indexes: stateTreeProof.pathIndices,
      state_tree_elements: stateTreeProof.siblings,
      data: provableData,
      epoch: epoch,
      attester_id: attesterId,
      value: values,
    })
    const prover = defaultProver
    const {publicSignals, proof} = await prover.genProofAndPublicSignals(
      'dataProof',
      circuitInputs
    )
    const dataProof = new DataProof(publicSignals, proof, prover)
    const valid = await dataProof.verify()
    return stringifyBigInts({
      publicSignals: dataProof.publicSignals,
      proof: dataProof.proof,
      valid,
    })
  } catch (e) {
    throw e;
  }
}
