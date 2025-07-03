import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={`prose prose-blue max-w-none ${className}`}
      components={{
        // Custom styling for code blocks
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline ? (
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
              <code className={`${className} font-mono`} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code 
              className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-mono" 
              {...props}
            >
              {children}
            </code>
          );
        },
        // Custom styling for blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-400 pl-4 italic text-blue-700 bg-blue-50 py-2 rounded-r-lg">
            {children}
          </blockquote>
        ),
        // Custom styling for tables
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-blue-200">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-blue-200 bg-blue-100 px-4 py-2 text-left font-semibold text-blue-800">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-blue-200 px-4 py-2">
            {children}
          </td>
        ),
        // Custom styling for headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-blue-900 mb-4 mt-6 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-blue-800 mb-3 mt-5 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-blue-700 mb-2 mt-4 first:mt-0">
            {children}
          </h3>
        ),
        // Custom styling for lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-blue-700">
            {children}
          </li>
        ),
        // Custom styling for links
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {children}
          </a>
        ),
        // Custom styling for paragraphs
        p: ({ children }) => (
          <p className="text-blue-700 mb-3 leading-relaxed font-serif">
            {children}
          </p>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
};