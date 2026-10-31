"use client";

import * as React from "react";
import { ChevronsLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  header?: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
}

function ItemLink({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const link = (
    <a
      href={item.href}
      className={cn(
        "group flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
        item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {!collapsed && item.badge != null ? (
        <Badge variant="secondary" className="px-1.5 text-[10px]">
          {item.badge}
        </Badge>
      ) : null}
    </a>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({ items, header, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative hidden h-screen shrink-0 flex-col border-r border-border bg-card lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center" : "justify-between px-4")}>
        {collapsed ? header && <div className="scale-90">{header}</div> : header}
        <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse sidebar" className={collapsed ? "hidden" : ""}>
          <ChevronsLeft className="size-4" />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <ItemLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>
      <div className="p-3">
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
          {collapsed ? <span className="sr-only">Educational use only</span> : "MedCoach AI · educational use only"}
        </div>
      </div>
    </aside>
  );
}
