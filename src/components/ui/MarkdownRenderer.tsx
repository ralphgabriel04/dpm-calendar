"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => <p className="my-2">{children}</p>,
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          // Code
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-3 rounded-lg bg-muted text-sm font-mono overflow-x-auto my-2">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="rounded-lg bg-muted overflow-x-auto my-2">
              {children}
            </pre>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Task lists (GFM)
          input: ({ checked }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-2 rounded"
            />
          ),
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,
          // Tables (GFM)
          table: ({ children }) => (
            <table className="border-collapse border border-border my-2 w-full text-sm">
              {children}
            </table>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-1.5 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-1.5">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
