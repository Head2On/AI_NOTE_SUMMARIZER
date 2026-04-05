// app/notes/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getNoteById, uploadNote } from "@/services/notesService";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import NoteEditor from "@/components/notes/NoteEditor";
import type { Note } from "@/types";

export default function NotePage() {
  const params = useParams();
  const id = params.id as string;   // ← cast properly, avoids string[] issue
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    if (id) {
      getNoteById(id).then(setNote).catch(console.error);
    }
  }, [id]);

  const handleNewNote = async () => {
    try {
      const created = await uploadNote({ title: "Untitled Note", content: "" });
      setNote(created);
      router.push(`/notes/${created.id}`);
    } catch {
      console.error("Failed to create note");
    }
  };

  return (

     <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar
        onSelectNote={(n) => {
          setNote(n);
          router.push(`/notes/${n.id}`);  // ← navigate when clicking sidebar note
        }}
        onNewNote={handleNewNote}
      />
      
     <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onNewNote={handleNewNote}
          onSearchResults={(results) => {
            if (results.length > 0) {
              setNote(results[0]);
              router.push(`/notes/${results[0].id}`);
            }
          }}
        />
        <NoteEditor
          note={note}
          onNoteUpdated={setNote}
          onNoteDeleted={() => {
            setNote(null);
            router.push("/");   // ← go home after delete
          }}
        />
      </div>
    </div>
  );
}