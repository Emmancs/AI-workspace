'use client';

import * as React from 'react';
import { apiFetch } from './api-client';

export interface Document {
  id: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  content?: any;
  plainText?: string;
  isArchived: boolean;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
    versions: number;
  };
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  joinedAt: string;
}

export function useDocuments(workspaceId: string) {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!workspaceId) return;

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Document[]>(`/documents/workspace/${workspaceId}`);
        setDocuments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [workspaceId]);

  return { documents, loading, error, refetch: () => {} };
}

export function useDocument(documentId: string) {
  const [document, setDocument] = React.useState<Document | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Document>(`/documents/${documentId}`);
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  return { document, loading, error };
}

export async function createDocument(
  workspaceId: string,
  title: string,
  content?: any,
  projectId?: string
) {
  return apiFetch<Document>('/documents', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      title,
      content,
      projectId,
    }),
  });
}

export async function updateDocument(
  documentId: string,
  title?: string,
  content?: any,
  plainText?: string
) {
  return apiFetch<Document>(`/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title,
      content,
      plainText,
    }),
  });
}

export async function deleteDocument(documentId: string) {
  return apiFetch(`/documents/${documentId}`, {
    method: 'DELETE',
  });
}

export async function archiveDocument(documentId: string) {
  return apiFetch(`/documents/${documentId}/archive`, {
    method: 'PATCH',
  });
}

// Comments API functions
export function useComments(documentId: string) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!documentId) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Comment[]>(`/comments/document/${documentId}`);
        setComments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [documentId]);

  return { comments, loading, error };
}

export async function addComment(documentId: string, content: string, mentions?: string[]) {
  return apiFetch<Comment>('/comments', {
    method: 'POST',
    body: JSON.stringify({
      documentId,
      content,
      mentions,
    }),
  });
}

export async function updateComment(
  commentId: string,
  content?: string,
  isResolved?: boolean
) {
  return apiFetch<Comment>(`/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      content,
      isResolved,
    }),
  });
}

export async function deleteComment(commentId: string) {
  return apiFetch(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}

export async function addCommentReply(commentId: string, content: string, mentions?: string[]) {
  return apiFetch<CommentReply>(`/comments/${commentId}/replies`, {
    method: 'POST',
    body: JSON.stringify({
      commentId,
      content,
      mentions,
    }),
  });
}

export async function deleteCommentReply(replyId: string) {
  return apiFetch(`/comments/reply/${replyId}`, {
    method: 'DELETE',
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  const [members, setMembers] = React.useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!workspaceId) return;

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
        setMembers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [workspaceId]);

  return { members, loading, error };
}

// Document Sharing API functions
export interface DocumentShare {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN';
  sharedBy: {
    id: string;
    name: string;
  };
}

export async function shareDocument(
  documentId: string,
  userId: string,
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN'
) {
  return apiFetch<DocumentShare>(`/documents/${documentId}/share`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      permissionLevel,
    }),
  });
}

export async function getDocumentShares(documentId: string) {
  return apiFetch<DocumentShare[]>(`/documents/${documentId}/shares`, {
    method: 'GET',
  });
}

export async function updateDocumentShare(
  documentId: string,
  userId: string,
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN'
) {
  return apiFetch<DocumentShare>(`/documents/${documentId}/share/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      userId,
      permissionLevel,
    }),
  });
}

export async function unshareDocument(documentId: string, userId: string) {
  return apiFetch(`/documents/${documentId}/share/${userId}`, {
    method: 'DELETE',
  });
}

// Document Version API functions
export interface DocumentVersion {
  id: string;
  documentId: string;
  title: string;
  content: any;
  version: number;
  createdAt: string;
  createdById: string;
  plainText?: string;
  changedBy?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export async function getDocumentVersions(documentId: string) {
  return apiFetch<DocumentVersion[]>(`/documents/${documentId}/versions`, {
    method: 'GET',
  });
}

export async function restoreDocumentVersion(documentId: string, versionId: string) {
  return apiFetch<Document>(`/documents/${documentId}/versions/${versionId}/restore`, {
    method: 'POST',
  });
}
