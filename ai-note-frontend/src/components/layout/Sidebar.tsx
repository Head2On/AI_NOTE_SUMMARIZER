"use client";

import  { useState, JSX, } from "react";
import { logout } from "../../services/authService";
import type { Note } from "../../types";
import { HomeIcon, TranscribeIcon, LibraryIcon, SettingIcon, FolderIcon, PlusIcon, LogoutIcon } from "../UI/Icons";

type NavItem = { label: string; icon: JSX.Element };

const navItems: NavItem[] = [
  { label: "Home", icon: <HomeIcon /> },
  { label: "Transcribe", icon: <TranscribeIcon /> },
  { label: "My Library", icon: <LibraryIcon /> },
  { label: "Setting", icon: <SettingIcon /> },
];

type SidebarProps = {
  notes: Note[];
  onSelectNote?: (note: Note) => void;
  onNewNote?: () => void;
};

export default function Sidebar({ notes = [], onSelectNote, onNewNote }: SidebarProps) {
  const [activeNav, setActiveNav] = useState<string>("Home");
  const [loading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  const handleLogout = async () => {
  try {
    await logout();
    window.location.href = "/login";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Logout failed:", message);
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }
};

  return (
    <aside className="w-52 bg-white border-r border-gray-100 flex flex-col py-4 px-3 shrink-0 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-base tracking-tight">NotaAI</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 mb-6">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveNav(item.label)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left
              ${activeNav === item.label
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
          >
            <span className={activeNav === item.label ? "text-gray-700" : "text-gray-400"}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

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
        {!loading && ! error && notes.length === 0 && (
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

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 mt-4 rounded-lg text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors w-full"
      >
        <LogoutIcon />
        Logout
      </button>
    </aside>
  );
}