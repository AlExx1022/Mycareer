import { notFound } from "next/navigation";

export const metadata = {
  title: "Python Labs Preview｜Mycareer",
};

export default async function PythonLabsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const { default: PreviewClient } = await import("./preview-client");
  return <PreviewClient />;
}
