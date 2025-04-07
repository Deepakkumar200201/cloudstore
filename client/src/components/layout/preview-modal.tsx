import { useState } from "react";
import { File } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatFileSize } from "@/lib/utils";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onShare: (file: File) => void;
  files: File[];
}

export function PreviewModal({ isOpen, onClose, file, onShare, files }: PreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Update current index when file changes
  if (file && files.length > 0) {
    const index = files.findIndex(f => f.id === file.id);
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
    }
  }
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const currentFile = files[currentIndex] || file;
  
  const getPreviewContent = () => {
    if (!currentFile) return null;
    
    const type = currentFile.type.split('/')[0];
    const subType = currentFile.type.split('/')[1];
    
    // Image preview
    if (type === 'image') {
      return (
        <img 
          src={`/api/files/${currentFile.id}/download`} 
          alt={currentFile.name} 
          className="max-h-full max-w-full object-contain"
        />
      );
    }
    
    // PDF preview (using iframe)
    if (type === 'application' && subType === 'pdf') {
      return (
        <iframe 
          src={`/api/files/${currentFile.id}/download`} 
          className="w-full h-full"
          title={currentFile.name}
        />
      );
    }
    
    // Video preview
    if (type === 'video') {
      return (
        <video 
          src={`/api/files/${currentFile.id}/download`} 
          controls
          className="max-h-full max-w-full"
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    
    // Audio preview
    if (type === 'audio') {
      return (
        <audio 
          src={`/api/files/${currentFile.id}/download`} 
          controls
          className="w-full"
        >
          Your browser does not support the audio tag.
        </audio>
      );
    }
    
    // Default file icon for unsupported types
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="text-9xl mb-4">
          {type === 'application' && (
            <>
              {subType.includes('word') || currentFile.name.endsWith('.doc') || currentFile.name.endsWith('.docx') ? (
                <i className="fa-regular fa-file-word text-blue-600"></i>
              ) : subType.includes('spreadsheet') || currentFile.name.endsWith('.xls') || currentFile.name.endsWith('.xlsx') ? (
                <i className="fa-regular fa-file-excel text-green-600"></i>
              ) : subType.includes('presentation') || currentFile.name.endsWith('.ppt') || currentFile.name.endsWith('.pptx') ? (
                <i className="fa-regular fa-file-powerpoint text-orange-600"></i>
              ) : (
                <i className="fa-regular fa-file text-secondary-600"></i>
              )}
            </>
          ) || (
            <i className="fa-regular fa-file text-secondary-600"></i>
          )}
        </div>
        <div className="text-lg text-secondary-700">
          Preview not available for this file type
        </div>
        <Button className="mt-4" onClick={() => window.open(`/api/files/${currentFile.id}/download`, "_blank")}>
          <Download className="mr-2 h-4 w-4" />
          Download to view
        </Button>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row justify-between items-center p-4 border-b border-secondary-200">
          <DialogTitle className="text-lg font-medium truncate">{currentFile?.name}</DialogTitle>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(`/api/files/${currentFile?.id}/download`, "_blank")}
              title="Download"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => currentFile && onShare(currentFile)}
              title="Share"
            >
              <Share className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-4 bg-secondary-50 flex items-center justify-center">
          {getPreviewContent()}
        </div>
        
        <div className="p-4 border-t border-secondary-200">
          <div className="flex justify-between items-center text-sm">
            <div>
              <p className="text-secondary-600">
                {currentFile ? `${formatFileSize(currentFile.size)} · Added ${formatDistanceToNow(new Date(currentFile.createdAt), { addSuffix: true })}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{files.length > 0 ? `${currentIndex + 1} of ${files.length}` : ''}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNext}
                disabled={currentIndex === files.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
