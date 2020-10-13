export default interface ITokenRevokeRequest {
  token_type_hint?: "refresh_token" | "access_token";
  token: string;
  client_id: string;
  client_secret?: string;
}
