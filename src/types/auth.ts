export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokensResponse {
  user: User;
  access_token: string;
  expires_at: string;
  refresh_token: string;
}

export interface StoredSession {
  user: User;
  accessToken?: string;
  expiresAt?: string;
  refreshToken?: string;
}

export interface AuthCredentialsRequest {
  email: string;
  password: string;
}
