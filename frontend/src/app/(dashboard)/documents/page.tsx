'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FileText, Plus, Search, Filter, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDocuments } from '@/lib/documents';

function DocumentsListContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace') || '';
  const [search, setSearch] = React.useState('');
  
  const { documents, loading, error } = useDocuments(workspaceId);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(search.toLowerCase()) ||
    doc.plainText?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight">
            Documents
          </h1>
          <p className="text-slate-400 text-xs lg:text-sm mt-1">
            Collaborate and manage documents in your workspace
          </p>
        </div>

        <Button variant="gradient" size="sm">
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </Button>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-slate-800 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-400 text-sm">Loading documents...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300 text-sm">
          Error: {error}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 rounded-xl bg-slate-800/50 mb-4">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-1">No documents yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create your first document to get started</p>
          <Button variant="gradient" size="sm">
            <Plus className="w-4 h-4" />
            <span>Create Document</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`}>
              <Card className="p-4 hover:border-slate-700 transition-colors cursor-pointer h-full">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <FileText className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-white text-sm line-clamp-2">{doc.title}</h3>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {doc.plainText || 'No description'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{doc.createdBy.name.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {doc._count && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>💬 {doc._count.comments} comments</span>
                      <span>•</span>
                      <span>📝 {doc._count.versions} versions</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentsListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-slate-800 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-400 text-sm">Loading documents...</p>
          </div>
        </div>
      }
    >
      <DocumentsListContent />
    </Suspense>
  );
}
