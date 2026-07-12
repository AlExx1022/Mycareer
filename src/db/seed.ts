import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { seedSkillTree } from "./seed-skill-tree";

async function seed() {
  await seedSkillTree();
  const email = process.env.DEMO_EMAIL!;
  const password = process.env.DEMO_PASSWORD!;

  const existing = await db.select().from(user).where(eq(user.email, email));
  if (existing.length > 0) {
    console.log(`Demo 帳號已存在：${email}`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name: "Demo" },
  });
  console.log(`Demo 帳號已建立：${email}`);
}

seed().then(() => process.exit(0));
