"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function demoLogin() {
  try {
    await auth.api.signInEmail({
      body: {
        email: process.env.DEMO_EMAIL!,
        password: process.env.DEMO_PASSWORD!,
      },
    });
  } catch {
    return { error: "Demo 帳號暫時無法登入，請改用註冊或稍後再試" };
  }
  redirect("/tree");
}
