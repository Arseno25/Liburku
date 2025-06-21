'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  children: string;
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        h3: ({ node, ...props }) => (
          <h3 className="text-base font-semibold font-sans text-primary mt-4 mb-2 first:mt-0" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc space-y-1.5 pl-5" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-semibold" {...props} />
        ),
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        a: ({ node, ...props }) => (
          <a className="text-primary underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
