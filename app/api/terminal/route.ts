import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

// Whitelisted base commands
const ALLOWED_COMMANDS = new Set([
  'ls',
  'pwd',
  'whoami',
  'date',
  'uptime',
  'df',
  'free',
  'ps',
  'cat',
  'head',
  'tail',
  'echo',
  'which',
  'env',
  'node',
  'npm',
  'git',
]);

// Blocked patterns that should never be executed
const BLOCKED_PATTERNS = [
  /\brm\b/,
  /\bsudo\b/,
  /\bkill\b/,
  /\bchmod\b/,
  /\bchown\b/,
  /\bmkfs\b/,
  /\bdd\b/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bcurl\b/,
  /\bwget\b/,
  /\bnc\b/,
  /\bssh\b/,
  /\bscp\b/,
  /\bmv\b/,
  /\bcp\b/,
  /\bmkdir\b/,
  /\brmdir\b/,
  /\bchroot\b/,
  /\bmount\b/,
  /\bumount\b/,
  /\bsystemctl\b/,
  /\bservice\b/,
  /[|;&`$()]/, // Block shell operators / injection
  /\bexport\b/,
  /\bsource\b/,
  /\beval\b/,
  /[><]/, // Block redirects
];

// Additional restrictions for specific commands
const COMMAND_RESTRICTIONS: Record<string, (args: string) => boolean> = {
  node: (args) => args.trim() === '-v' || args.trim() === '--version',
  npm: (args) => args.trim() === '-v' || args.trim() === '--version',
  git: (args) => {
    const trimmed = args.trim();
    return (
      trimmed === 'status' ||
      trimmed.startsWith('log') ||
      trimmed === 'branch' ||
      trimmed === 'branch -a' ||
      trimmed === 'branch -r' ||
      trimmed === 'diff' ||
      trimmed.startsWith('diff ')
    );
  },
  env: () => true, // We will filter the output
};

function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  const trimmed = command.trim();

  if (!trimmed) {
    return { allowed: false, reason: 'Empty command' };
  }

  // Check blocked patterns first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason: `Command contains blocked pattern: ${pattern}` };
    }
  }

  // Extract the base command
  const parts = trimmed.split(/\s+/);
  const baseCommand = parts[0];
  const args = parts.slice(1).join(' ');

  if (!ALLOWED_COMMANDS.has(baseCommand)) {
    return { allowed: false, reason: `Command '${baseCommand}' is not in the whitelist` };
  }

  // Check command-specific restrictions
  if (COMMAND_RESTRICTIONS[baseCommand]) {
    if (!COMMAND_RESTRICTIONS[baseCommand](args)) {
      return { allowed: false, reason: `Arguments not allowed for '${baseCommand}'` };
    }
  }

  return { allowed: true };
}

// Filter sensitive env vars from output
const SENSITIVE_ENV_KEYS = [
  'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PASS', 'AUTH', 'CREDENTIAL',
  'PRIVATE', 'API_KEY', 'DATABASE_URL', 'SUPABASE',
];

function filterEnvOutput(output: string): string {
  return output
    .split('\n')
    .filter((line) => {
      const key = line.split('=')[0]?.toUpperCase() || '';
      return !SENSITIVE_ENV_KEYS.some((sensitive) => key.includes(sensitive));
    })
    .join('\n');
}

function executeCommand(command: string, cwd: string): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = exec(
      command,
      {
        cwd,
        timeout: 10000,
        maxBuffer: 1024 * 1024, // 1MB
        env: { ...process.env, PATH: process.env.PATH },
      },
      (error, stdout, stderr) => {
        let output = stdout || '';
        if (stderr) {
          output += (output ? '\n' : '') + stderr;
        }

        // Filter env output
        if (command.trim() === 'env') {
          output = filterEnvOutput(output);
        }

        resolve({
          output: output || (error ? error.message : ''),
          exitCode: error ? (error.code as number) || 1 : 0,
        });
      }
    );

    // Ensure the process is killed on timeout
    setTimeout(() => {
      child.kill('SIGTERM');
    }, 10000);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { success: false, output: '', error: 'Invalid command', exitCode: 1 },
        { status: 400 }
      );
    }

    const validation = isCommandAllowed(command);
    if (!validation.allowed) {
      return NextResponse.json(
        {
          success: false,
          output: '',
          error: `Command blocked: ${validation.reason}`,
          exitCode: 1,
        },
        { status: 403 }
      );
    }

    const projectDir = path.resolve(process.cwd());
    const result = await executeCommand(command, projectDir);

    return NextResponse.json({
      success: result.exitCode === 0,
      output: result.output,
      error: result.exitCode !== 0 ? result.output : undefined,
      exitCode: result.exitCode,
    });
  } catch (error) {
    console.error('Terminal API error:', error);
    return NextResponse.json(
      {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
      },
      { status: 500 }
    );
  }
}
