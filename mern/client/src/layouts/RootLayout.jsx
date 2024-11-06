import { Outlet } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { NavLink } from "react-router-dom";
import { Home, FileCheck, Video, Camera } from 'lucide-react';

const Navigation = () => {
  const navItems = [
    {
      to: "/",
      text: "Predict",
      icon: Home,
      description: "Make predictions using our model"
    },
    {
      to: "/vision",
      text: "Vision",
      icon: Camera,
      description: "Computer vision capabilities"
    },
    {
      to: "/proof-verification",
      text: "Verification",
      icon: FileCheck,
      description: "Verify and validate proofs"
    },
    {
      to: "/video-upload",
      text: "Video Upload",
      icon: Video,
      description: "Upload and process videos"
    }
  ];

  return (
    <NavigationMenu className="max-w-full w-full justify-start">
      <NavigationMenuList className="space-x-2">
        {navItems.map(({ to, text, icon: Icon}) => (
          <NavigationMenuItem key={to}>
            <NavLink to={to}>
              {({ isActive }) => (
                <NavigationMenuLink 
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "flex items-center gap-2",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{text}</span>
                </NavigationMenuLink>
              )}
            </NavLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <Navigation />
        </div>
      </header>
      <main className="container mx-auto py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;