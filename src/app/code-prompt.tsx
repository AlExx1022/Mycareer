import ReactMarkdown, { type Components } from "react-markdown";

// AI 輸出常帶 markdown（標題、清單、粗體、反引號、fenced code），
// 用 react-markdown 解析語法，樣式全走自家 components，維持設計系統一致。

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const lines = code.split("\n");
  return (
    <div className="my-2 overflow-x-auto rounded-lg bg-[#17242D] text-white/90">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 font-mono text-[11px] tracking-wide text-white/40">
        <span>{lang || "code"}</span>
      </div>
      <pre className="px-3 py-2 text-[13px] leading-relaxed">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-5 shrink-0 select-none text-right text-white/25">
                {i + 1}
              </span>
              <span className="whitespace-pre">{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

const components: Components = {
  h1: ({ children }) => (
    <h3 className="mt-4 text-lg font-bold first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-4 text-base font-bold first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 text-base font-bold first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 text-sm font-semibold text-[#17242D]/70 first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  // fenced code block 帶 language-xxx class；行內 code 沒有，兩者分流渲染
  code: ({ className, children }) => {
    const lang = /language-(\w+)/.exec(className ?? "")?.[1] ?? "";
    if (!className) {
      return (
        <code className="rounded bg-[#17242D]/8 px-1.5 py-0.5 font-mono text-[0.9em]">
          {children}
        </code>
      );
    }
    return <CodeBlock lang={lang} code={String(children).replace(/\n$/, "")} />;
  },
  // CodeBlock 已自帶版面，不要再被包一層 <pre>
  pre: ({ children }) => children,
};

export function renderPromptContent(text: string) {
  return <ReactMarkdown components={components}>{text}</ReactMarkdown>;
}
