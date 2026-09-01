import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  learningPath,
  lesson,
  lessonDependency,
  unit,
  user,
  userLessonMastery,
} from "@/db/schema";
import { nextAvailableLesson } from "@/lib/next-lesson";

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3100";
const PATH_A = "__integration-path-a";
const PATH_B = "__integration-path-b";
const DRAFT_PATH = "__integration-path-draft";
const FIXTURE_PATH_IDS = [PATH_A, PATH_B, DRAFT_PATH];

async function cleanup() {
  await db.delete(learningPath).where(inArray(learningPath.id, FIXTURE_PATH_IDS));
}

async function signInCookie() {
  const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: process.env.BETTER_AUTH_URL ?? BASE_URL,
    },
    body: JSON.stringify({
      email: process.env.DEMO_EMAIL,
      password: process.env.DEMO_PASSWORD,
    }),
  });
  assert.equal(response.status, 200, `demo 登入失敗：${await response.text()}`);

  const setCookies = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
  const cookie = setCookies
    .map((value) => value.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");
  assert.ok(cookie, "登入回應沒有 session cookie");
  return cookie;
}

async function getJson(path: string, cookie?: string) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
  const body = (await response.json()) as Record<string, unknown>;
  return { response, body };
}

async function seedFixtures(userId: string) {
  const concept = {
    type: "concept" as const,
    position: 0,
    examPoints: ["fixture exam point"],
    rubric: [{ criterion: "fixture", passCondition: "fixture" }],
    topic: "fixture",
    intro: {
      hook: "fixture hook",
      scenarios: ["fixture scenario"],
      outcome: "fixture outcome",
    },
  };

  await db.batch([
    db.insert(learningPath).values([
      {
        id: PATH_A,
        title: "Integration A",
        description: "API integration fixture A",
        subject: "Fixture A",
        codeLanguage: "JavaScript",
        status: "published",
        position: 9001,
      },
      {
        id: PATH_B,
        title: "Integration B",
        description: "API integration fixture B",
        subject: "Fixture B",
        codeLanguage: "Python",
        status: "published",
        position: 9002,
      },
      {
        id: DRAFT_PATH,
        title: "Integration Draft",
        description: "API integration draft fixture",
        subject: "Fixture Draft",
        codeLanguage: "TypeScript",
        status: "draft",
        position: 9003,
      },
    ]),
    db.insert(unit).values([
      { id: `${PATH_A}-unit`, pathId: PATH_A, title: "Unit A", position: 0 },
      { id: `${PATH_B}-unit`, pathId: PATH_B, title: "Unit B", position: 0 },
      {
        id: `${DRAFT_PATH}-unit`,
        pathId: DRAFT_PATH,
        title: "Draft Unit",
        position: 0,
      },
    ]),
    db.insert(lesson).values([
      {
        id: `${PATH_A}-lesson-1`,
        unitId: `${PATH_A}-unit`,
        title: "A1",
        ...concept,
      },
      {
        id: `${PATH_A}-lesson-2`,
        unitId: `${PATH_A}-unit`,
        title: "A2",
        ...concept,
        position: 1,
      },
      {
        id: `${PATH_B}-lesson-1`,
        unitId: `${PATH_B}-unit`,
        title: "B1",
        ...concept,
      },
      {
        id: `${DRAFT_PATH}-lesson-1`,
        unitId: `${DRAFT_PATH}-unit`,
        title: "Draft 1",
        ...concept,
      },
    ]),
    db.insert(lessonDependency).values([
      {
        lessonId: `${PATH_A}-lesson-2`,
        dependsOnLessonId: `${PATH_A}-lesson-1`,
      },
      {
        lessonId: `${PATH_A}-lesson-2`,
        dependsOnLessonId: `${PATH_B}-lesson-1`,
      },
    ]),
    db.insert(userLessonMastery).values({
      userId,
      lessonId: `${PATH_B}-lesson-1`,
      score: 100,
      assessedAt: new Date(),
    }),
  ]);
}

async function main() {
  await cleanup();
  const [demoUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, process.env.DEMO_EMAIL!));
  assert.ok(demoUser, "找不到 demo user，請先執行 db:seed");

  try {
    await seedFixtures(demoUser.id);

    const unauthorizedPaths = await getJson("/api/learning-paths");
    assert.equal(unauthorizedPaths.response.status, 401);
    const unauthorizedTree = await getJson(`/api/skill-tree?path=${PATH_A}`);
    assert.equal(unauthorizedTree.response.status, 401);

    const cookie = await signInCookie();
    const missingPath = await getJson("/api/skill-tree", cookie);
    assert.equal(missingPath.response.status, 400);
    const unknownPath = await getJson("/api/skill-tree?path=not-found", cookie);
    assert.equal(unknownPath.response.status, 404);
    const draftPath = await getJson(
      `/api/skill-tree?path=${DRAFT_PATH}`,
      cookie,
    );
    assert.equal(draftPath.response.status, 404);

    const summaries = await getJson("/api/learning-paths", cookie);
    assert.equal(summaries.response.status, 200);
    const paths = summaries.body.paths as Array<{
      id: string;
      completedLessons: number;
      totalLessons: number;
    }>;
    assert.ok(paths.some(({ id }) => id === "react-junior-mid"));
    assert.ok(!paths.some(({ id }) => id === DRAFT_PATH));
    assert.deepEqual(
      paths.find(({ id }) => id === PATH_B),
      {
        id: PATH_B,
        title: "Integration B",
        description: "API integration fixture B",
        subject: "Fixture B",
        codeLanguage: "Python",
        position: 9002,
        completedLessons: 1,
        totalLessons: 1,
        recommendedPrerequisites: [],
      },
    );

    const treeResult = await getJson(`/api/skill-tree?path=${PATH_A}`, cookie);
    assert.equal(treeResult.response.status, 200);
    const tree = treeResult.body as {
      path: { id: string };
      units: Array<{
        lessons: Array<{ id: string; dependsOn: string[]; mastery: unknown }>;
      }>;
    };
    const lessons = tree.units.flatMap((value) => value.lessons);
    assert.equal(tree.path.id, PATH_A);
    assert.deepEqual(
      lessons.map(({ id }) => id),
      [`${PATH_A}-lesson-1`, `${PATH_A}-lesson-2`],
    );
    assert.deepEqual(lessons[1].dependsOn, [`${PATH_A}-lesson-1`]);
    assert.ok(lessons.every(({ mastery }) => mastery === null));

    const next = await nextAvailableLesson(demoUser.id, `${PATH_A}-lesson-1`);
    assert.deepEqual(next, {
      pathId: PATH_A,
      pathComplete: false,
      next: { id: `${PATH_A}-lesson-2`, title: "A2" },
    });

    console.log("multi-path API integration OK");
  } finally {
    await cleanup();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
