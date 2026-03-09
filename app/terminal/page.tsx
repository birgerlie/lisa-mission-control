'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Terminal, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/classUtils';

interface HistoryEntry {
  command: string;
  output: string;
  success: boolean;
  timestamp: Date;
}

export default function TerminalPage() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = useCallback(async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    // Handle clear command locally
    if (trimmed === 'clear') {
      setHistory([]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });

      const data = await res.json();

      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          output: data.output || data.error || '',
          success: data.success,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          output: 'Failed to connect to terminal API',
          success: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }

    // Add to command history
    setCommandHistory((prev) => [trimmed, ...prev]);
    setHistoryIndex(-1);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Terminal className="w-6 h-6 text-linear-text" />
          <h1 className="text-2xl font-bold text-linear-text">Terminal</h1>
        </div>
        <p className="text-linear-textMuted">Execute commands on the server</p>
      </div>

      {/* Warning Banner */}
      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3 text-yellow-400 text-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          Only safe, whitelisted commands are allowed. Dangerous operations (rm, sudo, kill, etc.) are blocked.
        </span>
      </div>

      {/* Terminal Container */}
      <div
        className="glass rounded-xl border border-linear-border flex-1 flex flex-col min-h-0 overflow-hidden"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-linear-border bg-linear-surface/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-linear-textMuted ml-2 font-mono">bash</span>
        </div>

        {/* Output Area */}
        <div
          ref={outputRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-linear-bg"
        >
          {/* Welcome Message */}
          {history.length === 0 && !loading && (
            <div className="text-linear-textMuted">
              <p>Welcome to Mission Control Terminal.</p>
              <p className="mt-1">
                Type a command and press Enter. Type{' '}
                <span className="text-green-400">clear</span> to reset.
              </p>
              <p className="mt-1 text-xs">
                Allowed commands: ls, pwd, whoami, date, uptime, df, free, ps, cat, head, tail,
                echo, which, env, node -v, npm -v, git status, git log, git branch
              </p>
            </div>
          )}

          {/* History Entries */}
          {history.map((entry, i) => (
            <div key={i} className="mb-3">
              {/* Command Line */}
              <div className="flex items-center gap-2">
                <span className="text-green-400">$</span>
                <span className="text-linear-text">{entry.command}</span>
              </div>
              {/* Output */}
              {entry.output && (
                <pre
                  className={cn(
                    'mt-1 whitespace-pre-wrap break-all text-xs leading-relaxed',
                    entry.success ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {entry.output}
                </pre>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-linear-textMuted">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">Executing...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex items-center px-4 py-3 border-t border-linear-border bg-linear-surface/30">
          <span className="text-green-400 font-mono text-sm mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Type a command..."
            className={cn(
              'flex-1 bg-transparent text-linear-text font-mono text-sm',
              'placeholder:text-linear-textMuted/50 focus:outline-none',
              loading && 'opacity-50 cursor-not-allowed'
            )}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
