'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/classUtils';
import {
  Brain,
  Search,
  Calendar,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface MemoryFile {
  date: string;
  filename: string;
  content: string;
  lastModified: string;
}

type Tab = 'daily' | 'long-term';

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryFile[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryFile | null>(null);
  const [longTermContent, setLongTermContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [longTermLoading, setLongTermLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories);
        if (data.memories.length > 0 && !selectedMemory) {
          setSelectedMemory(data.memories[0]);
        }
      } else {
        setError(data.error || 'Failed to fetch memories');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchLongTermMemory = async () => {
    if (longTermContent !== null) return;
    try {
      setLongTermLoading(true);
      const res = await fetch('/api/memory/long-term');
      const data = await res.json();
      if (data.success) {
        setLongTermContent(data.content);
      } else {
        setError(data.error || 'Failed to fetch long-term memory');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLongTermLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'long-term') {
      fetchLongTermMemory();
    }
  };

  const filteredMemories = memories.filter(m =>
    m.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    // Try to parse as YYYY-MM-DD or similar format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime()) && dateStr.match(/\d{4}/)) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-linear-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-linear-danger mx-auto mb-2" />
          <p className="text-linear-textMuted">{error}</p>
          <button
            onClick={fetchMemories}
            className="mt-4 px-4 py-2 bg-linear-primary text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-linear-text mb-1">Memory</h1>
          <p className="text-linear-textMuted">
            {memories.length} memory {memories.length === 1 ? 'file' : 'files'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-linear-primary" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-linear-surface rounded-lg w-fit border border-linear-border">
        <button
          onClick={() => handleTabChange('daily')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'daily'
              ? 'bg-linear-primary text-white'
              : 'text-linear-textMuted hover:text-linear-text'
          )}
        >
          <Calendar className="w-4 h-4" />
          Daily Memories
        </button>
        <button
          onClick={() => handleTabChange('long-term')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'long-term'
              ? 'bg-linear-primary text-white'
              : 'text-linear-textMuted hover:text-linear-text'
          )}
        >
          <BookOpen className="w-4 h-4" />
          Long-term Memory
        </button>
      </div>

      {/* Content */}
      {activeTab === 'daily' ? (
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left Sidebar - Memory List */}
          <div className="w-72 flex-shrink-0 flex flex-col glass rounded-xl overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-linear-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-linear-textMuted" />
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-linear-bg border border-linear-border rounded-lg text-sm text-linear-text placeholder:text-linear-textMuted focus:outline-none focus:border-linear-primary"
                />
              </div>
            </div>

            {/* Memory List */}
            <div className="flex-1 overflow-y-auto">
              {filteredMemories.length === 0 ? (
                <div className="p-4 text-center text-linear-textMuted text-sm">
                  No memories found
                </div>
              ) : (
                filteredMemories.map(memory => (
                  <button
                    key={memory.filename}
                    onClick={() => setSelectedMemory(memory)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-linear-border transition-colors',
                      selectedMemory?.filename === memory.filename
                        ? 'bg-linear-primary/10 border-l-2 border-l-linear-primary'
                        : 'hover:bg-linear-surface'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-linear-textMuted flex-shrink-0" />
                      <span className="text-sm font-medium text-linear-text truncate">
                        {memory.date}
                      </span>
                    </div>
                    <p className="text-xs text-linear-textMuted ml-5.5">
                      {formatDate(memory.lastModified)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Memory Content */}
          <div className="flex-1 glass rounded-xl overflow-hidden flex flex-col min-w-0">
            {selectedMemory ? (
              <>
                <div className="px-6 py-4 border-b border-linear-border flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-linear-text">
                      {selectedMemory.date}
                    </h2>
                    <p className="text-xs text-linear-textMuted mt-0.5">
                      {selectedMemory.filename} &middot; Last modified{' '}
                      {formatDate(selectedMemory.lastModified)}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <pre className="text-sm text-linear-text whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedMemory.content}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-linear-textMuted mx-auto mb-3 opacity-50" />
                  <p className="text-linear-textMuted">Select a memory to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Long-term Memory */
        <div className="flex-1 glass rounded-xl overflow-hidden flex flex-col min-h-0">
          {longTermLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-linear-primary animate-spin" />
            </div>
          ) : longTermContent ? (
            <>
              <div className="px-6 py-4 border-b border-linear-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-linear-primary" />
                  <h2 className="text-lg font-semibold text-linear-text">
                    Long-term Memory
                  </h2>
                </div>
                <p className="text-xs text-linear-textMuted mt-1">
                  MEMORY.md &middot; Persistent knowledge base
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <pre className="text-sm text-linear-text whitespace-pre-wrap font-mono leading-relaxed">
                  {longTermContent}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-linear-textMuted mx-auto mb-3 opacity-50" />
                <p className="text-linear-textMuted">No long-term memory found</p>
                <p className="text-xs text-linear-textMuted mt-1">
                  Create a MEMORY.md file in the workspace root
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
