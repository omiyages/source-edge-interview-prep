import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, BookOpen, Settings, Menu, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { useAssignedCoursesCount } from "@/hooks/useAssignedCoursesCount";

export const NavigationHeader = memo(() => {
  const { signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count: assignedCoursesCount } = useAssignedCoursesCount();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const NavigationItems = () => (
    <>
      {!isAdmin && (
        <Link to="/dashboard">
          <Button 
            variant="ghost" 
            className={`transition-colors font-medium relative ${
              isActive("/dashboard") 
                ? "text-foreground font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            My Dashboard
            <NotificationBadge count={assignedCoursesCount} />
          </Button>
        </Link>
      )}
      <Link to="/tracks">
        <Button 
          variant="ghost" 
          className={`transition-colors font-medium ${
            isActive("/tracks") || isActive("/course/") 
              ? "text-foreground font-semibold" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Tracks
        </Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={`transition-colors font-medium ${
              isActive("/resources") || isActive("/relo")
                ? "text-foreground font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Resources
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link 
              to="/resources" 
              className={`cursor-pointer ${isActive("/resources") ? "font-semibold" : ""}`}
            >
              Resources
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link 
              to="/relo" 
              className={`cursor-pointer ${isActive("/relo") ? "font-semibold" : ""}`}
            >
              Relocation to Tokyo
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Link to="/company">
        <Button 
          variant="ghost" 
          className={`transition-colors font-medium ${
            isActive("/company") 
              ? "text-foreground font-semibold" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Companies
        </Button>
      </Link>
      {isAdmin && (
        <Link to="/admin">
          <Button 
            variant="ghost" 
            className={`transition-colors font-medium ${
              isActive("/admin") 
                ? "text-foreground font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </Link>
      )}
      <Button 
        variant="ghost" 
        onClick={signOut} 
        className="text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </>
  );

  return (
    <div className="bg-white border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/">
            <h1 className="text-xl font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
              Source Edge Database
            </h1>
          </Link>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center gap-1">
              <NavigationItems />
            </nav>
          )}
          
          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-2 mt-8">
                  {!isAdmin && (
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className={`w-full justify-start transition-colors font-medium relative ${
                          isActive("/dashboard") 
                            ? "text-foreground font-semibold" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        My Dashboard
                        <NotificationBadge count={assignedCoursesCount} />
                      </Button>
                    </Link>
                  )}
                  <Link to="/tracks" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start transition-colors font-medium ${
                        isActive("/tracks") || isActive("/course/")
                          ? "text-foreground font-semibold" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Tracks
                    </Button>
                  </Link>
                  <div className="flex flex-col gap-1 pl-4">
                    <Link to="/resources" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className={`w-full justify-start transition-colors font-medium text-sm ${
                          isActive("/resources") 
                            ? "text-foreground font-semibold" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Resources
                      </Button>
                    </Link>
                    <Link to="/relo" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className={`w-full justify-start transition-colors font-medium text-sm ${
                          isActive("/relo") 
                            ? "text-foreground font-semibold" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Relocation to Tokyo
                      </Button>
                    </Link>
                  </div>
                  <Link to="/company" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start transition-colors font-medium ${
                        isActive("/company") 
                          ? "text-foreground font-semibold" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Companies
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className={`w-full justify-start transition-colors font-medium ${
                          isActive("/admin") 
                            ? "text-foreground font-semibold" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={signOut} 
                    className="w-full justify-start text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </div>
  );
});

NavigationHeader.displayName = 'NavigationHeader';

