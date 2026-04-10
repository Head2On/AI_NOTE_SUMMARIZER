"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchNotes } from "../../services/notesService";
import { getProfile, logout } from "../../services/authService";
import type { Note, UserProfile } from "../../types";
import { SearchIcon, EditIcon, SettingIcon, LogoutIcon, ChevronDownIcon } from "../../components/UI/Icons";

type TopBarProps = {
  onNewNote?: () => void;
  onSearchResults?: (results: Note[]) => void;
};

export default function TopBar({ onNewNote, onSearchResults }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [modalClosing, setModalClosing] = useState<boolean>(false);

  // Load profile on mount
  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

 const handleLogoutClick = () => {
    setIsProfileOpen(false); // Close profile dropdown
    setShowLogoutModal(true); // Show confirmation modal
  };

  const handleConfirmLogout = async () => {
    setModalClosing(true);
    
    // Wait for close animation
    setTimeout(async () => {
      setIsLoggingOut(true);
      setShowLogoutModal(false);
      
      // Add delay before actual logout
      await new Promise(resolve => setTimeout(resolve, 700)); // 700ms delay
      
      try {
        await logout();
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }, 300);
  };
  
  const handleCancelLogout = () => {
    setModalClosing(true);
    setTimeout(() => {
      setShowLogoutModal(false);
      setModalClosing(false);
    }, 300); // Match this with your transition duration
  };

  const handleSettings = () => {
    window.location.href = "/settings";
  };

  return (
    <>
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-50">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
        />
        {searching && (
          <span className="w-1 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        <button
          onClick={onNewNote}
          className="flex items-center gap-2 w-34 h-10 bg-linear-to-r from-blue-400 hover:from-green-200 to-red-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <EditIcon />
          New Note
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-15 h-10 rounded-full bg-linear-to-r from-violet-500 to-purple-500 overflow-visible flex items-center justify-center text-white font-bold text-xs">
              {profile?.username?.[0]?.toUpperCase() ?? "User"}
            </div>
            {profile && (
              <span className="text-sm text-gray-700 hidden md:block">{profile.username}</span>
            )}
            <ChevronDownIcon 
              className={`transition-transform w-8 h-4 duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{profile?.username || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.email || "user@example.com"}</p>
              </div>
              
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <SettingIcon />
                Settings
              </button>
              
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogoutIcon />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

     {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-in-out">
          {/* Backdrop */}
          <div 
      className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-700 ease-in-out
          ${modalClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleCancelLogout}
      />
          
          {/* Modal with slower zoom and fade */}
        <div className={`relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transition-all duration-700 delay-100 ease-in-out
          ${modalClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="p-6">
            {/* Icon with pulse animation */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4 animate-pulse">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Are you sure?
            </h3>
            
            {/* Message */}
            <p className="text-sm text-gray-500 text-center mb-6">
              You will be logged out of your account. Would you like to continue?
            </p>
            
            {/* Buttons with hover transitions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging out...
                  </>
                ) : (
                  "Yes, Logout"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
          )}
    </>

  );
}