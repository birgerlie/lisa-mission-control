'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, Cpu, HardDrive, Server, Clock } from 'lucide-react';
import { cn } from '@/lib/classUtils';

interface SystemMetrics {
  timestamp: string;
  cpu: {
    model: string;
    cores: number;
    averageUsage: number;
    perCore: Array<{
      core: number;
      model: string;
      speed: number;
      usage: number;
    }>;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    filesystem: string;
    size: string;
    used: string;
    available: string;
    usagePercent: number;
    mountedOn: string;
  } | null;
  system: {
    hostname: string;
    platform: string;
    arch: string;
    uptime: number;
    nodeVersion: string;
  };
  process: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function usageColor(percent: number): string {
  if (percent < 60) return 'text-green-400';
  if (percent < 80) return 'text-yellow-400';
  return 'text-red-400';
}

function usageBarColor(percent: number): string {
  if (percent < 60) return 'bg-green-500';
  if (percent < 80) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function SystemPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/system');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading && !metrics) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-linear-textMuted">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Loading system metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-linear-text mb-1">System Monitor</h1>
          <p className="text-linear-textMuted">Real-time server metrics and resource usage</p>
        </div>
        <div className="text-sm text-linear-textMuted">
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {metrics && (
        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Usage */}
            <div className="glass rounded-xl p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-linear-primary/10">
                  <Cpu className="w-5 h-5 text-linear-primary" />
                </div>
                <span className="text-sm text-linear-textMuted">CPU Usage</span>
              </div>
              <p className={cn('text-3xl font-bold', usageColor(metrics.cpu.averageUsage))}>
                {metrics.cpu.averageUsage}%
              </p>
              <p className="text-xs text-linear-textMuted mt-1">{metrics.cpu.cores} cores</p>
            </div>

            {/* Memory Usage */}
            <div className="glass rounded-xl p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-linear-primary/10">
                  <Server className="w-5 h-5 text-linear-primary" />
                </div>
                <span className="text-sm text-linear-textMuted">Memory Usage</span>
              </div>
              <p className={cn('text-3xl font-bold', usageColor(metrics.memory.usagePercent))}>
                {metrics.memory.usagePercent}%
              </p>
              <p className="text-xs text-linear-textMuted mt-1">
                {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
              </p>
            </div>

            {/* Disk Usage */}
            <div className="glass rounded-xl p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-linear-primary/10">
                  <HardDrive className="w-5 h-5 text-linear-primary" />
                </div>
                <span className="text-sm text-linear-textMuted">Disk Usage</span>
              </div>
              <p className={cn('text-3xl font-bold', usageColor(metrics.disk?.usagePercent ?? 0))}>
                {metrics.disk?.usagePercent ?? '—'}%
              </p>
              <p className="text-xs text-linear-textMuted mt-1">
                {metrics.disk ? `${metrics.disk.used} / ${metrics.disk.size}` : 'Unavailable'}
              </p>
            </div>

            {/* Uptime */}
            <div className="glass rounded-xl p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-linear-primary/10">
                  <Clock className="w-5 h-5 text-linear-primary" />
                </div>
                <span className="text-sm text-linear-textMuted">Uptime</span>
              </div>
              <p className="text-3xl font-bold text-linear-text">
                {formatUptime(metrics.system.uptime)}
              </p>
              <p className="text-xs text-linear-textMuted mt-1">{metrics.system.hostname}</p>
            </div>
          </div>

          {/* CPU Per-Core Section */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-linear-text mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-linear-primary" />
              CPU Cores
            </h2>
            <p className="text-sm text-linear-textMuted mb-4">{metrics.cpu.model}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metrics.cpu.perCore.map((core) => (
                <div key={core.core} className="flex items-center gap-3">
                  <span className="text-xs text-linear-textMuted w-16 shrink-0">
                    Core {core.core}
                  </span>
                  <div className="flex-1 h-3 bg-linear-bg rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', usageBarColor(core.usage))}
                      style={{ width: `${Math.max(core.usage, 1)}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-mono w-14 text-right', usageColor(core.usage))}>
                    {core.usage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Memory Section */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-linear-text mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-linear-primary" />
              Memory
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-linear-textMuted">
                    Used: {formatBytes(metrics.memory.used)}
                  </span>
                  <span className="text-linear-textMuted">
                    Free: {formatBytes(metrics.memory.free)}
                  </span>
                </div>
                <div className="h-6 bg-linear-bg rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      usageBarColor(metrics.memory.usagePercent)
                    )}
                    style={{ width: `${metrics.memory.usagePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-linear-textMuted mt-1">
                  <span>0</span>
                  <span>{formatBytes(metrics.memory.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info & Process Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Info */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-linear-text mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-linear-primary" />
                System Info
              </h2>
              <div className="space-y-3">
                {[
                  ['Hostname', metrics.system.hostname],
                  ['Platform', metrics.system.platform],
                  ['Architecture', metrics.system.arch],
                  ['Node.js', metrics.system.nodeVersion],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-linear-border last:border-0"
                  >
                    <span className="text-sm text-linear-textMuted">{label}</span>
                    <span className="text-sm font-mono text-linear-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Info */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-linear-text mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-linear-primary" />
                Process Memory
              </h2>
              <div className="space-y-3">
                {[
                  ['Heap Used', formatBytes(metrics.process.heapUsed)],
                  ['Heap Total', formatBytes(metrics.process.heapTotal)],
                  ['RSS', formatBytes(metrics.process.rss)],
                  ['External', formatBytes(metrics.process.external)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-linear-border last:border-0"
                  >
                    <span className="text-sm text-linear-textMuted">{label}</span>
                    <span className="text-sm font-mono text-linear-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
