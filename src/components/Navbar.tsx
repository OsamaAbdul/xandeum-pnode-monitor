import { Sun, Moon, Github, ExternalLink, Menu, X, Terminal, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center border border-primary/50 bg-primary/10 text-primary animate-pulse">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="font-mono font-bold text-lg tracking-wider text-primary">
              XANDEUM_PNODES
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 border border-primary/20 bg-primary/5 rounded text-xs font-mono text-primary/80">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              SYSTEM_STATUS: ONLINE
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:text-primary hover:bg-primary/10 hidden sm:flex"
              asChild
            >
              <a href="https://github.com/xandeum" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
            </Button>

            <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary font-mono">
              CONNECT_WALLET
              <ExternalLink className="h-4 w-4" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary hover:bg-primary/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary/20 bg-background animate-fade-in">
            <div className="flex flex-col gap-2">
              <div className="px-4 py-2 text-xs font-mono text-primary/60 border-b border-primary/10 mb-2">
                NAVIGATION_MENU
              </div>
              <Button variant="ghost" className="justify-start font-mono text-primary hover:bg-primary/10 hover:text-primary">DASHBOARD</Button>
              <Button variant="ghost" className="justify-start font-mono text-primary hover:bg-primary/10 hover:text-primary">NETWORK</Button>
              <Button variant="ghost" className="justify-start font-mono text-primary hover:bg-primary/10 hover:text-primary">ANALYTICS</Button>
              <Button variant="outline" className="mt-2 mx-4 border-primary/50 text-primary hover:bg-primary/10 font-mono">CONNECT_WALLET</Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
