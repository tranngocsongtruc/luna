
import React from 'react';
import ReactMarkdown, { Components as ReactMarkdownComponents } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

// Props for the custom 'code' renderer
// Based on what react-markdown provides.
// node can be more specifically typed using 'hast' Element type if needed.
interface CustomCodeRendererProps {
  node?: any; 
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any; // To capture any other HTML attributes passed down
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const components: ReactMarkdownComponents = {
    h1: ({ node, children, ...rest }) => <h1 className="text-2xl font-bold my-4 text-sky-400" {...rest}>{children}</h1>,
    h2: ({ node, children, ...rest }) => <h2 className="text-xl font-semibold my-3 text-sky-300" {...rest}>{children}</h2>,
    h3: ({ node, children, ...rest }) => <h3 className="text-lg font-semibold my-2 text-sky-200" {...rest}>{children}</h3>,
    p: ({ node, children, ...rest }) => <p className="my-2 leading-relaxed" {...rest}>{children}</p>,
    ul: ({ node, children, ...rest }) => <ul className="list-disc list-inside my-2 pl-4" {...rest}>{children}</ul>,
    ol: ({ node, children, ...rest }) => <ol className="list-decimal list-inside my-2 pl-4" {...rest}>{children}</ol>,
    li: ({ node, children, ...rest }) => <li className="my-1" {...rest}>{children}</li>,
    code: ({ node, inline, className, children, ...rest }: CustomCodeRendererProps) => {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match) {
        return (
          <pre className="bg-slate-800 p-3 rounded-md my-2 overflow-x-auto">
            <code className={`language-${match[1]}`} {...rest}>
              {String(children).replace(/\n$/, '')}
            </code>
          </pre>
        );
      }
      return (
        <code className={`bg-slate-700 px-1 py-0.5 rounded-sm text-sm ${className || ''}`} {...rest}>
          {children}
        </code>
      );
    },
    a: ({ node, children, ...rest }) => <a className="text-sky-400 hover:text-sky-300 underline" target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>,
    blockquote: ({ node, children, ...rest }) => <blockquote className="border-l-4 border-slate-500 pl-4 italic my-2 text-slate-400" {...rest}>{children}</blockquote>,
  };

  return (
    <div className="prose prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
