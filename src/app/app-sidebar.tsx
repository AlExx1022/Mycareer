"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/tree", label: "技能樹", emoji: "🗺️" },
  { href: "/review", label: "今日複習", emoji: "🔥" },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login" || pathname === "/signup")
    return children;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col gap-1.5 border-r-2 border-[#17242D]/10 bg-white p-4 lg:flex">
        <p className="px-3 pt-1 pb-3 text-xl font-extrabold tracking-tight text-[#E8590C]">
          Mycareer
        </p>
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-sm font-extrabold tracking-wide transition ${
                active
                  ? "border-[#E8590C]/30 bg-[#FFF4E6] text-[#E8590C]"
                  : "border-transparent text-[#17242D]/60 hover:bg-[#17242D]/5"
              }`}
            >
              <span className="text-xl">{l.emoji}</span>
              {l.label}
            </Link>
          );
        })}
      </aside>
      <div className="lg:pl-56">{children}</div>
    </>
  );
}
