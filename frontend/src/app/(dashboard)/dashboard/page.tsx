'use client';

import * as React from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  FileText, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  Plus,
  Bot
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';

const taskData = [
  { day: 'Mon', completed: 12, created: 18 },
  { day: 'Tue', completed: 19, created: 22 },
  { day: 'Wed', completed: 25, created: 15 },
  { day: 'Thu', completed: 32, created: 28 },
  { day: 'Fri', completed: 41, created: 30 },
  { day: 'Sat', completed: 18, created: 8 },
  { day: 'Sun', completed: 14, created: 5 },
];

const aiUsageData = [
  { hour: '09:00', requests: 120 },
  { hour: '11:00', requests: 340 },
  { hour: '13:00', requests: 280 },
  { hour: '15:00', requests: 490 },
  { hour: '17:00', requests: 310 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight">
            Good morning, Emmanuel 👋
          </h1>
          <p className="text-slate-400 text-xs lg:text-sm mt-1">
            Here is your workspace overview and AI-driven team activity for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Activity Log</span>
          </Button>
          <Button variant="gradient" size="sm">
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Projects</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">8</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +2 this week
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">5 Active • 3 Planning</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Tasks</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">34</span>
            <span className="text-xs text-emerald-400 font-medium">82% On Schedule</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">126 Completed total</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Documents</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">72</span>
            <span className="text-xs text-purple-300 font-medium">Real-time sync</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">14 Updated today</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">AI Knowledge Requests</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-300">1,284</span>
            <span className="text-xs text-brand-400 font-medium">99.8% Context Match</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">RAG isolated per workspace</span>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Velocity Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Task Velocity</CardTitle>
                <CardDescription>Tasks created vs completed over the last 7 days</CardDescription>
              </div>
              <Badge variant="brand">Weekly View</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={taskData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Activity Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>AI Engine Activity</span>
            </CardTitle>
            <CardDescription>RAG query volume throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiUsageData}>
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="requests" fill="#818CF8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workspace Activity List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Workspace Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">View Audit Log</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-xs border-b border-slate-800/60 pb-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                E
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white">Emmanuel</span> created project <span className="text-brand-300 font-medium font-mono">FlowAI E-Commerce Core</span>
                <span className="text-slate-500 text-[10px] block mt-0.5">10 minutes ago</span>
              </div>
              <Badge variant="brand">Project</Badge>
            </div>

            <div className="flex items-start gap-3 text-xs border-b border-slate-800/60 pb-3">
              <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center shrink-0">
                A
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white">Alex</span> edited document <span className="text-purple-300 font-medium font-mono">JWT & OAuth Architecture Spec</span>
                <span className="text-slate-500 text-[10px] block mt-0.5">32 minutes ago</span>
              </div>
              <Badge variant="purple">Document</Badge>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                P
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white">Priya</span> completed task <span className="text-emerald-300 font-medium font-mono">Setup PostgreSQL pgvector extension</span>
                <span className="text-slate-500 text-[10px] block mt-0.5">1 hour ago</span>
              </div>
              <Badge variant="success">Task</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
