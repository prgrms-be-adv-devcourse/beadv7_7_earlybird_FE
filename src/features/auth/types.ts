export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "BACKER" | "CREATOR" | "ADMIN";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

