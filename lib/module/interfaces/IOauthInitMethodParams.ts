import session from "express-session";

export default interface IOauthInitMethodParams {
  sessionOptions?: Partial<session.SessionOptions>;
}
