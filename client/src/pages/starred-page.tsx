import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { FileWithPath, FolderWithStats } from "@shared/schema";
import { FileCard } from "@/components/ui/file-card";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useLocation } from "wouter";
import { ShareModal } from "@/components/layout/share-modal";
import { PreviewModal } from "@/components/layout/preview-modal";
import { UploadModal } from "@/components/layout/upload-modal";
import { formatFileSize } from "@/lib/utils";

export default function StarredPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareItemId, setShareItemId] = useState<number | undefined>();
  const [shareItemName, setShareItemName] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState<string>("starred");

  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<FolderWithStats[]>({
    queryKey: ["/api/folders"],
    enabled: !!user,
  });

  const { data: starredFiles = [], isLoading: isFilesLoading } = useQuery<FileWithPath[]>({
    queryKey: ["/api/files", { view: "starred" }],
    enabled: !!user,
  });
  
  const { data: starredFolders = [], isLoading: isStarredFoldersLoading } = useQuery<FolderWithStats[]>({
    queryKey: ["/api/folders", { view: "starred" }],
    enabled: !!user,
  });

  const handleOpenFile = (file: FileWithPath) => {
    setSelectedFile(file as any);
    setIsPreviewModalOpen(true);
  };

  const handleShareFile = (file: FileWithPath) => {
    setShareItemId(file.id);
    setShareItemName(file.name);
    setIsShareModalOpen(true);
  };

  const handleFolderSelect = (folderId: number | null) => {
    setCurrentFolder(folderId);
    navigate("/");
  };

  const handlePageNavigation = (page: string) => {
    if (page === "home") {
      navigate("/");
    } else if (page === "recent") {
      navigate("/recent");
    } else if (page === "starred") {
      navigate("/starred");
    } else if (page === "shared") {
      navigate("/shared");
    } else if (page === "trash") {
      navigate("/trash");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentFolder={currentFolder}
        onUploadClick={() => setIsUploadModalOpen(true)}
        onFolderSelect={handleFolderSelect}
        currentPage={currentPage}
        onNavigate={handlePageNavigation}
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary-900">Starred Files</h1>
          <p className="text-secondary-500">Files you've marked as important</p>
        </div>

        {isFilesLoading || isStarredFoldersLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (starredFiles.length > 0 || starredFolders.length > 0) ? (
          <div>
            {starredFolders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-primary-800">Starred Folders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {starredFolders.map((folder) => (
                    <div 
                      key={folder.id}
                      className="p-4 bg-card rounded-lg border border-border hover:border-primary-300 transition-colors shadow-sm cursor-pointer"
                      onClick={() => handleFolderSelect(folder.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-primary-900 mb-1 line-clamp-1">{folder.name}</h3>
                            <p className="text-xs text-muted-foreground">{folder.fileCount} files, {formatFileSize(folder.totalSize)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {starredFiles.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-primary-800">Starred Files</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {starredFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onPreview={() => handleOpenFile(file)}
                      onShare={() => handleShareFile(file)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary-50 rounded-lg border border-secondary-100">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No starred items</h3>
            <p className="text-secondary-500 mb-4">
              You haven't starred any files or folders yet. Star items to find them quickly later.
            </p>
            <button 
              className="text-primary-600 hover:text-primary-700 font-medium"
              onClick={() => navigate("/")}
            >
              Go to home
            </button>
          </div>
        )}
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folders={folders}
        currentFolderId={currentFolder}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        file={selectedFile as any}
        onShare={(file) => {
          setIsPreviewModalOpen(false);
          setShareItemId((file as any).id);
          setShareItemName((file as any).name);
          setIsShareModalOpen(true);
        }}
        files={starredFiles as any[]}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileId={shareItemId}
        itemName={shareItemName}
      />
    </div>
  );
}