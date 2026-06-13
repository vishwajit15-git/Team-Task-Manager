import { apiFetch } from '@/lib/api';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { format } from 'date-fns';
import { CheckSquare, Plus, FolderGit2, Trash2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

export function Tasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [comment, setComment] = useState('');
  
  // Task form
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');

const toggleAssignee = (id: string) => setAssignees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiFetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    }
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['myTasks'],
    queryFn: async () => {
      const res = await apiFetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiFetch('/api/users');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: user?.role === 'ADMIN'
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['taskComments', selectedTask?.id],
    queryFn: async () => {
      if (!selectedTask) return [];
      const res = await apiFetch(`/api/tasks/${selectedTask.id}/comments`, {
        
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: !!selectedTask});

  const sendCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiFetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to send comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskComments', selectedTask.id] });
      setComment('');
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedTask((prev: any) => ({ ...prev, status: prev.status }));
    }
  });

  const [isEditingTask, setIsEditingTask] = useState(false);

  const editTaskMutation = useMutation({
    mutationFn: async (updatedTask: any) => {
      const res = await apiFetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedTask(updated);
      setIsEditingTask(false);
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleEditClick = () => {
    setTitle(selectedTask.title);
    setDescription(selectedTask.description || '');
    setPriority(selectedTask.priority);
    setAssignees(selectedTask.assignees.map((a: any) => a.id));
    setDueDate(selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'yyyy-MM-dd') : '');
    setStartDate(selectedTask.startDate ? format(new Date(selectedTask.startDate), 'yyyy-MM-dd') : '');
    setIsEditingTask(true);
  };

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: any) => {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, projectId: projects[0].id })
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setTaskDialogOpen(false);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAssignees([]);
      setDueDate('');
      setStartDate('');
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async (newProject: any) => {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectDialogOpen(false);
      setProjectTitle('');
      toast.success('Project setup successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    sendCommentMutation.mutate(comment.trim());
  };

  const currentProject = projects[0];

  if (isLoading || isLoadingProjects) return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading tasks...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D1CDC4] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-[#1F4D3A]" />
            Tasks
          </h1>
          <p className="text-slate-500 mt-1">{user?.role === 'ADMIN' ? 'All tasks in the workspace.' : 'Tasks assigned to you.'}</p>
        </div>
        
        {user?.role === 'ADMIN' && (
          <div className="flex gap-4">
            {!currentProject ? (
              <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                <DialogTrigger render={
                  <Button className="shrink-0 bg-[#1F4D3A] hover:bg-[#1F4D3A]/90 text-white font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none border border-[#1F4D3A]">
                    <FolderGit2 className="h-4 w-4 mr-2" />
                    Setup Project
                  </Button>
                } />
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Setup Initial Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); createProjectMutation.mutate({ title: projectTitle }); }} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectTitle">Project Title</Label>
                      <Input id="projectTitle" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createProjectMutation.isPending} className="bg-[#1F4D3A] text-white">Setup</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger render={
                  <Button className="shrink-0 bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#111111] font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none border border-[#C6A15B]">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                } />
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); createTaskMutation.mutate({ title, description, priority, assignees, dueDate, startDate }); }} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Task Title</Label>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col">
                      <Label>Assignees</Label>
                      <Popover>
                        <PopoverTrigger render={
                          <button type="button" className="w-full justify-start text-left font-normal border border-input rounded-md px-3 py-2 text-sm bg-background/50 hover:bg-background">
                            {assignees.length > 0 
                              ? users.filter((u: any) => assignees.includes(u.id)).map((u: any) => u.name).join(', ') 
                              : "Select users"}
                          </button>
                        } />
                        <PopoverContent className="w-full p-2" align="start">
                          <div className="space-y-2">
                            {users.map((u: any) => (
                              <label key={u.id} className="flex items-center space-x-2 p-1 hover:bg-slate-50 cursor-pointer rounded">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-[#111111] border-gray-300 rounded focus:ring-[#C6A15B]"
                                  checked={assignees.includes(u.id)} 
                                  onChange={() => toggleAssignee(u.id)} 
                                />
                                <span className="text-sm font-medium">{u.name}</span>
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createTaskMutation.isPending} className="bg-[#111111] text-white hover:bg-[#222222]">Create Task</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      <div className="border border-[#D1CDC4] bg-white">
        <div className="hidden md:grid grid-cols-[24px_1fr_100px_120px] padding-4 bg-slate-50 font-bold text-xs uppercase tracking-wider border-b border-[#D1CDC4] p-3 px-4">
          <div></div>
          <div>Task Description</div>
          <div>Status</div>
          <div>Due</div>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">No tasks.</div>
        ) : (
          tasks.map((task: any) => (
            <div 
              key={task.id} 
              onClick={() => setSelectedTask(task)}
              className="grid grid-cols-[24px_1fr] md:grid-cols-[24px_1fr_100px_120px] gap-y-2 md:gap-y-0 p-3 px-4 border-b border-[#D1CDC4] text-[13px] hover:bg-[#FAF9F6] transition-colors items-center cursor-pointer"
            >
              <div className="text-slate-400">
                {task.status === 'COMPLETED' ? '☑' : '☐'}
              </div>
              <div className="font-medium text-foreground truncate pr-4 text-[#111111] hover:text-[#1F4D3A]">
                {task.title}
              </div>
              <div>
                <span className={`px-2 py-[2px] text-[10px] font-bold uppercase border border-current ${task.status === 'COMPLETED' ? 'border-[#111111] bg-[#111111] text-white' : 'border-slate-300'}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <div className={`font-bold text-[11px] uppercase tracking-widest ${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-[#A21F1F]' : 'text-slate-500'}`}>
                {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'None'}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={(open) => {
        if (!open) {
          setSelectedTask(null);
          setIsEditingTask(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden rounded-none border-[#D1CDC4]">
          {selectedTask && (
            <div className="flex flex-col h-[80vh] max-h-[800px]">
              {isEditingTask ? (
                <div className="p-6 h-full flex flex-col">
                  <DialogTitle className="text-2xl font-bold tracking-tight text-[#111111] mb-6">Edit Task</DialogTitle>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <form id="edit-task-form" onSubmit={(e) => { e.preventDefault(); editTaskMutation.mutate({ title, description, priority, assignees, dueDate, startDate }); }} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Task Title</Label>
                        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-startDate">Start Date</Label>
                          <Input id="edit-startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-dueDate">Due Date</Label>
                          <Input id="edit-dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2 flex flex-col">
                        <Label>Assignees</Label>
                        <Popover>
                          <PopoverTrigger render={
                            <button type="button" className="w-full justify-start text-left font-normal border border-input rounded-md px-3 py-2 text-sm bg-background/50 hover:bg-background">
                              {assignees.length > 0 
                                ? users.filter((u: any) => assignees.includes(u.id)).map((u: any) => u.name).join(', ') 
                                : "Select users"}
                            </button>
                          } />
                          <PopoverContent className="w-full p-2" align="start">
                            <div className="space-y-2">
                              {users.map((u: any) => (
                                <label key={u.id} className="flex items-center space-x-2 p-1 hover:bg-slate-50 cursor-pointer rounded">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-[#111111] border-gray-300 rounded focus:ring-[#C6A15B]"
                                    checked={assignees.includes(u.id)} 
                                    onChange={() => toggleAssignee(u.id)} 
                                  />
                                  <span className="text-sm font-medium">{u.name}</span>
                                </label>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </form>
                  </div>
                  <div className="pt-4 border-t border-[#D1CDC4] flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditingTask(false)}>Cancel</Button>
                    <Button type="submit" form="edit-task-form" disabled={editTaskMutation.isPending} className="bg-[#111111] text-white hover:bg-[#222222]">Save Changes</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-[#D1CDC4] bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-[2px] text-[10px] font-bold uppercase border ${selectedTask.priority === 'CRITICAL' || selectedTask.priority === 'HIGH' ? 'border-[#A21F1F] text-[#A21F1F]' : selectedTask.priority === 'MEDIUM' ? 'border-[#C6A15B] text-[#C6A15B]' : 'border-[#1F4D3A] text-[#1F4D3A]'}`}>
                    {selectedTask.priority}
                  </span>
                  <select 
                    value={selectedTask.status} 
                    onChange={(e) => {
                      setSelectedTask({ ...selectedTask, status: e.target.value });
                      updateTaskStatusMutation.mutate({ taskId: selectedTask.id, status: e.target.value });
                    }}
                    className={`px-2 py-[2px] text-[10px] font-bold uppercase border outline-none cursor-pointer ${selectedTask.status === 'COMPLETED' ? 'border-[#1F4D3A] bg-[#1F4D3A] text-white' : 'border-slate-300 text-slate-600 bg-white'}`}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold text-[#111111] mb-2">{selectedTask.title}</DialogTitle>
                  {user?.role === 'ADMIN' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleEditClick}
                        className="text-slate-500 hover:bg-slate-200 p-2 border border-transparent hover:border-slate-300 transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            try {
                              const res = await apiFetch(`/api/tasks/${selectedTask.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                queryClient.invalidateQueries({ queryKey: ['myTasks'] });
                                setSelectedTask(null);
                              }
                            } catch (err) {}
                          }
                        }}
                        className="text-[#A21F1F] hover:bg-[#A21F1F]/10 p-2 border border-transparent hover:border-[#A21F1F] transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-[13px] text-slate-600">
                  {selectedTask.description || 'No description provided.'}
                </div>
                <div className="mt-4 pt-4 border-t border-[#D1CDC4] flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-4">
                    <div>
                      Assignee:{' '}
                      <span className="text-[#111111]">{selectedTask.assignees?.length > 0 ? selectedTask.assignees.map((a: any) => a.name).join(', ') : 'Unassigned'}</span>
                    </div>
                    <div>
                      Start:{' '}
                      <span className="text-[#111111]">
                        {selectedTask.startDate ? format(new Date(selectedTask.startDate), 'MMM d, yyyy') : 'No date'}
                      </span>
                    </div>
                    <div>
                      Due:{' '}
                      <span className={new Date(selectedTask.dueDate) < new Date() && selectedTask.status !== 'COMPLETED' ? 'text-[#A21F1F]' : 'text-[#111111]'}>
                        {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'MMM d, yyyy') : 'No date'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-[#D1CDC4] pb-2">Discussion</h4>
                
                {isLoadingComments ? (
                  <div className="text-center text-slate-500 py-4 font-bold uppercase tracking-widest text-[10px]">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-slate-500 py-8 font-bold uppercase tracking-widest text-[10px]">No comments yet.</div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c: any) => (
                      <div key={c.id} className="flex gap-4">
                        <div className="h-8 w-8 shrink-0 bg-[#C6A15B] flex items-center justify-center font-bold text-[#111111] text-xs">
                          {c.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-[13px] text-[#111111]">{c.user.name}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{format(new Date(c.createdAt), 'h:mm a')}</span>
                          </div>
                          <div className="text-[13px] text-slate-700 bg-slate-50 p-3 border border-[#D1CDC4]">
                            {c.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[#D1CDC4] bg-white">
                <form onSubmit={handleSendComment} className="flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border border-[#D1CDC4] px-4 py-2 text-[13px] outline-none focus:border-[#C6A15B] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim() || sendCommentMutation.isPending}
                    className="flex-shrink-0 px-4 flex items-center justify-center bg-[#C6A15B] text-[#111111] hover:bg-[#C6A15B]/90 disabled:opacity-50 transition-colors border border-[#C6A15B] font-bold text-[10px] uppercase tracking-widest"
                  >
                    Post
                  </button>
                </form>
              </div>
              </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
