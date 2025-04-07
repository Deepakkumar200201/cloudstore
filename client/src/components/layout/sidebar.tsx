import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Home, Clock, Star, ShareIcon, Trash } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { FolderWithStats } from "@shared/schema";

interface SidebarProps {
  currentFolder: number | null;
  onUploadClick: () => void;
  onFolderSelect: (folderId: number | null) => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function Sidebar({ 
  currentFolder, 
  onUploadClick, 
  onFolderSelect, 
  currentPage = 'home',
  onNavigate 
}: SidebarProps) {
  const { user } = useAuth();
  
  const { data: storageInfo, isLoading: isStorageLoading } = useQuery<{
    storageUsed: number;
    storageLimit: number;
    storagePercentage: number;
  }>({
    queryKey: ["/api/user/storage"],
    enabled: !!user,
  });
  
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<FolderWithStats[]>({
    queryKey: ["/api/folders"],
    enabled: !!user,
  });
  
  return (
    <aside className="hidden md:block w-64 bg-white border-r border-secondary-200 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-4">
        <Button onClick={onUploadClick} className="w-full flex items-center justify-center gap-2">
          <Upload className="h-4 w-4" />
          <span>Upload Files</span>
        </Button>
      </div>
      <nav className="mt-2">
        <div className="px-3 mb-2">
          <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Main</h3>
        </div>
        <div 
          onClick={() => {
            onFolderSelect(null);
            if (onNavigate) onNavigate('home');
          }}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer
            ${currentPage === 'home' ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-500' : 'text-secondary-700 hover:bg-secondary-50'}`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </div>
        <div 
          onClick={() => {
            if (onNavigate) onNavigate('recent');
          }}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer
            ${currentPage === 'recent' ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-500' : 'text-secondary-700 hover:bg-secondary-50'}`}
        >
          <Clock className="w-5 h-5" />
          <span>Recent</span>
        </div>
        <div 
          onClick={() => {
            if (onNavigate) onNavigate('starred');
          }}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer
            ${currentPage === 'starred' ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-500' : 'text-secondary-700 hover:bg-secondary-50'}`}
        >
          <Star className="w-5 h-5" />
          <span>Starred</span>
        </div>
        <div 
          onClick={() => {
            if (onNavigate) onNavigate('shared');
          }}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer
            ${currentPage === 'shared' ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-500' : 'text-secondary-700 hover:bg-secondary-50'}`}
        >
          <ShareIcon className="w-5 h-5" />
          <span>Shared</span>
        </div>
        <div 
          onClick={() => {
            if (onNavigate) onNavigate('trash');
          }}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer
            ${currentPage === 'trash' ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-500' : 'text-secondary-700 hover:bg-secondary-50'}`}
        >
          <Trash className="w-5 h-5" />
          <span>Trash</span>
        </div>

        <div className="px-3 my-2">
          <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">My Folders</h3>
        </div>
        
        {isFoldersLoading ? (
          <div className="px-3 py-4 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-secondary-400 mx-auto" />
          </div>
        ) : folders.length > 0 ? (
          folders.map((folder: FolderWithStats) => (
            <div 
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer
                ${currentFolder === folder.id ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-500' : 'text-secondary-700 hover:bg-secondary-50'}`}
            >
              <i className="fa-solid fa-folder text-amber-400 w-5 text-center"></i>
              <span className="truncate">{folder.name}</span>
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-secondary-500 text-sm">No folders yet</div>
        )}

        <div className="px-3 mt-6 mb-2">
          <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Storage</h3>
        </div>
        <div className="px-3 py-2">
          {isStorageLoading ? (
            <div className="text-center">
              <Loader2 className="h-5 w-5 animate-spin text-secondary-400 mx-auto" />
            </div>
          ) : storageInfo ? (
            <>
              <div className="mb-1 flex justify-between text-sm">
                <span>{formatFileSize(storageInfo.storageUsed)} used</span>
                <span>of {formatFileSize(storageInfo.storageLimit)}</span>
              </div>
              <Progress value={storageInfo.storagePercentage} className="h-2" />
              <button className="mt-3 text-sm text-primary-600 hover:text-primary-700">
                Upgrade Storage
              </button>
            </>
          ) : (
            <div className="text-secondary-500 text-sm">Storage information unavailable</div>
          )}
        </div>
      </nav>
    </aside>
  );
}
