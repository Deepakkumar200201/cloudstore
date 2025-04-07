import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { FileWithPath, FolderWithStats, File } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FileCard } from "@/components/ui/file-card";
import { FolderCard } from "@/components/ui/folder-card";
import { FileUploadArea } from "@/components/ui/file-upload-area";
import { UploadModal } from "@/components/layout/upload-modal";
import { PreviewModal } from "@/components/layout/preview-modal";
import { ShareModal } from "@/components/layout/share-modal";
import { Button } from "@/components/ui/button";
import { Loader2, Grid, List, ChevronDown, FolderPlus } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSort] = useState<string>("name");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  
  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderWithStats | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // Fetch folders
  const { 
    data: folders = [], 
    isLoading: isFoldersLoading 
  } = useQuery<FolderWithStats[]>({
    queryKey: ["/api/folders"],
    enabled: !!user,
  });
  
  // Fetch files for the current folder
  const { 
    data: files = [],
    isLoading: isFilesLoading,
  } = useQuery<FileWithPath[]>({
    queryKey: ["/api/files", currentFolder !== undefined ? { folderId: currentFolder } : {}],
    enabled: !!user,
  });
  
  // Filter folders for the current view
  const currentFolders = folders.filter(folder => 
    currentFolder === null ? folder.parentId === null : folder.parentId === currentFolder
  );
  
  // Get current folder name
  const currentFolderName = currentFolder !== null 
    ? folders.find(f => f.id === currentFolder)?.name || "Folder" 
    : "My Files";
  
  // Sort files based on sort selection
  const sortedFiles = [...files].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "date":
        return (b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0) - 
               (a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0);
      case "size":
        return b.size - a.size;
      case "type":
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });
  
  const handleOpenFile = (file: FileWithPath) => {
    setSelectedFile(file);
    setIsPreviewModalOpen(true);
  };
  
  const handleOpenFolder = (folder: FolderWithStats) => {
    setCurrentFolder(folder.id);
  };
  
  const handleShareFile = (file: FileWithPath) => {
    setSelectedFile(file);
    setIsShareModalOpen(true);
  };
  
  const handleShareFolder = (folder: FolderWithStats) => {
    setSelectedFolder(folder);
    setIsShareModalOpen(true);
  };
  
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingFolder(true);
    
    try {
      const response = await apiRequest("POST", "/api/folders", {
        name: newFolderName,
        parentId: currentFolder
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create folder");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      
      toast({
        title: "Success",
        description: `Folder "${newFolderName}" has been created.`
      });
    } catch (error) {
      console.error("Error creating folder:", error);
      
      let errorMessage = "Failed to create folder.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header onMenuToggle={toggleSidebar} />
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar 
          currentFolder={currentFolder} 
          onUploadClick={() => setIsUploadModalOpen(true)}
          onFolderSelect={setCurrentFolder}
        />
        
        {/* Mobile sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={toggleSidebar}></div>
            <div className="absolute left-0 top-0 h-full w-64 bg-background border-r border-border overflow-y-auto">
              <Sidebar
                currentFolder={currentFolder} 
                onUploadClick={() => {
                  setIsUploadModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                onFolderSelect={(folderId) => {
                  setCurrentFolder(folderId);
                  setIsSidebarOpen(false);
                }}
              />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <main className="flex-1 overflow-auto h-[calc(100vh-4rem)] bg-background">
          <div className="p-6">
            {/* Header section */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-foreground">{currentFolderName}</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={viewMode === "grid" ? "bg-accent text-accent-foreground" : ""}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={viewMode === "list" ? "bg-accent text-accent-foreground" : ""}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <DropdownMenu open={isSortMenuOpen} onOpenChange={setIsSortMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <span>Sort by</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSort("name")}>
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("date")}>
                      Date modified
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("size")}>
                      Size
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("type")}>
                      Type
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Upload area */}
            <div className="mb-8">
              <FileUploadArea folderId={currentFolder} />
            </div>
            
            {/* Folder section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Folders</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsCreateFolderModalOpen(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>New Folder</span>
                </Button>
              </div>
              
              {isFoldersLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : currentFolders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {currentFolders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onOpen={handleOpenFolder}
                      onShare={handleShareFolder}
                    />
                  ))}
                  
                  {/* Create folder card */}
                  <div 
                    className="bg-card rounded-lg shadow-sm border border-dashed border-border hover:border-primary transition cursor-pointer flex items-center justify-center p-4 h-[115px]"
                    onClick={() => setIsCreateFolderModalOpen(true)}
                  >
                    <div className="text-center">
                      <i className="fa-solid fa-folder-plus text-3xl text-muted-foreground mb-2"></i>
                      <h3 className="font-medium text-foreground">Create Folder</h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-dashed border-border p-6 text-center">
                  <i className="fa-solid fa-folder-open text-4xl text-muted-foreground mb-3"></i>
                  <h3 className="font-medium text-foreground mb-2">No folders yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Create your first folder to organize your files</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateFolderModalOpen(true)}
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Create Folder
                  </Button>
                </div>
              )}
            </div>
            
            {/* Files section */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Files</h2>
              
              {isFilesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onPreview={handleOpenFile}
                      onShare={handleShareFile}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-dashed border-border p-6 text-center">
                  <i className="fa-solid fa-cloud-arrow-up text-4xl text-muted-foreground mb-3"></i>
                  <h3 className="font-medium text-foreground mb-2">No files yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Upload your first file to get started</p>
                  <Button onClick={() => setIsUploadModalOpen(true)}>
                    Upload Files
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folders={folders}
        currentFolderId={currentFolder}
      />
      
      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        file={selectedFile as any}
        onShare={(file) => handleShareFile(file as FileWithPath)}
        files={files as any[]}
      />
      
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileId={selectedFile?.id}
        folderId={selectedFolder?.id}
        itemName={selectedFile?.name || selectedFolder?.name || ""}
      />
      
      {/* Create Folder Modal */}
      <Dialog open={isCreateFolderModalOpen} onOpenChange={setIsCreateFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateFolderModalOpen(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={isCreatingFolder || !newFolderName.trim()}
            >
              {isCreatingFolder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
