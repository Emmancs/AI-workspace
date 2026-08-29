'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, AlertCircle, Clock, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useDocument, updateDocument } from '@/lib/documents';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const { document, loading, error } = useDocument(documentId);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState<any>(null);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Initialize from loaded document
  React.useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
    }
  }, [document]);

  // Autosave with debounce
  const handleContentChange = (newContent: any) => {
    setContent(newContent);
    setSaveStatus('saving');

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for autosave (2 seconds after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateDocument(documentId, title, newContent);
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // Reset saved status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        setSaveStatus('error');
        console.error('Failed to save document:', err);
      }
    }, 2000);
  };

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateDocument(documentId, newTitle, content);
        setSaveStatus('saved');
        setLastSaved(new Date());
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        setSaveStatus('error');
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-slate-800 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 w-fit mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <p className="text-slate-400">{error || 'Document not found'}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="flex-1 bg-transparent text-xl font-bold text-white placeholder-slate-500 focus:outline-none"
              placeholder="Document title..."
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Save Status */}
            <div className="flex items-center gap-2 text-xs">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1 text-slate-400">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
                  Saving...
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-4 h-4" />
                  Saved
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1 text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  Save failed
                </div>
              )}
              {lastSaved && saveStatus !== 'saving' && (
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-4 h-4" />
                  {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Collaborators */}
            <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-2 rounded-lg bg-slate-900/50">
              <Users className="w-4 h-4" />
              <span>Editing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            editable={true}
          />

          {/* Document Info */}
          <div className="mt-8 p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
            <div className="space-y-2">
              <div>Created by <span className="text-slate-300">{document.createdBy.name}</span></div>
              <div>Created on <span className="text-slate-300">{new Date(document.createdAt).toLocaleString()}</span></div>
              <div>Last modified <span className="text-slate-300">{new Date(document.updatedAt).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
