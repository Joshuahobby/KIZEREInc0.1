import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Menu, X } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "Admin";

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Register Items", href: "/register" },
    { name: "Search", href: "/search" },
    { name: "Lost & Found", href: "/lost-found" },
    // Admin-only navigation
    { name: "User Management", href: "/user-management", admin: true },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-display font-bold text-primary-600 cursor-pointer">KIZERE</h1>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                if (item.admin && !isAdmin) return null;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={`${
                        isActive(item.href)
                          ? "border-primary-500 text-neutral-900"
                          : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="ml-6 flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0">
                  <AvatarWithInitials name={user.fullName} className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="cursor-pointer w-full">Your Profile</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="cursor-pointer w-full">Settings</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center sm:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMobileMenu}
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? "" : "hidden"} sm:hidden`} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            if (item.admin && !isAdmin) return null;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`${
                    isActive(item.href)
                      ? "bg-primary-50 border-primary-500 text-primary-700"
                      : "border-transparent text-neutral-500 hover:bg-gray-50 hover:border-neutral-300 hover:text-neutral-700"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
