'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/classUtils';
import { formatRelativeTime } from '@/lib/dateUtils';
import {
  Search as SearchIcon,
  Database,
  Loader2,
  AlertCircle,
  FileText,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SearchResult {
  external_id: string;
  score: number;
  text?: string;
  metadata?: Record<string, unknown>;
  belief?: { confidence: number };
}

interface DbStatus {
  document_count: number;
  has_embedder: boolean;
  dimensions: number;
  graph?: { vertex_count: number; edge_count: number };
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [dbOnline, setDbOnline] = useState<boolean | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchMode, setSearchMode] = useState<'hybrid' | 'vector' | 'text'>('hybrid');
  const [limit, setLimit] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/search');
      const data = await res.json();
      if (data.success) {
        setDbOnline(true);
        setDbStatus(data);
      } else {
        setDbOnline(false);
      }
    } catch {
      setDbOnline(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    const weights = {
      hybrid: { vector_weight: 0.5, text_weight: 0.5 },
      vector: { vector_weight: 1.0, text_weight: 0.0 },
      text: { vector_weight: 0.0, text_weight: 1.0 },
    };

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          k: limit,
          ...weights[searchMode],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch {
      setError('Failed to connect to search engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-linear-text mb-1">Search</h1>
          <p className="text-linear-textMuted">
            Query SiliconDB knowledge base
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dbOnline !== null && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
              dbOnline
                ? "bg-linear-success/20 text-linear-success"
                : "bg-linear-danger/20 text-linear-danger"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                dbOnline ? "bg-linear-success animate-pulse" : "bg-linear-danger"
              )} />
              {dbOnline ? 'SiliconDB Online' : 'SiliconDB Offline'}
            </div>
          )}
          {dbStatus && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-linear-surface border border-linear-border text-xs text-linear-textMuted">
              <Database className="w-3 h-3" />
              {dbStatus.document_count} documents
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-linear-textMuted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, knowledge, memories..."
              className="w-full pl-12 pr-4 py-3 bg-linear-surface border border-linear-border rounded-xl text-linear-text placeholder:text-linear-textMuted focus:outline-none focus:border-linear-primary text-sm"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim() || !dbOnline}
            className="px-6 py-3 bg-linear-primary hover:bg-linear-primaryHover disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Advanced Options */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 mt-3 text-xs text-linear-textMuted hover:text-linear-text transition-colors"
        >
          <SlidersHorizontal className="w-3 h-3" />
          Advanced options
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 bg-linear-surface border border-linear-border rounded-xl flex items-center gap-6">
            <div>
              <label className="text-xs text-linear-textMuted block mb-1">Search Mode</label>
              <div className="flex items-center bg-linear-bg rounded-lg p-1">
                {(['hybrid', 'vector', 'text'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSearchMode(mode)}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs capitalize transition-colors",
                      searchMode === mode
                        ? "bg-linear-primary text-white"
                        : "text-linear-textMuted hover:text-linear-text"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-linear-textMuted block mb-1">Results</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-linear-bg border border-linear-border rounded-lg px-3 py-1.5 text-xs text-linear-text"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-linear-danger/10 border border-linear-danger/20 rounded-lg flex items-center gap-3 text-linear-danger">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-linear-primary" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-linear-textMuted mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
            {results.map((result, i) => (
              <div
                key={result.external_id || i}
                className="glass rounded-xl p-5 card-hover"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-linear-primary" />
                    <h3 className="font-medium text-linear-text text-sm">
                      {result.external_id || `Result ${i + 1}`}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.belief && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-linear-primary/20 text-linear-primary">
                        {Math.round(result.belief.confidence * 100)}% confidence
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-linear-surface border border-linear-border text-linear-textMuted">
                      {(result.score * 100).toFixed(1)}% match
                    </span>
                  </div>
                </div>
                {result.text && (
                  <p className="text-sm text-linear-textMuted line-clamp-3 mt-2">
                    {result.text}
                  </p>
                )}
                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {Object.entries(result.metadata).slice(0, 5).map(([key, val]) => (
                      <span
                        key={key}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-linear-bg text-linear-textMuted"
                      >
                        {key}: {String(val).slice(0, 30)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="w-12 h-12 text-linear-textMuted mb-4" />
            <h3 className="text-lg font-medium text-linear-text mb-2">No results found</h3>
            <p className="text-linear-textMuted text-sm max-w-md">
              No documents matched your query. Try different keywords or check that SiliconDB has indexed content.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Database className="w-12 h-12 text-linear-textMuted mb-4" />
            <h3 className="text-lg font-medium text-linear-text mb-2">Search your knowledge base</h3>
            <p className="text-linear-textMuted text-sm max-w-md">
              Search across documents, memories, and knowledge stored in SiliconDB using hybrid vector + text search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
