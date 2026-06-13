import { apiFetch } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { Send, Image as ImageIcon, Paperclip, Video, FileText, Reply, X, Smile } from 'lucide-react';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

export function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<{ url: string; type: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await apiFetch('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 3000 // Poll every 3 seconds for simple realtime
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; attachmentUrl?: string; attachmentType?: string; replyToId?: string }) => {
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      const previousMessages = queryClient.getQueryData(['messages']);
      
      const tempMessage = {
        id: Date.now().toString(),
        content: newMsg.content,
        attachmentUrl: newMsg.attachmentUrl,
        attachmentType: newMsg.attachmentType,
        createdAt: new Date().toISOString(),
        userId: user?.id,
        user: {
          id: user?.id,
          name: user?.name
        },
        replyTo: replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          user: replyingTo.user
        } : null,
      };

      queryClient.setQueryData(['messages'], (old: any) => [...(old || []), tempMessage]);

      setContent('');
      setAttachment(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);

      return { previousMessages };
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages'], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachment) return;
    sendMessageMutation.mutate({
      content: content.trim(),
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
      replyToId: replyingTo?.id
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      let type = 'FILE';
      if (file.type.startsWith('image/')) type = 'IMAGE';
      else if (file.type.startsWith('video/')) type = 'VIDEO';
      
      setAttachment({ url, type });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const renderAttachment = (url: string, type: string) => {
    if (type === 'IMAGE') {
      return <img src={url} alt="attachment" className="max-w-xs md:max-w-md rounded mt-2 border border-[#D1CDC4]" />;
    } else if (type === 'VIDEO') {
      return <video src={url} controls className="max-w-xs md:max-w-md rounded mt-2 border border-[#D1CDC4]" />;
    } else {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 p-3 bg-white border border-[#D1CDC4] text-[13px] font-bold text-[#C6A15B] hover:bg-[#FAF9F6] transition-colors">
          <FileText className="h-4 w-4" />
          View File Attachment
        </a>
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 animate-in fade-in duration-300 relative">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {isLoading ? (
          <div className="text-center text-slate-500 py-10 font-bold uppercase tracking-widest text-xs">Loading messages...</div>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.userId === user?.id;
            return (
              <div key={msg.id} className={`flex gap-4 group ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="h-10 w-10 shrink-0 bg-[#C6A15B] flex items-center justify-center font-bold text-[#111111] text-sm mt-1 overflow-hidden">
                  {msg.user.name.charAt(0).toUpperCase()}
                </div>
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-[13px] text-[#111111]">
                      {isMe ? 'You' : msg.user.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
                  </div>
                  
                  {msg.replyTo && (
                    <div className={`mb-1 px-3 py-2 text-[11px] border-l-2 ${isMe ? 'bg-[#111111]/5 border-[#111111]/20 text-slate-600' : 'bg-black/5 border-[#C6A15B] text-slate-600'}`}>
                      <div className="font-bold mb-0.5">{msg.replyTo.user.name}</div>
                      {msg.replyTo.content || 'Attachment'}
                    </div>
                  )}

                  {msg.content && (
                    <div className={`p-4 text-[13px] ${isMe ? 'bg-[#f0ece1] text-[#111111] border border-[#D1CDC4]' : 'bg-white border border-[#D1CDC4] text-[#111111]'}`}>
                      {msg.content}
                    </div>
                  )}
                  
                  {msg.attachmentUrl && msg.attachmentType && renderAttachment(msg.attachmentUrl, msg.attachmentType)}
                  
                  <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <button onClick={() => setReplyingTo(msg)} className="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B] hover:text-[#111111] flex items-center gap-1">
                      <Reply className="h-3 w-3" />
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-[#D1CDC4]">
        {replyingTo && (
          <div className="mb-3 p-3 bg-slate-50 border border-[#C6A15B]/40 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B] mb-1">Replying to {replyingTo.user.name}</span>
              <span className="text-[13px] text-slate-700 line-clamp-1">{replyingTo.content || 'Attachment'}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setReplyingTo(null)}
              className="text-[#A21F1F] p-1.5 hover:bg-slate-200 transition-colors rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {attachment && (
          <div className="mb-3 p-3 bg-slate-50 border border-[#D1CDC4] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600">
              {attachment.type === 'IMAGE' && <ImageIcon className="h-4 w-4" />}
              {attachment.type === 'VIDEO' && <Video className="h-4 w-4" />}
              {attachment.type === 'FILE' && <FileText className="h-4 w-4" />}
              Attached {attachment.type.toLowerCase()}
            </div>
            <button 
              type="button" 
              onClick={() => setAttachment(null)}
              className="text-[#A21F1F] text-[10px] uppercase font-bold tracking-widest hover:underline"
            >
              Remove
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white border border-[#D1CDC4] text-slate-500 hover:text-[#111111] hover:bg-slate-50 transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white border border-[#D1CDC4] text-slate-500 hover:text-[#111111] hover:bg-slate-50 transition-colors"
              title="Add Emoji/Sticker"
            >
              <Smile className="h-5 w-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-14 left-0 z-50 shadow-2xl">
                <EmojiPicker 
                  onEmojiClick={(emojiObject) => {
                    setContent(prev => prev + emojiObject.emoji);
                    setShowEmojiPicker(false);
                  }} 
                />
              </div>
            )}
          </div>

          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-[#D1CDC4] px-4 text-[13px] outline-none focus:border-[#C6A15B] transition-colors"
          />
          <button
            type="submit"
            disabled={(!content.trim() && !attachment) || sendMessageMutation.isPending}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#C6A15B] text-[#111111] hover:bg-[#C6A15B]/90 disabled:opacity-50 transition-colors border border-[#C6A15B]"
          >
            <Send className="h-5 w-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
