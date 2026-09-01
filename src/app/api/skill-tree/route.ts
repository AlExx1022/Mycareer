import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathId = new URL(request.url).searchParams.get("path");
  if (!pathId) {
    return Response.json({ error: "Missing path query parameter" }, { status: 400 });
  }

  const tree = await getSkillTreeForUser(session.user.id, pathId);
  if (!tree) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(tree);
}
