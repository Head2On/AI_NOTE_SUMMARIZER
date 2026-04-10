"use client";

import { useState, JSX } from "react";
import type { Note } from "../../types";
import { FolderIcon, HomeIcon, PlusIcon, SettingIcon } from "../UI/Icons";

type SidebarProps = {
  notes: Note[];
  onSelectNote?: (note: Note) => void;
  onNewNote?: () => void;
};

export default function Sidebar({ notes = [], onSelectNote, onNewNote }: SidebarProps) {
  const [loading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  return (
    <aside className="w-52 bg-white border-r border-gray-100 flex flex-col py-4 px-3 shrink-0 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <HomeIcon />
        </div>
        <span className="font-bold text-gray-900 text-base tracking-tight">NotaAI</span>
      </div>

      {/* My Notes */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Notes</span>
          <button onClick={onNewNote} className="text-gray-400 hover:text-violet-600 transition-colors" title="New Note">
            <PlusIcon />
          </button>
        </div>

        {loading && <p className="px-3 text-xs text-gray-400 animate-pulse">Loading...</p>}
        {error && <p className="px-3 text-xs text-red-400">{error}</p>}
        {!loading && !error && notes.length === 0 && (
          <p className="px-3 text-xs text-gray-400">No notes yet.</p>
        )}

        <div className="flex flex-col gap-0.5">
          {Array.isArray(notes) && notes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote?.(note)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors w-full text-left"
            >
              <span className="text-gray-300"><FolderIcon /></span>
              <span className="truncate">{note.title}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}