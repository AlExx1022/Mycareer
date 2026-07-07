"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function demoLogin() {
  await auth.api.signInEmail({
    body: {
      email: process.env.DEMO_EMAIL!,
      password: process.env.DEMO_PASSWORD!,
    },
  });
  redirect("/");
}
