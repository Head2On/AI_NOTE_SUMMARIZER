import apiClient from "../lib/apiClient";
import type {
  Note,
  NoteVersion,
  UploadNotePayload,
  UpdateNotePayload,
  ShareNotePayload,
} from "../types";

// POST /api/notes/upload/
export const uploadNote = async (payload: UploadNotePayload): Promise<Note> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("file", payload.file);

  const { data } = await apiClient.post<Note>("/api/notes/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// GET /api/notes/
export const getNotes = async (): Promise<Note[]> => {
  const { data } = await apiClient.get<Note[]>("/api/notes/");
  return data;
};

// GET /api/notes/<uuid>/
export const getNoteById = async (id: string): Promise<Note> => {
  const { data } = await apiClient.get<Note>(`/api/notes/${id}/`);
  return data;
};

// PUT /api/notes/<uuid>/update/
export const updateNote = async (
  id: string,
  payload: UpdateNotePayload
): Promise<Note> => {
  const { data } = await apiClient.put<Note>(
    `/api/notes/${id}/update/`,
    payload
  );
  return data;
};

// DELETE /api/notes/<uuid>/delete/  (soft delete)
export const softDeleteNote = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/notes/${id}/delete/`);
};

// GET /api/notes/trash/
export const getTrashedNotes = async (): Promise<Note[]> => {
  const { data } = await apiClient.get<Note[]>("/api/notes/trash/");
  return data;
};

// POST /api/notes/<uuid>/restore/
export const restoreNote = async (id: string): Promise<void> => {
  await apiClient.post(`/api/notes/${id}/restore/`);
};

// DELETE /api/notes/<uuid>/delete/permanent/
export const permanentDeleteNote = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/notes/${id}/delete/permanent/`);
};

// POST /api/notes/<uuid>/share/
export const generateShareLink = async (
  id: string
): Promise<{ shared_link: string }> => {
  const { data } = await apiClient.post<{ shared_link: string }>(
    `/api/notes/${id}/share/`
  );
  return data;
};

// POST /api/notes/<uuid>/share/disable/
export const disableShareLink = async (id: string): Promise<void> => {
  await apiClient.post(`/api/notes/${id}/share/disable/`);
};

// GET /api/notes/public/<uuid>/
export const getPublicNote = async (id: string): Promise<Note> => {
  const { data } = await apiClient.get<Note>(`/api/notes/public/${id}/`);
  return data;
};

// GET /api/notes/search/?q=...
export const searchNotes = async (query: string): Promise<Note[]> => {
  const { data } = await apiClient.get<Note[]>("/api/notes/search/", {
    params: { q: query },
  });
  return data;
};

// GET /api/notes/<uuid>/versions/
export const getNoteVersions = async (id: string): Promise<NoteVersion[]> => {
  const { data } = await apiClient.get<NoteVersion[]>(
    `/api/notes/${id}/versions/`
  );
  return data;
};

// POST /api/notes/<uuid>/versions/restore/<version_id>/
export const restoreNoteVersion = async (
  id: string,
  versionId: number
): Promise<void> => {
  await apiClient.post(`/api/notes/${id}/versions/restore/${versionId}/`);
};

// POST /api/notes/<uuid>/rewrite/
export const rewriteNote = async (id: string): Promise<{ content: string }> => {
  const { data } = await apiClient.post<{ content: string }>(
    `/api/notes/${id}/rewrite/`
  );
  return data;
};

// GET /api/notes/<uuid>/summary/
export const getNotesSummary = async (
  id: string
): Promise<{ summary: string }> => {
  const { data } = await apiClient.get<{ summary: string }>(
    `/api/notes/${id}/summary/`
  );
  return data;
};

// GET /api/notes/<uuid>/translate/?lang=...
export const translateNote = async (
  id: string,
  lang: string
): Promise<{ translated: string }> => {
  const { data } = await apiClient.get<{ translated: string }>(
    `/api/notes/${id}/translate/`,
    { params: { lang } }
  );
  return data;
};

// GET /api/notes/<uuid>/export/txt/
export const exportNoteTxt = async (id: string): Promise<Blob> => {
  const { data } = await apiClient.get(`/api/notes/${id}/export/txt/`, {
    responseType: "blob",
  });
  return data;
};

// GET /api/notes/<uuid>/export/pdf/
export const exportNotePdf = async (id: string): Promise<Blob> => {
  const { data } = await apiClient.get(`/api/notes/${id}/export/pdf/`, {
    responseType: "blob",
  });
  return data;
};

// POST /api/notes/<uuid>/share-to/
export const shareNoteToUser = async (
  id: string,
  payload: ShareNotePayload
): Promise<void> => {
  await apiClient.post(`/api/notes/${id}/share-to/`, payload);
};

// POST /api/notes/<uuid>/unshare/
export const unshareNote = async (
  id: string,
  payload: ShareNotePayload
): Promise<void> => {
  await apiClient.post(`/api/notes/${id}/unshare/`, payload);
};

// GET /api/notes/share-with-me/
export const getSharedWithMe = async (): Promise<Note[]> => {
  const { data } = await apiClient.get<Note[]>("/api/notes/share-with-me/");
  return data;
};