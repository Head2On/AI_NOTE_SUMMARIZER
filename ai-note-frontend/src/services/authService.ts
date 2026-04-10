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
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult 
} from "firebase/auth";
import { app } from "../services/firebaseConfig";

interface CustomWindow extends Window {
  recaptchaVerifier?: RecaptchaVerifier;
}

const auth = getAuth(app);
const customWindow = typeof window !== "undefined" ? (window as unknown as CustomWindow) : null;

// Helper to save tokens
const saveTokens = (data: TokenResponse) => {
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
};

// --- Firebase -> Django Bridge ---
const authenticateWithDjango = async (firebaseToken: string): Promise<TokenResponse> => {
  const { data } = await apiClient.post<TokenResponse>("/api/auth/firebase/", {
    token: firebaseToken,
  });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
};

export const loginWithGoogle = async (): Promise<TokenResponse> => {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return await authenticateWithDjango(idToken);
};

// --- Phone OTP Flow ---
export const setupRecaptcha = (containerId: string): void => {
  if (customWindow && !customWindow.recaptchaVerifier) {
    customWindow.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });
  }
};

export const sendOtp = async (phoneNumber: string): Promise<ConfirmationResult> => {
  if (!customWindow?.recaptchaVerifier) {
    throw new Error("Recaptcha not initialized");
  }
  return await signInWithPhoneNumber(auth, phoneNumber, customWindow.recaptchaVerifier);
};

export const verifyOtpAndLogin = async (
  confirmationResult: ConfirmationResult, 
  otp: string
): Promise<TokenResponse> => {
  const result = await confirmationResult.confirm(otp);
  const idToken = await result.user.getIdToken();
  return await authenticateWithDjango(idToken);
};


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
  const { data } = await apiClient.post<TokenResponse>("/api/token/refresh/", { refresh });
  saveTokens(data);
  return data;
};