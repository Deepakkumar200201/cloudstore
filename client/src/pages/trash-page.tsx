import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { FileWithPath, FolderWithStats } from "@shared/schema";
import { FileCard } from "@/components/ui/file-card";
import { FolderCard } from "@/components/ui/folder-card";
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PreviewModal } from "@/components/layout/preview-modal";
import { UploadModal } from "@/components/layout/upload-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function TrashPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [fileToRestore, setFileToRestore] = useState<FileWithPath | null>(null);
  const [folderToRestore, setFolderToRestore] = useState<FolderWithStats | null>(null);
  const [currentPage, setCurrentPage] = useState<string>("trash");

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<FolderWithStats[]>({
    queryKey: ["/api/folders"],
    enabled: !!user,
  });

  const { data: trashedFiles = [], isLoading: isFilesLoading } = useQuery<FileWithPath[]>({
    queryKey: ["/api/files", { view: "trash" }],
    enabled: !!user,
  });
  
  const { data: trashedFolders = [], isLoading: isTrashedFoldersLoading } = useQuery<FolderWithStats[]>({
    queryKey: ["/api/folders", { view: "trash" }],
    enabled: !!user,
  });
  
  const isLoading = isFilesLoading || isTrashedFoldersLoading;

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/files/trash/empty");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files", { view: "trash" }] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders", { view: "trash" }] });
      toast({
        title: "Trash emptied",
        description: "All items in trash have been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to empty trash",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("POST", `/api/files/${fileId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files", { view: "trash" }] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File restored",
        description: "File has been moved out of trash.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to restore file",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const restoreFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      await apiRequest("POST", `/api/folders/${folderId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders", { view: "trash" }] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Folder restored",
        description: "Folder has been moved out of trash.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to restore folder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEmptyTrash = () => {
    setIsEmptyTrashDialogOpen(false);
    emptyTrashMutation.mutate();
  };

  const handleRestoreFile = () => {
    setIsRestoreDialogOpen(false);
    if (fileToRestore) {
      restoreFileMutation.mutate(fileToRestore.id);
      setFileToRestore(null);
    } else if (folderToRestore) {
      restoreFolderMutation.mutate(folderToRestore.id);
      setFolderToRestore(null);
    }
  };
  
  const handleOpenFolder = (folder: FolderWithStats) => {
    setCurrentFolder(folder.id);
    navigate("/");
  };

  const handleOpenFile = (file: FileWithPath) => {
    setSelectedFile(file);
    setIsPreviewModalOpen(true);
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Trash</h1>
            <p className="text-secondary-500">Items in trash will be permanently deleted after 30 days</p>
          </div>
          {(trashedFiles.length > 0 || trashedFolders.length > 0) && (
            <Button 
              variant="destructive" 
              onClick={() => setIsEmptyTrashDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Empty trash
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (trashedFiles.length > 0 || trashedFolders.length > 0) ? (
          <>
            {trashedFolders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Folders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {trashedFolders.map((folder) => (
                    <div key={folder.id} className="relative group">
                      <FolderCard
                        folder={folder}
                        onOpen={() => {}} 
                        onShare={() => {}}
                      />
                      <button 
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFolderToRestore(folder);
                          setIsRestoreDialogOpen(true);
                        }}
                        title="Restore folder"
                      >
                        <RefreshCw className="h-4 w-4 text-primary-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {trashedFiles.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Files</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {trashedFiles.map((file) => (
                    <div key={file.id} className="relative group">
                      <FileCard
                        file={file}
                        onPreview={() => handleOpenFile(file)}
                        onShare={() => {}}
                      />
                      <button 
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFileToRestore(file);
                          setIsRestoreDialogOpen(true);
                        }}
                        title="Restore file"
                      >
                        <RefreshCw className="h-4 w-4 text-primary-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-secondary-50 rounded-lg border border-secondary-100">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Trash is empty</h3>
            <p className="text-secondary-500 mb-4">
              There are no items in your trash.
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
        onShare={() => {}}
        files={trashedFiles as any[]}
      />

      <AlertDialog open={isEmptyTrashDialogOpen} onOpenChange={setIsEmptyTrashDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All items in the trash will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground">
              Empty trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fileToRestore ? "Restore file?" : "Restore folder?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This {fileToRestore ? "file" : "folder"} will be restored to its original location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreFile}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}