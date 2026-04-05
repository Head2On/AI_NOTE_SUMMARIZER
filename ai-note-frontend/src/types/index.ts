// ─── Auth ────────────────────────────────────────────────────────────────────

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
};

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  new_password: string;
};

export type TokenResponse = {
  access: string;
  refresh: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
};

// ─── Notes ───────────────────────────────────────────────────────────────────

export type Note = {
  id: string;
  title: string;
  file: string;           // file URL
  extracted_text: string | null;
  created_at: string;
  is_delete: boolean;
  deleted_at: string | null;
  category: string | null;
  tags: string[];
  is_public: boolean;
  share_token: string | null;
};

export type NoteVersion = {
  id: number;
  note: string;
  content: string;
  created_at: string;
};

export type UploadNotePayload = {
  title: string;
  file: File;
};

export type UpdateNotePayload = {
  title?: string;
  content?: string;
};

export type ShareNotePayload = {
  user_id: number;
};