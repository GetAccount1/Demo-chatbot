import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <ReactMarkdown
      className={cn("prose dark:prose-invert max-w-none", className)}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={cn("bg-neutral-100 rounded px-1 py-0.5", className)} {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        p: ({ children }) => <p className="mb-4">{children}</p>,
        a: ({ href, children }) => (
          <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-neutral-300 pl-4 py-1 mb-4 text-neutral-600">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border-collapse border border-neutral-300">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-neutral-100">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-neutral-300">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 border-r border-neutral-300 text-left font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 border-r border-neutral-300">{children}</td>
        ),
        hr: () => <hr className="my-6 border-t border-neutral-300" />,
        img: ({ src, alt }) => (
          <img src={src} alt={alt} className="max-w-full h-auto my-4 rounded" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
