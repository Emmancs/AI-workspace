'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  CheckSquare, 
  MessageSquare, 
  Users, 
  Settings, 
  ChevronDown, 
  Plus, 
  ShieldAlert,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  workspaceId?: string;
  onOpenAiDrawer?: () => void;
}

export function Sidebar({ workspaceId = 'ws-1', onOpenAiDrawer }: SidebarProps) {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = React.useState(true);

  const mainNav = [
    { name: 'Dashboard', href: `/dashboard`, icon: LayoutDashboard },
    { name: 'Projects', href: `/workspaces/${workspaceId}/projects`, icon: FolderKanban, badge: '8' },
    { name: 'Documents', href: `/workspaces/${workspaceId}/documents`, icon: FileText, badge: '14' },
    { name: 'Tasks', href: `/workspaces/${workspaceId}/tasks`, icon: CheckSquare, badge: '23' },
    { name: 'Discussions', href: `/workspaces/${workspaceId}/discussions`, icon: MessageSquare, badge: 'Live' },
  ];

  const adminNav = [
    { name: 'Members & Roles', href: `/workspaces/${workspaceId}/members`, icon: Users },
    { name: 'Workspace Settings', href: `/workspaces/${workspaceId}/settings`, icon: Settings },
    { name: 'System Admin', href: `/admin`, icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-dark-900/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 backdrop-blur-xl z-20">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo Branding */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-outfit font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                FlowAI
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">Pro</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium -mt-1">Collaborative SaaS</span>
            </div>
          </Link>
        </div>

        {/* Workspace Switcher Card */}
        <div className="p-3">
          <div 
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow">
                FA
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-white">FlowAI Team</span>
                <span className="text-[10px] text-slate-400">12 Members • Owner</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", workspaceOpen && "rotate-180")} />
          </div>
        </div>

        {/* AI Quick Launcher Button */}
        <div className="px-3 py-1">
          <button
            onClick={onOpenAiDrawer}
            className="w-full py-2.5 px-3 rounded-lg gradient-brand text-white text-xs font-semibold flex items-center justify-between shadow-lg shadow-indigo-600/25 hover:brightness-110 transition-all border border-indigo-400/30 group"
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
              <span>Ask Workspace AI</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/30 rounded text-indigo-200">⌘K</kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-6">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation</span>
            {mainNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                    isActive 
                      ? "bg-brand-600/20 text-brand-300 border border-brand-500/30" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isActive ? "text-brand-400" : "text-slate-400 group-hover:text-slate-200")} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge variant={isActive ? "brand" : "default"}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settings & Admin</span>
            </div>
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                    isActive 
                      ? "bg-brand-600/20 text-brand-300 border border-brand-500/30" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-brand-400" : "text-slate-400 group-hover:text-slate-200")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/60 bg-dark-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white ring-2 ring-indigo-500/40">
              E
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">Emmanuel</span>
              <span className="text-[10px] text-slate-400">emmanuel@flowai.io</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
