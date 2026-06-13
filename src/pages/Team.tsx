import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { Users, Briefcase, Mail, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function Team() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await apiFetch('/api/team');
      if (!res.ok) throw new Error('Failed to fetch team');
      return res.json();
    },
    refetchInterval: 5000
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading team...</div>;
  }

  const { teamMembers = [], activeTasks = [] } = data || {};

  // Group team members by task. Multiple users with the same task string (e.g. from same project)
  const usersWithTasks = teamMembers.map((user: any) => {
    const userTasks = activeTasks.filter((t: any) => t.assignees?.some((a: any) => a.id === user.id));
    return { ...user, tasks: userTasks };
  });

  const availableUsers = usersWithTasks.filter((u: any) => u.tasks.length === 0);
  const occupiedUsers = usersWithTasks.filter((u: any) => u.tasks.length > 0);

  // Group occupied users by task title and project
  const groups: Record<string, { title: string, project: string, users: any[] }> = {};
  occupiedUsers.forEach((u: any) => {
    u.tasks.forEach((task: any) => {
      const key = `${task.project.title}-${task.title}`;
      if (!groups[key]) {
        groups[key] = { title: task.title, project: task.project.title, users: [] };
      }
      if (!groups[key].users.find((eu: any) => eu.id === u.id)) {
        groups[key].users.push(u);
      }
    });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-[#D1CDC4] pb-6">
        <div className="p-3 bg-[#1F4D3A] text-white">
          <Users className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Team Members</h1>
          <p className="text-slate-500 mt-1">View your team and their current task groupings.</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Task Groups */}
        {Object.values(groups).map((group: any, idx) => (
          <div key={idx} className="bg-white border border-[#D1CDC4] overflow-hidden">
            <div className="p-4 border-b border-[#D1CDC4] bg-slate-50">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#1F4D3A]">{group.project}</h2>
              <h3 className="text-lg font-semibold mt-1">Working on: {group.title}</h3>
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {group.users.map((member: any) => (
                <UserCard 
                  key={member.id} 
                  member={member} 
                  currentUser={user} 
                  onDelete={() => deleteUserMutation.mutate(member.id)} 
                  isDeleting={deleteUserMutation.isPending} 
                />
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groups).length === 0 && occupiedUsers.length > 0 && (
            <div className="p-6 border border-[#D1CDC4] bg-slate-50 text-center text-slate-500">
                No active grouped tasks.
            </div>
        )}

        {/* Available Team */}
        <div className="bg-white border border-[#D1CDC4] overflow-hidden mt-6">
          <div className="p-4 border-b border-[#D1CDC4] bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600">Available / Idle</h2>
            <span className="bg-green-100 text-green-700 font-bold px-2 py-1 text-xs">{availableUsers.length}</span>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableUsers.length > 0 ? (
              availableUsers.map((member: any) => (
                <UserCard 
                  key={member.id} 
                  member={member} 
                  currentUser={user} 
                  onDelete={() => deleteUserMutation.mutate(member.id)} 
                  isDeleting={deleteUserMutation.isPending} 
                />
              ))
            ) : (
              <div className="col-span-full text-center text-slate-500 py-4 text-sm font-medium">
                No available team members right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserCard({ member, currentUser, onDelete, isDeleting }: { member: any, currentUser: any, onDelete: () => void, isDeleting: boolean }) {
  const canDelete = currentUser?.role === 'ADMIN' && member.role !== 'ADMIN' && member.id !== currentUser.userId;

  return (
    <div className="flex items-start gap-4 p-4 border border-[#D1CDC4] hover:bg-slate-50 transition-colors relative group">
      <div className="h-12 w-12 shrink-0 bg-[#C6A15B] flex items-center justify-center font-bold text-[#111111] text-lg overflow-hidden">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-[15px]">{member.name}</h3>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{member.role}</p>
        <div className="flex items-center gap-2 mt-3 text-slate-600">
          <Mail className="h-3.5 w-3.5" />
          <span className="text-[11px] truncate w-32" title={member.email}>{member.email}</span>
        </div>
      </div>
      {canDelete && (
        <button 
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A21F1F] hover:bg-[#A21F1F]/10 p-2 border border-transparent hover:border-[#A21F1F]" 
          title="Remove member"
          disabled={isDeleting}
          onClick={() => {
            if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
              onDelete();
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
