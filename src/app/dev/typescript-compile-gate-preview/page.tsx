import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "TypeScript Compile Gate Preview｜Mycareer",
};

export default async function TypeScriptCompileGatePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { default: PreviewClient } = await import("./preview-client");
  return <PreviewClient />;
}
