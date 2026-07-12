import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ units: await getSkillTreeForUser(session.user.id) });
}
