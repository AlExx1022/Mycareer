"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { SkillTreeUnit } from "@/db/queries/skill-tree";
import { withDraftPreview } from "@/lib/draft-preview";
import {
  CENTER_X,
  SNAKE_AMP,
  deriveNodeStates,
  layoutSkillTree,
  findYouAreHere,
} from "@/lib/skill-tree";
import { markLessonKnown, unmarkLessonKnown } from "./lesson-actions";

gsap.registerPlugin(useGSAP);

// 糖果色路線：{ c: 主色, d: 3D 底影深色 }
const ROUTES = [
  { c: "#1CB0F6", d: "#1899D6" },
  { c: "#58CC02", d: "#46A302" },
  { c: "#CE82FF", d: "#A568CC" },
  { c: "#FF9600", d: "#E08600" },
];
const GOLD = "#FFC800";
const GOLD_D = "#E6A800";
const LOCKED_FILL = "#E5E5E5";
const LOCKED_ICON = "#AFAFAF";

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 2.5l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1-5.5-3-5.5 3 1.2-6.1L3.2 8.9l6.1-.8z" />
    </svg>
  );
}

function DumbbellIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 8v8M17 8v8" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M3.5 10v4M20.5 10v4" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M7 12h10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4.5 12.5 10 18 19.5 6.5" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4.5" y="10" width="15" height="10" rx="3" fill={LOCKED_ICON} />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke={LOCKED_ICON} strokeWidth="3" fill="none" />
    </svg>
  );
}

function CrackIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2.5 9.5 9l4.5 2.5-3 4.5 1.5 5.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 蜿蜒路徑：相鄰站 S 曲線；跨站分支走左側廊道，每條 lane 往左讓開避免疊在一起
const GUTTER_X = CENTER_X - SNAKE_AMP - 82;
const LANE_GAP = 16;
function edgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lane: number,
) {
  if (lane === 0) {
    const my = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  }
  const gx = GUTTER_X - (lane - 1) * LANE_GAP;
  return `M ${x1} ${y1} C ${gx} ${y1 + 44}, ${gx} ${y2 - 44}, ${x2} ${y2}`;
}

export function SkillTreeMap({
  units,
  previewPathId = null,
}: {
  units: SkillTreeUnit[];
  previewPathId?: string | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const prevLitRef = useRef<Set<string> | null>(null);

  const allLessons = useMemo(() => units.flatMap((u) => u.lessons), [units]);
  const layout = useMemo(() => layoutSkillTree(units), [units]);
  const states = useMemo(() => deriveNodeStates(allLessons), [allLessons]);

  // 地圖是固定 px 佈局，用 zoom 等比縮放填滿與 header 同寬的容器
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const ro = new ResizeObserver(([entry]) =>
      setZoom(entry.contentRect.width / layout.width),
    );
    ro.observe(shell);
    return () => ro.disconnect();
  }, [layout.width]);

  const nodeById = useMemo(
    () => new Map(layout.nodes.map((n) => [n.lesson.id, n])),
    [layout],
  );
  const youAreHere = findYouAreHere(layout.nodes, states);
  const crackedCount = allLessons.filter(
    (l) => states.get(l.id) === "cracked",
  ).length;
  const litKey = layout.nodes
    .filter((n) => states.get(n.lesson.id) === "lit")
    .map((n) => n.lesson.id)
    .sort()
    .join(",");

  // 進場：路線畫線 → 車站沿線浮現 → 「你在這裡」落下，之後光圈脈衝 + 氣泡浮動
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
          .set(".route-edge", { clearProps: "strokeDasharray,strokeDashoffset" })
          .from(
            ".station",
            { opacity: 0, scale: 0.4, duration: 0.45, stagger: 0.05 },
            "<0.2",
          )
          .from(
            ".you-are-here",
            { y: -14, opacity: 0, duration: 0.5, ease: "back.out(2)" },
            ">-0.1",
          )
          .to(".you-are-here", {
            y: -5,
            duration: 0.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        gsap.to(".you-pulse", {
          scale: 1.35,
          opacity: 0,
          duration: 1.3,
          repeat: -1,
          ease: "power1.out",
          delay: 1.2,
        });
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
  const selectedRoute = selected
    ? ROUTES[selected.unitIndex % ROUTES.length]
    : null;

  function toggleKnown(lessonId: string, known: boolean) {
    startTransition(async () => {
      await (known ? unmarkLessonKnown(lessonId) : markLessonKnown(lessonId));
    });
  }

  return (
    <div ref={shellRef} className="pb-40">
      {crackedCount > 0 && (
        <Link
          href="/review"
          className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-2xl border-2 border-[#FFC800] bg-[#FFF7E0] px-5 py-3 text-sm font-bold text-[#17242D] [box-shadow:0_4px_0_#E6A800] transition hover:bg-[#FFF2CC] active:translate-y-[3px] active:[box-shadow:0_1px_0_#E6A800]"
        >
          <span aria-hidden>🧩</span>
          {crackedCount} 個車站的記憶裂開了，去複習修好它
          <span aria-hidden>→</span>
        </Link>
      )}
      <div
        ref={mapRef}
        className="relative"
        style={{ width: layout.width, height: layout.height, zoom }}
      >
        {layout.topics.map((t) => {
          const { c } = ROUTES[t.unitIndex % ROUTES.length];
          return (
            <div
              key={`${t.unitIndex}-${t.topic}`}
              className="absolute rounded-3xl"
              style={{
                left: t.x,
                top: t.y,
                width: t.width,
                height: t.height,
                background: `${c}12`,
              }}
              aria-hidden
            >
              <span
                className="absolute top-2 left-4 font-mono text-[11px] font-bold tracking-wide"
                style={{ color: c }}
              >
                {t.topic}
              </span>
            </div>
          );
        })}

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
            const branch = e.lane > 0;
            const active = selectedId === e.to || selectedId === e.from;
            const dimmed = states.get(e.to) === "locked";
            // 分支線平時退到背景，選到某站才點亮它的前置路線，避免下半部線條打結
            const opacity = branch
              ? active
                ? 0.9
                : 0.12
              : dimmed
                ? 1
                : 0.35;
            return (
              <path
                key={`${e.from}-${e.to}`}
                className="route-edge transition-opacity duration-300"
                d={edgePath(from.x, from.y, to.x, to.y, e.lane)}
                fill="none"
                stroke={
                  dimmed && !active
                    ? LOCKED_FILL
                    : ROUTES[to.unitIndex % ROUTES.length].c
                }
                strokeWidth={branch ? (active ? 7 : 5) : 10}
                strokeLinecap="round"
                strokeDasharray={transfer ? "1 14" : undefined}
                style={{ opacity }}
              />
            );
          })}
        </svg>

        {layout.bands.map((b) => {
          const route = ROUTES[b.unitIndex % ROUTES.length];
          return (
            <div
              key={b.unitIndex}
              className="absolute inset-x-0 flex h-[60px] items-center gap-3 rounded-2xl px-5"
              style={{ top: b.y, background: route.c, boxShadow: `0 4px 0 ${route.d}` }}
            >
              <span className="rounded-lg bg-white/25 px-2.5 py-1 font-mono text-xs font-bold text-white">
                {b.code} 線
              </span>
              <span className="text-lg font-extrabold text-white">
                {b.title}
              </span>
            </div>
          );
        })}

        {layout.nodes.map((n) => {
          const s = states.get(n.lesson.id)!;
          const route = ROUTES[n.unitIndex % ROUTES.length];
          const practice = n.lesson.type === "practice";
          const big = n.lesson.id === youAreHere;
          const shape = practice ? "rounded-2xl" : "rounded-full";
          const iconSize = big ? 34 : 26;

          // 狀態 → 填色與 3D 底影；available 未到站 = 白底彩框，到站（你在這裡）= 滿色
          let fill = "#fff";
          let shade = "#E0E0E0";
          let borderColor: string | undefined;
          if (s === "lit") {
            fill = route.c;
            shade = route.d;
          } else if (s === "locked") {
            fill = LOCKED_FILL;
            shade = "#C8C8C8";
          } else if (s === "cracked") {
            fill = "#FFF7E0";
            shade = "#EAD9A0";
          } else if (big) {
            fill = route.c;
            shade = route.d;
          } else {
            borderColor = route.c;
          }

          return (
            <button
              key={n.lesson.id}
              type="button"
              data-id={n.lesson.id}
              onClick={() => setSelectedId(n.lesson.id)}
              className="station group absolute flex -translate-x-1/2 -translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFC800]"
              style={{ left: n.x, top: n.y }}
              aria-label={`${n.code} ${n.lesson.title}`}
            >
              {big && (
                <span
                  className={`you-pulse pointer-events-none absolute inset-0 border-4 ${shape}`}
                  style={{ borderColor: route.c }}
                  aria-hidden
                />
              )}
              <span
                className={`flex items-center justify-center ${shape} ${
                  big ? "h-20 w-20" : "h-16 w-16"
                } [box-shadow:0_5px_0_var(--shade)] transition-transform duration-150 group-hover:scale-105 group-active:translate-y-[4px] group-active:[box-shadow:0_1px_0_var(--shade)] ${
                  selectedId === n.lesson.id
                    ? "ring-4 ring-[#FFC800]/70 ring-offset-2"
                    : ""
                }`}
                style={
                  {
                    background: fill,
                    "--shade": shade,
                    border: borderColor ? `4px solid ${borderColor}` : undefined,
                  } as React.CSSProperties
                }
              >
                {s === "lit" && <CheckIcon size={iconSize} />}
                {s === "locked" && <LockIcon size={iconSize} />}
                {s === "cracked" && <CrackIcon size={iconSize} color={route.c} />}
                {s === "available" &&
                  (practice ? (
                    <DumbbellIcon size={iconSize} color={big ? "#fff" : route.c} />
                  ) : (
                    <StarIcon size={iconSize} color={big ? "#fff" : route.c} />
                  ))}
              </span>
              <span
                className={`absolute top-1/2 ${
                  big ? "left-[88px] w-[116px]" : "left-[76px] w-[120px]"
                } -translate-y-1/2 text-left`}
              >
                <span className="block font-mono text-[11px] font-bold tracking-wide text-[#17242D]/40">
                  {n.code}
                </span>
                <span className="mt-0.5 block text-[15px] leading-tight font-bold text-[#17242D]">
                  {n.lesson.title}
                </span>
              </span>
              {n.lesson.id === youAreHere && (
                <span
                  className="you-are-here absolute -top-10 left-1/2 -translate-x-1/2 rounded-xl px-3 py-1 text-sm font-extrabold whitespace-nowrap text-[#17242D] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-[#FFC800]"
                  style={{ background: GOLD, boxShadow: `0 3px 0 ${GOLD_D}` }}
                >
                  你在這裡
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && selectedState && selectedRoute && (
        <div className="fixed inset-x-4 bottom-4 z-10 rounded-3xl border-2 border-[#E5E5E5] bg-white p-5 shadow-xl md:left-auto md:right-8 md:w-80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold text-white"
                  style={{ background: selectedRoute.c }}
                >
                  {selected.code}
                </span>
                <span className="text-xs font-bold text-[#17242D]/50">
                  {selected.lesson.type === "concept" ? "概念" : "實作"}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-extrabold text-[#17242D]">
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
            <div className="mt-4 flex gap-2">
              <Link
                href={withDraftPreview(
                  `/lesson/${selected.lesson.id}`,
                  previewPathId,
                )}
                className="flex-1 rounded-2xl px-3 py-2.5 text-center text-sm font-extrabold text-white [box-shadow:0_4px_0_var(--shade)] transition active:translate-y-[3px] active:[box-shadow:0_1px_0_var(--shade)]"
                style={
                  {
                    background: selectedRoute.c,
                    "--shade": selectedRoute.d,
                  } as React.CSSProperties
                }
              >
                進入課程
              </Link>
              <button
                type="button"
                disabled={isPending || previewPathId !== null}
                onClick={() =>
                  toggleKnown(selected.lesson.id, selectedState === "lit")
                }
                className="flex-1 rounded-2xl border-2 border-[#E5E5E5] px-3 py-2.5 text-sm font-bold text-[#17242D]/70 [box-shadow:0_4px_0_#E5E5E5] transition hover:bg-[#F7F7F7] active:translate-y-[3px] active:[box-shadow:0_1px_0_#E5E5E5] disabled:opacity-50"
              >
                {previewPathId
                  ? "試走請完成課程"
                  : isPending
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
