# Oauth v2 Provider (experimental)

When you develop your APIs, you need to secure the resources they will offer. The Oauth 2 framework offers a safe and secure way to achieve this.

This package is an OAuth 2.0 Authorization Server with [mongoose](<[https://mongoosejs.com/](https://mongoosejs.com/)>), [Express](<[https://expressjs.com/fr/](https://expressjs.com/fr/)>) and [EJS](<[https://ejs.co/](https://ejs.co/)>).

While developing app using **MEAN** _(MongoDB + Express+ Angular + Node.js)_, **MERN** _(MongoDB + Express+ React.js + Node.js)_ or globallyf **ME\*N** stack you can use this package to host a Oauth 2 server.

**Table of Contents**

[TOC]

## Implemented specifications & Features

- [RFC6749 - OAuth 2.0](https://tools.ietf.org/html/rfc6749) 
  - [x] Authorization (Authorization Code Flow, Implicit Flow)
  - [x] Client Credentials Grant
  - [x] Password Grant
- [RFC7636 - Proof Key for Code Exchange (PKCE)](https://tools.ietf.org/html/rfc7636))
  - [x] Authorization code with PKCE
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
  - [ ] ID Token `(soon)`



## Installation

Installation command

```typescript
npm  install @noreajs/oauth-v2-provider-mongoose --save
```

The package already content it's types definition.



## Configuration

The provider is initialize with a simple function.

Initialization function definition

```typescript
Oauth.init(app: Application, initContext: IOauthContext): void
```

The **IOauthContext** is an object with some properties useful for the provider configuration.

| Property                      | Type                                                         | Optional | Description                                                  |
| ----------------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------ |
| providerName                  | string                                                       | false    | Oauth v2 provider name. This name is going to be used as cookie name. |
| secretKey                     | string                                                       | false    | Oauth v2 provider secret key                                 |
| jwtAlgorithm                  | "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512" | true     | Jwt encrypt algorithm                                        |
| authenticationLogic           | Function                                                     | false    | Function which take username and password as parameters and authenticate related user. |
| supportedOpenIdStandardClaims | Function                                                     | false    | Function that return claims to be included in id_token       |
| subLookup                     | Function                                                     | true     | Lookup the token owner and make his data available in Express response within the locals property. |
| securityMiddlewares           | array                                                        | true     | Middlewares to be applied to Clients management routes and Scopes management routes |
| tokenType                     | "Bearer"                                                     | true     | Token type will be always Bearer                             |
| authorizationCodeLifeTime     | object                                                       | true     | Authorization code lifetime in seconds                       |
| accessTokenExpiresIn          | object                                                       | true     | Access Token Expiration Times                                |
| refreshTokenExpiresIn         | object                                                       | true     | Refresh Token Expiration Times                               |

Oauth context default values:

* **jwtAlgorithm**: "HS512"
* **securityMiddlewares**: []
* **tokenType**: "Bearer"
* **authorizationCodeLifeTime**: 60 * 5 // 5 minutes
* **accessTokenExpiresIn**

```json
{
    "confidential": {
        "internal": 60 * 60 * 24, // 24h
        "external": 60 * 60 * 12, // 12h
    },
    "public": {
        "internal": 60 * 60 * 2, // 2h
        "external": 60 * 60, // 1h
    }
}
```

* **refreshTokenExpiresIn**

```json
{
    "confidential": {
        "internal": 60 * 60 * 24 * 30 * 12, // 1 year
        "external": 60 * 60 * 24 * 30, // 30 days
    },
    "public": {
        "internal": 60 * 60 * 24 * 30, // 30 days
        "external": 60 * 60 * 24 * 7, // 1 week
    }
}
```



Initialization example - *don't worry about the content of the methods. You would write your own logic.*

```typescript
Oauth.init(app, {
  providerName: "Your App Name",
  secretKey:
    "66a5ddac054bfe9389e82dea96c85c2084d4b011c3d33e0681a7488756a00ca334a1468015da8",
  authenticationLogic: async function (username: string, password: string) {
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
          user.emailVerifiedAt !== undefined && user.emailVerifiedAt !== null,
        updated_at: user.updatedAt.getTime(),
      } as JwtTokenReservedClaimsType;
    } else {
      return undefined;
    }
  },
  subLookup: async (sub: string) => {
    return await User.findById(sub);
  },
  securityMiddlewares: [Oauth.authorize()],
});
```



## Managing Clients

Developers building applications that need to interact with your application's API will need to register their application with yours by creating a "client".

### Client endpoints

Some endpoints are already provided with the package to manage clients:

| HTTP Method | Route                 | Description         |
| ----------- | --------------------- | ------------------- |
| GET         | /oauth/v2/clients     | Get all clients     |
| GET         | /oauth/v2/clients/:id | Get client by ID    |
| POST        | /oauth/v2/clients     | Create a new client |
| PUT         | /oauth/v2/clients/:id | Edit a client       |
| DELETE      | /oauth/v2/clients/:id | Delete a client     |

### Client properties

To respect Oauth 2 specifications some properties are needed for the client.

| Property Name       | Type                                                         | Optional                                            | Description                                                  |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------ |
| clientId            | string                                                       | Generated                                           | Client ID                                                    |
| name                | string                                                       | false                                               | Name of the application                                      |
| domaine             | string                                                       | true                                                | Domaine name of the application                              |
| logo                | string                                                       | true                                                | Link of the application logo                                 |
| description         | string                                                       | true                                                | Description of the application                               |
| secretKey           | string                                                       | generated                                           | Secret key of the client. It is only generated when the **clientType** value is **confidential**. |
| internal            | boolean                                                      | false                                               | Set internal value to true for [First-party applications](https://auth0.com/docs/applications/concepts/app-types-first-third-party#first-party-applications) and false for [Third-party applications](https://auth0.com/docs/applications/concepts/app-types-first-third-party#third-party-applications) |
| grants              | array of values in **implicit**, **client_credentials**, **password**, **authorization_code** and **refresh_token** | Automatically filled based on data provides         | Allowed grants depends on whether the client is confidential or public, internal or external. |
| redirectURIs        | array of URI                                                 | false                                               | After a user successfully authorizes an application, the server will redirect the user back to the application with either an authorization code or access token in the URL |
| clientProfile       | **web**, **user-agent-based** or **native**                  | false                                               | **web** for web application, **user-agent-based** for user-agent based application, and **native** for native desktop or mobile application. |
| clientType          | **confidential** or **public**                               | Automatically filled based on *clientProfile* value | A **confidential** client is a client who guarantees the confidentiality of credentials (Web application with a secure backend). A **public** client cannot hold credentials securely (native desktop or mobile application, user-agent-based application such as a single page app). |
| programmingLanguage | string                                                       | true                                                | Language used to develop the application                     |
| scope               | string                                                       | false                                               | Scope requested by the application (i.e. *"read:users list:users add:users"*) |

Other client properties:

* **legalTermsAcceptedAt** *(optional)*: if some legal terms need to be accepted before consuming your API.
* **revokedAt** *(optional)*: filled when the client is revoked
* **createdAt**: client's creation date
* **updatedAt**: date of the client's last modification

### Client types detailed

OAuth defines two client types, based on their ability to authenticate securely with the authorization server.

- **confidential**
  - **Web application**: Application were views are generated from a server. The following list is not exhaustive.
    - JavaScript - [Node.js](https://nodejs.org/) (Express)
    - C# – [ASP.NET MVC](https://dotnet.microsoft.com/apps/aspnet)
    - Java – [Spring MVC](https://spring.io/), [Apache Struts](https://struts.apache.org/), [Play Framework](https://en.wikipedia.org/wiki/Play_Framework)
    - Groovy – [Grails Framework](https://en.wikipedia.org/wiki/Grails_(framework))
    - Python – [Django](https://www.djangoproject.com/)
    - Ruby – [Ruby on Rails](https://rubyonrails.org/)
    - PHP – [Laravel](https://laravel.com/)

- **public**
  - **Browser-based application**: Most of [SPA](https://en.wikipedia.org/wiki/Single-page_application) application based on Web browser JavaScript frameworks and libraries such as:
    - AngularJs
    - Ember.Js
    - ExtJS
    - [Meteor.js](https://en.wikipedia.org/wiki/Meteor_(web_framework))
    - [React](https://en.wikipedia.org/wiki/React_(JavaScript_library)).js
    - [Vue.js](https://en.wikipedia.org/wiki/Vue.js)
  - **Native application**: software program that is developed for use on a particular platform or device
    - Mobile applications: *Android, IOS and Windows phone*
    - Desktop application: *Linux, windows, Mac OS*

### Client example

Client creation's request body example

```json
{
    "name": "Cake Shop",
    "internal": false,
    "redirectURIs": ["https://www.cakeshop.com/auth/callback"],
    "clientProfile": "web",
    "scope": "read:users read:cake add:cakes" /* "*" is allowed only for internal client */
}
```



## Authorization Grants

Depending on the type of customers who want to access your API, there are appropriate types of authentication.

### Authorization Code Grant

The authorization code grant type is the most commonly used because it is optimized for server-side applications, where source code is not publicly exposed, and Client Secret confidentiality can be maintained. This is a redirection-based flow, which means that the application must be capable of interacting with the user-agent (i.e. the user’s web browser) and receiving API authorization codes that are routed through the user-agent.

**Creating The Client**

Targeted applications:

* Public and confidential web frontend application - *web app or browser-based app*
* Native frontend application - *mobile* or desktop app

Request body example:

```json
{
    "name": "App Name",
    "internal": true,
    "redirectURIs": ["https://www.app_name.com/auth/callback"],
    "clientProfile": "web",
    "scope": "*"
}
```



**Requesting Tokens**

Once a client has been created, developers may use their client ID and secret to request an authorization code and access token from your application. 

1. **Get authorization codes**

* HTTP Method: **GET**

* Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/authorize**

* Query parameters: 

```json
{
    "client_id": "client-id",
    "redirect_uri": "http://example.com/callback",
    "response_type": "code",
    "scope": "", // optional
    "state": "" //optional but highly recommended
}
```

> **Note**: _client_id_ and _client_secret_ can be sent via Basic authorization header and not in the request body.
>
> _Authorization: Basic {Base64(client_id:client_secret)}_

After sending this request, the client will be redirect to an authentication page. Once the end-user authenticated, he will be redirected to the provided *redirect_uri* with the authorization code.

The given authorization code will be used to request access token in the next step. 

2. **Converting Authorization Codes To Access Tokens**

* HTTP Method: **POST**

* Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/token**

* Query body: 

```json
{
    "grant_type": "authorization_code", 
    "client_id": "client-id",
    "client_secret": "client-secret", // required only for confidential client
    "redirect_uri": "http://example.com/callback",
    "code": "code" // code previously received
}
```

> **Note**: _client_id_ and _client_secret_ can be sent via Basic authorization header and not in the request body.
>
> _Authorization: Basic {Base64(client_id:client_secret)}_

Try with Postman as follow:

// some images

### Authorization Code Grant with PKCE

The Authorization Code grant with "Proof Key for Code Exchange" (PKCE) is a secure way to authenticate public client. You use it when there is not guarantee that the client client can store secret key confidentially.

This grant is based on a *"code verifier"* and a *"code challenge"*.

**Code Verifier & Code Challenge**

As this authorization grant does not provide a client secret, developers will need to generate a combination of a code verifier and a code challenge in order to request a token.

The code verifier should be a random string of between 43 and 128 characters containing letters, numbers and "-", ".", "\*", "~", as defined in the RFC 7636 specification.

The code challenge should be a Base64 encoded string with URL and filename-safe characters. The trailing '=' characters should be removed and no line breaks, whitespace, or other additional characters should be present.

**Creating The Client**

Targeted applications:

- Public web frontend application - *web app or browser-based app*
- Native frontend application - *mobile* or desktop app

Request body example:

```json
{
    "name": "App Name",
    "internal": false,
    "redirectURIs": ["https://www.app_name.com/auth/callback"],
    "clientProfile": "user-agent-based",
    "scope": "read:users list:users"
}
```



**Requesting Tokens**

Once a client has been created, developers may use their client ID and secret to request an authorization code and access token from your application.

1. **Get authorization codes**

* HTTP Method: **GET**

* Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/authorize**

* Query parameters:

```json
{
    "client_id": "client-id",
    "redirect_uri": "http://example.com/callback",
    "response_type": "code",
    "scope": "", // optional
    "state": "" //optional but highly recommended
}
```



After sending this request, the client will be redirect to an authentication page. Once the end-user authenticated, he will be redirected to the provided *redirect_uri* with the authorization code.

The given authorization code will be used to request access token in the next step.

2. **Converting Authorization Codes To Access Tokens**

* HTTP Method: **POST**

* Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/token**

* Query body:

```json
{
    "grant_type": "authorization_code",
    "client_id": "client-id",
    "redirect_uri": "http://example.com/callback",
    "code_verifier": "codeVerifier",
    "code": "code" // code previously received
}
```



Try with Postman as follow:

// some images

### Password Grant

The password grant allows confidential application to obtain an access token using an e-mail address / username and password. This allows you to issue access tokens securely to your first-party clients without requiring your users to go through the entire authorization code redirect flow.

Targeted clients:

This grant type should only be enabled on the authorization server if other flows are not viable. Also, it should only be used if first-party applications (e.g. : applications in your organization).

**Creating A Password Grant Client**

This grant is recommended for internal ([First-party applications](https://auth0.com/docs/applications/concepts/app-types-first-third-party#first-party-applications)) applications:

- Public or confidential web frontend application - *web app or browser-based app*
- Native frontend application - *mobile* or desktop app

Request body example:

```json
{
    "name": "App Name",
    "internal": true, // must be true for password grant
    "redirectURIs": ["https://www.app_name.com/auth/callback"],
    "clientProfile": "native",
    "scope": "*"
}
```



**Requesting Tokens**

Once a client has been created, developers may use their client ID and secret to request an access token from your application.

The consuming application should send client ID, secret key, username and password to your application's /oauth/v2/token endpoint.

**Request tokens**

* HTTP Method: **POST**

* Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/token**

* Query body: 

```json
{
    "grant_type": "password",
    "client_id": "client-id",
    "client_secret": "client-secret",
    "username": "john.conor@sky.net",
    "password": "my-password",
    "scope": "" // optional
}
```



> **Note**: _client_id_ and _client_secret_ can be sent via Basic authorization header and not in the request body.
>
> _Authorization: Basic {Base64(client_id:client_secret)}_

Try with Postman as follow:

// some images

### Implicit Grant

The implicit grant is similar to the authorization code grant; however, the token is returned to the client without exchanging an authorization code. This grant is most commonly used for JavaScript or mobile applications where the client credentials can't be securely stored.

The implicit grant type is used for mobile apps and web applications (*i.e. applications that run in a web browser*), where the client secret confidentiality is not guaranteed. The implicit grant type is also a redirection-based flow but the access token is given to the user-agent to forward to the application, so it may be exposed to the user and other applications on the user’s device.

**Creating An Implicit Grant Client**

Targeted applications:

* Public web frontend application - *browser-based app*
* Native frontend application - *mobile* or desktop app

Request body example:

```json
{
    "name": "App Name",
    "internal": true,
    "redirectURIs": ["https://www.app_name.com/auth/callback"],
    "clientProfile": "user-agent-based",
    "scope": "read:users list:users edit:users"
}
```



**Request tokens**

* HTTP Method: **POST**

* Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/token**

* Query body: 

```json
{
    "client_id": "client-id",
    "redirect_uri": "http://example.com/callback",
    "response_type": "token",
    "scope": "", // optional
    "state": "state"
}
```



Try with Postman as follow:

// some image

### Client Credentials Grant

The client credentials grant is suitable for machine-to-machine authentication. Use it if you need for example two or more servers of your organization to communicate together.

The client credentials grant type provides an application a way to access its own service. Server to server communication in the same organization.

**Creating An Client Credentials Grant Client**

Targeted applications:

* Confidential web application - *frontend or backend*

Request body example:

```json
{
    "name": "App Name",
    "internal": true, // must be true for client credentials grant
    "redirectURIs": ["https://www.app_name.com/auth/callback"],
    "clientProfile": "web", // must be web for client credentials grant
    "scope": "*"
}
```



**Request token**

* HTTP Method: **POST**

* Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/token**

* Query body:

```json
{
    "grant_type": "client_credentials",
    "client_id": "client-id",
    "client_secret": "client-secret",
    "scope": "client-requested-scope" // optional
}
```

> **Note**: _client_id_ and _client_secret_ can be sent via Basic authorization header and not in the request body.
>
> _Authorization: Basic {Base64(client_id:client_secret)}_
>

Try with Postman as follow:

// some image



## Refreshing Tokens

Token generated with some grants as Password Credentials Grant and Authorization Code Grant, come with a refresh token that the user can use to get a new token as follow.

**Refresh token**

* HTTP Method: **POST**

* Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/token**

* Query body:

```json
{
    "grant_type": "refresh_token",
    "refresh_token": "the-refresh-token",
    "client_id": "client-id",
    "client_secret": "client-secret",
    "scope": "client-requested-scope" // optional
}
```

> **Note**: _client_id_ and _client_secret_ can be sent via Basic authorization header and not in the request body.
>
> _Authorization: Basic {Base64(client_id:client_secret)}_

Try with Postman as follow:

// some image



## Purging Tokens and Authorization codes

This package provide some endpoints to purge revoked or expired tokens and authorization codes.

1. **Tokens**

HTTP Method: **GET**

Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/purge/token**

Query parameters:

```json
{
  "type": "revoked or expired" // (optional - if empty or undefined both revoked and expired will be purged)
}
```

2. **Authorization codes**

HTTP Method: **GET**

Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/purge/code**

Query parameters:

```json
{
  "type": "revoked or expired" // (optional - if empty or undefined both revoked and expired will be purged)
}
```

3. **Both tokens and authorization codes**

HTTP Method: **GET**

Endpoint: **{YOUR_API_BASE_URL}/oauth/v2/purge**

Query parameters:

```json
{
  "type": "revoked or expired" // (optional - if empty or undefined both revoked and expired will be purged)
}
```



## Protecting Routes

### Via Middleware. 

You can secure your routes by adding the middleware `Oauth.authorize()`. It is a static method of the `Oauth` class provided by the package.

Method definition:

```typescript
Oauth.authorize(scope?: string | undefined): (req: Request, res: Response, next: NextFunction) => Promise<Response<any> | undefined>
```

Import `Oauth` 

```typescript
import Oauth from "@noreajs/oauth-v2-provider-mongoose";

// app is an express application or express router
app.route('/account/update').put([
    // ... other middleware
    Oauth.authorize(), // oauth middleware. It must always be before the protected resource
    // ... other middleware
    authController.update // protected resource
]);
```

### Checking Scopes

The scope(s) required for a resource can be passed via the `Oauth.authorize` method as follow:

```typescript
app.route('/account/update').put([
    Oauth.authorize('edit:profile'),
    authController.update
]);
```

**Note** : Many scopes can be transmitted by separating them with a space.

### Defining Scopes

(Coming soon)



## Consuming Your API With JavaScript (with [axios](https://github.com/axios/axios))