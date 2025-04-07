import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: number;
  folderId?: number;
  itemName?: string;
}

export function ShareModal({ isOpen, onClose, fileId, folderId, itemName }: ShareModalProps) {
  const [accessType, setAccessType] = useState<string>("public");
  const [allowDownload, setAllowDownload] = useState<boolean>(true);
  const [showExpiryPicker, setShowExpiryPicker] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [shareLink, setShareLink] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const { toast } = useToast();
  
  const createShareLink = async () => {
    if (!fileId && !folderId) return;
    
    setIsCreating(true);
    
    try {
      const res = await apiRequest("POST", "/api/shares", {
        fileId,
        folderId,
        accessType,
        allowDownload,
        expiryDate: expiryDate?.toISOString(),
      });
      
      const shareData = await res.json();
      const origin = window.location.origin;
      const link = `${origin}/share/${shareData.token}`;
      
      setShareLink(link);
      queryClient.invalidateQueries({ queryKey: ["/api/shares"] });
      
      toast({
        title: "Share link created",
        description: "You can now share this link with others."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create share link.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Copied to clipboard",
      description: "The share link has been copied to your clipboard."
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            Share "{itemName}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">People</label>
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Add email or name" 
                className="pr-10"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">General access</label>
            <Select value={accessType} onValueChange={setAccessType}>
              <SelectTrigger className="w-full">
                {accessType === "public" ? (
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-secondary-500" />
                    <span>Anyone with the link</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-secondary-500" />
                    <span>Restricted</span>
                  </div>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Anyone with the link</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-secondary-500">
              {accessType === "public" 
                ? "Anyone with the link can access" 
                : "Only people you add can access"}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Link settings</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allow-download" 
                    checked={allowDownload}
                    onCheckedChange={(checked) => setAllowDownload(checked as boolean)}
                  />
                  <label htmlFor="allow-download" className="text-sm">Allow downloads</label>
                </div>
                <Popover open={showExpiryPicker} onOpenChange={setShowExpiryPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="link" className="p-0 text-primary-500 text-sm">
                      {expiryDate ? format(expiryDate, "PPP") : "Add expiry date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                    {expiryDate && (
                      <div className="p-2 border-t border-secondary-200 flex justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setExpiryDate(undefined)}
                        >
                          Remove
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => setShowExpiryPicker(false)}
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          {shareLink && (
            <div className="p-3 bg-secondary-50 rounded-lg">
              <label className="block text-sm font-medium mb-2">Share link</label>
              <div className="flex">
                <Input 
                  type="text" 
                  value={shareLink} 
                  className="flex-1 rounded-r-none" 
                  readOnly
                />
                <Button 
                  className="rounded-l-none"
                  onClick={copyToClipboard}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!shareLink ? (
            <Button 
              onClick={createShareLink} 
              disabled={isCreating}
              className="ml-2"
            >
              {isCreating ? "Creating..." : "Create share link"}
            </Button>
          ) : (
            <Button 
              onClick={onClose}
              className="ml-2"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
