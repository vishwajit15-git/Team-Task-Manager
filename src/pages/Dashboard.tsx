import { apiFetch } from '@/lib/api';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, LayoutDashboard, Briefcase, ListTodo, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

const fetchStats = async () => {
  const res = await apiFetch('/api/dashboard/stats', {
    
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

export function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Ongoing');
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchStats
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

  const sendInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data, email) => {
      toast.success(`Invite sent successfully to ${email}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send invite');
    }
  });

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

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-destructive">Failed to load dashboard data.</div>;

  const { metrics, overdueTasks = [], ongoingTasks = [], pendingTasks = [], notifications = [] } = data;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    sendCommentMutation.mutate(comment.trim());
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Here's a summary of your workspace activity.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="bg-white border border-[#D1CDC4] p-4 flex-1">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Active Projects</div>
          <div className="text-4xl font-bold mb-1">{metrics.projectsActive < 10 ? `0${metrics.projectsActive}` : metrics.projectsActive}</div>
          <div className="w-full h-1 bg-slate-100 mt-4">
            <div className="h-full bg-[#1F4D3A]" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="bg-white border border-[#D1CDC4] p-4 flex-1">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">My Open Tasks</div>
          <div className="text-4xl font-bold mb-1">{metrics.tasksAssigned < 10 ? `0${metrics.tasksAssigned}` : metrics.tasksAssigned}</div>
          <div className="text-xs text-emerald-700 mt-4 font-bold">Needs attention</div>
        </div>
        <div className="bg-white border border-[#D1CDC4] p-4 flex-1">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Completed Tasks</div>
          <div className="text-4xl font-bold mb-1 text-slate-700">{metrics.tasksCompleted < 10 ? `0${metrics.tasksCompleted}` : metrics.tasksCompleted}</div>
          <div className="text-xs text-slate-400 mt-4">Recent activity</div>
        </div>
        <div className="bg-[#C6A15B] text-[#111111] p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold mb-2">Team Capacity</div>
            <div className="text-4xl font-bold mb-1">{metrics.teamSize ?? 0}</div>
            <div className="text-xs font-bold mt-2 text-[#111111]/70">Members joined</div>
          </div>
          {user?.role === 'ADMIN' && (
            <div className="mt-4 border-t border-[#111111]/20 pt-4">
              <Dialog>
                <DialogTrigger render={
                  <button type="button" className="text-xs font-bold uppercase tracking-widest hover:text-[#111111]/70 transition-colors flex items-center gap-2">
                    <Send className="h-3 w-3" />
                    Invite via Email
                  </button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                    sendInviteMutation.mutate(email);
                    form.reset();
                  }} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <input type="email" name="email" required className="w-full border border-input rounded-md px-3 py-2 text-sm" placeholder="colleague@example.com" />
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="bg-[#111111] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#111111]/90">
                        Send Invite
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold tracking-tight">{user?.role === 'ADMIN' ? 'Project Tasks' : 'Your Tasks'}</h2>
        </div>
        
        <div className="border border-[#D1CDC4] bg-slate-50">
          <div className="flex border-b border-[#D1CDC4]">
            {['Ongoing', 'Pending', 'Overdue'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-white border-t-2 border-t-[#C6A15B] text-[#111111]' : 'bg-transparent text-slate-500 hover:text-[#111111]'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white min-h-[200px]">
             <div className="hidden md:grid grid-cols-[24px_1fr_140px_100px_120px] padding-4 bg-slate-50 font-bold text-xs uppercase tracking-wider border-b border-[#D1CDC4] p-3 px-4">
              <div></div>
              <div>Task Description</div>
              <div>Context</div>
              <div>Status</div>
              <div>Due</div>
             </div>
             
             {(() => {
               const tasks = activeTab === 'Ongoing' ? ongoingTasks : activeTab === 'Pending' ? pendingTasks : overdueTasks;
               
               if (tasks.length === 0) {
                 return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">No {activeTab.toLowerCase()} tasks.</div>;
               }
               
               return tasks.map((task: any) => (
                 <div 
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  className="grid grid-cols-[24px_1fr] md:grid-cols-[24px_1fr_140px_100px_120px] gap-y-2 md:gap-y-0 p-3 px-4 border-b border-[#D1CDC4] text-[13px] hover:bg-[#FAF9F6] transition-colors items-center cursor-pointer"
                 >
                  <div className="text-slate-400">
                    {task.status === 'COMPLETED' ? '☑' : '☐'}
                  </div>
                  <div className="font-medium text-foreground truncate pr-4 text-[#111111] hover:text-[#1F4D3A]">
                    {task.title}
                  </div>
                  <div className="text-slate-500 truncate pr-4">
                    {task.project.title}
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
               ));
             })()}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white border border-[#D1CDC4] p-6 text-foreground min-h-[300px]">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Activity Log</div>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-sm text-slate-500 py-4">No recent activity.</div>
            ) : (
              notifications.map((notif: any) => (
                <div key={notif.id} className="text-xs flex justify-between border-b border-[#D1CDC4] pb-3 gap-4">
                  <span className="text-slate-800 font-medium">{notif.message}</span>
                  <span className="text-slate-500 shrink-0 font-medium">{format(new Date(notif.createdAt), 'h:mm a')}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white border border-slate-300 p-6 flex flex-col justify-center items-center">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Upcoming</div>
          <div className="text-center py-4">
            <div className="text-xs text-slate-400">Tasks Due Soon</div>
            <div className="text-6xl font-bold tracking-tighter my-2">
              {metrics.tasksAssigned > 0 ? (metrics.tasksAssigned < 10 ? `0${metrics.tasksAssigned}` : metrics.tasksAssigned) : '--'}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden rounded-none border-[#D1CDC4]">
          {selectedTask && (
            <div className="flex flex-col h-[80vh] max-h-[800px]">
              <div className="p-6 border-b border-[#D1CDC4] bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-[2px] text-[10px] font-bold uppercase border ${selectedTask.priority === 'CRITICAL' || selectedTask.priority === 'HIGH' ? 'border-[#A21F1F] text-[#A21F1F]' : selectedTask.priority === 'MEDIUM' ? 'border-[#C6A15B] text-[#C6A15B]' : 'border-[#1F4D3A] text-[#1F4D3A]'}`}>
                    {selectedTask.priority}
                  </span>
                  <span className={`px-2 py-[2px] text-[10px] font-bold uppercase border ${selectedTask.status === 'COMPLETED' ? 'border-[#1F4D3A] bg-[#1F4D3A] text-white' : 'border-slate-300 text-slate-600'}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
                <DialogTitle className="text-2xl font-bold text-[#111111] mb-2">{selectedTask.title}</DialogTitle>
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
                        <div className="h-8 w-8 shrink-0 bg-[#C6A15B] flex items-center justify-center font-bold text-[#111111] text-xs overflow-hidden">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
