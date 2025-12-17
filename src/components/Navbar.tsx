import { NavLink } from 'react-router-dom';
import { DatasetStatus } from './DatasetStatus';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, UserCheck, Settings } from 'lucide-react';

export function Navbar() {
  const navItems = [
    { to: "/employee", label: "Employé", icon: UserCheck },
    { to: "/manager", label: "Décideur", icon: Users },
    { to: "/hr", label: "Pilote", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex flex-col">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block">QVCTi</span>
          </a>
        </div>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "transition-colors hover:text-foreground/80 flex items-center gap-2",
                  isActive ? "text-foreground" : "text-foreground/60"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <DatasetStatus />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "transition-colors hover:text-foreground/80",
                isActive ? "text-foreground" : "text-foreground/60"
              )
            }
            title="Paramètres & Données"
          >
            <Settings className="h-5 w-5" />
          </NavLink>
        </div>
      </div>
    </header>
  );
}
