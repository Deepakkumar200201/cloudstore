import { Card } from "@/components/ui/card";
import { useState } from "react";
import { File } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { formatFileSize } from "@/lib/utils";
import { FileIcon, MoreVertical, Star } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileCardProps {
  file: File;
  onPreview: (file: File) => void;
  onShare: (file: File) => void;
}

export function FileCard({ file, onPreview, onShare }: FileCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  
  const getFileIcon = () => {
    const type = file.type.split('/')[0];
    const subType = file.type.split('/')[1];
    
    // Images show previews
    if (type === 'image') {
      return (
        <div className="h-32 bg-secondary-100 flex items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: `url(/api/files/${file.id}/download)` }}>
        </div>
      );
    }
    
    // Document types
    if (type === 'application') {
      if (subType.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        return (
          <div className="h-32 bg-secondary-100 flex items-center justify-center">
            <i className="fa-regular fa-file-word text-5xl text-blue-600"></i>
          </div>
        );
      }
      
      if (subType.includes('pdf') || file.name.endsWith('.pdf')) {
        return (
          <div className="h-32 bg-secondary-100 flex items-center justify-center">
            <i className="fa-regular fa-file-pdf text-5xl text-red-600"></i>
          </div>
        );
      }
      
      if (subType.includes('excel') || subType.includes('spreadsheet') || 
          file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        return (
          <div className="h-32 bg-secondary-100 flex items-center justify-center">
            <i className="fa-regular fa-file-excel text-5xl text-green-600"></i>
          </div>
        );
      }
      
      if (subType.includes('powerpoint') || subType.includes('presentation') || 
          file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
        return (
          <div className="h-32 bg-secondary-100 flex items-center justify-center">
            <i className="fa-regular fa-file-powerpoint text-5xl text-orange-600"></i>
          </div>
        );
      }
    }
    
    // Default file icon
    return (
      <div className="h-32 bg-secondary-100 flex items-center justify-center">
        <FileIcon className="h-16 w-16 text-secondary-400" />
      </div>
    );
  };
  
  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/files/${file.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
      toast({
        title: "File deleted",
        description: `${file.name} has been deleted.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file.",
        variant: "destructive"
      });
    }
  };
  
  const handleDownload = () => {
    window.open(`/api/files/${file.id}/download`, "_blank");
  };
  
  const handleToggleStar = async () => {
    try {
      await apiRequest("PATCH", `/api/files/${file.id}`, {
        starred: !file.starred
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: file.starred ? "Removed from starred" : "Added to starred",
        description: `${file.name} has been ${file.starred ? "removed from" : "added to"} starred files.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update file.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden hover:border-primary-400 hover:shadow transition cursor-pointer">
      <div onClick={() => onPreview(file)}>
        {getFileIcon()}
      </div>
      <div className="p-3 border-t border-secondary-200">
        <div className="flex justify-between items-start">
          <div className="truncate">
            <h3 className="font-medium text-secondary-900 truncate">{file.name}</h3>
            <p className="text-xs text-secondary-500">
              {formatFileSize(file.size)} · Modified {formatDistanceToNow(new Date(file.modifiedAt), { addSuffix: true })}
            </p>
          </div>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="text-secondary-400 hover:text-secondary-700">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                <i className="fa-solid fa-download mr-2 w-4 text-secondary-500"></i> Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(file); }}>
                <i className="fa-solid fa-share-nodes mr-2 w-4 text-secondary-500"></i> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStar(); }}>
                <Star className={`mr-2 w-4 ${file.starred ? "text-yellow-400 fill-yellow-400" : "text-secondary-500"}`} /> 
                {file.starred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              >
                <i className="fa-solid fa-trash mr-2 w-4 text-red-600"></i> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
