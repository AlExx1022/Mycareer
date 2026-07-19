"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });
    setLoading(false);
    if (error) {
      setError(
        error.code === "USER_ALREADY_EXISTS"
          ? "這個 email 已註冊過"
          : "註冊失敗，請再試一次",
      );
      return;
    }
    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs font-semibold tracking-wide text-[#0B7285]">
          ● 起點站
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">註冊</h1>
        <p className="mt-2 text-[15px] text-[#17242D]/60">
          註冊後從路線第一站出發。
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#17242D]/20 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#17242D]/50"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="密碼（至少 8 碼）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#17242D]/20 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#17242D]/50"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#17242D] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "註冊中⋯" : "註冊"}
          </button>
        </form>
        <p className="mt-6 text-sm text-[#17242D]/60">
          已有帳號？{" "}
          <Link href="/login" className="font-medium text-[#17242D] underline">
            登入
          </Link>
        </p>
      </div>
    </main>
  );
}
