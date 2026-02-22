import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface IntentMarkdownProps {
  text: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 text-[20px] font-bold text-cyan-100">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 text-[18px] font-semibold text-cyan-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 text-[16px] font-semibold text-cyan-100">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 text-[16px] leading-relaxed text-cyan-200/80">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 text-[15px] text-cyan-200/80">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 text-[15px] text-cyan-200/80">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-cyan-100">{children}</strong>
  ),
  em: ({ children }) => <em className="text-cyan-200/90">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 underline decoration-cyan-400/30 transition-colors hover:text-cyan-300"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-cyan-400/30 pl-3 text-cyan-200/60 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1.5 py-0.5 text-[14px] text-cyan-200/90">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-white/5 p-3 text-[14px]">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-3 border-white/10" />,
};

export function IntentMarkdown({ text }: IntentMarkdownProps) {
  return (
    <div className="mt-6 mb-2 px-6 text-center">
      <div className="text-left">
        <ReactMarkdown components={components}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
