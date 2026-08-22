'use client';

import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { Bot, Sparkles, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [aiDrawerOpen, setAiDrawerOpen] = React.useState(false);
  const [aiInput, setAiInput] = React.useState('');
  const [aiMessages, setAiMessages] = React.useState<Array<{ id: string; role: 'user' | 'assistant'; text: string; sources?: string[] }>>([
    {
      id: '1',
      role: 'assistant',
      text: 'Hello Emmanuel! I am your FlowAI Workspace assistant. I have full knowledge of your documents, tasks, and team discussions. What can I help you with today?',
      sources: ['FlowAI Architecture Spec', 'E-Commerce Tasks']
    }
  ]);

  const handleSendAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput;
    setAiInput('');
    setAiMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', text: userText }
    ]);

    setTimeout(() => {
      setAiMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `Retrieved context for "${userText}": Currently, there are 8 active projects and 34 tasks. The main authentication architecture is configured with JWT tokens & Redis pub/sub session state.`,
          sources: ['JWT Discussion Channel', 'Architecture Doc']
        }
      ]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-row">
      {/* Sidebar */}
      <Sidebar 
        workspaceId="ws-1" 
        onOpenAiDrawer={() => setAiDrawerOpen(true)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          onOpenSearch={() => setAiDrawerOpen(true)} 
        />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

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
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <Button type="submit" variant="gradient" size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
