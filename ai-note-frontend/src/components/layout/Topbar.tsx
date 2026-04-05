"use client";


import { useState, useCallback } from "react";
import { searchNotes } from "../../services/notesService";
import { getProfile } from "../../services/authService";
import { useEffect } from "react";
import type { Note, UserProfile } from "../../types";
import { SearchIcon, EditIcon } from "../../components/UI/Icons";

type TopBarProps = {
  onNewNote?: () => void;
  onSearchResults?: (results: Note[]) => void;
};

export default function TopBar({ onNewNote, onSearchResults }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load profile on mount
  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  // Debounced search
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      onSearchResults?.([]);
      return;
    }
    try {
      setSearching(true);
      const results = await searchNotes(q);
      onSearchResults?.(results);
    } catch {
      console.error("Search failed");
    } finally {
      setSearching(false);
    }
  }, [onSearchResults]);

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-72">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
        />
        {searching && (
          <span className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewNote}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <EditIcon />
          New Note
        </button>

        {/* Avatar + username */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-100 overflow-hidden flex items-center justify-center text-violet-600 font-bold text-xs">
            {profile?.username?.[0]?.toUpperCase() ?? "U"}
          </div>
          {profile && (
            <span className="text-sm text-gray-600 hidden md:block">{profile.username}</span>
          )}
        </div>
      </div>
    </header>
  );
}