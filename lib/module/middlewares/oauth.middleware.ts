import { Request, Response, NextFunction } from "express";
import { urlencoded } from "body-parser";
import cookieParser from "cookie-parser";
const crsf = require("csurf");

class OauthMiddleware {
  /**
   * Authorization request validation required
   * @param req request
   * @param res response
   * @param next next function
   */
  async authorize(req: Request, res: Response, next: NextFunction) {}

  /**
   * Inject crsf token
   */
  injectCsrfToken() {
    return [cookieParser(), crsf({ cookie: true })];
  }

  /**
   * Verify csrf token
   */
  verifyCsrfToken() {
    const urlencodedParser = urlencoded({ extended: false });
    return [cookieParser(), urlencodedParser, crsf({ cookie: true })];
  }
}

export default new OauthMiddleware();
