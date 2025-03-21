export interface Context {
  before: string;
  keyword: string;
  after: string;
  fullContext: string;
}

export interface SearchResult {
  found: boolean;
  contexts?: Context[];
  summary?: string;
  totalOccurrences?: number;
  message?: string;
  error?: boolean;
} 