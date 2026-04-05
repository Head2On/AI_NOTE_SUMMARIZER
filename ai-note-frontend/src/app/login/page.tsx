"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await login({ email, password });
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">NotaAI</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-400 mb-6">Sign in to your account</p>

        {/* Error */}
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Username */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-violet-400 transition-colors"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-violet-400 transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-gray-400 mt-4">
          `Don&apos;t` have an account?{" "}
          <a href="/register" className="text-violet-600 hover:underline font-medium">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}