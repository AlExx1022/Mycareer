import Link from "next/link";
import { CANDY } from "./content";

// 版面主結構：標題留在左欄（桌機黏在視窗上緣），內容吃滿右側寬度——避免整頁擠在中央一條
export function Section({
  id,
  code,
  eyebrow,
  title,
  color,
  children,
}: {
  id: string;
  code: string;
  eyebrow: string;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 grid gap-6 border-t-2 border-[#17242D]/8 py-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14"
    >
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center gap-2">
          <span
            className="rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold text-white"
            style={{ background: color }}
          >
            {code}
          </span>
          <span className="font-mono text-[11px] font-bold tracking-wide text-[#17242D]/45">
            {eyebrow}
          </span>
        </div>
        <h2 className="mt-3 text-2xl leading-[1.25] font-extrabold tracking-tight sm:text-[28px]">
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </section>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-3xl text-[15px] leading-[1.85] font-medium text-[#17242D]/70">
      {children}
    </p>
  );
}

export function Card({
  title,
  children,
  color,
}: {
  title: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-[#E5E5E5] bg-white p-5">
      <h3
        className="text-sm font-extrabold"
        style={{ color: color ?? CANDY.ink }}
      >
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed font-medium text-[#17242D]/65">
        {children}
      </p>
    </div>
  );
}

export function GhostLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border-2 border-[#E5E5E5] bg-white px-5 py-3 text-sm font-extrabold text-[#17242D]/75 [box-shadow:0_4px_0_#E5E5E5] transition hover:bg-[#F7F7F7] active:translate-y-[3px] active:[box-shadow:0_1px_0_#E5E5E5]"
    >
      {children}
    </Link>
  );
}
