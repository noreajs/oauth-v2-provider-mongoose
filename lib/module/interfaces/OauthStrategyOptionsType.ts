import OauthClient from "oauth-v2-client";
import { IEndUserAuthData } from "../..";
import OauthStrategyGrantType from "./OauthStrategyGrantType";

type OauthStrategyOptionsType = {
  identifier: string;
  providerName?: string;
  grant: OauthStrategyGrantType;
  client: OauthClient;
  userLookup: (
    client: OauthClient
  ) => Promise<IEndUserAuthData | undefined> | IEndUserAuthData | undefined;
};

export default OauthStrategyOptionsType;
