export interface AuthUser {
  id: string;
  name: string;
  phoneNumber: string;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: string;
}
