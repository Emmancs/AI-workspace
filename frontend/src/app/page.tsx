'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Bot, 
  FileText, 
  CheckSquare, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  BrainCircuit, 
  Users,
  Search,
  Lock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <header className="h-20 border-b border-slate-800/60 bg-dark-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-outfit font-extrabold text-xl text-white tracking-tight">FlowAI Workspace</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#ai-engine" className="hover:text-white transition-colors">AI Knowledge</a>
          <a href="#collaboration" className="hover:text-white transition-colors">Collaboration</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="gradient" size="sm">
              <span>Start Building</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-20 px-6 lg:px-12 max-w-7xl mx-auto text-center overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-brand-600/30 to-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-8 animate-pulse">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Introducing FlowAI 2.0 • The AI-Native Team Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-outfit max-w-4xl mx-auto leading-[1.1]">
            Your team&apos;s workspace, with an AI that <span className="gradient-text">actually knows the work.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            Create. Collaborate. Ask AI. Everything connected in one seamless workspace powered by real-time CRDT sync and workspace-scoped RAG intelligence.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="gradient" size="lg" className="shadow-2xl shadow-indigo-600/40">
                <span>Start building</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/workspaces/ws-1">
              <Button variant="outline" size="lg">
                <span>Explore workspace</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Button>
            </Link>
          </div>

          {/* Interactive Workspace App Preview Card */}
          <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-indigo-500/20 via-slate-800/40 to-slate-900/80 border border-slate-700/60 shadow-2xl">
            <div className="rounded-xl overflow-hidden bg-dark-900 border border-slate-800 text-left p-6 space-y-6">
              {/* Top Window Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-4 text-xs font-mono text-slate-400">FlowAI Workspace / E-Commerce Revamp Project</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    3 Members Editing Live
                  </span>
                </div>
              </div>

              {/* Grid content preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-base">📄 Architecture Spec & Auth Strategy</h3>
                      <Badge variant="brand">Collaborative Doc</Badge>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      &quot;Authentication will use JWT with refresh token rotation stored in httpOnly secure cookies. RBAC logic is enforced on NestJS backend via custom Guards...&quot;
                    </p>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">🟢 Alex editing...</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">🟢 Emmanuel online</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Tasks Completed</span>
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">24 / 28</div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-full w-[85%]" />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Workspace RAG Index</span>
                        <BrainCircuit className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="text-2xl font-bold text-brand-300">1,420 Chunks</div>
                      <span className="text-[10px] text-slate-400">Isolated per workspace</span>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Chat Preview Side Pane */}
                <div className="p-4 rounded-xl gradient-border bg-slate-900/90 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
                      <Bot className="w-4 h-4 text-brand-400" />
                      <span>Workspace AI Assistant</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/70 text-xs text-slate-200">
                      <span className="text-brand-300 font-semibold">User:</span> &quot;What did we decide about auth strategy?&quot;
                    </div>
                    <div className="p-2.5 rounded-lg bg-brand-950/60 border border-brand-500/30 text-xs text-slate-200 space-y-1">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Context Answer:
                      </span>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        Based on <span className="underline text-indigo-300">Architecture Spec</span> & <span className="underline text-indigo-300">JWT Discussion</span>, auth uses JWT tokens, refresh rotation, and RBAC guards (OWNER, ADMIN, EDITOR, VIEWER).
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800">
                    🔒 Workspace Isolated Retrieval
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-800/60">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-outfit">
              Everything teams need to build at full speed
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-base">
              FlowAI integrates documents, projects, discussions, and workspace intelligence in one unified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Collaborative Documents</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Rich Yjs CRDT document editor supporting headings, code blocks, tables, user mentions, inline comments, and autosave.
              </p>
            </Card>

            <Card className="hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Kanban Project Tasks</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                List & Kanban views with priorities, due dates, assignees, and AI-driven automated epic and task decomposition.
              </p>
            </Card>

            <Card className="hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Workspace-Aware AI</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                RAG system built on pgvector storing documents, tasks, and discussions with strict tenant-level isolation guarantees.
              </p>
            </Card>

            <Card className="hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Discussions</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                WebSocket channel messaging with threads, reactions, mentions, and instant notification updates.
              </p>
            </Card>

            <Card className="hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Role-Based Access Control</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enforced RBAC hierarchy on backend (OWNER, ADMIN, EDITOR, VIEWER) ensuring strict authorization across endpoints.
              </p>
            </Card>

            <Card className="hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Redis & WebSockets</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Scalable pub/sub infrastructure designed to scale across multiple backend micro-instances horizontally.
              </p>
            </Card>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-dark-950 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-outfit font-bold text-white text-sm">FlowAI Workspace</span>
            <span>© 2026 FlowAI Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
            <a href="#" className="hover:text-white transition-colors">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
