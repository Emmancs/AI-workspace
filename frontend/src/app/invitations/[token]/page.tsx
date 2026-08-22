'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, XCircle, Building, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api-client';

interface InvitationPageProps {
  params: {
    token: string;
  };
}

export default function InvitationPage({ params }: InvitationPageProps) {
  const router = useRouter();
  const [invitation, setInvitation] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [actionDone, setActionDone] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const data = await apiFetch(`/workspaces/invitations/${params.token}`);
        setInvitation(data);
      } catch (err: any) {
        setError(err.message || 'Invitation is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [params.token]);

  const handleAccept = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/workspaces/invitations/${params.token}/accept`, {
        method: 'POST',
      });
      setActionDone('Invitation accepted! Redirecting to workspace...');
      setTimeout(() => router.push(`/workspaces/${invitation.workspaceId || 'ws-1'}`), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation. Please ensure you are logged in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await apiFetch(`/workspaces/invitations/${params.token}/reject`, {
        method: 'POST',
      });
      setActionDone('Invitation rejected.');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reject invitation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/20 blur-[140px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md p-8 relative z-10 glass-card text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl gradient-brand mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/30">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Workspace Invitation</h1>
          <p className="text-xs text-slate-400 mt-1">You have been invited to collaborate on FlowAI</p>
        </div>

        {loading && <p className="text-xs text-slate-400 animate-pulse">Verifying invitation token...</p>}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {actionDone && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionDone}</span>
          </div>
        )}

        {invitation && !actionDone && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-left">
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-brand-400" />
                <span className="font-bold text-white text-sm">{invitation.workspace?.name}</span>
              </div>
              <p className="text-xs text-slate-400">
                Invited by <span className="text-white font-medium">{invitation.invitedBy?.name}</span> ({invitation.invitedBy?.email})
              </p>
              <div className="pt-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Assigned Role:</span>
                <span className="text-xs font-bold text-brand-300">{invitation.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="w-1/2" 
                onClick={handleReject} 
                disabled={submitting}
              >
                <XCircle className="w-4 h-4" />
                <span>Decline</span>
              </Button>

              <Button 
                variant="gradient" 
                className="w-1/2" 
                onClick={handleAccept} 
                disabled={submitting}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Joining...' : 'Accept Invitation'}</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
