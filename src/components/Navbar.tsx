import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DatasetStatus } from './DatasetStatus';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, UserCheck, Settings, Moon, Sun, Menu, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

export function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { to: "/employee", label: "Collaborateur", icon: UserCheck },
    { to: "/manager", label: "Décideur", icon: Users },
    { to: "/hr", label: "Pilote", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center px-4 md:px-6">
        <div className="mr-4 flex md:hidden">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px] left-0 top-0 translate-x-0 translate-y-0 h-full flex flex-col justify-start p-6">
              <DialogTitle className="text-left border-b pb-4 flex items-center gap-2 font-semibold">
                <Activity className="h-5 w-5 text-primary" />
                QVCT Dashboard
              </DialogTitle>
              <nav className="flex flex-col space-y-2 mt-6">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 text-sm font-medium transition-all px-3 py-2 rounded-md",
                        isActive 
                          ? "bg-secondary text-primary" 
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mr-8 hidden md:flex items-center">
          <NavLink to="/" className="mr-6 flex items-center space-x-2 transition-opacity hover:opacity-90">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">QVCT<span className="font-light">i</span></span>
          </NavLink>
          <nav className="flex items-center space-x-1 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-md transition-all flex items-center gap-2",
                    isActive 
                      ? "bg-secondary text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <DatasetStatus />
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <Settings className="h-4 w-4" />
          </NavLink>
        </div>
      </div>
    </header>
  );
}