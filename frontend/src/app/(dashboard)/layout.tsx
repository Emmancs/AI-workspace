'use client';

import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { Bot, X, Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeWorkspace, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [aiDrawerOpen, setAiDrawerOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [aiInput, setAiInput] = React.useState('');
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | undefined>(undefined);
  const [aiMessages, setAiMessages] = React.useState<Array<{ id: string; role: 'user' | 'assistant'; text: string; sources?: string[] }>>([
    {
      id: '1',
      role: 'assistant',
      text: 'Hello! I am your FlowAI Workspace assistant. How can I help you today?',
    }
  ]);

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    const userText = aiInput;
    setAiInput('');
    setAiMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', text: userText }
    ]);
    setIsAiLoading(true);

    try {
      const { apiFetch } = await import('@/lib/api-client');
      // Adding explicit generic to avoid Type instantiation is excessively deep error
      const data = await apiFetch<any>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userText, conversationId }),
      });
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setAiMessages(prev => [
        ...prev,
        {
          id: data.id || (Date.now() + 1).toString(),
          role: 'assistant',
          text: data.text || 'Sorry, I could not generate a response.',
        }
      ]);
    } catch (error: any) {
      console.error('AI chat error:', error);
      setAiMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Sorry, an error occurred while processing your request.',
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  React.useEffect(() => {
    if (!searchOpen || !activeWorkspace?.id || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await import('@/lib/api-client').then(({ apiFetch }) =>
          apiFetch<{ results: any[] }>(`/search?workspaceId=${encodeURIComponent(activeWorkspace.id)}&q=${encodeURIComponent(searchQuery)}`),
        );
        setSearchResults(data.results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchOpen, searchQuery, activeWorkspace?.id]);

  if (authLoading) {
    return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-row">
      {/* Sidebar */}
      <Sidebar 
        workspaceId={activeWorkspace?.id}
        onOpenAiDrawer={() => setAiDrawerOpen(true)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          onOpenSearch={() => setSearchOpen(true)} 
        />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 p-4 sm:p-16" onClick={() => setSearchOpen(false)}>
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-dark-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-800 p-4">
              <Search className="h-5 w-5 text-slate-400" />
              <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search documents, projects, tasks, and members" className="flex-1 bg-transparent text-white outline-none" />
              <button onClick={() => setSearchOpen(false)} className="text-xs text-slate-400">Esc</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {searchLoading && <p className="p-4 text-sm text-slate-400">Searching...</p>}
              {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && <p className="p-4 text-sm text-slate-400">No matching results.</p>}
              {searchResults.map((result) => (
                <button key={`${result.type}-${result.id}`} onClick={() => { setSearchOpen(false); router.push(result.href); }} className="w-full rounded-lg p-3 text-left hover:bg-slate-800">
                  <div className="text-xs uppercase text-brand-300">{result.type}</div>
                  <div className="text-sm text-white">{result.title}</div>
                  {result.subtitle && <div className="text-xs text-slate-400">{result.subtitle}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Workspace AI Assistant Drawer */}
      {aiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-dark-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gradient-brand">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Bot className="w-5 h-5" />
                <span>Workspace AI Intelligence</span>
              </div>
              <button 
                onClick={() => setAiDrawerOpen(false)}
                className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {aiMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3.5 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-brand-600 text-white rounded-br-none' 
                        : 'glass-card border-slate-700/60 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1">
                        <span className="text-[10px] text-slate-400 font-semibold w-full">Sources retrieved:</span>
                        {msg.sources.map((s, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            📄 {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Prompt Input */}
            <form onSubmit={handleSendAi} className="p-4 border-t border-slate-800 bg-dark-950 flex gap-2">
              <input 
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask anything about docs, tasks, or discussions..."
                disabled={isAiLoading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 disabled:opacity-50"
              />
              <Button type="submit" variant="gradient" size="sm" disabled={isAiLoading || !aiInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
