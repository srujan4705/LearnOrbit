import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Menu, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:bg-muted/50 transition-all" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="animate-fade-in">
          <div className="flex items-center gap-2">
            <p className="font-heading font-semibold text-foreground">
              {user?.full_name || user?.email || 'User'}
            </p>
            <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs px-2 py-0 h-5 gap-1">
              {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {isAdmin ? 'Admin' : 'Learner'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
          <Bell className="w-5 h-5" />
        </Button>
        <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/40 transition-all hover:scale-105">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}