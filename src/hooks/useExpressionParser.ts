import { useState, useEffect, useMemo } from 'react';
import { ExpressionParser, type ParsedExpression } from '../services/ExpressionParser';

export function useExpressionParser(expression: string) {
  const [debouncedExpr, setDebouncedExpr] = useState(expression);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedExpr(expression);
    }, 150);

    return () => clearTimeout(timer);
  }, [expression]);

  const parsed = useMemo<ParsedExpression>(() => {
    return ExpressionParser.parse(debouncedExpr);
  }, [debouncedExpr]);

  return parsed;
}
