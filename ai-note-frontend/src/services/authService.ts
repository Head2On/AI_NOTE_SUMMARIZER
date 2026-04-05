import apiClient from "../lib/apiClient";
import type {
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  TokenResponse,
  UserProfile,
} from "../types";

// POST /api/auth/register/
export const register = async (payload: RegisterPayload): Promise<void> => {
  await apiClient.post("/api/auth/register/", payload);
};

// GET /api/auth/profile/
export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get<UserProfile>("/api/auth/profile/");
  return data;
};

// POST /api/auth/change-password/
export const changePassword = async (
  payload: ChangePasswordPayload
): Promise<void> => {
  await apiClient.post("/api/auth/change-password/", payload);
};

// POST /api/auth/forgot-password/
export const forgotPassword = async (
  payload: ForgotPasswordPayload
): Promise<void> => {
  await apiClient.post("/api/auth/forgot-password/", payload);
};

// POST /api/auth/reset-password/
export const resetPassword = async (
  payload: ResetPasswordPayload
): Promise<void> => {
  await apiClient.post("/api/auth/reset-password/", payload);
};

// POST /api/login/
export const login = async (payload: LoginPayload): Promise<TokenResponse> => {
  const { data } = await apiClient.post<TokenResponse>("/api/login/", payload);
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
};

export const logout = async (): Promise<void> => {
  const refresh = localStorage.getItem("refresh_token");
  await apiClient.post("/api/logout/", { refresh });
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// POST /api/token/refresh/
export const refreshToken = async (refresh: string): Promise<TokenResponse> => {
  const { data } = await apiClient.post<TokenResponse>("/api/token/refresh/", {
    refresh,
  });
  return data;
};