'use client';

import * as React from 'react';
import { Users, Lock, Copy, Trash2, Check, X } from 'lucide-react';
import { Button } from './button';

export interface SharePermission {
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

interface DocumentSharePanelProps {
  shares: SharePermission[];
  onShare?: (userId: string, permission: 'READ' | 'WRITE' | 'ADMIN') => void;
  onUpdatePermission?: (userId: string, permission: 'READ' | 'WRITE' | 'ADMIN') => void;
  onRevoke?: (userId: string) => void;
  isOwner?: boolean;
}

export function DocumentSharePanel({
  shares,
  onShare,
  onUpdatePermission,
  onRevoke,
  isOwner = false,
}: DocumentSharePanelProps) {
  const [showAddShare, setShowAddShare] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [selectedPermission, setSelectedPermission] = React.useState<'READ' | 'WRITE' | 'ADMIN'>('READ');

  const handleShare = async () => {
    if (selectedUserId) {
      await onShare?.(selectedUserId, selectedPermission);
      setSelectedUserId('');
      setSelectedPermission('READ');
      setShowAddShare(false);
    }
  };

  const getPermissionBadgeColor = (level: 'READ' | 'WRITE' | 'ADMIN') => {
    switch (level) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'WRITE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'READ':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const permissionLabels = {
    READ: 'Can view',
    WRITE: 'Can edit',
    ADMIN: 'Full access',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4" />
          Sharing
        </h3>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddShare(!showAddShare)}
          >
            <Users className="w-3 h-3" />
            Add
          </Button>
        )}
      </div>

      {/* Add Share Form */}
      {showAddShare && isOwner && (
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
          >
            <option value="">Choose a user...</option>
            {/* TODO: Populate with workspace members */}
          </select>

          <select
            value={selectedPermission}
            onChange={(e) => setSelectedPermission(e.target.value as 'READ' | 'WRITE' | 'ADMIN')}
            className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
          >
            <option value="READ">Can view</option>
            <option value="WRITE">Can edit</option>
            <option value="ADMIN">Full access</option>
          </select>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="gradient"
              onClick={handleShare}
              className="flex-1"
            >
              <Check className="w-3 h-3" />
              Share
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddShare(false)}
              className="flex-1"
            >
              <X className="w-3 h-3" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Shares List */}
      <div className="space-y-2">
        {shares.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            <Lock className="w-4 h-4 mx-auto mb-2 opacity-50" />
            Not shared with anyone yet
          </div>
        ) : (
          shares.map((share) => (
            <div
              key={share.user.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 group hover:border-slate-700/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {share.user.avatarUrl && (
                    <img
                      src={share.user.avatarUrl}
                      alt={share.user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {share.user.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {share.user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isOwner ? (
                  <>
                    <select
                      value={share.permissionLevel}
                      onChange={(e) =>
                        onUpdatePermission?.(
                          share.user.id,
                          e.target.value as 'READ' | 'WRITE' | 'ADMIN'
                        )
                      }
                      className={`px-2 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${getPermissionBadgeColor(share.permissionLevel)}`}
                    >
                      <option value="READ">Can view</option>
                      <option value="WRITE">Can edit</option>
                      <option value="ADMIN">Full access</option>
                    </select>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRevoke?.(share.user.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                    </Button>
                  </>
                ) : (
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getPermissionBadgeColor(share.permissionLevel)}`}>
                    {permissionLabels[share.permissionLevel]}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Copy Link */}
      <button className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400 hover:text-slate-300 hover:border-slate-700 transition-colors flex items-center justify-center gap-2">
        <Copy className="w-3 h-3" />
        Copy share link
      </button>
    </div>
  );
}
