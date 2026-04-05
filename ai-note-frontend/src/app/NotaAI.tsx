"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import NoteEditor from "../components/notes/NoteEditor";
import { uploadNote, getNotes } from "../services/notesService";
import type { Note } from "../types";

export default function NotaAI() {
  const router = useRouter();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Auth check + load notes on mount ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const fetchNotes = async () => {
      try {
        const data = await getNotes();
        setNotes(data);
        // Auto-select first note if exists
        if (data.length > 0) setSelectedNote(data[0]);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to fetch notes:", message);
        // Token might be expired
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [router]);


  const handleNewNote = () => {
  // just trigger the hidden file input
  document.getElementById("note-file-input")?.click();
};

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const created = await uploadNote({
      title: file.name.replace(/\.[^/.]+$/, ""), // use filename as title
      file,
    });
    setNotes((prev) => [created, ...prev]);
    setSelectedNote(created);
    router.push(`/notes/${created.id}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create note:", message);
  }
};

  const handleNoteDeleted = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  const handleNoteUpdated = (updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNote(updated);
  };

  const handleSearchResults = (results: Note[]) => {
    if (results.length > 0) setSelectedNote(results[0]);
  };

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 animate-pulse" />
          <p className="text-sm text-gray-400">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
    {/* Hidden file input */}
    <input
      id="note-file-input"
      type="file"
      accept=".txt,.pdf,.doc,.docx"
      className="hidden"
      onChange={handleFileSelected}
    />

    <Sidebar
      notes={notes}
      onSelectNote={(note) => {
        setSelectedNote(note);
        router.push(`/notes/${note.id}`);
      }}
      onNewNote={handleNewNote}
    />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        onNewNote={handleNewNote}
        onSearchResults={handleSearchResults}
      />
      <NoteEditor
        note={selectedNote}
        onNoteDeleted={handleNoteDeleted}
        onNoteUpdated={handleNoteUpdated}
      />
    </div>
  </div>
);

}