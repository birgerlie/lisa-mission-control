'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  Bot,
  Brain,
  FileText,
  Users,
  Command
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: Kanban },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Documents', href: '/docs', icon: FileText },
  { name: 'Team', href: '/team', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-linear-surface border-r border-linear-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-linear-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-primary flex items-center justify-center">
            <Command className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-linear-text">Mission Control</h1>
            <p className="text-xs text-linear-textMuted">Lisa AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-linear-primary text-white'
                      : 'text-linear-textMuted hover:text-linear-text hover:bg-linear-surfaceHover'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-linear-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-linear-primary to-purple-500 flex items-center justify-center text-sm font-bold">
            L
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-linear-text truncate">Lisa</p>
            <p className="text-xs text-linear-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-linear-success animate-pulse" />
              Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}