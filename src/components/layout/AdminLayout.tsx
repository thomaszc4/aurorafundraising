import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  ShoppingCart, 
  Heart, 
  Settings,
  FolderOpen,
  Mail,
  BarChart3,
  LogOut,
  ChevronDown,
  Plus,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminLayoutProps {
  children: React.ReactNode;
  campaignName?: string;
  campaigns?: Array<{ id: string; name: string }>;
  selectedCampaignId?: string;
  onCampaignChange?: (campaignId: string) => void;
  onCreateCampaign?: () => void;
}

interface NavItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  onClick?: () => void;
  badge?: string;
}

export function AdminLayout({ 
  children,
  campaignName,
  campaigns = [],
  selectedCampaignId,
  onCampaignChange,
  onCreateCampaign
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const mainNavItems: NavItem[] = [
    { title: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { title: 'Project Manager', icon: ClipboardList, path: '/admin?view=project-manager' },
    { title: 'Participants', icon: Users, path: '/admin/participants' },
    { title: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
  ];

  const engagementNavItems: NavItem[] = [
    { title: 'Donor CRM', icon: Heart, path: '/admin?view=donors' },
    { title: 'Email Center', icon: Mail, path: '/admin?view=email' },
    { title: 'Analytics', icon: BarChart3, path: '/admin?view=analytics' },
  ];

  const toolsNavItems: NavItem[] = [
    { title: 'Resources', icon: FolderOpen, path: '/admin?view=resources' },
    { title: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground truncate">Aurora</h2>
                <p className="text-xs text-muted-foreground">Fundraising Platform</p>
              </div>
            </div>
            
            {/* Campaign Selector */}
            {campaigns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full mt-4 justify-between">
                    <span className="truncate">{campaignName || 'Select Campaign'}</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {campaigns.map((campaign) => (
                    <DropdownMenuItem
                      key={campaign.id}
                      onClick={() => onCampaignChange?.(campaign.id)}
                      className={cn(
                        campaign.id === selectedCampaignId && "bg-accent"
                      )}
                    >
                      {campaign.name}
                    </DropdownMenuItem>
                  ))}
                  {onCreateCampaign && (
                    <DropdownMenuItem onClick={onCreateCampaign} className="text-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      New Fundraiser
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => item.path && navigate(item.path)}
                        isActive={isActive(item.path)}
                        className="w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Engagement</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {engagementNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => item.path && navigate(item.path)}
                        isActive={isActive(item.path)}
                        className="w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => item.path && navigate(item.path)}
                        isActive={isActive(item.path)}
                        className="w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              {campaignName && (
                <div>
                  <h1 className="font-semibold text-foreground">{campaignName}</h1>
                </div>
              )}
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}