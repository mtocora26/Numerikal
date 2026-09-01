export interface IterationData {
  iteration: number;
  [key: string]: number | string | boolean | undefined;
}

export interface IterationColumn {
  key: string;
  label: string;
  latexLabel?: string;
  format?: 'number' | 'integer' | 'scientific' | 'percentage' | 'text' | 'sign';
  precision?: number;
}
