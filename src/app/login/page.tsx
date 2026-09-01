"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { demoLogin } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError("Email 或密碼錯誤");
      return;
    }
    router.push("/tree");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs font-semibold tracking-wide text-[#0B7285]">
          ● 起點站
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">工程師學習路徑</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#17242D]/60">
          一張會記得你的學習路線圖——哪裡不熟、哪裡該複習，它都記得。
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
            placeholder="密碼"
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
            {loading ? "登入中⋯" : "登入"}
          </button>
        </form>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setError("");
            setLoading(true);
            const result = await demoLogin();
            setLoading(false);
            if (result?.error) setError(result.error);
          }}
          className="mt-3 w-full rounded-lg border border-[#17242D]/20 py-3 text-sm font-medium hover:bg-[#17242D]/5 disabled:opacity-50"
        >
          用 Demo 帳號逛逛
        </button>
        <p className="mt-6 text-sm text-[#17242D]/60">
          沒有帳號？{" "}
          <Link href="/signup" className="font-medium text-[#17242D] underline">
            註冊
          </Link>
        </p>
      </div>
    </main>
  );
}
