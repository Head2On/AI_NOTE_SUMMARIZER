"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register ,loginWithGoogle,setupRecaptcha,sendOtp,verifyOtpAndLogin } from "@/services/authService";
import type { ConfirmationResult } from "firebase/auth";

type AuthStep =
  | "landing"
  | "login"
  | "login-password"
  | "register"
  | "register-password"
  | "phone"
  | "phone-otp";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState({ name: "India", code: "+91", flag: "🇮🇳" });
  const [countryOpen, setCountryOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const clearError = () => setError(null);

 const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    await loginWithGoogle();
    router.push("/");
  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("An unexpected error occurred");
    }
  } finally {
    setLoading(false);
  }
};
  // ── Landing ───────────────────────────────────────────────────────────────
  if (step === "landing") {
    return (
      <AuthLayout>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">
          Log in or sign up
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Upload files, get AI summaries, and more.
        </p>

        {error && <ErrorBox message={error} onDismiss={clearError} />}

        <div className="flex flex-col gap-3 w-full">
          {/* Google */}
          <SocialButton onClick={handleGoogleLogin}>
            <GoogleIcon />
            Continue with Google
          </SocialButton>

          {/* Phone */}
          <SocialButton onClick={() => { clearError(); setStep("phone"); }}>
            <PhoneIcon />
            Continue with phone
          </SocialButton>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-[#3f3f3f]" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-[#3f3f3f]" />
          </div>

          {/* Email input directly on landing — like ChatGPT */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email.trim() && setStep("login")}
            className="w-full px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition-colors"
          />

          <button
            onClick={() => { clearError(); setStep("login"); }}
            disabled={!email.trim()}
            className="w-full py-3 rounded-full bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => { clearError(); setStep("register"); }}
            className="text-white hover:underline"
          >
            Sign up
          </button>
        </p>
      </AuthLayout>
    );
  }

  // ── Login — password ──────────────────────────────────────────────────────
  if (step === "login") {
    const handleLogin = async () => {
      if (!password.trim()) return;
      try {
        setLoading(true);
        clearError();
        await login({ email: email, password });
        router.push("/");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Invalid credentials.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <AuthLayout onBack={() => { setStep("landing"); clearError(); }}>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Welcome back</h1>
        <p className="text-gray-400 text-sm text-center mb-1">Signing in as</p>
        <p className="text-white text-sm text-center font-medium mb-6 truncate">{email}</p>

        {error && <ErrorBox message={error} onDismiss={clearError} />}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition-colors mb-3"
        />
        <button
          onClick={handleLogin}
          disabled={loading || !password.trim()}
          className="w-full py-3 rounded-full bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spinner label="Signing in..." /> : "Log in"}
        </button>

        <p className="text-center text-xs text-gray-500 mt-5">
          Don&apos;t have an account?{" "}
          <button onClick={() => { setStep("register"); clearError(); }} className="text-white hover:underline">
            Sign up
          </button>
        </p>
      </AuthLayout>
    );
  }

  // ── Register — email ──────────────────────────────────────────────────────
  if (step === "register") {
    return (
      <AuthLayout onBack={() => { setStep("landing"); clearError(); }}>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Create your account</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Enter your email to get started</p>

        {error && <ErrorBox message={error} onDismiss={clearError} />}

        {/* Social buttons on register too */}
        <div className="flex flex-col gap-3 mb-4">
          <SocialButton onClick={handleGoogleLogin}>
            <GoogleIcon />
            Continue with Google
          </SocialButton>
          <SocialButton onClick={() => { clearError(); setStep("phone"); }}>
            <PhoneIcon />
            Continue with phone
          </SocialButton>
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-[#3f3f3f]" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-[#3f3f3f]" />
          </div>
        </div>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && email.trim() && setStep("register-password")}
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition-colors mb-3"
        />
        <button
          onClick={() => { clearError(); setStep("register-password"); }}
          disabled={!email.trim()}
          className="w-full py-3 rounded-full bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>

        <p className="text-center text-xs text-gray-500 mt-5">
          Already have an account?{" "}
          <button onClick={() => { setStep("landing"); clearError(); }} className="text-white hover:underline">
            Log in
          </button>
        </p>
      </AuthLayout>
    );
  }

  // ── Register — email + password ────────────────────────────────────────
  if (step === "register-password") {
    const handleRegister = async () => {
      if (!email.trim() || !password.trim()) return;
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      try {
        setLoading(true);
        clearError();
        await register({ email, password });
        await login({ email, password });
        router.push("/");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Registration failed.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <AuthLayout onBack={() => { setStep("register"); clearError(); }}>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Set up your account</h1>
        <p className="text-gray-400 text-sm text-center mb-1">Registering as</p>
        <p className="text-white text-sm text-center font-medium mb-6 truncate">{email}</p>

        {error && <ErrorBox message={error} onDismiss={clearError} />}

        <input
          type="text"
          placeholder="Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition-colors mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition-colors mb-3"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          className="w-full px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition-colors mb-3"
        />
        <button
          onClick={handleRegister}
          disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
          className="w-full py-3 rounded-full bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spinner label="Creating account..." /> : "Create account"}
        </button>
      </AuthLayout>
    );
  }

  // ── Phone — enter number ──────────────────────────────────────────────────
  if (step === "phone") {
    const countries = [
      { name: "India", code: "+91", flag: "🇮🇳" },
      { name: "United States", code: "+1", flag: "🇺🇸" },
      { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
      { name: "Canada", code: "+1", flag: "🇨🇦" },
      { name: "Australia", code: "+61", flag: "🇦🇺" },
      { name: "Germany", code: "+49", flag: "🇩🇪" },
      { name: "France", code: "+33", flag: "🇫🇷" },
      { name: "Japan", code: "+81", flag: "🇯🇵" },
      { name: "UAE", code: "+971", flag: "🇦🇪" },
      { name: "Singapore", code: "+65", flag: "🇸🇬" },
      { name: "Pakistan", code: "+92", flag: "🇵🇰" },
      { name: "Bangladesh", code: "+880", flag: "🇧🇩" },
      { name: "Brazil", code: "+55", flag: "🇧🇷" },
      { name: "Nigeria", code: "+234", flag: "🇳🇬" },
    ];

   const handleSendOtp = async () => {
  if (!phone.trim()) return;
  try {
    setLoading(true);
    clearError();

    // 1. Initialize the invisible captcha
    setupRecaptcha("recaptcha-container");

    // 2. Format the phone number (e.g., +919876543210)
    const fullPhone = country.code + phone;

    // 3. Send the OTP and save the result
    const result = await sendOtp(fullPhone);
    setConfirmationResult(result);
    
    setStep("phone-otp");
  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Failed to send OTP. Try again later.");
    }
  } finally {
    setLoading(false);
  }
};

    return (
      <AuthLayout onBack={() => { setStep("landing"); clearError(); setCountryOpen(false); }}>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Continue with phone</h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          We&apos;ll send a verification code to your number
        </p>

        {error && <ErrorBox message={error} onDismiss={clearError} />}

        {/* Country Selector */}
        <div className="relative mb-3">
          <button
            onClick={() => setCountryOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white text-sm hover:border-gray-500 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{country.flag}</span>
              <span>{country.name} ({country.code})</span>
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${countryOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {countryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-[#3f3f3f] rounded-xl overflow-y-auto max-h-48 z-50 shadow-2xl">
              {countries.map((c) => (
                <button
                  key={`${c.name}-${c.code}`}
                  onClick={() => { setCountry(c); setCountryOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-[#3a3a3a] transition-colors
                    ${country.name === c.name ? "text-white bg-[#383838]" : "text-gray-300"}`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-gray-500 text-xs">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone input with country code prefix */}
        <div className="flex items-center bg-[#2f2f2f] border border-[#3f3f3f] rounded-xl mb-3 focus-within:border-gray-500 transition-colors overflow-hidden">
          <span className="px-4 py-3 text-sm text-gray-400 border-r border-[#3f3f3f] shrink-0 select-none">
            {country.code}
          </span>
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            autoFocus
            className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
          />
        </div>

        <button
          onClick={handleSendOtp}
          disabled={loading || !phone.trim()}
          className="w-full py-3 rounded-full bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spinner label="Sending code..." /> : "Continue"}
        </button>
      </AuthLayout>
    );
  }

  // ── Phone — enter OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
  if (!otp.trim() || !confirmationResult) return;
  try {
    setLoading(true);
    clearError();

    // Verify the code and log in to your Django backend
    await verifyOtpAndLogin(confirmationResult, otp);
    
    // If successful, the authService has already saved your tokens
    router.push("/");
  } catch (err: unknown) {
    if (err instanceof Error) {
      setError("Invalid OTP or connection error.");
    } else {
      setError("Verification failed.");
    }
  } finally {
    setLoading(false);
  }

    return (
      <AuthLayout onBack={() => { setStep("phone"); clearError(); }}>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Enter the code</h1>
        <p className="text-gray-400 text-sm text-center mb-1">Code sent to</p>
        <p className="text-white text-sm text-center font-medium mb-6">{phone}</p>

        {error && <ErrorBox message={error} onDismiss={clearError} />}

        <input
          type="text"
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
          autoFocus
          maxLength={6}
          className="w-full px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition-colors mb-3 text-center tracking-[0.5em] text-lg"
        />
        <button
          onClick={handleVerifyOtp}
          disabled={loading || otp.length < 6}
          className="w-full py-3 rounded-full bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spinner label="Verifying..." /> : "Verify"}
        </button>

        <button
          onClick={() => { setStep("phone"); setOtp(""); clearError(); }}
          className="w-full text-center text-xs text-gray-500 hover:text-white mt-4 transition-colors"
        >
          Didn&apos;t receive a code? Go back
        </button>
      </AuthLayout>
    );
  }

  return null;
};

// ─── Shared Layout ────────────────────────────────────────────────────────────

function AuthLayout({ children, onBack }: { children: React.ReactNode; onBack?: () => void; }) {
  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#2a2a2a] rounded-2xl p-8 shadow-2xl border border-[#3f3f3f] relative">
        {/* ... existing code ... */}
        {children}
        
        {/* ADD THIS LINE AT THE BOTTOM OF THE BOX */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

// ─── Social Button ────────────────────────────────────────────────────────────

function SocialButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-[#2f2f2f] border border-[#3f3f3f] text-white text-sm font-medium hover:bg-[#383838] transition-colors"
    >
      {children}
    </button>
  );
}

// ─── Error Box ────────────────────────────────────────────────────────────────

function ErrorBox({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4 flex items-center justify-between gap-2">
      <span>{message}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300 shrink-0">✕</button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      {label}
    </span>
  );
}

// ─── Google Icon ──────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─── Phone Icon ───────────────────────────────────────────────────────────────

function PhoneIcon() {
  return (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}