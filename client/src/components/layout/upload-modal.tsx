import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Loader2, Upload, X, Pause } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatFileSize } from "@/lib/utils";

interface UploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'complete' | 'error';
  error?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: any[];
  currentFolderId: number | null;
}

export function UploadModal({ isOpen, onClose, folders, currentFolderId }: UploadModalProps) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    currentFolderId === null ? 'root' : currentFolderId.toString()
  );
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const handleFileDrop = (file: File) => {
    setUploadItems(prev => [
      ...prev,
      { file, progress: 0, status: 'pending' }
    ]);
  };
  
  const removeFile = (index: number) => {
    setUploadItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadFiles = async () => {
    if (uploadItems.length === 0) return;
    
    setIsUploading(true);
    
    try {
      for (let i = 0; i < uploadItems.length; i++) {
        if (uploadItems[i].status === 'complete') continue;
        
        // Update status to uploading
        setUploadItems(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploading', progress: 0 };
          return updated;
        });
        
        const formData = new FormData();
        formData.append('file', uploadItems[i].file);
        formData.append('folderId', selectedFolderId === 'root' ? '' : selectedFolderId);
        
        try {
          const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload file');
          }
          
          // Update status to complete
          setUploadItems(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: 'complete', progress: 100 };
            return updated;
          });
        } catch (error) {
          // Update status to error
          setUploadItems(prev => {
            const updated = [...prev];
            updated[i] = { 
              ...updated[i], 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
            return updated;
          });
        }
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
      
      const completedCount = uploadItems.filter(item => item.status === 'complete').length;
      
      if (completedCount > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${completedCount} file${completedCount > 1 ? 's' : ''}.`
        });
        
        // Close modal if all files uploaded successfully
        if (completedCount === uploadItems.length) {
          setTimeout(() => {
            onClose();
            setUploadItems([]);
          }, 1000);
        }
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Upload Files</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {uploadItems.length === 0 && (
            <Dropzone onFileDrop={handleFileDrop} disabled={isUploading}>
              <div className="text-center">
                <Upload className="h-10 w-10 text-secondary-400 mb-3 mx-auto" />
                <h3 className="text-xl font-medium text-secondary-900 mb-1">Drag and drop files here</h3>
                <p className="text-secondary-500 mb-4">or</p>
                <Button>Browse Files</Button>
                <p className="mt-2 text-xs text-secondary-500">Supports all file types up to 2GB</p>
              </div>
            </Dropzone>
          )}
          
          {uploadItems.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Selected Files</h4>
                {!isUploading && (
                  <Button variant="ghost" size="sm" onClick={() => setUploadItems([])}>
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {uploadItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg mb-2">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate max-w-[200px]">{item.file.name}</span>
                        <span className="text-secondary-500">
                          {item.status === 'uploading' 
                            ? `${Math.round(item.progress)}%` 
                            : formatFileSize(item.file.size)}
                        </span>
                      </div>
                      
                      {item.status === 'uploading' && (
                        <div className="w-full bg-secondary-200 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full" 
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      {item.status === 'error' && (
                        <p className="text-xs text-red-500">{item.error}</p>
                      )}
                    </div>
                    
                    {item.status === 'uploading' ? (
                      <Button variant="ghost" size="sm" disabled>
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : item.status !== 'complete' && !isUploading ? (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {uploadItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Upload to</label>
              <Select 
                value={selectedFolderId} 
                onValueChange={setSelectedFolderId}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Home</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={uploadFiles} 
            disabled={uploadItems.length === 0 || isUploading}
            className="ml-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Upload Files</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
