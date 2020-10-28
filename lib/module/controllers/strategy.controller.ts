import { HttpStatus, Obj } from "@noreajs/common";
import { Request, Response } from "express";
import OauthHelper from "../helpers/OauthHelper";
import UrlHelper from "../helpers/UrlHelper";
import ISessionCurrentData from "../interfaces/ISessionCurrentData";
import OauthAuthCode, { IOauthAuthCode } from "../models/OauthAuthCode";
import OauthStrategy from "../strategy/OauthStrategy";
import OauthController from "./oauth.controller";
import { injectQueryParams } from "oauth-v2-client";
import AuthorizationController from "./authorization.controller";

class StrategyController extends OauthController {
  static OAUTH_STRATEGY_CALLBACK_PATH =
    "oauth/v2/strategy/callback/:identifier";

  /**
   * Get authorization token
   * @param req request
   * @param res response
   */
  redirect = async (req: Request, res: Response) => {
    const strategy = this.oauthContext.strategies.find(
      (s) => s.options.identifier === req.params.identifier
    );

    if (req.session) {
      /**
       * Load session auth code
       */
      const authCode = await OauthAuthCode.findById(
        req.session.oauthAuthCodeId
      );

      // auth code exist
      if (authCode) {
        if (strategy) {
          switch (strategy.options.grant) {
            case "authorization_code":
              return res.redirect(
                HttpStatus.TemporaryRedirect,
                strategy.options.client.authorizationCode.getAuthUri({
                  callbackUrl: `${UrlHelper.getFullUrl(req)}/${
                    StrategyController.OAUTH_STRATEGY_CALLBACK_PATH
                  }`.replace(":identifier", strategy.options.identifier),
                })
              );

            case "authorization_code_pkce":
              return res.redirect(
                HttpStatus.TemporaryRedirect,
                strategy.options.client.authorizationCodePKCE.getAuthUri({
                  callbackUrl: `${UrlHelper.getFullUrl(req)}/${
                    StrategyController.OAUTH_STRATEGY_CALLBACK_PATH
                  }`.replace(":identifier", strategy.options.identifier),
                })
              );

            case "implicit":
              return res.redirect(
                HttpStatus.TemporaryRedirect,
                strategy.options.client.implicit.getAuthUri({
                  callbackUrl: `${UrlHelper.getFullUrl(req)}/${
                    StrategyController.OAUTH_STRATEGY_CALLBACK_PATH
                  }`.replace(":identifier", strategy.options.identifier),
                })
              );

            default:
              return OauthHelper.throwError(req, res, {
                error: "access_denied",
                error_description: `The grant "${strategy.options.grant}" doesn't support redirection.`,
                state: authCode.state,
              });
          }
        } else {
          return OauthHelper.throwError(req, res, {
            error: "access_denied",
            error_description: "Oauth v2 strategy not found.",
            state: authCode.state,
          });
        }
      } else {
        return OauthHelper.throwError(req, res, {
          error: "access_denied",
          error_description: "Authorization code instance not found.",
        });
      }
    } else {
      throw Error("No session defined. Express session required.");
    }
  };

  /**
   * Get authorization token
   * @param req request
   * @param res response
   */
  authorize = async (req: Request, res: Response) => {
    const strategy = this.oauthContext.strategies.find(
      (s) => s.options.identifier === req.params.identifier
    );

    if (req.session) {
      /**
       * Load session auth code
       */
      const authCode = await OauthAuthCode.findById(
        req.session.oauthAuthCodeId
      );

      // auth code exist
      if (authCode) {
        if (strategy) {
          switch (strategy.options.grant) {
            case "password":
              strategy.options.client.password.getToken({
                username: req.body.username,
                password: req.body.password,
                onSuccess: async () => {
                  return this.lookupAndRedirect(req, res, authCode, strategy);
                },
                onError: (error) => {
                  return OauthHelper.throwError(req, res, {
                    error: "access_denied",
                    error_description:
                      error.message ??
                      `Failed to get ${strategy.options.identifier} token.`,
                    state: authCode.state,
                  });
                },
              });
              break;

            default:
              return OauthHelper.throwError(req, res, {
                error: "access_denied",
                error_description: `The grant "${strategy.options.grant}" doesn't support redirection.`,
                state: authCode.state,
              });
          }
        } else {
          return OauthHelper.throwError(req, res, {
            error: "access_denied",
            error_description: "Authorization code instance not found.",
            state: authCode.state,
          });
        }
      }
    } else {
      throw Error("No session defined. Express session required.");
    }
  };

  /**
   * Get authorization token
   * @param req request
   * @param res response
   */
  callback = async (req: Request, res: Response) => {
    const strategy = this.oauthContext.strategies.find(
      (s) => s.options.identifier === req.params.identifier
    );

    if (req.session) {
      /**
       * Load session auth code
       */
      const authCode = await OauthAuthCode.findById(
        req.session.oauthAuthCodeId
      );

      // auth code exist
      if (authCode) {
        if (strategy) {
          switch (strategy.options.grant) {
            case "authorization_code":
              await strategy.options.client.authorizationCode.getToken({
                callbackUrl: req.originalUrl,
                onSuccess: async (_token) => {
                  return this.lookupAndRedirect(req, res, authCode, strategy);
                },
                onError: (error) => {
                  return OauthHelper.throwError(req, res, {
                    error: "access_denied",
                    error_description:
                      error.message ??
                      `Failed to get ${strategy.options.identifier} token.`,
                    state: authCode.state,
                  });
                },
              });
              break;

            case "authorization_code_pkce":
              await strategy.options.client.authorizationCodePKCE.getToken({
                callbackUrl: req.originalUrl,
                onSuccess: () => {
                  return this.lookupAndRedirect(req, res, authCode, strategy);
                },
                onError: (error) => {
                  return OauthHelper.throwError(req, res, {
                    error: "access_denied",
                    error_description:
                      error.message ??
                      `Failed to get ${strategy.options.identifier} token.`,
                    state: authCode.state,
                  });
                },
              });
              break;

            case "implicit":
              // extract token
              strategy.options.client.implicit.getToken(req.originalUrl);

              return this.lookupAndRedirect(req, res, authCode, strategy);

            default:
              return OauthHelper.throwError(req, res, {
                error: "access_denied",
                error_description: `The grant "${strategy.options.grant}" doesn't support redirection.`,
                state: authCode.state,
              });
          }
        } else {
          return OauthHelper.throwError(req, res, {
            error: "access_denied",
            error_description: "Oauth v2 strategy not found.",
            state: authCode.state,
          });
        }
      } else {
        return OauthHelper.throwError(req, res, {
          error: "access_denied",
          error_description: "Authorization code instance not found.",
        });
      }
    } else {
      return OauthHelper.throwError(req, res, {
        error: "access_denied",
        error_description: "No session defined. Express session required.",
      });
    }
  };

  /**
   * Lookup end user and redirect
   * @param req express request
   * @param res express response
   * @param authCode authorization code instance
   * @param strategy strategy
   */
  private async lookupAndRedirect(
    req: Request,
    res: Response,
    authCode: IOauthAuthCode,
    strategy: OauthStrategy
  ) {
    // lookup user
    const endUserData = await strategy.userLookup(strategy.options.client);

    /**
     * User exist
     */
    if (endUserData) {
      /**
       * Refresh session for next use, Save current user data
       * **********************************************
       */
      req.session?.regenerate(function (err) {
        if (err) {
          throw Error("Failed to regenerate session.");
        } else {
          const currentData: ISessionCurrentData = {
            responseType: authCode.responseType,
            authData: endUserData,
          };

          if (req.session) {
            req.session.currentData = currentData;
          } else {
            throw Error("Unable to access to session");
          }
        }
      });

      /**
       * Redirect for internal token generation
       * =============================================
       */
      const queryParams: any = {
        client_id: authCode.client.clientId,
        state: authCode.state,
        scope: authCode.scope,
        response_type: authCode.responseType,
        redirect_uri: authCode.redirectUri,
      };

      // inject if exist
      if (
        authCode.codeChallengeMethod &&
        authCode.codeChallengeMethod.length !== 0
      ) {
        queryParams.code_challenge_method = authCode.codeChallengeMethod;
      }

      // inject if exist
      if (authCode.codeChallenge && authCode.codeChallenge.length !== 0) {
        queryParams.code_challenge = authCode.codeChallenge;
      }

      return res.redirect(
        HttpStatus.MovedPermanently,
        injectQueryParams(
          `${UrlHelper.getFullUrl(req)}/${
            AuthorizationController.OAUTH_AUTHORIZE_PATH
          }`,
          queryParams
        )
      );
    } else {
      // add error
      if (req.session) {
        req.session.error = {
          message: `No account is associated with your ${`${
            strategy.options.providerName ?? strategy.options.identifier
          }`.toLowerCase()} profile.`,
        };
      }

      return res.redirect(
        HttpStatus.TemporaryRedirect,
        `${UrlHelper.getFullUrl(req)}/${
          AuthorizationController.OAUTH_DIALOG_PATH
        }`
      );
    }
  }
}

export default StrategyController;
