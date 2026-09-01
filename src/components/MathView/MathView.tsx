import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    if (!math) return '';
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false, // allow accented Spanish text (e.g. "ó", "ú") inside math without console warnings
      });
    } catch {
      return math;
    }
  }, [math, block]);

  return (
    <span
      className={`math-view ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
