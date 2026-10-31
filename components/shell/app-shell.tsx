"use client";

import { useCallback, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { Sidebar, type SidebarItem } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { useCommandPalette } from "@/components/providers/app-providers";
import type { Profile } from "@/lib/types";

export type { SidebarItem };

interface AppShellProps {
  items: SidebarItem[];
  user?: Profile | null;
  children: ReactNode;
  title: string;
  subtitle?: string;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  topbarMenuItems?: ReactNode;
  header?: ReactNode;
  sidebarFooter?: ReactNode;
}

export function AppShell({
  items,
  user,
  children,
  title,
  subtitle,
  onOpenNotifications,
  unreadCount,
  topbarMenuItems,
  header,
  sidebarFooter,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { setOpen } = useCommandPalette();

  const handleOpenCommand = useCallback(() => setOpen(true), [setOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar
          items={items}
          header={header}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          footer={sidebarFooter}
          className="hidden lg:flex"
        />

        <MobileNav
          items={items}
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar
            title={title}
            subtitle={subtitle}
            onOpenCommand={handleOpenCommand}
            onOpenNotifications={onOpenNotifications}
            onOpenMenu={() => setMobileNavOpen(true)}
            unreadCount={unreadCount}
            user={user}
            menuItems={topbarMenuItems}
          />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </MotionConfig>
  );
}
