"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, CloudOff, CheckCircle2 } from "lucide-react";
import { useFarm } from "@/lib/store";
import { FarmLogo } from "@/components/farm-logo";

type Mode = "signin" | "forgot" | "newpass";

export function LoginScreen() {
  const { login, isCloud, authError, passwordRecovery, setNewPassword } = useFarm();
  const [mode, setMode] = useState<Mode>(passwordRecovery ? "newpass" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const effectiveMode: Mode = passwordRecovery ? "newpass" : mode;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (effectiveMode === "signin") {
        const res = await login(email, password);
        if (!res.success) setError(res.error || "Wrong email or password.");
      } else if (effectiveMode === "forgot") {
        setMode("signin");
      } else {
        if (password.length < 8) setError("Use at least 8 characters.");
        else if (password !== password2) setError("The two passwords don't match.");
        else {
          const res = await setNewPassword(password);
          if (res.success) setInfo("Password updated. You're signed in.");
          else setError(res.error || "Could not update the password.");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const shownError = error || (effectiveMode === "signin" ? authError : "");

  return (
    <div className="min-h-[100dvh] w-full grid lg:grid-cols-[1.05fr_1fr] bg-tb-ivory">
      {/* Photo side (laptops) */}
      <div className="relative hidden lg:block overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login-bg.jpg" alt="Rose bunches packed at TriBloom Farms" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-tb-forest/90 via-tb-forest/25 to-transparent" />
        <div className="absolute left-10 right-10 bottom-10 text-tb-ivory">
          <p className="text-[11px] uppercase tracking-[0.3em] text-tb-sage font-semibold">Doddaballapur · Bengaluru</p>
          <p className="font-serif-brand text-4xl leading-tight mt-2">From polyhouse to market, every stem accounted for.</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <FarmLogo size="lg" />
          </div>

          <h1 className="font-serif-brand text-3xl text-tb-forest text-center">
            {effectiveMode === "signin" ? "Farm dashboard" : effectiveMode === "forgot" ? "Forgot your password?" : "Set a new password"}
          </h1>
          <p className="text-sm text-tb-muted text-center mt-1 mb-7">
            {effectiveMode === "signin"
              ? "Sign in with your TriBloom team account."
              : effectiveMode === "forgot"
              ? "Ask your TriBloom admin to set a new password for you. They do this in Settings & team → Team → Edit, and it takes a few seconds."
              : "Choose a password you haven't used elsewhere."}
          </p>

          <form onSubmit={submit} className="space-y-3.5">
            {effectiveMode === "signin" && (
              <label className="block">
                <span className="text-xs font-semibold text-tb-ink">Email</span>
                <div className="mt-1 relative">
                  <Mail className="w-4 h-4 text-tb-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={isCloud ? "email" : "text"}
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@tribloom.in"
                    className="w-full rounded-xl border border-tb-line bg-white pl-10 pr-3 py-3 text-sm text-tb-ink placeholder:text-tb-muted/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
              </label>
            )}

            {effectiveMode !== "forgot" && (
              <label className="block">
                <span className="text-xs font-semibold text-tb-ink flex items-center justify-between">
                  {effectiveMode === "newpass" ? "New password" : "Password"}
                  {effectiveMode === "signin" && isCloud && (
                    <button type="button" onClick={() => { setMode("forgot"); setError(""); setInfo(""); }} className="text-emerald-700 font-semibold hover:underline">
                      Forgot password?
                    </button>
                  )}
                </span>
                <div className="mt-1 relative">
                  <Lock className="w-4 h-4 text-tb-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={show ? "text" : "password"}
                    autoComplete={effectiveMode === "newpass" ? "new-password" : "current-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-tb-line bg-white pl-10 pr-11 py-3 text-sm text-tb-ink focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                  <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-tb-muted hover:text-tb-forest" aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
            )}

            {effectiveMode === "newpass" && (
              <label className="block">
                <span className="text-xs font-semibold text-tb-ink">Repeat new password</span>
                <input
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-tb-line bg-white px-3 py-3 text-sm text-tb-ink focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </label>
            )}

            {shownError && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{shownError}</p>}
            {info && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-tb-forest hover:bg-tb-forest-2 disabled:opacity-70 text-white text-sm font-semibold py-3 flex items-center justify-center gap-2 shadow-sm"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {effectiveMode === "signin" ? "Sign in" : effectiveMode === "forgot" ? "Back to sign in" : "Save new password"}
            </button>

          </form>

          {!isCloud && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] text-amber-900">
              <p className="font-semibold flex items-center gap-1.5"><CloudOff className="w-3.5 h-3.5" /> Demo mode</p>
              <p className="mt-1">
                Not connected to the cloud yet, so data stays in this browser. Try <span className="font-mono">shiva@tribloom.in</span> /{" "}
                <span className="font-mono">Password@123</span>.
              </p>
            </div>
          )}

          <p className="text-center text-[11px] text-tb-muted mt-10">
            TriBloom Farms · <a href="https://tribloom.in" className="hover:text-tb-forest">tribloom.in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
