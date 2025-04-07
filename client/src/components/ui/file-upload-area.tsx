import { useCallback, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { Dropzone } from "./dropzone";

interface FileUploadAreaProps {
  folderId?: number | null;
  onSuccess?: () => void;
}

export function FileUploadArea({ folderId, onSuccess }: FileUploadAreaProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (folderId !== undefined) {
        formData.append('folderId', folderId === null ? '' : String(folderId));
      }
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded.`
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [folderId, toast, onSuccess]);

  return (
    <Dropzone onFileDrop={uploadFile} disabled={isUploading}>
      {isUploading ? (
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-secondary-400 mb-3 mx-auto animate-spin" />
          <h3 className="text-xl font-medium text-secondary-900 mb-1">Uploading...</h3>
          <p className="text-secondary-500">Please wait while we upload your file</p>
        </div>
      ) : (
        <div className="text-center">
          <Upload className="h-10 w-10 text-secondary-400 mb-3 mx-auto" />
          <h3 className="text-xl font-medium text-secondary-900 mb-1">Drag and drop files here</h3>
          <p className="text-secondary-500 mb-4">or</p>
          <Button>Browse Files</Button>
          <p className="mt-2 text-xs text-secondary-500">Supports all file types up to 2GB</p>
        </div>
      )}
    </Dropzone>
  );
}
