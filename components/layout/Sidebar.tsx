'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/classUtils';
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  Bot,
  Brain,
  FileText,
  Users,
  FolderKanban,
  Search,
  MessageSquare,
  Terminal,
  DollarSign,
  Activity,
  Command,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: Kanban },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Documents', href: '/docs', icon: FileText },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Terminal', href: '/terminal', icon: Terminal },
  { name: 'Costs', href: '/costs', icon: DollarSign },
  { name: 'System', href: '/system', icon: Activity },
  { name: 'Team', href: '/team', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1a1d29] border-r border-[#2d3348] flex flex-col">
      <SidebarHeader />
      <Navigation pathname={pathname} />
      <SidebarFooter />
    </aside>
  );
}

function SidebarHeader() {
  return (
    <div className="p-6 border-b border-[#2d3348]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#5e6ad2] flex items-center justify-center">
          <Command className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-[#f7f8f8]">Mission Control</h1>
          <p className="text-xs text-[#8a8f98]">Lisa AI Assistant</p>
        </div>
      </div>
    </div>
  );
}

interface NavigationProps {
  pathname: string;
}

function Navigation({ pathname }: NavigationProps) {
  return (
    <nav className="flex-1 p-4">
      <ul className="space-y-1">
        {navigationItems.map((item) => (
          <NavigationItem 
            key={item.name} 
            item={item} 
            isActive={pathname === item.href} 
          />
        ))}
      </ul>
    </nav>
  );
}

interface NavigationItemProps {
  item: typeof navigationItems[0];
  isActive: boolean;
}

function NavigationItem({ item, isActive }: NavigationItemProps) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-[#5e6ad2] text-white'
            : 'text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#252a3c]'
        )}
      >
        <Icon className="w-4 h-4" />
        {item.name}
      </Link>
    </li>
  );
}

function SidebarFooter() {
  return (
    <div className="p-4 border-t border-[#2d3348]">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5e6ad2] to-purple-500 flex items-center justify-center text-sm font-bold">
          L
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#f7f8f8] truncate">Lisa</p>
          <p className="text-xs text-[#4ade80] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            Online
          </p>
        </div>
      </div>
    </div>
  );
}
