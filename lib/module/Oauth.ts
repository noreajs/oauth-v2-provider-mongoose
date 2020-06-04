import { Application, Request, Response, NextFunction } from "express";
import { IOauthContext } from "./interfaces/IOauthContext";
import oauthRoutes from "./routes/oauth.routes";
import OauthContext from "./OauthContext";
import jwt from "jsonwebtoken";
import session from "express-session";
import { IJwtTokenPayload } from "./interfaces/IJwt";
import OauthAccessToken from "./models/OauthAccessToken";
import { HttpStatus, replaceAllMatch } from "@noreajs/common";

export default class Oauth {
  private static instance: Oauth;
  context: OauthContext;
  app: Application;

  private constructor(app: Application, context: OauthContext) {
    // express app
    this.app = app;
    // oauth provider context
    this.context = context;
    // initialize oauth instance
    this.initialize();
  }

  /**
   * Initialize oauth instance
   */
  private initialize() {
    // set session
    this.app.use(
      session({
        secret: this.context.secretKey,
        resave: false,
        saveUninitialized: true,
        name: `${replaceAllMatch(
          this.context.providerName.toLocaleLowerCase(),
          /\s/g,
          "-"
        )}.sid`,
        cookie: {
          httpOnly: true,
          secure: this.app.get("env") === "production",
          maxAge: 1000 * 60 * 60, // 1 hour
        },
      })
    );

    // set the view engine to ejs
    this.app.set("view engine", "ejs");

    // Add oauth routes
    oauthRoutes(this.app, this.context);
  }

  /**
   * Get oauth instance
   */
  public static getInstance(): Oauth {
    return Oauth.instance;
  }

  /**
   * Initialize oauth 2 module
   * @param context oauth 2 context
   */
  static init(app: Application, initContext: IOauthContext) {
    // create context
    Oauth.instance = new Oauth(app, new OauthContext(initContext));
  }

  /**
   * Validate user access token
   * @param scope scope needed - Optional
   */
  static authorize(scope?: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // get auth instance
      const oauth = Oauth.getInstance();
      // check instance existance
      if (oauth) {
        // get oauth context
        const oauthContext = oauth.context;
        // authorization server
        const authorization =
          req.headers["authorization"] ?? req.headers["proxy-authorization"];
        // authorization required
        if (authorization) {
          // bearer token required
          if (authorization.startsWith(oauthContext.tokenType)) {
            // token parts
            const parts = authorization.split(" ");
            try {
              // Verify token signature
              const tokenData = jwt.verify(parts[1], oauthContext.secretKey, {
                algorithms: [oauthContext.jwtAlgorithm],
              }) as IJwtTokenPayload;

              // load access token
              const accessToken = await OauthAccessToken.findById(
                tokenData.jti
              );

              // access token must exist localy
              if (accessToken) {
                // revocation state
                if (accessToken.revokedAt) {
                  return res.status(HttpStatus.Unauthorized).json({
                    message: "Access Token not approved",
                  });
                } else {
                  // lookup sub for other grant but client_credentials
                  if (
                    accessToken.grant !== "client_credentials" &&
                    oauthContext.subLookup
                  ) {
                    res.locals.user = await oauthContext.subLookup(
                      accessToken.userId
                    );
                  }

                  // scope validation if exist
                  if (scope) {
                    const tokenScope = tokenData.scope ?? accessToken.scope;
                    const tokenScopeParts = tokenScope.split(" ");
                    const scopeParts = scope.split(" ");
                    for (const item of tokenScopeParts) {
                      if (!scopeParts.includes(item)) {
                        return res.status(HttpStatus.Unauthorized).json({
                          message: "Insufficient scope",
                        });
                      }
                    }

                    // the user can access to the resource
                    next();
                  } else {
                    // the user can access to the resource
                    next();
                  }
                }
              } else {
                return res.status(HttpStatus.Unauthorized).json({
                  message: "Invalid access token",
                });
              }
            } catch (error) {
              return res.status(HttpStatus.Unauthorized).json({
                message: "Access Token expired",
              });
            }
          } else {
            return res.status(HttpStatus.Unauthorized).json({
              message: `${oauthContext.tokenType} Token type required`,
            });
          }
        } else {
          return res.status(HttpStatus.Unauthorized).json({
            message: `Authorization Header Required`,
          });
        }
      } else {
        console.warn(
          "The Oauth.context static property is not defined. Make sure you have initialized the Oauth package as described in the documentation."
        );
        // the user can access to the resource
        next();
      }
    };
  }
}
