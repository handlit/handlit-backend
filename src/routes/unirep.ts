import {Request, Response, Router} from "express";
import {ethers} from 'ethers'
import authToken from "../middleware/authToken";
import {uniRepAttest, uniRepLoad, uniRepProve, uniRepSignUp, uniRepTransition} from "../module/UniRep";
import {sendError} from "../common/SendError";
import {sendResponse} from "../common/CommonResponse";

const UNIREP_ADDRESS = '0x4D137bb44553d55AE6B28B5391c6f537b06C9cc3'
const APP_ADDRESS = '0x9A676e781A523b5d0C0e43731313A708CB607508'
const ETH_PROVIDER_URL = 'http://127.0.0.1:8545'
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const providerURL = 'http://127.0.0.1:8545'
const provider = new ethers.providers.JsonRpcProvider(providerURL);

const router = Router();
/**
 * UniRep init user
 */
router.get('/load', authToken, async (req: Request, res: Response) => {
  try {
    await uniRepLoad(req.userId as string)
    sendResponse(res)
  } catch (e) {
    sendError(res, e)
  }
});

/**
 * UniRep sign up
 */
router.get('/signup', authToken, async (req: Request, res: Response) => {
  try {
    await uniRepSignUp(req.userId as string)
    sendResponse(res)
  } catch (e) {
    sendError(res, e)
  }
});

/**
 * UniRep transition
 */
router.get('/transition', authToken, async (req: Request, res: Response) => {
  try {
    await uniRepTransition(req.userId as string)
    sendResponse(res)
  } catch (e) {
    sendError(res, e)
  }
});
/**
 * UniRep uniRepAttest
 */
router.get('/attest', authToken, async (req: Request, res: Response) => {
  try {
    const reqData = {
      0: req.body.data0,
      1: req.body.data1,
      2: req.body.data2,
      3: req.body.data3,
      4: req.body.data4,
      5: req.body.data5,
    }
    const epkNonce = req.body.epkNonce
    const result = await uniRepAttest(req.userId as string, reqData, epkNonce)
    sendResponse(res, result)
  } catch (e) {
    sendError(res, e)
  }
});

/**
 * UniRep uniRepAttest
 */
router.get('/prove', authToken, async (req: Request, res: Response) => {
  try {
    const proveData = {
      0: req.body.data0,
      1: req.body.data1,
      2: req.body.data2,
      3: req.body.data3,
    }
    const result = await uniRepProve(req.userId as string, proveData)
    sendResponse(res, result)
  } catch (e) {
    sendError(res, e)
  }
});


module.exports = router;
export default class indexRouter {
}
