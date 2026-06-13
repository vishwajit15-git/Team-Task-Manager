import { apiFetch } from '@/lib/api';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { FileText, Image as ImageIcon, Video, Upload, Download, Folder, Plus, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function Files() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{id: string, name: string}[]>([]);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allFiles = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const res = await apiFetch('/api/files');
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (data: { name: string; url?: string; type: string; size: number; parentId: string | null }) => {
      const res = await apiFetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setIsUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      let type = 'FILE';
      if (file.type.startsWith('image/')) type = 'IMAGE';
      else if (file.type.startsWith('video/')) type = 'VIDEO';
      
      uploadFileMutation.mutate({
        name: file.name,
        url,
        type,
        size: file.size,
        parentId: currentFolderId
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    uploadFileMutation.mutate({
      name: newFolderName.trim(),
      type: 'FOLDER',
      size: 0,
      parentId: currentFolderId
    });
    setNewFolderName('');
    setIsNewFolderDialogOpen(false);
  };

  const currentLevelFiles = allFiles.filter((f: any) => f.parentId === currentFolderId);
  const folders = currentLevelFiles.filter((f: any) => f.type === 'FOLDER').sort((a: any, b: any) => a.name.localeCompare(b.name));
  const files = currentLevelFiles.filter((f: any) => f.type !== 'FOLDER').sort((a: any, b: any) => a.name.localeCompare(b.name));
  const combined = [...folders, ...files];

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'FOLDER': return <Folder className="h-6 w-6 text-[#1F4D3A]" />;
      case 'IMAGE': return <ImageIcon className="h-6 w-6 text-[#1F4D3A]" />;
      case 'VIDEO': return <Video className="h-6 w-6 text-[#1F4D3A]" />;
      default: return <FileText className="h-6 w-6 text-[#1F4D3A]" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    setCurrentFolderId(folderId);
  };

  const navigateUp = (index: number) => {
    if (index === -1) {
      setFolderPath([]);
      setCurrentFolderId(null);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1].id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D1CDC4] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] flex items-center gap-3">
            <FileText className="h-8 w-8 text-[#1F4D3A]" />
            Files Repository
          </h1>
          <div className="flex items-center text-sm font-bold uppercase tracking-widest text-slate-500 mt-3 flex-wrap">
            <button onClick={() => navigateUp(-1)} className="hover:text-[#111111] transition-colors">Root</button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-2 text-[#D1CDC4]" />
                <button 
                  onClick={() => navigateUp(index)} 
                  className={index === folderPath.length - 1 ? 'text-[#111111]' : 'hover:text-[#111111] transition-colors'}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
            <DialogTrigger render={<Button className="shrink-0 bg-white hover:bg-slate-50 text-[#111111] font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none border border-[#111111]" />}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFolder} className="space-y-4 pt-4">
                <Input 
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
                <Button type="submit" disabled={!newFolderName.trim()}>Create</Button>
              </form>
            </DialogContent>
          </Dialog>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shrink-0 bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#111111] font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none border border-[#C6A15B]"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading files...</div>
      ) : combined.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#D1CDC4] bg-white">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold">No files here</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">Upload a file or create a folder to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {combined.map((file: any) => (
            <div 
              key={file.id} 
              className={`bg-white border border-[#D1CDC4] h-full flex flex-col hover:bg-[#FAF9F6] transition-colors relative group ${file.type === 'FOLDER' ? 'cursor-pointer' : ''}`}
              onClick={() => file.type === 'FOLDER' ? navigateToFolder(file.id, file.name) : undefined}
            >
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 border border-[#D1CDC4]">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111111] truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {file.type === 'FOLDER' ? 'Folder' : `${formatSize(file.size)} • ${file.type}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-auto px-6 py-4 border-t border-[#D1CDC4] bg-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-slate-200 flex items-center justify-center text-[#111111] font-bold">
                    {file.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[80px]" title={file.user.name}>{file.user.name}</span>
                </div>
                <span>
                  {format(new Date(file.createdAt), 'MMM d, yyyy')}
                </span>
                
                {file.type !== 'FOLDER' && file.url && (
                  <a 
                    href={file.url} 
                    download={file.name}
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-4 right-4 bg-[#C6A15B] text-[#111111] p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:brightness-110"
                    title="Download File"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
