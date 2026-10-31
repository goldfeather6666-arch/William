"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar, type SidebarItem } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Topbar } from "./topbar";
import { useCommandPalette } from "@/components/providers/app-providers";

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  items,
  user,
  header,
  children,
}: {
  items: SidebarItem[];
  user: { email?: string; name?: string };
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { setOpen } = useCommandPalette();

  const navItems = items.map((item) => ({ ...item, active: isActive(item.href, pathname) }));

  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} header={header} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onOpenPalette={() => setOpen(true)} onToggleSidebar={() => setMobileOpen((v) => !v)} />
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </div>

      <MobileNav items={navItems} open={mobileOpen} onOpenChange={setMobileOpen} />
    </div>
  );
}
