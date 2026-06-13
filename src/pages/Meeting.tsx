import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { format } from 'date-fns';
import { Video, Plus, Phone, Calendar } from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function Meeting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const res = await apiFetch('/api/meetings');
      if (!res.ok) throw new Error('Failed to fetch meetings');
      return res.json();
    },
    refetchInterval: 5000
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiFetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create meeting');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setIsDialogOpen(false);
      setTitle('');
      setDescription('');
      setScheduledAt('');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await apiFetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update meeting');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    }
  });

  if (activeRoom) {
    return (
      <div className="h-full w-full relative">
        <button 
          onClick={() => setActiveRoom(null)}
          className="absolute top-4 left-4 z-50 bg-[#111111] text-white px-4 py-2 text-sm font-bold shadow-lg flex items-center"
        >
          Leave Meeting
        </button>
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={activeRoom}
          configOverwrite={{
            startWithAudioMuted: true,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
          }}
          userInfo={{
            displayName: user?.name,
            email: user?.email,
          }}
          onApiReady={(externalApi) => {
            // attach custom event listeners to the Jitsi Meet External API if needed
          }}
          getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; iframeRef.style.width = '100%'; }}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Online Meetings</h1>
          <p className="text-slate-500 mt-1">Join scheduled team meetings</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button className="bg-[#111111] hover:bg-[#222222] text-white rounded-none">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a Meeting</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({ title, description, scheduledAt });
              }} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Meeting Title</Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" required value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="w-full bg-[#111111] text-white hover:bg-[#222222] transition-colors rounded-none">
                  Schedule
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6A15B]"></div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border border-[#D1CDC4]">
          <Video className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#111111]">No meetings scheduled</h3>
          <p className="text-slate-500 mt-1">There are no upcoming or active meetings.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((m: any) => (
            <div key={m.id} className="border border-[#D1CDC4] bg-white p-6 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 shrink-0 bg-[#C6A15B] flex items-center justify-center font-bold text-[#111111] text-sm overflow-hidden rounded-full">
                  {m.creator?.avatar ? (
                    <img src={m.creator.avatar} alt={m.creator.name} className="w-full h-full object-cover" />
                  ) : (
                    m.creator?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                  m.status === 'LIVE' ? 'bg-[#1F4D3A] text-white' :
                  m.status === 'SCHEDULED' ? 'bg-slate-100 text-slate-700' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {m.status}
                </span>
              </div>
              <h3 className="font-bold text-lg text-[#111111] mb-1 truncate" title={m.title}>{m.title}</h3>
              {m.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{m.description}</p>}
              
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{format(new Date(m.scheduledAt), 'MMM d, yyyy h:mm a')}</span>
              </div>

              {user?.role === 'ADMIN' ? (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (m.status !== 'LIVE') updateStatusMutation.mutate({ id: m.id, status: 'LIVE' });
                      setActiveRoom(m.roomId);
                    }}
                    className="flex-1 bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#111111] rounded-none font-bold"
                  >
                    <Phone className="h-4 w-4 mr-2" fill="currentColor" />
                    Call
                  </Button>
                  {m.status !== 'ENDED' && (
                    <Button 
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: m.id, status: 'ENDED' })}
                      className="rounded-none border-0 bg-slate-100 text-slate-600 hover:bg-[#A21F1F] hover:text-white"
                    >
                      End
                    </Button>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={() => setActiveRoom(m.roomId)}
                  disabled={m.status !== 'LIVE'}
                  className="w-full bg-[#111111] hover:bg-[#222222] text-white rounded-none disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100 font-bold"
                >
                  <Video className="h-4 w-4 mr-2" />
                  {m.status === 'LIVE' ? 'Join Now' : m.status === 'ENDED' ? 'Ended' : 'Waiting for Admin...'}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
