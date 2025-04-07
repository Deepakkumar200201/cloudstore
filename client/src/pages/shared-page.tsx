import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { FileWithPath, FolderWithStats, ShareWithDetails } from "@shared/schema";
import { FileCard } from "@/components/ui/file-card";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useLocation } from "wouter";
import { ShareModal } from "@/components/layout/share-modal";
import { PreviewModal } from "@/components/layout/preview-modal";
import { UploadModal } from "@/components/layout/upload-modal";
import { FolderCard } from "@/components/ui/folder-card";

export default function SharedPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareItemId, setShareItemId] = useState<number | undefined>();
  const [shareItemName, setShareItemName] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState<string>("shared");

  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<FolderWithStats[]>({
    queryKey: ["/api/folders"],
    enabled: !!user,
  });

  const { data: shares = [], isLoading: isSharesLoading } = useQuery<ShareWithDetails[]>({
    queryKey: ["/api/shares"],
    enabled: !!user,
  });
  
  const { data: sharedFiles = [], isLoading: isSharedFilesLoading } = useQuery<FileWithPath[]>({
    queryKey: ["/api/files", { view: "shared" }],
    enabled: !!user,
  });
  
  const { data: sharedFolders = [], isLoading: isSharedFoldersLoading } = useQuery<FolderWithStats[]>({
    queryKey: ["/api/folders", { view: "shared" }],
    enabled: !!user,
  });
  
  // Combine loading states
  const isLoading = isSharesLoading || isSharedFilesLoading || isSharedFoldersLoading;

  const handleOpenFile = (file: FileWithPath) => {
    setSelectedFile(file);
    setIsPreviewModalOpen(true);
  };

  const handleShareFile = (file: FileWithPath) => {
    setShareItemId(file.id);
    setShareItemName(file.name);
    setIsShareModalOpen(true);
  };

  const handleOpenFolder = (folder: FolderWithStats) => {
    setCurrentFolder(folder.id);
    navigate("/");
  };

  const handleShareFolder = (folder: FolderWithStats) => {
    setShareItemId(folder.id);
    setShareItemName(folder.name);
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
          <h1 className="text-2xl font-bold text-primary-900">Shared with Me</h1>
          <p className="text-secondary-500">Files and folders others have shared with you</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (sharedFiles.length > 0 || sharedFolders.length > 0) ? (
          <>
            {sharedFolders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Folders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sharedFolders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onOpen={() => handleOpenFolder(folder)}
                      onShare={() => handleShareFolder(folder)}
                    />
                  ))}
                </div>
              </div>
            )}

            {sharedFiles.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Files</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sharedFiles.map((file) => (
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
          </>
        ) : (
          <div className="text-center py-12 bg-secondary-50 rounded-lg border border-secondary-100">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No shared items</h3>
            <p className="text-secondary-500 mb-4">
              Nobody has shared any files or folders with you yet.
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
        files={sharedFiles as any[]}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileId={shareItemId}
        folderId={shareItemId}
        itemName={shareItemName}
      />
    </div>
  );
}