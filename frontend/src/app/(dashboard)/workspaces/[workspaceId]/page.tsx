'use client';

import * as React from 'react';
import { 
  FolderKanban, 
  FileText, 
  Users, 
  Plus, 
  Sparkles, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WorkspacePageProps {
  params: {
    workspaceId: string;
  };
}

export default function WorkspaceDetailPage({ params }: WorkspacePageProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Workspace Header Banner */}
      <div className="p-6 rounded-2xl gradient-brand text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-bold text-2xl text-white shadow-xl">
              FA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-outfit">FlowAI Workspace</h1>
                <Badge variant="brand" className="bg-white/20 text-white border-white/30">
                  ID: {params.workspaceId}
                </Badge>
              </div>
              <p className="text-indigo-100 text-xs mt-1">
                Collaborative team workspace with 12 active members, 8 projects, and pgvector RAG active.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Users className="w-4 h-4" />
              <span>Invite Members</span>
            </Button>
            <Button variant="default" size="sm" className="bg-white text-brand-900 hover:bg-indigo-50 font-semibold">
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-brand-400" />
            <span>Active Projects (8)</span>
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Filter by status</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:border-brand-500/50 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <Badge variant="brand">ACTIVE</Badge>
              <Badge variant="warning">HIGH PRIORITY</Badge>
            </div>
            <h3 className="mt-3 font-bold text-white text-base group-hover:text-brand-300 transition-colors">
              E-Commerce Platform Core
            </h3>
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
              Full-stack store front with authentication, payments, product catalog, and real-time order tracking.
            </p>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>12 Docs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>18/24 Tasks</span>
              </div>
            </div>
          </Card>

          <Card className="hover:border-brand-500/50 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <Badge variant="brand">ACTIVE</Badge>
              <Badge variant="brand">MEDIUM PRIORITY</Badge>
            </div>
            <h3 className="mt-3 font-bold text-white text-base group-hover:text-brand-300 transition-colors">
              RAG AI Search Index
            </h3>
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
              Chunking, OpenAI embedding generation, pgvector storage, and tenant isolation policies.
            </p>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>6 Docs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>8/10 Tasks</span>
              </div>
            </div>
          </Card>

          <Card className="hover:border-brand-500/50 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <Badge variant="default">PLANNING</Badge>
              <Badge variant="default">LOW PRIORITY</Badge>
            </div>
            <h3 className="mt-3 font-bold text-white text-base group-hover:text-brand-300 transition-colors">
              Mobile App Companion
            </h3>
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
              React Native cross-platform workspace push notifications and document viewer.
            </p>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>2 Docs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>0/6 Tasks</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
