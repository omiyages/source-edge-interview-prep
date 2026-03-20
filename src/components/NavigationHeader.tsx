import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LogOut, BookOpen, Settings, Menu, User, ChevronRight, LogIn, UserPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/components/AuthModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { useAssignedCoursesCount } from "@/hooks/useAssignedCoursesCount";

export const NavigationHeader = memo(() => {
  const { signOut, isAdmin, user, loading: authLoading } = useAuth();
  const { openSignIn, openSignUp } = useAuthModal();
  const isAuthenticated = !authLoading && !!user;
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDashboardOpen, setMobileDashboardOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const { count: assignedCoursesCount } = useAssignedCoursesCount();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll(); // check initial position
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
              : "text-muted-foreground hover:text-accent-foreground"
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
              : "text-muted-foreground hover:text-accent-foreground"
          }`}
        >
          Questions
        </Button>
      </Link>
      <Link to="/resources">
        <Button 
          variant="ghost" 
          className={`transition-colors font-medium ${
            isActive("/resources") 
              ? "text-foreground font-semibold" 
              : "text-muted-foreground hover:text-accent-foreground"
          }`}
        >
          Resources
        </Button>
      </Link>
      <Link to="/jobs">
        <Button 
          variant="ghost" 
          className={`transition-colors font-medium ${
            isActive("/jobs") || isActive("/job/") || isActive("/roles") || isActive("/role/")
              ? "text-foreground font-semibold" 
              : "text-muted-foreground hover:text-accent-foreground"
          }`}
        >
          Jobs
        </Button>
      </Link>
      <Link to="/company">
        <Button 
          variant="ghost" 
          className={`transition-colors font-medium ${
            isActive("/company") 
              ? "text-foreground font-semibold" 
              : "text-muted-foreground hover:text-accent-foreground"
          }`}
        >
          Companies
        </Button>
      </Link>
      {authLoading ? (
        /* Subtle skeleton while auth resolves — prevents flash */
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-neutral-800 rounded-md animate-pulse" />
          <div className="h-9 w-9 bg-neutral-800 rounded-md animate-pulse" />
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
                    : "text-muted-foreground hover:text-accent-foreground"
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
                      : "text-muted-foreground hover:text-accent-foreground"
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
              className="transition-colors font-medium text-muted-foreground hover:text-accent-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            className="transition-colors font-medium text-muted-foreground hover:text-accent-foreground"
            onClick={openSignIn}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
          <Button
            variant="default"
            className="btn-cta"
            onClick={openSignUp}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Register
          </Button>
        </>
      )}
    </>
  );

  return (
    <div className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800'
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/">
            <h1 className="text-xl font-semibold text-foreground hover:text-accent-foreground transition-colors cursor-pointer">
              Omiyages
            </h1>
          </Link>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center gap-1">
              {NavigationItems()}
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
                          : "text-muted-foreground hover:text-accent-foreground"
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
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      Questions
                    </Button>
                  </Link>
                  <Link to="/resources" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start transition-colors font-medium ${
                        isActive("/resources") 
                          ? "text-foreground font-semibold" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      Resources
                    </Button>
                  </Link>
                  <Link to="/jobs" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start transition-colors font-medium ${
                        isActive("/jobs") || isActive("/job/") || isActive("/roles") || isActive("/role/")
                          ? "text-foreground font-semibold" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      Jobs
                    </Button>
                  </Link>
                  <Link to="/company" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start transition-colors font-medium ${
                        isActive("/company") 
                          ? "text-foreground font-semibold" 
                          : "text-muted-foreground hover:text-accent-foreground"
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
                                : "text-muted-foreground hover:text-accent-foreground"
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
                                  : "text-muted-foreground hover:text-accent-foreground"
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
                                className="w-full justify-between transition-colors font-medium text-muted-foreground hover:text-accent-foreground pl-6"
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
                                  className="w-full justify-start text-muted-foreground hover:text-accent-foreground transition-colors font-medium text-sm"
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
                          className="w-full justify-start text-muted-foreground hover:text-accent-foreground transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2 border-t pt-4">
                      <Button
                        variant="ghost"
                        className="w-full justify-start transition-colors font-medium text-muted-foreground hover:text-accent-foreground"
                        onClick={() => { setMobileMenuOpen(false); openSignIn(); }}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                      <Button
                        variant="default"
                        className="w-full btn-cta"
                        onClick={() => { setMobileMenuOpen(false); openSignUp(); }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register
                      </Button>
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

