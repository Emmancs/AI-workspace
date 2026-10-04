'use client';

import * as React from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TasksPage({ params }: { params: { workspaceId: string } }) {
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState('');
  const [projectId, setProjectId] = React.useState('');
  const [projects, setProjects] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [taskData, projectData] = await Promise.all([
        apiFetch(`/tasks/workspace/${params.workspaceId}`),
        apiFetch(`/projects/workspace/${params.workspaceId}`),
      ]);
      setTasks(taskData);
      setProjects(projectData);
      if (!projectId && projectData[0]) setProjectId(projectData[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    }
  }, [params.workspaceId, projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !projectId) return;
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: params.workspaceId, projectId, title }),
      });
      setTitle('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    }
  }

  async function updateStatus(taskId: string, status: string) {
    try {
      await apiFetch(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }

    async function updateTask(taskId: string, data: Record<string, string>) {
      try { await apiFetch(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }); await load(); }
      catch (err: any) { setError(err.message || 'Failed to update task'); }
    }

    async function deleteTask(taskId: string) {
      if (!window.confirm('Delete this task?')) return;
      try { await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' }); await load(); }
      catch (err: any) { setError(err.message || 'Failed to delete task'); }
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div><h1 className="text-2xl font-bold text-white">Tasks</h1><p className="text-sm text-slate-400 mt-1">Track work across workspace projects.</p></div>
      <Card>
        <form onSubmit={createTask} className="flex flex-col md:flex-row gap-3">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" className="input flex-1" />
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="input">
            <option value="">Select project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <Button type="submit" disabled={!title.trim() || !projectId}>Create task</Button>
        </form>
      </Card>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="space-y-3">
        {tasks.length === 0 ? <Card><p className="text-sm text-slate-400">No tasks yet.</p></Card> : tasks.map((task) => (
          <Card key={task.id} className="flex items-center justify-between gap-4">
            <div><h2 className="font-medium text-white">{task.title}</h2><p className="text-xs text-slate-500">{task.project?.name || 'Project'} · {task.priority}</p></div>
            <div className="flex items-center gap-2">
              <select value={task.status} onChange={(event) => updateStatus(task.id, event.target.value)} className="input w-auto">
                <option value="TODO">TODO</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="IN_REVIEW">IN_REVIEW</option><option value="DONE">DONE</option>
              </select>
              <select value={task.priority} onChange={(event) => updateTask(task.id, { priority: event.target.value })} className="input w-auto">
                <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="URGENT">URGENT</option>
              </select>
              <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
