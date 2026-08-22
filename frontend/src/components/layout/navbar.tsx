'use client';

import * as React from 'react';
import { Search, Bell, Plus, Sparkles, Menu, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  onToggleMobileDrawer?: () => void;
  onOpenSearch?: () => void;
}

export function Navbar({ onToggleMobileDrawer, onOpenSearch }: NavbarProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-dark-900/60 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button 
          onClick={onToggleMobileDrawer}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="text-xs">Search projects, docs, tasks, or ask AI...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Presence Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>4 Active Now</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500"></span>
        </button>

        {/* Action Button */}
        <Button variant="gradient" size="sm" className="hidden sm:flex">
          <Plus className="w-4 h-4" />
          <span>New Entity</span>
        </Button>
      </div>
    </header>
  );
}
