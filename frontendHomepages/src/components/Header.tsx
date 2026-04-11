import { useState, useEffect, useCallback } from "react";
import { Menu, X, User, Settings, LogOut, ChevronDown, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import kslLogo from "@/assets/ksl-logo.png";
import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";

type StoredUser = { id?: string; firstName?: string; lastName?: string; email?: string; role?: string; profilePicture?: string } | null;

function getStoredUser(): StoredUser {
  try {
    const raw = localStorage.getItem("ksl_user");
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

const Header = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<StoredUser>(getStoredUser);

  useEffect(() => {
    const onUpdate = () => setUser(getStoredUser());
    window.addEventListener("ksl-user-update", onUpdate);
    return () => window.removeEventListener("ksl-user-update", onUpdate);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("ksl_token");
    localStorage.removeItem("ksl_user");
    window.dispatchEvent(new Event("ksl-user-update"));
    navigate("/", { replace: true });
  }, [navigate]);

  const navLinks = [
    { key: "home", to: "/" },
    { key: "translate", to: "/translate" },
    { key: "features", to: "/features" },
    { key: "howItWorks", to: "/how-it-works" },
    { key: "about", to: "/about" },
  ] as const;

  const navLabels: Record<(typeof navLinks)[number]["key"], { kinyarwanda: string; english: string; french: string }> =
  {
    home: {
      kinyarwanda: "Ahabanza",
      english: "Home",
      french: "Accueil",
    },
    translate: {
      kinyarwanda: "Guhindura",
      english: "Translate",
      french: "Traduire",
    },
    features: {
      kinyarwanda: "Ibiranga",
      english: "Features",
      french: "Fonctionnalités",
    },
    howItWorks: {
      kinyarwanda: "Uko Bikora",
      english: "How It Works",
      french: "Comment ça marche",
    },
    about: {
      kinyarwanda: "Ibyerekeye",
      english: "About",
      french: "À propos",
    },
  };

  const authLabels = {
    getStarted: {
      kinyarwanda: "Tangira",
      english: "Get Started",
      french: "Commencer",
    },
    profile: {
      kinyarwanda: "Umwirondoro",
      english: "Profile",
      french: "Profil",
    },
    settings: {
      kinyarwanda: "Igenamiterere",
      english: "Settings",
      french: "Paramètres",
    },
    logout: {
      kinyarwanda: "Gusohoka",
      english: "Logout",
      french: "Déconnexion",
    },
    account: {
      kinyarwanda: "Konti",
      english: "Account",
      french: "Compte",
    },
  } as const;

  const displayName =
    (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email) ?? authLabels.account[language];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={kslLogo} alt="KSL Logo" className="h-10 md:h-12 w-auto" />
            <span className="font-display font-bold text-xl hidden sm:block">
              <span className="text-ksl-blue">K</span>
              <span className="text-ksl-yellow">S</span>
              <span className="text-ksl-dark dark:text-white">L</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.to}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                {navLabels[link.key][language]}
              </Link>
            ))}
          </nav>

          {/* CTA or Profile dropdown */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-full px-2 py-1.5">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePicture || ""} alt={displayName} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(user.firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[120px] truncate">{displayName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{displayName}</p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      {authLabels.profile[language]}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      {authLabels.settings[language]}
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-primary">
                          <LayoutDashboard className="h-4 w-4" />
                          Back to Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-500/20 focus:text-red-400 font-medium cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    {authLabels.logout[language]}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="hero">
                <Link to="/auth">{authLabels.getStarted[language]}</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {navLabels[link.key][language]}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {/* Theme Toggle for Mobile */}
                <div className="flex items-center justify-between px-2 py-2">
                  <span className="text-sm font-medium">
                    {language === "kinyarwanda"
                      ? "Imiterere"
                      : language === "french"
                        ? "Thème"
                        : "Theme"}
                  </span>
                  <ThemeToggle />
                </div>

                {user ? (
                  <>
                    <p className="text-sm font-medium px-2 py-1 truncate">{displayName}</p>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                        {authLabels.profile[language]}
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link to="/settings" onClick={() => setIsMenuOpen(false)}>
                        {authLabels.settings[language]}
                      </Link>
                    </Button>
                    {user?.role === "admin" && (
                      <Button asChild variant="ghost" className="justify-start text-primary">
                        <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Back to Admin Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="justify-start text-red-500 hover:text-red-400 hover:bg-red-500/20" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                      {authLabels.logout[language]}
                    </Button>
                  </>
                ) : (
                  <Button asChild variant="hero" className="w-full">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      {authLabels.getStarted[language]}
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
