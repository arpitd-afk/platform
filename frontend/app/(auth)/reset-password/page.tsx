"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crown,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;
  const strengthColor = ["", "#DC2626", "#9A6E00", "#15803D"][strength];
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await authAPI.resetPassword(token!, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Reset failed. Link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token)
    return (
      <div className="card p-8 text-center space-y-4 max-w-sm mx-auto">
        <AlertCircle
          size={36}
          className="mx-auto"
          style={{ color: "#DC2626" }}
        />
        <h3 className="font-semibold">Invalid reset link</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This link is missing a token. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-primary block text-center">
          Request new link
        </Link>
      </div>
    );

  if (success)
    return (
      <div className="card p-8 text-center space-y-4 max-w-sm mx-auto">
        <CheckCircle2
          size={40}
          className="mx-auto"
          style={{ color: "#15803D" }}
        />
        <h3 className="font-semibold">Password updated!</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Redirecting you to login...
        </p>
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ background: "var(--bg-subtle)" }}
        >
          <div
            className="h-full rounded-full animate-pulse"
            style={{ width: "100%", background: "#15803D" }}
          />
        </div>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <label className="label">New Password</label>
        <div className="relative">
          <input
            className="input pr-10"
            type={show ? "text" : "password"}
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7"
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all"
                  style={{
                    background: i <= strength ? strengthColor : "var(--border)",
                  }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: strengthColor }}>
              {strengthLabel}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="label">Confirm Password</label>
        <input
          className="input"
          type="password"
          placeholder="Same as above"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirm.length > 0 && password !== confirm && (
          <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
            Passwords don't match
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || password !== confirm || password.length < 6}
        className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin mx-auto" />
        ) : (
          "Set New Password"
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 mb-6"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(200,150,30,0.15)",
                border: "1px solid rgba(200,150,30,0.25)",
              }}
            >
              <Crown size={16} style={{ color: "var(--amber)" }} />
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold mb-1">
            Set new password
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Enter a new password for your account
          </p>
        </div>

        <Suspense
          fallback={
            <div
              className="card p-6 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Loading...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center mt-5">
          <Link
            href="/login"
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
