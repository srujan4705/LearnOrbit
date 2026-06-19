import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Map,
  ClipboardList,
  RotateCcw,
  Users,
  BarChart3,
  LogOut,
  GraduationCap,
  ChevronLeft,
  Menu,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const adminLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/progress", label: "Learner Progress", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const userLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/my-courses", label: "My Courses", icon: BookOpen },
  { to: "/tracker", label: "Tracker", icon: ClipboardList },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/revision", label: "Revision", icon: RotateCcw },
  { to: "/browse-courses", label: "Browse Courses", icon: GraduationCap },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground z-40 transition-all duration-300 ease-in-out flex flex-col ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">LearnOrbit</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent shrink-0 transition-all duration-300"
        >
          {collapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {links.map((link, index) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <link.icon
                className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
              />
              {!collapsed && (
                <span className="font-medium text-sm">{link.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground animate-pulse-soft" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-300 hover:shadow-sm"
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:rotate-12" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
