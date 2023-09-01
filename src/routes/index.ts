import {Request, Response, Router} from "express";
import {sendResponse} from "../common/CommonResponse";

const router = Router();

/* GET home page. */
router.get('/', async (req: Request, res: Response) => {
  sendResponse(res, "test")
});

module.exports = router;
export default class indexRouter {
}
