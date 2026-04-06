import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function UserNav() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/10 p-0 hover:bg-slate-800 transition-all overflow-hidden border-white/10 shadow-lg shadow-black/20">
          <Avatar className="h-10 w-10 border border-white/5">
            <AvatarImage src="" alt="Manager" />
            <AvatarFallback className="bg-primary text-white font-black tracking-tighter">BM</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-black leading-none text-slate-900">Building Manager</p>
            <p className="text-xs leading-none text-slate-500 font-medium mt-1">admin@fanaplaza.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer py-3" onClick={() => navigate("/settings")}>
            <User className="mr-3 h-4 w-4 text-slate-400" />
            <span className="font-bold text-slate-700">Profile Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer py-3" onClick={() => navigate("/settings")}>
            <Shield className="mr-3 h-4 w-4 text-slate-400" />
            <span className="font-bold text-slate-700">System Credentials</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer py-3" onClick={() => navigate("/settings")}>
            <Settings className="mr-3 h-4 w-4 text-slate-400" />
            <span className="font-bold text-slate-700">Account Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer py-3 text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={handleLogout}>
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-bold">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
