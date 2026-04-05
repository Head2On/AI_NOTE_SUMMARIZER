"use client";

import { useState } from "react";
import {
  updateNote,
  softDeleteNote,
  generateShareLink,
  disableShareLink,
  rewriteNote,
  getNotesSummary,
  exportNoteTxt,
  exportNotePdf,
} from "../../services/notesService";
import type { Note } from "../../types"
// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
const SummaryIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

type NoteEditorProps = {
  note: Note | null;
  onNoteDeleted?: (id: string) => void;
  onNoteUpdated?: (note: Note) => void;
};

// ─── Helper: download blob ────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NoteEditor({ note, onNoteDeleted, onNoteUpdated }: NoteEditorProps) {
  const [title, setTitle] = useState<string>(note?.title ?? "");
  const [content, setContent] = useState<string>(note?.file ?? "");
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Sync when a different note is selected
  if (note && note.title !== title && !saving) {
    setTitle(note.title);
    setContent(note.file);
    setSummary(null);
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!note) return;
    try {
      setSaving(true);
      const updated = await updateNote(note.id, { title, content });
      onNoteUpdated?.(updated);
      showToast("Note saved!");
    } catch {
      showToast("Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !confirm("Move this note to trash?")) return;
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
    if (!note) return;
    try {
      setLoadingAction("share");
      const { shared_link } = await generateShareLink(note.id);
      await navigator.clipboard.writeText(shared_link);
      showToast("Share link copied to clipboard!");
    } catch {
      showToast("Failed to generate share link.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisableShare = async () => {
    if (!note) return;
    try {
      setLoadingAction("disableShare");
      await disableShareLink(note.id);
      showToast("Share link disabled.");
    } catch {
      showToast("Failed to disable share link.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRewrite = async () => {
    if (!note) return;
    try {
      setLoadingAction("rewrite");
      const { content: rewritten } = await rewriteNote(note.id);
      setContent(rewritten);
      showToast("Note rewritten with AI!");
    } catch {
      showToast("AI rewrite failed.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSummary = async () => {
    if (!note) return;
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
    if (!note) return;
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
    if (!note) return;
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

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!note) {
    return (
      <main className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a note or create a new one.
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-10 py-8 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <div className="max-w-2xl">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold text-gray-900 mb-3 bg-transparent outline-none border-b border-transparent focus:border-violet-300 transition-colors pb-1"
          placeholder="Note title..."
        />

        {/* Meta */}
        <div className="flex items-center gap-3 mb-5 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <CalendarIcon />
            <span>{new Date(note.created_at).toLocaleDateString()}</span>
          </div>
          <span>·</span>
          <span>{note.title}</span>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <SaveIcon />
            {saving ? "Saving..." : "Save"}
          </button>

          {/* AI Rewrite */}
          <button
            onClick={handleRewrite}
            disabled={loadingAction === "rewrite"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50 transition-colors"
          >
            <SparkleIcon />
            {loadingAction === "rewrite" ? "Rewriting..." : "AI Rewrite"}
          </button>

          {/* Summary */}
          <button
            onClick={handleSummary}
            disabled={loadingAction === "summary"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <SummaryIcon />
            {loadingAction === "summary" ? "Loading..." : "Summary"}
          </button>

          {/* Share
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
          )} */}

          {/* Export TXT */}
          <button
            onClick={handleExportTxt}
            disabled={loadingAction === "exportTxt"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <DownloadIcon />
            TXT
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            disabled={loadingAction === "exportPdf"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <DownloadIcon />
            PDF
          </button>

          {/* Delete */}
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

        {/* Share Link
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
        )} */}

        {/* Content Editor */}
        <div className="w-full min-h-96 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {note.extracted_text ?? "No text extracted from this file yet."}
      </div>
      </div>
    </main>
  );
}