import OauthStrategy from "../strategy/OauthStrategy";

type OauthStrategyGrantType =
  | "implicit"
  | "authorization_code"
  | "authorization_code_pkce"
  | "password";

export default OauthStrategyGrantType;
