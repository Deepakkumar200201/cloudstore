import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Search, Menu, ChevronDown, Cloud } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden hover:text-primary"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <a href="/" className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-foreground">CloudStore</span>
          </a>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-muted-foreground hover:text-primary">Features</a>
          <a href="#" className="text-muted-foreground hover:text-primary">Pricing</a>
          <a href="#" className="text-muted-foreground hover:text-primary">Support</a>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Input 
              type="text" 
              placeholder="Search files..." 
              className="pr-10 w-64"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <ThemeToggle />
          <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name || user?.username || ''} />
                  <AvatarFallback>{user?.name?.[0] || user?.username?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block">{user?.name || user?.username}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <span>Your Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
