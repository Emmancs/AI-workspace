'use client';

import * as React from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ProjectsPage({ params }: { params: { workspaceId: string } }) {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<any[]>([]);

  const loadProjects = React.useCallback(async () => {
    try {
      setError(null);
      const [projectData, memberData] = await Promise.all([
        apiFetch(`/projects/workspace/${params.workspaceId}`),
        apiFetch(`/workspaces/${params.workspaceId}/members`),
      ]);
      setProjects(projectData);
      setMembers(memberData);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [params.workspaceId]);

  React.useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: params.workspaceId, name, description }),
      });
      setName('');
      setDescription('');
      await loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }

  }

  async function updateProject(id: string, data: Record<string, string>) {
    try { await apiFetch(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); await loadProjects(); }
    catch (err: any) { setError(err.message || 'Failed to update project'); }
  }

  async function deleteProject(id: string) {
    if (!window.confirm('Delete this project and its tasks?')) return;
    try { await apiFetch(`/projects/${id}`, { method: 'DELETE' }); await loadProjects(); }
    catch (err: any) { setError(err.message || 'Failed to delete project'); }
  }

  async function addProjectMember(projectId: string, userId: string) {
    if (!userId) return;
    try { await apiFetch(`/projects/${projectId}/members/${userId}`, { method: 'POST' }); await loadProjects(); }
    catch (err: any) { setError(err.message || 'Failed to add project member'); }
  }

  async function removeProjectMember(projectId: string, userId: string) {
    try { await apiFetch(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }); await loadProjects(); }
    catch (err: any) { setError(err.message || 'Failed to remove project member'); }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="text-sm text-slate-400 mt-1">Manage projects in this workspace.</p>
      </div>
      <Card>
        <form onSubmit={createProject} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" className="input" />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="input" />
          <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Creating...' : 'Create project'}</Button>
        </form>
      </Card>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {loading ? <p className="text-slate-400">Loading projects...</p> : projects.length === 0 ? (
        <Card><p className="text-sm text-slate-400">No projects yet.</p></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <h2 className="font-semibold text-white">{project.name}</h2>
              <p className="text-sm text-slate-400 mt-2">{project.description || 'No description'}</p>
              <div className="mt-4 flex items-center gap-2">
                <select value={project.status} onChange={(event) => updateProject(project.id, { status: event.target.value })} className="input text-xs">
                  <option value="PLANNING">PLANNING</option><option value="ACTIVE">ACTIVE</option><option value="ON_HOLD">ON_HOLD</option><option value="COMPLETED">COMPLETED</option><option value="ARCHIVED">ARCHIVED</option>
                </select>
                <select value={project.priority} onChange={(event) => updateProject(project.id, { priority: event.target.value })} className="input text-xs">
                  <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="URGENT">URGENT</option>
                </select>
                <span className="text-xs text-slate-500">{project._count?.tasks || 0} tasks</span>
                <Button size="sm" variant="ghost" onClick={() => deleteProject(project.id)}>Delete</Button>
              </div>
              <div className="mt-3 border-t border-slate-800 pt-3">
                <select defaultValue="" onChange={(event) => { void addProjectMember(project.id, event.target.value); event.target.value = ''; }} className="input w-full text-xs">
                  <option value="">Add project member</option>{members.filter((member) => !project.members?.some((item: any) => item.userId === member.user.id)).map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
                </select>
                <div className="mt-2 flex flex-wrap gap-1">{project.members?.map((member: any) => <button key={member.userId} onClick={() => removeProjectMember(project.id, member.userId)} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white">{member.user.name} ×</button>)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
