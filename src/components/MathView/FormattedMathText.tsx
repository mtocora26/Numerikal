import React from 'react';
import { MathView } from './MathView';

interface FormattedMathTextProps {
  text: string;
  className?: string;
}

/**
 * Renderiza textos explicativos preservando el espaciado natural y la tipografía en español,
 * renderizando fórmulas matemáticas delimitadas por $...$ mediante KaTeX.
 */
export const FormattedMathText: React.FC<FormattedMathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  if (text.includes('$')) {
    const parts = text.split('$');
    return (
      <span className={`formatted-math-text ${className}`}>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <MathView
                key={index}
                math={part}
                className="inline-math-item"
              />
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </span>
    );
  }

  return <span className={`formatted-math-text ${className}`}>{text}</span>;
};
