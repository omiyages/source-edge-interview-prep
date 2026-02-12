import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LogOut, BookOpen, Settings, Menu, ChevronDown, User, ChevronRight, LogIn, UserPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { useAssignedCoursesCount } from "@/hooks/useAssignedCoursesCount";

export const NavigationHeader = memo(() => {
  const { signOut, isAdmin, user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!user;
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDashboardOpen, setMobileDashboardOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
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
      <Link to="/questions">
        <Button 
          variant="ghost" 
          className={`transition-colors font-medium ${
            isActive("/questions") 
              ? "text-foreground font-semibold" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Questions
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
      {authLoading ? (
        /* Subtle skeleton while auth resolves — prevents flash */
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-gray-100 rounded-md animate-pulse" />
          <div className="h-9 w-9 bg-gray-100 rounded-md animate-pulse" />
        </div>
      ) : isAuthenticated ? (
        <>
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
          {!isAdmin && (
            <div 
              className="relative group"
              onMouseEnter={() => setDashboardDropdownOpen(true)}
              onMouseLeave={() => setDashboardDropdownOpen(false)}
            >
              <Link to="/dashboard">
                <Button 
                  variant="ghost" 
                  className={`transition-colors font-medium relative ${
                    isActive("/dashboard") 
                      ? "text-foreground font-semibold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  My Dashboard
                  <NotificationBadge count={assignedCoursesCount} />
                </Button>
              </Link>
              {dashboardDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50">
                  <button
                    onClick={signOut}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
          {isAdmin && (
            <Button 
              variant="ghost" 
              onClick={signOut}
              className="transition-colors font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </>
      ) : (
        <>
          <Link to="/auth">
            <Button 
              variant="ghost" 
              className="transition-colors font-medium text-muted-foreground hover:text-foreground"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button 
              variant="default"
              className="btn-purple-gradient"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Register
            </Button>
          </Link>
        </>
      )}
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
                  <Link to="/questions" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start transition-colors font-medium ${
                        isActive("/questions") 
                          ? "text-foreground font-semibold" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Questions
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
                  {authLoading ? null : isAuthenticated ? (
                    <>
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
                      {!isAdmin && (
                        <>
                          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <Button 
                              variant="ghost" 
                              className={`w-full justify-start transition-colors font-medium relative ${
                                isActive("/dashboard") 
                                  ? "text-foreground font-semibold" 
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <User className="w-4 h-4 mr-2" />
                              My Dashboard
                              <NotificationBadge count={assignedCoursesCount} />
                            </Button>
                          </Link>
                          <Collapsible open={mobileDashboardOpen} onOpenChange={setMobileDashboardOpen}>
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="w-full justify-between transition-colors font-medium text-muted-foreground hover:text-foreground pl-6"
                              >
                                <span className="text-sm">More</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${mobileDashboardOpen ? 'rotate-90' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="flex flex-col gap-1 pl-6">
                                <Button 
                                  variant="ghost" 
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    signOut();
                                  }} 
                                  className="w-full justify-start text-muted-foreground hover:text-foreground transition-colors font-medium text-sm"
                                >
                                  <LogOut className="w-4 h-4 mr-2" />
                                  Sign Out
                                </Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </>
                      )}
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setMobileMenuOpen(false);
                            signOut();
                          }} 
                          className="w-full justify-start text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2 border-t pt-4">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start transition-colors font-medium text-muted-foreground hover:text-foreground"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant="default"
                          className="w-full btn-purple-gradient"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Register
                        </Button>
                      </Link>
                    </div>
                  )}
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

