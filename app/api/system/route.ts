import { NextResponse } from 'next/server';
import * as os from 'os';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

function getCpuUsage() {
  const cpus = os.cpus();
  return cpus.map((cpu, index) => {
    const total = Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0);
    const idle = cpu.times.idle;
    const usage = ((total - idle) / total) * 100;
    return {
      core: index,
      model: cpu.model,
      speed: cpu.speed,
      usage: Math.round(usage * 100) / 100,
    };
  });
}

function getDiskUsage() {
  try {
    const output = execSync('df -h /').toString();
    const lines = output.trim().split('\n');
    if (lines.length < 2) return null;

    const parts = lines[1].split(/\s+/);
    return {
      filesystem: parts[0],
      size: parts[1],
      used: parts[2],
      available: parts[3],
      usagePercent: parseInt(parts[4], 10),
      mountedOn: parts[5],
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuCores = getCpuUsage();
    const avgCpuUsage =
      cpuCores.length > 0
        ? Math.round(
            (cpuCores.reduce((sum, c) => sum + c.usage, 0) / cpuCores.length) *
              100
          ) / 100
        : 0;

    const processMemory = process.memoryUsage();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cpu: {
        model: cpuCores[0]?.model ?? 'Unknown',
        cores: cpuCores.length,
        averageUsage: avgCpuUsage,
        perCore: cpuCores,
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 10000) / 100,
      },
      disk: getDiskUsage(),
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        nodeVersion: process.version,
      },
      process: {
        heapUsed: processMemory.heapUsed,
        heapTotal: processMemory.heapTotal,
        rss: processMemory.rss,
        external: processMemory.external,
      },
    });
  } catch (error) {
    console.error('System metrics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve system metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
