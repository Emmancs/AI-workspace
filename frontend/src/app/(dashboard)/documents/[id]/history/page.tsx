'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocument, getDocumentVersions, restoreDocumentVersion, DocumentVersion } from '@/lib/documents';


export default function DocumentHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const { document, loading, error } = useDocument(documentId);
  const [versions, setVersions] = React.useState<DocumentVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = React.useState(true);
  const [selectedVersion, setSelectedVersion] = React.useState<DocumentVersion | null>(null);
  const [restoring, setRestoring] = React.useState(false);
  const [restoringError, setRestoringError] = React.useState<string | null>(null);

  // Fetch document versions
  React.useEffect(() => {
    if (!documentId) return;

    const fetchVersions = async () => {
      try {
        setVersionsLoading(true);
        const response = await fetch(`/api/documents/${documentId}/versions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch versions');
        
        const data = await response.json();
        setVersions(data || []);
        
        if (data && data.length > 0) {
          setSelectedVersion(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      } finally {
        setVersionsLoading(false);
      }
    };

    fetchVersions();
  }, [documentId]);

  const handleRestore = async (versionId: string) => {
    try {
      setRestoring(true);
      setRestoringError(null);
      
      const response = await fetch(`/api/documents/${documentId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to restore version');
      
      // Redirect to editor
      router.push(`/documents/${documentId}`);
    } catch (err) {
      setRestoringError(err instanceof Error ? err.message : 'Failed to restore version');
    } finally {
      setRestoring(false);
    }
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
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-dark-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white font-outfit">{document.title}</h1>
              <p className="text-xs text-slate-400 mt-1">Version History</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {restoringError && (
          <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-rose-300 text-sm">{restoringError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Versions List */}
          <div className="lg:col-span-1">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">All Versions ({versions.length})</h3>
              
              {versionsLoading ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500">Loading versions...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 rounded-lg bg-slate-900/50 border border-slate-800">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No versions yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {versions.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">
                            v{versions.length - index}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {version.plainText || '(empty)'}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(version.createdAt).toLocaleDateString()} {new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <p className="text-[10px] text-slate-500">By {version.changedBy?.name || 'Unknown'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Version Preview */}
          <div className="lg:col-span-2">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Version Details</h3>
                  <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-4 space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Modified By</p>
                      {selectedVersion.changedBy ? (
                        <div className="flex items-center gap-2">
                          {selectedVersion.changedBy.avatarUrl && (
                            <img
                              src={selectedVersion.changedBy.avatarUrl}
                              alt={selectedVersion.changedBy.name}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-sm text-white">{selectedVersion.changedBy.name}</p>
                            <p className="text-xs text-slate-500">{selectedVersion.changedBy.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Unknown</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">Modified Date</p>
                      <p className="text-sm text-white">{new Date(selectedVersion.createdAt).toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-2">Preview</p>
                      <div className="bg-dark-950 rounded border border-slate-800 p-3 max-h-64 overflow-y-auto">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap line-clamp-20">
                            {selectedVersion.plainText || '(empty)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/documents/${documentId}`)}
                    className="flex-1"
                  >
                    Back to Editor
                  </Button>
                  {versions[0]?.id !== selectedVersion.id && (
                    <Button
                      variant="gradient"
                      onClick={() => handleRestore(selectedVersion.id)}
                      disabled={restoring}
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{restoring ? 'Restoring...' : 'Restore Version'}</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 rounded-lg bg-slate-900/50 border border-slate-800">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a version to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
