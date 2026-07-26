"use client";

import { useState, useTransition } from "react";
import { demoLogin } from "../login/actions";
import { CANDY } from "./content";

// 面試官的主要入口：不填任何欄位就進得去
export function DemoCta({ label }: { label: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError("");
            const result = await demoLogin();
            if (result?.error) setError(result.error);
          })
        }
        className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white transition [box-shadow:0_4px_0_var(--shade)] active:translate-y-[3px] active:[box-shadow:0_1px_0_var(--shade)] disabled:opacity-60"
        style={
          {
            background: CANDY.green,
            "--shade": "#46A302",
          } as React.CSSProperties
        }
      >
        {isPending ? "登入中⋯" : label}
      </button>
      {error && (
        <p className="w-full text-sm font-bold text-[#C92A2A]">{error}</p>
      )}
    </>
  );
}
