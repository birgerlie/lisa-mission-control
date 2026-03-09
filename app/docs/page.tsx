'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, Search, Filter, Loader2, AlertCircle, File, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/classUtils';

interface DocumentItem {
  path: string;
  name: string;
  category: string;
  createdAt: string;
  size: number;
  extension: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DocsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/documents');
        const data = await res.json();
        if (data.success) {
          setDocuments(data.documents);
        } else {
          setError(data.error || 'Failed to fetch documents');
        }
      } catch {
        setError('Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(documents.map(d => d.category));
    return Array.from(cats).sort();
  }, [documents]);

  const filtered = useMemo(() => {
    let result = documents;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.name.toLowerCase().includes(q));
    }

    if (selectedCategory) {
      result = result.filter(d => d.category === selectedCategory);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [documents, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-linear-text mb-1">Documents</h1>
          <p className="text-linear-textMuted">
            {loading
              ? 'Loading documents...'
              : `${filtered.length} of ${documents.length} documents`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Toggle */}
          <div className="flex items-center bg-linear-surface rounded-lg p-1 border border-linear-border">
            <button
              onClick={() => setSortBy('date')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                sortBy === 'date'
                  ? 'bg-linear-primary text-white'
                  : 'text-linear-textMuted hover:text-linear-text'
              )}
            >
              By Date
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                sortBy === 'name'
                  ? 'bg-linear-primary text-white'
                  : 'text-linear-textMuted hover:text-linear-text'
              )}
            >
              By Name
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-linear-textMuted" />
        <input
          type="text"
          placeholder="Search documents by filename..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-linear-surface border border-linear-border rounded-lg text-linear-text placeholder:text-linear-textMuted focus:outline-none focus:border-linear-primary transition-colors"
        />
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-linear-textMuted mr-1" />
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-3 py-1 rounded-full text-sm transition-colors border',
              selectedCategory === null
                ? 'bg-linear-primary text-white border-linear-primary'
                : 'text-linear-textMuted border-linear-border hover:text-linear-text hover:border-linear-textMuted'
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={cn(
                'px-3 py-1 rounded-full text-sm transition-colors border',
                selectedCategory === cat
                  ? 'bg-linear-primary text-white border-linear-primary'
                  : 'text-linear-textMuted border-linear-border hover:text-linear-text hover:border-linear-textMuted'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-linear-danger/10 border border-linear-danger/20 rounded-lg flex items-center gap-3 text-linear-danger">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-linear-textMuted">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading documents...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-linear-surface rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-linear-textMuted" />
          </div>
          <h3 className="text-lg font-medium text-linear-text mb-2">
            {documents.length === 0 ? 'No documents found' : 'No matching documents'}
          </h3>
          <p className="text-linear-textMuted max-w-sm">
            {documents.length === 0
              ? 'Documents will appear here when they are added to the project.'
              : 'Try adjusting your search query or category filter.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doc => (
              <div
                key={doc.path}
                className="glass rounded-xl p-4 border border-linear-border hover:border-linear-textMuted transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-linear-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    {doc.extension === '.md' || doc.extension === '.txt' ? (
                      <FileText className="w-5 h-5 text-linear-textMuted group-hover:text-linear-text transition-colors" />
                    ) : (
                      <File className="w-5 h-5 text-linear-textMuted group-hover:text-linear-text transition-colors" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-linear-text truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-linear-primary/20 text-linear-primary">
                        {doc.category}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-linear-surface text-linear-textMuted border border-linear-border">
                        {doc.extension}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-linear-border">
                  <span className="text-xs text-linear-textMuted">
                    {formatFileSize(doc.size)}
                  </span>
                  <span className="text-xs text-linear-textMuted">
                    {formatDate(doc.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
