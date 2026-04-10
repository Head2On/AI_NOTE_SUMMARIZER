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
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNewNote, setIsNewNote] = useState(false);
  const [isFetchingNote, setIsFetchingNote] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchNoteData = async () => {
        setIsFetchingNote(true);
        try {
          const noteData = await getNoteById(id);
          setNote(noteData);
        } catch (err) {
          console.error(err);
        } finally {
          setIsFetchingNote(false);
        }
      };
      
      fetchNoteData();
    }
  }, [id]);

  useEffect(() => {
    const fetchSidebarNotes = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if(!token) return;
        
        const res = await fetch('http://localhost:8000/api/notes/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.error("Failed to fetch sidebar notes");
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)){
          setNotes(data);
        }else if (data && Array.isArray(data.results)){
          setNotes(data.results);
        }
      } catch (err) {
        console.error(err);
      }
    };
  
    fetchSidebarNotes();
  }, []);


  const handleNewNote = () => {
    setIsNewNote(true);
    setNote(null);
  };

  return (

     <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar
        notes={notes}
        onSelectNote={(n) => {
          // 1. Update the selected note
          setNote(n);
          setIsNewNote(false); 
          router.push(`/notes/${n.id}`);  
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

        {isFetchingNote && !isNewNote ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
            <p className="text-sm text-gray-400 mt-4">Loading note...</p>
          </div>
        ) : (
        <NoteEditor
          note={note}
          isNewNote={isNewNote} // 1. Pass the new state
          
          // 2. Add the onNoteCreated handler to catch the file upload
          onNoteCreated={(created) => {
            setNotes((prev) => Array.isArray(prev) ? [created, ...prev] : [created]);
            setIsNewNote(false);
            router.push(`/notes/${created.id}`);
            router.refresh();
          }}
          
          onNoteUpdated={setNote}
          onNoteDeleted={(deletedId) => {
            setNote(null);
            const remainingNotes = notes.filter((n) => n.id !== deletedId);
            setNotes(remainingNotes);
            if (remainingNotes.length > 0) {
              router.push(`/notes/${remainingNotes[0].id}`);
            } else {
              router.push("/");
            }
          }}
        />
        )}
      </div>
    </div>
  );
}