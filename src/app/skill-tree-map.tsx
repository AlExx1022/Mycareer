"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { SkillTreeUnit } from "@/db/queries/skill-tree";
import {
  deriveNodeStates,
  layoutSkillTree,
  findYouAreHere,
  type MapNode,
  type NodeState,
} from "@/lib/skill-tree";
import { markLessonKnown, unmarkLessonKnown } from "./lesson-actions";

gsap.registerPlugin(useGSAP);

const ROUTE_COLORS = ["#0B7285", "#6741D9", "#C2255C", "#E8590C"];
const LOCKED = "#A6ADB4";
const R = 22; // 車站半徑

function edgePath(x1: number, y1: number, x2: number, y2: number) {
  if (y1 === y2) return `M ${x1 + R} ${y1} L ${x2 - R} ${y2}`;
  const midX = (x1 + x2) / 2;
  return `M ${x1 + R} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2 - R} ${y2}`;
}

export function SkillTreeMap({ units }: { units: SkillTreeUnit[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const prevLitRef = useRef<Set<string> | null>(null);

  const allLessons = useMemo(() => units.flatMap((u) => u.lessons), [units]);
  const layout = useMemo(() => layoutSkillTree(units), [units]);
  const states = useMemo(() => deriveNodeStates(allLessons), [allLessons]);
  const nodeById = useMemo(
    () => new Map(layout.nodes.map((n) => [n.lesson.id, n])),
    [layout],
  );
  const youAreHere = findYouAreHere(layout.nodes, states);
  const litKey = layout.nodes
    .filter((n) => states.get(n.lesson.id) === "lit")
    .map((n) => n.lesson.id)
    .sort()
    .join(",");

  // 進場：路線畫線 → 車站沿線浮現 → 「你在這裡」落下
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
        gsap.utils.toArray<SVGPathElement>(".route-edge").forEach((path) => {
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        });
        tl.to(".route-edge", { strokeDashoffset: 0, duration: 0.9, stagger: 0.04 })
          .from(
            ".station",
            { opacity: 0, scale: 0.4, duration: 0.45, stagger: 0.05 },
            "<0.2",
          )
          .from(
            ".you-are-here",
            { y: -14, opacity: 0, duration: 0.5, ease: "back.out(2)" },
            ">-0.1",
          );
      });
      return () => mm.revert();
    },
    { scope: mapRef },
  );

  // 標記後：新亮燈與新解鎖的車站脈衝
  useGSAP(
    () => {
      const lit = new Set(litKey ? litKey.split(",") : []);
      const prev = prevLitRef.current;
      prevLitRef.current = lit;
      if (!prev) return;
      const changed = layout.nodes
        .filter((n) => {
          const s = states.get(n.lesson.id);
          return (
            (s === "lit" && !prev.has(n.lesson.id)) ||
            (s === "available" &&
              n.lesson.dependsOn.some((d) => lit.has(d) && !prev.has(d)))
          );
        })
        .map((n) => `.station[data-id="${n.lesson.id}"]`);
      if (changed.length === 0) return;
      gsap.fromTo(
        changed.join(","),
        { scale: 1.35 },
        { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" },
      );
    },
    { scope: mapRef, dependencies: [litKey] },
  );

  const selected = selectedId ? nodeById.get(selectedId) : null;
  const selectedState = selected ? states.get(selected.lesson.id) : null;

  function toggleKnown(lessonId: string, known: boolean) {
    startTransition(async () => {
      await (known ? unmarkLessonKnown(lessonId) : markLessonKnown(lessonId));
    });
  }

  return (
    <div className="overflow-x-auto pb-40">
      <div
        ref={mapRef}
        className="relative"
        style={{ width: layout.width, height: layout.height }}
      >
        <svg
          className="absolute inset-0"
          width={layout.width}
          height={layout.height}
          aria-hidden
        >
          {layout.edges.map((e) => {
            const from = nodeById.get(e.from)!;
            const to = nodeById.get(e.to)!;
            const transfer = from.unitIndex !== to.unitIndex;
            const dimmed = states.get(e.to) === "locked";
            return (
              <path
                key={`${e.from}-${e.to}`}
                className="route-edge"
                d={edgePath(from.x, from.y, to.x, to.y)}
                fill="none"
                stroke={ROUTE_COLORS[to.unitIndex % ROUTE_COLORS.length]}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={transfer ? "6 8" : undefined}
                opacity={dimmed ? 0.15 : 0.4}
              />
            );
          })}
        </svg>

        {layout.bands.map((b) => (
          <div
            key={b.unitIndex}
            className="absolute flex items-center gap-2"
            style={{ left: 16, top: b.y - 34 }}
          >
            <span
              className="rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold text-white"
              style={{ background: ROUTE_COLORS[b.unitIndex % ROUTE_COLORS.length] }}
            >
              {b.code} 線
            </span>
            <span className="text-sm font-medium text-[#17242D]/70">
              {b.title}
            </span>
          </div>
        ))}

        {layout.nodes.map((n) => {
          const s = states.get(n.lesson.id)!;
          const color = ROUTE_COLORS[n.unitIndex % ROUTE_COLORS.length];
          const practice = n.lesson.type === "practice";
          return (
            <button
              key={n.lesson.id}
              type="button"
              data-id={n.lesson.id}
              onClick={() => setSelectedId(n.lesson.id)}
              className="station group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F0A202]"
              style={{ left: n.x, top: n.y }}
              aria-label={`${n.code} ${n.lesson.title}`}
            >
              <span className="mb-1 font-mono text-[10px] tracking-wide text-[#17242D]/45">
                {n.code}
              </span>
              <span
                className={`flex h-11 w-11 items-center justify-center border-[3px] transition-transform duration-150 group-hover:scale-110 ${
                  practice ? "rounded-xl" : "rounded-full"
                } ${s === "locked" ? "border-dashed" : ""} ${
                  selectedId === n.lesson.id ? "ring-2 ring-[#F0A202] ring-offset-2" : ""
                }`}
                style={{
                  background:
                    s === "lit"
                      ? color
                      : s === "locked"
                        ? "#EDF0F2"
                        : s === "cracked"
                          ? "#FFF4E6"
                          : "#fff",
                  borderColor: s === "locked" ? LOCKED : color,
                }}
              >
                {s === "cracked" && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M8 1.5 6.5 6l3 1.5-2 3 1 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {s === "lit" && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8.5 6.5 12 13 4.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {s === "locked" && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <rect x="2.5" y="6" width="9" height="6" rx="1.5" fill={LOCKED} />
                    <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke={LOCKED} strokeWidth="1.8" fill="none" />
                  </svg>
                )}
              </span>
              <span className="mt-1.5 w-32 text-center text-[13px] leading-tight font-medium text-[#17242D]">
                {n.lesson.title}
              </span>
              {n.lesson.id === youAreHere && (
                <span className="you-are-here absolute -top-9 rounded-md bg-[#F0A202] px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-[#17242D] shadow-sm after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#F0A202]">
                  你在這裡
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && selectedState && (
        <div className="fixed inset-x-4 bottom-4 z-10 rounded-xl border border-[#17242D]/10 bg-white p-4 shadow-lg md:left-auto md:right-8 md:w-80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white"
                  style={{ background: ROUTE_COLORS[selected.unitIndex % ROUTE_COLORS.length] }}
                >
                  {selected.code}
                </span>
                <span className="text-xs text-[#17242D]/60">
                  {selected.lesson.type === "concept" ? "概念" : "實作"}
                </span>
              </div>
              <h2 className="mt-1.5 font-semibold text-[#17242D]">
                {selected.lesson.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="關閉"
              className="text-[#17242D]/40 hover:text-[#17242D]"
            >
              ✕
            </button>
          </div>

          {selectedState === "locked" ? (
            <p className="mt-3 text-sm text-[#17242D]/60">
              需先完成：
              {selected.lesson.dependsOn
                .filter((d) => states.get(d) !== "lit")
                .map((d) => nodeById.get(d)?.lesson.title)
                .join("、")}
            </p>
          ) : (
            <div className="mt-3 flex gap-2">
              <Link
                href={`/lesson/${selected.lesson.id}`}
                className="flex-1 rounded-lg bg-[#17242D] px-3 py-2 text-center text-sm font-medium text-white hover:bg-[#17242D]/85"
              >
                進入課程
              </Link>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  toggleKnown(selected.lesson.id, selectedState === "lit")
                }
                className="flex-1 rounded-lg border border-[#17242D]/20 px-3 py-2 text-sm font-medium text-[#17242D] hover:bg-[#17242D]/5 disabled:opacity-50"
              >
                {isPending
                  ? "儲存中…"
                  : selectedState === "lit"
                    ? "取消已會"
                    : "我已經會了"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
