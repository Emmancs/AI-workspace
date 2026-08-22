import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlowAI Workspace - The AI-Native Team Workspace',
  description: 'AI-native collaborative workspace combining documents, project tasks, real-time discussions, and context-aware workspace AI intelligence.',
  keywords: ['FlowAI', 'Workspace', 'AI Assistant', 'Collaborative Editor', 'Project Management', 'Real-time Chat', 'RAG'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-dark-950 text-slate-100 font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
