"use client";

import { useState } from "react";
import {
  uploadNote,
  softDeleteNote,
  generateShareLink,
  disableShareLink,
  rewriteNote,
  getNotesSummary,
  exportNoteTxt,
  exportNotePdf,
} from "../../services/notesService";
import type { Note } from "../../types"
import { CalendarIcon, DownloadIcon, ShareIcon, SparkleIcon, SummaryIcon, TrashIcon,FileIcon, PaperclipIcon, SendIcon, XIcon } from "../UI/Icons";
import { useCallback, useRef } from "react";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
type NoteEditorProps = {
  note: Note | null;
  isNewNote?: boolean;
  onNoteDeleted?: (id: string) => void;
  onNoteUpdated?: (note: Note) => void;
  onNoteCreated?: (note: Note) => void;
};
 
// ─── Helper ───────────────────────────────────────────────────────────────────
 
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
 
// ─── New Note Chat UI ─────────────────────────────────────────────────────────
 
function NewNoteChat({ onNoteCreated }: { onNoteCreated?: (note: Note) => void }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  const handleFileChange = (selected: File) => {
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ""));
  };
 
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  }, []);
 
  const handleSend = async () => {
    if (!file) {
      setError("Please attach a file first.");
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const created = await uploadNote({
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        file,
      });
      onNoteCreated?.(created);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };
 
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Create a new note</h2>
          <p className="text-sm text-gray-400">Upload a file and give it a title</p>
        </div>
 
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-2xl p-8 mb-4 text-center transition-colors cursor-pointer
            ${dragging ? "border-violet-400 bg-violet-50" : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"}
            ${file ? "cursor-default" : ""}`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                <FileIcon />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(""); }}
                className="ml-auto text-gray-300 hover:text-red-400 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          ) : (
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                <PaperclipIcon />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Drop your file here</p>
              <p className="text-xs text-gray-400">or click to browse — PDF, TXT, DOC, DOCX</p>
            </div>
          )}
        </div>
 
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
        />
 
        {/* Chat input row */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-violet-600 transition-colors shrink-0"
            title="Attach file"
          >
            <PaperclipIcon />
          </button>
 
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your note a title..."
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
 
          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={uploading || !file}
            className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors shrink-0"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
 
        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
        )}
 
        {/* Hint chips */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {["Summarize this", "Extract key points", "Translate to English", "Rewrite clearly"].map((hint) => (
            <button
              key={hint}
              onClick={() => setTitle(hint)}
              className="px-3 py-1.5 rounded-full text-xs text-gray-500 bg-gray-100 hover:bg-violet-50 hover:text-violet-600 transition-colors"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
 
// ─── Main NoteEditor ──────────────────────────────────────────────────────────
 
export default function NoteEditor({
  note,
  isNewNote = false,
  onNoteDeleted,
  onNoteUpdated,
  onNoteCreated,
}: NoteEditorProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(note?.share_token ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
 
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
 
  // ── Show chat UI when no note selected or new note mode ───────────────────
  if (!note || isNewNote) {
    return <NewNoteChat onNoteCreated={onNoteCreated} />;
  }
 
  // ── Actions ───────────────────────────────────────────────────────────────
 
  const handleDelete = async () => {
    if (!confirm("Move this note to trash?")) return;
    try {
      setLoadingAction("delete");
      await softDeleteNote(note.id);
      onNoteDeleted?.(note.id);
      showToast("Note moved to trash.");
    } catch {
      showToast("Failed to delete note.");
    } finally {
      setLoadingAction(null);
    }
  };
 
  const handleShare = async () => {
    try {
      setLoadingAction("share");
      const { shared_link } = await generateShareLink(note.id);
      setShareLink(shared_link);
      await navigator.clipboard.writeText(shared_link);
      showToast("Share link copied!");
    } catch {
      showToast("Failed to generate share link.");
    } finally {
      setLoadingAction(null);
    }
  };
 
  const handleDisableShare = async () => {
    try {
      setLoadingAction("disableShare");
      await disableShareLink(note.id);
      setShareLink(null);
      showToast("Share link disabled.");
    } catch {
      showToast("Failed to disable share link.");
    } finally {
      setLoadingAction(null);
    }
  };
 
  const handleRewrite = async () => {
    try {
      setLoadingAction("rewrite");
      const { content } = await rewriteNote(note.id);
      onNoteUpdated?.({ ...note, extracted_text: content });
      showToast("Note rewritten with AI!");
    } catch {
      showToast("AI rewrite failed.");
    } finally {
      setLoadingAction(null);
    }
  };
 
  const handleSummary = async () => {
    try {
      setLoadingAction("summary");
      const { summary: s } = await getNotesSummary(note.id);
      setSummary(s);
    } catch {
      showToast("Failed to get summary.");
    } finally {
      setLoadingAction(null);
    }
  };
 
  const handleExportTxt = async () => {
    try {
      setLoadingAction("exportTxt");
      const blob = await exportNoteTxt(note.id);
      downloadBlob(blob, `${note.title}.txt`);
    } catch {
      showToast("Export failed.");
    } finally {
      setLoadingAction(null);
    }
  };
 
  const handleExportPdf = async () => {
    try {
      setLoadingAction("exportPdf");
      const blob = await exportNotePdf(note.id);
      downloadBlob(blob, `${note.title}.pdf`);
    } catch {
      showToast("Export failed.");
    } finally {
      setLoadingAction(null);
    }
  };
 
  // ── Note View ─────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 overflow-y-auto px-10 py-8 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
 
      <div className="max-w-2xl">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{note.title}</h1>
 
        {/* Meta */}
        <div className="flex items-center gap-3 mb-5 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <CalendarIcon />
            <span>{new Date(note.created_at).toLocaleDateString()}</span>
          </div>
          {note.category && (
            <>
              <span>·</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-xs">
                {note.category}
              </span>
            </>
          )}
          {note.tags && note.tags.length > 0 && (
            <div className="flex gap-1">
              {note.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
 
        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={handleRewrite}
            disabled={loadingAction === "rewrite"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50 transition-colors"
          >
            <SparkleIcon />
            {loadingAction === "rewrite" ? "Rewriting..." : "AI Rewrite"}
          </button>
 
          <button
            onClick={handleSummary}
            disabled={loadingAction === "summary"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <SummaryIcon />
            {loadingAction === "summary" ? "Loading..." : "Summary"}
          </button>
 
          {!shareLink ? (
            <button
              onClick={handleShare}
              disabled={loadingAction === "share"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ShareIcon />
              {loadingAction === "share" ? "Sharing..." : "Share"}
            </button>
          ) : (
            <button
              onClick={handleDisableShare}
              disabled={loadingAction === "disableShare"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              <ShareIcon />
              {loadingAction === "disableShare" ? "Disabling..." : "Shared (disable)"}
            </button>
          )}
 
          <button
            onClick={handleExportTxt}
            disabled={loadingAction === "exportTxt"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <DownloadIcon />
            TXT
          </button>
 
          <button
            onClick={handleExportPdf}
            disabled={loadingAction === "exportPdf"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <DownloadIcon />
            PDF
          </button>
 
          <button
            onClick={handleDelete}
            disabled={loadingAction === "delete"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors ml-auto"
          >
            <TrashIcon />
            {loadingAction === "delete" ? "Deleting..." : "Trash"}
          </button>
        </div>
 
        {/* AI Summary Panel */}
        {summary && (
          <div className="mb-5 p-4 bg-violet-50 border border-violet-100 rounded-xl">
            <p className="text-xs font-semibold text-violet-500 mb-1 uppercase tracking-wider">AI Summary</p>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
            <button onClick={() => setSummary(null)} className="text-xs text-violet-400 hover:text-violet-600 mt-2">
              Dismiss
            </button>
          </div>
        )}
 
        {/* Share Link */}
        {shareLink && (
          <div className="mb-5 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2">
            <p className="text-xs text-green-700 truncate flex-1">{shareLink}</p>
            <button
              onClick={() => navigator.clipboard.writeText(shareLink)}
              className="text-xs text-green-600 hover:text-green-800 shrink-0"
            >
              Copy
            </button>
          </div>
        )}
 
        {/* Extracted Text — read only, from backend */}
        <div className="w-full min-h-96 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {note.extracted_text ?? (
            <span className="text-gray-400 italic">No text extracted from this file yet.</span>
          )}
        </div>
      </div>
    </main>
  );
}
 