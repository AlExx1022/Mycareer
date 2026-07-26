"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CANDY, STATIONS } from "./content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GAP = 68;
const AMP = 10;
const RAIL_W = 44;
const stationY = (i: number) => 22 + i * GAP;
const stationX = (i: number) => RAIL_W / 2 + (i % 2 === 0 ? -AMP : AMP);

// 路線骨架：跟技能樹同一套蜿蜒語彙，LP 的六段就是六站
export function Spine() {
  const railRef = useRef<HTMLElement>(null);
  // -1 = 尚未捲到任何段；reduced motion 下直接全亮
  const [activeIndex, setActiveIndex] = useState(-1);
  const [allLit, setAllLit] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => setAllLit(true));
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 傳 DOM 元素而非選擇器字串：section 在 useGSAP scope 之外，字串會被限制在 rail 裡找不到
        STATIONS.forEach((s, i) => {
          const trigger = document.getElementById(s.id);
          if (!trigger) return;
          ScrollTrigger.create({
            trigger,
            start: "top 55%",
            end: "bottom 55%",
            onToggle: ({ isActive }) => isActive && setActiveIndex(i),
          });
        });
      });
      return () => mm.revert();
    },
    { scope: railRef },
  );

  const height = stationY(STATIONS.length - 1) + 22;
  const d = STATIONS.map((_, i) => {
    const x = stationX(i);
    const y = stationY(i);
    if (i === 0) return `M ${x} ${y}`;
    const py = stationY(i - 1);
    const px = stationX(i - 1);
    const my = (py + y) / 2;
    return `C ${px} ${my}, ${x} ${my}, ${x} ${y}`;
  }).join(" ");

  return (
    <nav
      ref={railRef}
      aria-label="頁面導覽"
      className="fixed top-1/2 left-6 z-20 hidden -translate-y-1/2 lg:block"
    >
      <svg width={RAIL_W} height={height} aria-hidden className="absolute">
        <path
          d={d}
          fill="none"
          stroke={CANDY.locked}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <ul className="relative" style={{ height }}>
        {STATIONS.map((s, i) => {
          const lit = allLit || i <= activeIndex;
          const current = !allLit && i === activeIndex;
          return (
            <li
              key={s.id}
              className="absolute"
              style={{ left: stationX(i) - 11, top: stationY(i) - 11 }}
            >
              <a
                href={`#${s.id}`}
                className="group flex h-[22px] w-[22px] items-center justify-center rounded-full border-[3px] transition focus-visible:ring-2 focus-visible:ring-[#17242D] focus-visible:ring-offset-2 focus-visible:outline-none"
                style={{
                  borderColor: lit ? s.color : CANDY.locked,
                  background: lit ? s.color : "#fff",
                  transform: current ? "scale(1.25)" : undefined,
                }}
              >
                <span className="pointer-events-none absolute left-9 hidden rounded-lg bg-[#17242D] px-2 py-1 font-mono text-[11px] font-bold whitespace-nowrap text-white group-hover:block group-focus-visible:block">
                  {s.code} {s.label}
                </span>
                <span className="sr-only">
                  {s.code} {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
