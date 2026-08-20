import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by code blocks first
  const parts: { type: 'text' | 'code'; lang?: string; code?: string; text?: string }[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.substring(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      lang: match[1] || 'text',
      code: match[2].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.substring(lastIndex) });
  }

  return (
    <div className={`space-y-3 leading-relaxed text-xs sm:text-sm ${className}`}>
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          return <CodeBlock key={pIdx} lang={part.lang || 'code'} code={part.code || ''} />;
        }
        return <TextFormattedBlock key={pIdx} text={part.text || ''} />;
      })}
    </div>
  );
};

const CodeBlock: React.FC<{ lang: string; code: string }> = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-[var(--border-color)] overflow-hidden bg-gray-950 text-gray-100 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-gray-900/90 border-b border-gray-800 text-[11px] text-gray-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="uppercase font-bold tracking-wider">{lang}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[11.5px] font-mono leading-relaxed text-gray-200 custom-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const TextFormattedBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Headers
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-3 mb-1">
              <FormatInline text={line.slice(4)} />
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] mt-3.5 mb-1.5">
              <FormatInline text={line.slice(3)} />
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-base sm:text-lg font-black text-[var(--text-primary)] mt-4 mb-2">
              <FormatInline text={line.slice(2)} />
            </h1>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[var(--accent-primary)] font-bold text-xs mt-0.5">•</span>
              <div className="flex-1">
                <FormatInline text={trimmed.slice(2)} />
              </div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[var(--accent-primary)] font-mono font-bold text-xs mt-0.5">{numMatch[1]}.</span>
              <div className="flex-1">
                <FormatInline text={numMatch[2]} />
              </div>
            </div>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-[var(--accent-primary)] pl-3 py-1 my-1 italic text-[var(--text-secondary)] bg-[var(--accent-subtle)]/30 rounded-r-lg">
              <FormatInline text={trimmed.slice(2)} />
            </blockquote>
          );
        }

        // Standard line
        return (
          <p key={idx} className="leading-relaxed">
            <FormatInline text={line} />
          </p>
        );
      })}
    </div>
  );
};

const FormatInline: React.FC<{ text: string }> = ({ text }) => {
  // Parse inline bold (**text**), inline code (`code`), inline italics (*text*)
  const elements: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      elements.push(
        <strong key={match.index} className="font-bold text-[var(--text-primary)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      elements.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11px] bg-[var(--bg-hover)] text-[var(--accent-primary)] border border-[var(--border-color)]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      elements.push(
        <em key={match.index} className="italic text-[var(--text-secondary)]">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    elements.push(text.substring(lastIdx));
  }

  return <>{elements}</>;
};
