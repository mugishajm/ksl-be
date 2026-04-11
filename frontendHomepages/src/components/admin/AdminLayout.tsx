import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Sun,
  Moon,
  HandHeart,
  Monitor,
  BarChart3,
  Home,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/admin",
    submenu: null,
  },
  {
    title: "Manage Gestures",
    icon: HandHeart,
    url: "/admin/gestures",
    submenu: null,
  },
  {
    title: "User Management",
    icon: Users,
    url: "/admin/users",
    submenu: null,
  },
  {
    title: "Interpretation Logs",
    icon: Monitor,
    url: "/admin/logs",
    submenu: null,
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/admin/settings",
    submenu: null,
  },
  {
    title: "Reports",
    icon: BarChart3,
    url: "/admin/reports",
    submenu: null,
  },
];

type StoredUser = { firstName?: string; lastName?: string; email?: string } | null;

function getStoredUser(): StoredUser {
  try {
    const raw = localStorage.getItem("ksl_user");
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

const AdminSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [user, setUser] = useState<StoredUser>(getStoredUser);

  useEffect(() => {
    const onUpdate = () => setUser(getStoredUser());
    window.addEventListener("ksl-user-update", onUpdate);
    return () => window.removeEventListener("ksl-user-update", onUpdate);
  }, []);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email ?? "Admin";

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  return (
    <Sidebar
      variant="inset"
      className="border-r border-sidebar-border bg-gradient-to-br from-[#0a4b8a] via-[#0b5fb0] to-[#0f74d4] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-center gap-3 px-2 group-data-[collapsible=icon]:hidden">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-card overflow-hidden">
            <img
              src="/ksl-logo.png"
              alt="KSL logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-semibold text-white">Admin User</span>
            <span className="mt-0.5 h-[1px] w-10 rounded-full bg-white/40" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isMenuOpen = openMenus.includes(item.title);
                const active = isActive(item.url);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "justify-start",
                        active &&
                          "bg-white/10 text-white border-l-4 border-l-[#ffd166] font-semibold"
                      )}
                    >
                      <Link to={item.url}>
                        <Icon className={cn("h-4 w-4", active && "text-[#ffd166]")} />
                        <span className="ml-1.5">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const AdminHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser>(getStoredUser);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const onUpdate = () => setUser(getStoredUser());
    window.addEventListener("ksl-user-update", onUpdate);
    return () => window.removeEventListener("ksl-user-update", onUpdate);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email ?? "Admin";

  const handleLogout = () => {
    localStorage.removeItem("ksl_token");
    localStorage.removeItem("ksl_user");
    window.dispatchEvent(new Event("ksl-user-update"));
    navigate("/", { replace: true });
  };

  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border bg-[#0f74d4] dark:bg-slate-950">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="bg-white/10 hover:bg-white/20 text-white" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <span className="text-lg font-bold text-[#0f74d4]">K</span>
            </div>
            <span className="text-xl font-bold text-white">KSL Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-white hover:bg-white/10 border border-white/20 hover:border-white/40 transition-all px-3"
            onClick={() => navigate("/")}
            aria-label="Back to Home"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline text-sm font-medium">Back to Home</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-white hover:bg-white/10"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {(user?.firstName?.[0] ?? user?.email?.[0] ?? "A").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium">{displayName}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export const AdminLayout = () => {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1 bg-gray-50 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
