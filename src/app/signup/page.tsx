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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold">註冊</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="密碼（至少 8 碼）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          >
            註冊
          </button>
        </form>
        <p className="text-sm">
          已有帳號？{" "}
          <Link href="/login" className="underline">
            登入
          </Link>
        </p>
      </div>
    </main>
  );
}
