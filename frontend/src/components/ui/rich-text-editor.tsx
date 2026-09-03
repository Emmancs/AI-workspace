'use client';

import * as React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Collaboration from '@tiptap/extension-collaboration';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  LinkIcon,
  ImageIcon,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Button } from './button';
import type { CollaborationConfig, CollaboratorPresence, CollaborationStatus } from '@/lib/collaboration';

export interface EditorProps {
  content?: string | object;
  onChange?: (content: object) => void;
  editable?: boolean;
  collaboration?: CollaborationConfig;
  onCollaborationStateChange?: (state: {
    connectionStatus: CollaborationStatus;
    collaborators: CollaboratorPresence[];
  }) => void;
}

const ToolbarButton = ({ 
  onClick, 
  isActive, 
  children,
  title 
}: { 
  onClick: () => void; 
  isActive?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md transition-colors ${
      isActive
        ? 'bg-indigo-500/20 text-indigo-400'
        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-300'
    }`}
  >
    {children}
  </button>
);

const Toolbar = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 p-3 border-b border-slate-800 bg-slate-900/50 rounded-t-lg flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-800" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-800" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-800" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-800" />

      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        title="Link"
      >
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter image URL:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        title="Image"
      >
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-800 ml-auto" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
};

export function RichTextEditor({ content, onChange, editable = true, collaboration, onCollaborationStateChange }: EditorProps) {
  const yDoc = React.useMemo(() => (collaboration ? new Y.Doc() : null), [collaboration?.documentId]);
  const socketRef = React.useRef<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<CollaborationStatus>('offline');
  const [collaborators, setCollaborators] = React.useState<CollaboratorPresence[]>([]);

  React.useEffect(() => {
    if (!collaboration || !collaboration.documentId || !collaboration.workspaceId || !collaboration.token) {
      return;
    }

    const socket = io(`${collaboration.socketUrl || 'http://localhost:4000'}/collab`, {
      transports: ['websocket'],
      auth: {
        token: `Bearer ${collaboration.token}`,
      },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('joinDocument', {
        documentId: collaboration.documentId,
        workspaceId: collaboration.workspaceId,
      });
    });

    socket.on('connect_error', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('offline');
    });

    socket.on('reconnect', () => {
      setConnectionStatus('connected');
      socket.emit('joinDocument', {
        documentId: collaboration.documentId,
        workspaceId: collaboration.workspaceId,
      });
    });

    socket.on('presence:update', (payload: { collaborators?: CollaboratorPresence[] }) => {
      setCollaborators(payload.collaborators ?? []);
      onCollaborationStateChange?.({
        connectionStatus: connectionStatus,
        collaborators: payload.collaborators ?? [],
      });
    });

    socket.on('document:error', (payload: { message?: string }) => {
      console.error('Collaboration error:', payload?.message || 'Unknown collaboration error');
    });

    socket.on('document:initial', (payload: { content?: object; documentId?: string }) => {
      if (payload.documentId && payload.documentId !== collaboration.documentId) return;
      if (payload.content && editor) {
        editor.commands.setContent(payload.content, false);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [collaboration?.documentId, collaboration?.workspaceId, collaboration?.token]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
      ...(yDoc ? [Collaboration.configure({ document: yDoc })] : []),
    ],
    content: content || '<p>Start typing...</p>',
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  React.useEffect(() => {
    if (!editor || !yDoc || !collaboration || !socketRef.current) return;

    const handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || !socketRef.current?.connected) return;
      socketRef.current.emit('document:update', {
        documentId: collaboration.documentId,
        workspaceId: collaboration.workspaceId,
        update: Array.from(update),
      });
    };

    const handleRemoteUpdate = (payload: { documentId?: string; update?: number[]; senderId?: string }) => {
      if (!payload.documentId || payload.documentId !== collaboration.documentId) return;
      if (payload.senderId && collaboration.currentUser && payload.senderId === collaboration.currentUser.id) return;
      if (!payload.update) return;
      Y.applyUpdate(yDoc, Uint8Array.from(payload.update), 'remote');
    };

    yDoc.on('update', handleLocalUpdate);
    socketRef.current.on('document:remote-update', handleRemoteUpdate);

    return () => {
      yDoc.off('update', handleLocalUpdate);
      socketRef.current?.off('document:remote-update', handleRemoteUpdate);
    };
  }, [editor, yDoc, collaboration]);

  React.useEffect(() => {
    onCollaborationStateChange?.({ connectionStatus, collaborators });
  }, [connectionStatus, collaborators, onCollaborationStateChange]);

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
      {editable && <Toolbar editor={editor!} />}
      <EditorContent
        editor={editor}
        className="prose prose-invert max-w-none px-6 py-4 focus:outline-none"
      />
    </div>
  );
}
