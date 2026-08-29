'use client';

import * as React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
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

export interface EditorProps {
  content?: string | object;
  onChange?: (content: object) => void;
  editable?: boolean;
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

export function RichTextEditor({ content, onChange, editable = true }: EditorProps) {
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
    ],
    content: content || '<p>Start typing...</p>',
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

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
