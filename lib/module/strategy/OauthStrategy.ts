import OauthClient from "oauth-v2-client";
import { IEndUserAuthData } from "../..";
import OauthStrategyGrantType from "../interfaces/OauthStrategyGrantType";
import OauthStrategyOptionsType from "../interfaces/OauthStrategyOptionsType";

export default class OauthStrategy {
  options: OauthStrategyOptionsType;
  userLookup: (
    client: OauthClient
  ) => Promise<IEndUserAuthData | undefined> | IEndUserAuthData | undefined;

  constructor(options: OauthStrategyOptionsType) {
    this.options = options;
    this.userLookup = options.userLookup;
  }

  /**
   * Checking if there is not duplicated identifier
   * @param strategies social strategies list
   */
  static validateStrategies(strategies: Array<OauthStrategy>) {
    const keys: string[] = [];
    for (const strategy of strategies) {
      if (keys.includes(strategy.options.identifier)) {
        throw new Error(
          `Social Strategy: duplicate identifier ${strategy.options.identifier}`
        );
      } else {
        keys.push(strategy.options.identifier);
      }
    }
  }

  /**
   * Render strategies as options
   * @param url url
   * @param strategies strategies
   */
  static renderOptions(
    url: (identifier: string) => string,
    strategies: Array<OauthStrategy>
  ) {
    const r: Array<{
      grant: OauthStrategyGrantType;
      identifier: string;
      providerName?: string;
      redirectUri: string;
    }> = [];
    for (const strategy of strategies) {
      r.push({
        grant: strategy.options.grant,
        identifier: strategy.options.identifier,
        providerName:
          strategy.options.providerName ?? strategy.options.identifier,
        redirectUri: url(strategy.options.identifier),
      });
    }
    return r;
  }
}
