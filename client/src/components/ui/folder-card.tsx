import { FolderWithStats } from "@shared/schema";
import { Folder, Star, Share2 } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { Button } from "./button";

interface FolderCardProps {
  folder: FolderWithStats;
  onOpen: (folder: FolderWithStats) => void;
  onShare: (folder: FolderWithStats) => void;
  onStar?: (folder: FolderWithStats) => void;
  onDelete?: (folder: FolderWithStats) => void;
}

export function FolderCard({ folder, onOpen, onShare, onStar, onDelete }: FolderCardProps) {
  return (
    <div 
      className="border rounded-lg p-4 bg-card hover:border-primary-300 transition-colors cursor-pointer group"
      onClick={() => onOpen(folder)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-100 p-2 rounded">
            <Folder className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-primary-900 truncate max-w-[180px]">{folder.name}</h3>
            <div className="text-xs text-secondary-500">
              {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'} · {formatFileSize(folder.totalSize)}
            </div>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          {onStar && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={(e) => {
                e.stopPropagation();
                onStar(folder);
              }}
            >
              <Star 
                className={`h-4 w-4 ${folder.starred ? 'fill-yellow-400 text-yellow-400' : 'text-secondary-400'}`} 
              />
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={(e) => {
              e.stopPropagation();
              onShare(folder);
            }}
          >
            <Share2 className="h-4 w-4 text-secondary-400" />
          </Button>
          
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-secondary-400"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}