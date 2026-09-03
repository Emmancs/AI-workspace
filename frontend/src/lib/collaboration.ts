export type CollaborationStatus = 'connected' | 'reconnecting' | 'offline';

export interface CollaborationUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface CollaboratorPresence {
  id: string;
  name: string;
  avatarUrl?: string | null;
  status: 'editing' | 'viewing';
  color: string;
}

export interface CollaborationConfig {
  documentId: string;
  workspaceId: string;
  currentUser?: CollaborationUser;
  token?: string;
  socketUrl?: string;
}
