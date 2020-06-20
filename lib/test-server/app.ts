import { NoreaApp } from "@noreajs/core";
import apiRoutes from "./api.routes";
import { Application } from "express";
import { MongoDBContext } from "@noreajs/mongoose";
import Oauth from "../module/Oauth";
import IEndUserAuthData from "../module/interfaces/IEndUserAuthData";
import { JwtTokenReservedClaimsType } from "../module/interfaces/IJwt";
import User from "./models/User";

const app = new NoreaApp(apiRoutes, {
  beforeStart: (app: Application) => {
    // Get MongoDB Instance
    MongoDBContext.init({
      connectionUrl: `mongodb://127.0.0.1:27017/your-api-database?replicaSet=rs0`,
      onConnect: (connection) => {
        // Mongoose oauth 2  provider initialization
        Oauth.init(app, {
          providerName: "Oauth 2 Provider",
          secretKey:
            "66a5ddac054bfe9389e82dea96c85c2084d4b011c3d33e0681a7488756a00ca334a1468015da8",
          authenticationLogic: async function (
            username: string,
            password: string
          ) {
            const user = await User.findOne({ email: username });
            if (user) {
              if (user.verifyPassword(password)) {
                const data: IEndUserAuthData = {
                  scope: "*",
                  userId: user._id,
                  extraData: {
                    user: user,
                  },
                };
                return data;
              } else {
                return undefined;
              }
            } else {
              return undefined;
            }
          },
          supportedOpenIdStandardClaims: async function (userId: string) {
            const user = await User.findById(userId);
            if (user) {
              return {
                name: user.username,
                email: user.email,
                email_verified:
                  user.emailVerifiedAt !== undefined &&
                  user.emailVerifiedAt !== null,
                updated_at: user.updatedAt.getTime(),
              } as JwtTokenReservedClaimsType;
            } else {
              return undefined;
            }
          },
          subLookup: async (sub: string) => {
            return await User.findById(sub);
          },
          // securityMiddlewares: [Oauth.authorize()],
        });
      },
    });
  },
});

app.start();
