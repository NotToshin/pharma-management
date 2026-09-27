"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please verify credentials.");
        return;
      }

      // Store security credentials and permission matrix
      if (data.token) {
        localStorage.setItem("ak_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("ak_user", JSON.stringify(data.user));
      }

      // Redirect directly to the Command Center Dashboard
      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the authentication server. Please verify backend service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between items-center py-12 px-4 selection:bg-slate-900 selection:text-white">
      <div className="w-full" />

      {/* Main Container */}
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* AK Pharma Brand Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-md bg-black flex items-center justify-center text-white">
            <span className="font-bold text-[11px] tracking-tighter">AK</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            AK Pharma
          </span>
        </div>

        {/* Card Component */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm">
          <div className="space-y-1 mb-6">
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              Login to your account
            </h1>
            <p className="text-xs text-slate-500">
              Enter your email below to login to your account
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-900">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="h-10 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-950 rounded-lg placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-900">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => alert("Please contact your System Administrator to reset your security credentials.")}
                  className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="h-10 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-950 rounded-lg"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 bg-[#18181B] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-none transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 leading-relaxed max-w-sm mt-8">
        By clicking continue, you agree to our{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-slate-900">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-slate-900">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}