'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Building, 
  Bot, 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  Trash2, 
  Save 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api-client';

interface SettingsPageProps {
  params: {
    workspaceId: string;
  };
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const router = useRouter();
  const [name, setName] = React.useState('FlowAI Team Workspace');
  const [description, setDescription] = React.useState('Collaborative AI workspace for engineering & product teams');
  const [logoUrl, setLogoUrl] = React.useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe');
  
  // AI Settings
  const [autoSummarize, setAutoSummarize] = React.useState(true);
  const [ragContextIsolation, setRagContextIsolation] = React.useState(true);
  const [aiModel, setAiModel] = React.useState('gpt-4o-mini');

  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await apiFetch(`/workspaces/${params.workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          logoUrl,
          settings: {
            aiSettings: { autoSummarize, ragContextIsolation, aiModel },
          },
        }),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update workspace settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm('CRITICAL WARNING: Are you sure you want to permanently delete this workspace and all its projects, docs, and tasks?')) return;
    try {
      await apiFetch(`/workspaces/${params.workspaceId}`, {
        method: 'DELETE',
      });
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to delete workspace. Only OWNER can delete.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-400" />
            <span>Workspace Settings</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Configure workspace profile, AI knowledge isolation policies, and administrative settings.
          </p>
        </div>

        <Button variant="gradient" size="sm" onClick={handleSaveSettings} disabled={saving}>
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </Button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Workspace settings updated successfully!</span>
        </div>
      )}

      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <span>General Workspace Profile</span>
          </CardTitle>
          <CardDescription>Public branding and workspace identifier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Logo Image URL</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Workspace Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-400" />
            <span>AI Knowledge & RAG Configuration</span>
          </CardTitle>
          <CardDescription>Manage embedding generation policies and model defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <div>
              <span className="font-semibold text-white text-xs block">Workspace RAG Tenant Isolation</span>
              <span className="text-[11px] text-slate-400">Strictly filter all semantic search queries by workspace authorization metadata.</span>
            </div>
            <input
              type="checkbox"
              checked={ragContextIsolation}
              onChange={(e) => setRagContextIsolation(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-900 border-slate-700"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <div>
              <span className="font-semibold text-white text-xs block">Auto-Summarize Documents</span>
              <span className="text-[11px] text-slate-400">Automatically generate AI summaries when documents are created or updated.</span>
            </div>
            <input
              type="checkbox"
              checked={autoSummarize}
              onChange={(e) => setAutoSummarize(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-900 border-slate-700"
            />
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-slate-300">Default Workspace LLM Model</label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Fast & Cost Efficient)</option>
              <option value="gpt-4o">OpenAI GPT-4o (High Reasoning)</option>
              <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-500/30 bg-rose-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription className="text-rose-300/70">Irreversible workspace actions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-white text-xs block">Delete This Workspace</span>
            <span className="text-[11px] text-slate-400">Permanently delete workspace, all member access, documents, and task data.</span>
          </div>
          <Button variant="danger" size="sm" onClick={handleDeleteWorkspace}>
            <Trash2 className="w-4 h-4" />
            <span>Delete Workspace</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
