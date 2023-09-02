import {Request, Response, Router} from "express";
import {sendResponse} from "../common/CommonResponse";
import {sendError} from "../common/SendError";
import Country from "../models/Country";
import { deployUnirep } from '@unirep/contracts/deploy'
import { getUnirepContract, Unirep } from '@unirep/contracts'
import { genEpochKey } from '@unirep/utils'
import {ethers} from "ethers";
const router = Router();

import { UserState } from '@unirep/core'
import { defaultProver } from '@unirep/circuits/provers/defaultProver'
import { Identity } from "@semaphore-protocol/identity"
import MyUser from "../models/MyUser";


/**
 * #1000 국가목록 조회
 */
router.get('/country', async (req: Request, res: Response) => {
  try {
    const country = await Country.find({}, { _id: 0, __v: 0 }, { sort: { countryName: 1 } });
    sendResponse(res, country);
  } catch (e) {
    sendError(res, e)
  }
});


const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const providerURL = 'http://127.0.0.1:8545'
const provider = new ethers.providers.JsonRpcProvider(providerURL);
const _address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
let _unirepContract: Unirep = getUnirepContract(_address, provider)
// connect to a wallet
/**
 * deploy
 */
let deployer: ethers.Wallet = new ethers.Wallet(privateKey, provider)
deployUnirep(deployer).then((unirepContract) => {
  _unirepContract = unirepContract
})
router.get('/deploy', async (req: Request, res: Response) => {
  try {
    // connect to a wallet
    deployer = new ethers.Wallet(privateKey, provider)
    _unirepContract = await deployUnirep(deployer)

    sendResponse(res, deployer);
  } catch (e) {
    sendError(res, e)
  }
});
/**
 * test
 */
router.get('/connection', async (req: Request, res: Response) => {
  try {
    const address = '0x4A0dc8522a33f5aD5d878dd2246DAD9a86c35dC0'
    const unirep = getUnirepContract(address, provider)
    sendResponse(res, unirep);
  } catch (e) {
    sendError(res, e)
  }
});
/**
 * 사용자가 가입
 */
let attester = new ethers.Wallet(privateKey, provider)
let attesterUnirepContract;
router.get('/joinAttester', async (req: Request, res: Response) => {
  try {
    attesterUnirepContract = await _unirepContract.connect(attester)

    const user = await MyUser.findById('64edbf5d46036fb5ab1262db')
    if (user) {
      user.uniRepAttester = attester
      user.uniRepAttesterContract = attesterUnirepContract
      await user.save()
    }

// define epoch length
    const epochLength = 300 // 300 seconds
// send transaction
    const tx = await attesterUnirepContract.attesterSignUp(epochLength)
    await tx.wait()
    sendResponse(res);
  } catch (e) {
    sendError(res, e)
  }
});
/**
 * 사용자가 가입
 */
router.get('/joinCustomer', async (req: Request, res: Response) => {
  try {
    // Semaphore Identity
    const id = new Identity()
    // generate user state
    const userState = new UserState({
      prover: defaultProver, // a circuit prover
      unirepAddress: _unirepContract.address,
      provider: provider, // an ethers.js provider
      id,
    })

// start and sync
    await userState.start()
    await userState.waitForSync()

    const user = await MyUser.findById('64edbf5d46036fb5ab1262db')
    if (user) {
      user.uniRepId = id.toString()
      user.uniRepUser = userState
      await user.save()
    }

    const { proof, publicSignals } = await userState.genUserSignUpProof()

    sendResponse(res);
  } catch (e) {
    sendError(res, e)
  }
});

/**
 * epoch
 */
router.get('/epoch', async (req: Request, res: Response) => {
  try {
    const attester = new ethers.Wallet(privateKey, provider)
    const user = await MyUser.findById('64edbf5d46036fb5ab1262db')
    if (!user) {
      throw new Error('user not found')
    }

    const identity = new Identity(user.uniRepId)
    const userState = user.uniRepUser as UserState
    // const attesterUnirepContract = await _unirepContract.connect(attester)
    const epoch = await _unirepContract.attesterCurrentEpoch(attester.address)
// define nonce
    const nonce = 0 // it could be 0 to (NUM_EPOCH_KEY_NONCE - 1) per user
// generate an epoch key
    const epochKey = genEpochKey(
      identity.secret,
      BigInt(user.uniRepAttester.address),
      epoch,
      nonce
    )

    user.uniRepEpochKey = epochKey
    await user.save()
    sendResponse(res);
  } catch (e) {
    sendError(res, e)
  }
});

/**
 * change
 */
router.get('/change', async (req: Request, res: Response) => {
  try {
    const user = await MyUser.findById('64edbf5d46036fb5ab1262db')
    if (!user) {
      throw new Error('user not found')
    }

    const identity = new Identity(user.uniRepId)
    const epoch = await _unirepContract.attesterCurrentEpoch(attester.address)
// define nonce
    const nonce = 0 // it could be 0 to (NUM_EPOCH_KEY_NONCE - 1) per user
// generate an epoch key
    const epochKey = genEpochKey(
      identity.secret,
      BigInt(user.uniRepAttester.address),
      epoch,
      nonce
    )

// attester sends the tx
// the data field that the attester chooses to change
    const fieldIndex = 0
// the amount of the change
    const change = 5
    const conn = await _unirepContract.connect(attester)
    const tx = await conn
      .attest(
        epochKey,
        epoch,
        fieldIndex,
        change
      )
    await tx.wait()
    sendResponse(res);
  } catch (e) {
    sendError(res, e)
  }
});
/**
 * generates data proof
 */
router.post('/proof', async (req: Request, res: Response) => {
  try {
    const user = await MyUser.findById('64edbf5d46036fb5ab1262db')
    if (!user) {
      throw new Error('user not found')
    }

    const identity = new Identity(user.uniRepId)
    const userState = new UserState({
      prover: defaultProver, // a circuit prover
      unirepAddress: _unirepContract.address,
      provider: provider, // an ethers.js provider
      id: identity,
    })

    // start and sync
    await userState.waitForSync()

// the data that the user wants to prove
// If the user has 5, they can choose to prove they have more than 3
    const repProof = await userState.genProveReputationProof({
      minRep: 3
    })
// check if proof is valid
    console.log(await repProof.verify()) // true

// we will use { publicSignals, proof} later
    const { publicSignals, proof } = repProof

    sendResponse(res);
  } catch (e) {
    sendError(res, e)
  }
});

module.exports = router;
export default class indexRouter {
}
