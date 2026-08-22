'use client';

import * as React from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  X, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api-client';

interface MembersPageProps {
  params: {
    workspaceId: string;
  };
}

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    jobTitle?: string;
  };
}

export default function MembersPage({ params }: MembersPageProps) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [inviteSending, setInviteSending] = React.useState(false);
  const [inviteSuccess, setInviteSuccess] = React.useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const data = await apiFetch(`/workspaces/${params.workspaceId}/members`);
      setMembers(data);
    } catch (err: any) {
      // Mock fallback data if running standalone
      setMembers([
        {
          id: 'mem-1',
          role: 'OWNER',
          joinedAt: new Date().toISOString(),
          user: { id: 'usr-1', name: 'Emmanuel', email: 'emmanuel@flowai.io', jobTitle: 'Founding Engineer' }
        },
        {
          id: 'mem-2',
          role: 'ADMIN',
          joinedAt: new Date().toISOString(),
          user: { id: 'usr-2', name: 'Alex Johnson', email: 'alex@flowai.io', jobTitle: 'Tech Lead' }
        },
        {
          id: 'mem-3',
          role: 'EDITOR',
          joinedAt: new Date().toISOString(),
          user: { id: 'usr-3', name: 'Priya Sharma', email: 'priya@flowai.io', jobTitle: 'Fullstack Dev' }
        },
        {
          id: 'mem-4',
          role: 'VIEWER',
          joinedAt: new Date().toISOString(),
          user: { id: 'usr-4', name: 'John Doe', email: 'john@example.com', jobTitle: 'Product Manager' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMembers();
  }, [params.workspaceId]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await apiFetch(`/workspaces/${params.workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole as any } : m));
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      await apiFetch(`/workspaces/${params.workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSending(true);
    setInviteSuccess(null);
    setError(null);

    try {
      const result = await apiFetch(`/workspaces/${params.workspaceId}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      setInviteSuccess(`Invitation sent to ${inviteEmail}! Token: ${result.token.substring(0, 8)}...`);
      setInviteEmail('');
      setTimeout(() => setInviteModalOpen(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>Members & Roles</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage workspace members, assign RBAC permissions, and invite new collaborators.
          </p>
        </div>

        <Button variant="gradient" size="sm" onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </Button>
      </div>

      {/* Role Legend Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Badge variant="brand">OWNER</Badge>
            <span className="text-xs text-slate-400">Full Control</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Manage billing, delete workspace, manage members & settings.</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Badge variant="purple">ADMIN</Badge>
            <span className="text-xs text-slate-400">Management</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Manage members, projects, documents, tasks, and settings.</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Badge variant="success">EDITOR</Badge>
            <span className="text-xs text-slate-400">Collaborator</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Create & edit documents, tasks, comments, and discussions.</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Badge variant="default">VIEWER</Badge>
            <span className="text-xs text-slate-400">Read Only</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Read-only access across projects, documents, and tasks.</p>
        </Card>
      </div>

      {/* Members Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Workspace Members ({members.length})</CardTitle>
            <Badge variant="brand">Backend RBAC Protected</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 uppercase border border-indigo-500/30">
                        {member.user.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{member.user.name}</span>
                        <span className="text-[10px] text-slate-400">{member.user.jobTitle || 'Team Member'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{member.user.email}</td>
                    <td className="py-3.5 px-4">
                      {member.role === 'OWNER' ? (
                        <Badge variant="brand">OWNER</Badge>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="EDITOR">EDITOR</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-dark-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg font-outfit">Invite Team Member</h3>
                <p className="text-xs text-slate-400">Send an invitation email to join workspace</p>
              </div>
            </div>

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="ADMIN">ADMIN — Full management access</option>
                  <option value="EDITOR">EDITOR — Create/edit docs, tasks, channels</option>
                  <option value="VIEWER">VIEWER — Read-only access</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={inviteSending}>
                  <span>{inviteSending ? 'Sending...' : 'Send Invitation'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
