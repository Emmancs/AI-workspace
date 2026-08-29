'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createDocument } from '@/lib/documents';

function CreateDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace') || '';
  const projectId = searchParams.get('project');
  
  const [title, setTitle] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Document title is required');
      return;
    }

    if (!workspaceId) {
      setError('Workspace is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const doc = await createDocument(
        workspaceId,
        title,
        {},
        projectId || undefined
      );

      // Redirect to editor
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-white font-outfit">Create Document</h1>
          <p className="text-slate-400 text-sm">
            Start a new document to collaborate with your team
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q1 Product Roadmap"
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              autoFocus
            />
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <p>💡 Tip: Use descriptive titles for better searchability</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateDocumentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-slate-400">Loading...</p></div>}>
      <CreateDocumentContent />
    </Suspense>
  );
}
