import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import auroraLogo from "@/assets/aurora-logo-white.png";
const navLinks = [{
  name: "Home",
  path: "/"
}, {
  name: "Fundraising",
  path: "/fundraising"
}, {
  name: "Resources",
  path: "/resources"
}, {
  name: "About",
  path: "/about"
}, {
  name: "Contact",
  path: "/contact"
}];
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const {
    user,
    isAdmin,
    isStudent,
    signOut
  } = useAuth();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  return <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-lg">
      <nav className="container-wide">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img alt="Aurora Fundraising" className="h-28 w-auto" src="/lovable-uploads/9452e228-a5f0-4f97-ac95-d1fc5d6acf18.png" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${location.pathname === link.path ? "text-secondary bg-primary-foreground/10" : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/5"}`}>
                {link.name}
              </Link>)}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? <>
                {isAdmin && <Button variant="heroOutline" size="default" asChild>
                    <Link to="/admin">Admin Dashboard</Link>
                  </Button>}
                {isStudent && <Button variant="heroOutline" size="default" asChild>
                    <Link to="/dashboard">My Dashboard</Link>
                  </Button>}
                <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <LogOut className="h-5 w-5" />
                </Button>
              </> : <>
                <Button variant="heroOutline" size="default" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="hero" size="default" asChild>
                  <Link to="/contact">Start Fundraising</Link>
                </Button>
              </>}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 text-primary-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`lg:hidden absolute top-full left-0 right-0 bg-primary/98 backdrop-blur-lg transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? "max-h-screen py-6" : "max-h-0"}`}>
        <div className="container-wide flex flex-col gap-2">
          {navLinks.map(link => <Link key={link.path} to={link.path} className={`px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${location.pathname === link.path ? "text-secondary bg-primary-foreground/10" : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/5"}`}>
              {link.name}
            </Link>)}
          {user ? <>
              {isAdmin && <Button variant="heroOutline" size="lg" className="mt-4" asChild>
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>}
              {isStudent && <Button variant="heroOutline" size="lg" className="mt-4" asChild>
                  <Link to="/dashboard">My Dashboard</Link>
                </Button>}
              <Button variant="ghost" size="lg" className="mt-2" onClick={() => {
            signOut();
            setIsMobileMenuOpen(false);
          }}>
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            </> : <>
              <Button variant="heroOutline" size="lg" className="mt-4" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="hero" size="lg" className="mt-2" asChild>
                <Link to="/contact">Start Fundraising</Link>
              </Button>
            </>}
        </div>
      </div>
    </header>;
}