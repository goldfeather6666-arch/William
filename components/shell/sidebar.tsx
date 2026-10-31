"use client";

import type { ReactNode } from "react";
import { motion, MotionConfig } from "framer-motion";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  header?: ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  footer?: ReactNode;
  className?: string;
}

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 64;

export function Sidebar({
  items,
  header,
  collapsed,
  onToggle,
  footer,
  className,
}: SidebarProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.aside
        aria-label="Primary"
        initial={false}
        animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
        className={cn(
          "flex h-full flex-col overflow-hidden border-r bg-card/60",
          className,
        )}
      >
        {header ? (
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b",
              collapsed ? "justify-center px-2" : "px-4",
            )}
          >
            {header}
          </div>
        ) : null}

        <TooltipProvider delayDuration={0}>
          <ScrollArea className="min-h-0 flex-1">
            <nav
              className={cn(
                "flex flex-col gap-1 py-3",
                collapsed ? "items-center px-2" : "px-3",
              )}
            >
              {items.map((item) => {
                const Icon = item.icon;
                const link = (
                  <a
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "group flex h-10 items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
                      collapsed ? "w-10 justify-center" : "w-full px-3",
                      item.active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && (
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge != null ? (
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-1.5 text-[10px]"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </a>
                );

                if (!collapsed) return link;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="z-50">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>
        </TooltipProvider>

        {footer ? (
          <div
            className={cn(
              "shrink-0 border-t",
              collapsed ? "flex justify-center p-2" : "p-3",
            )}
          >
            {footer}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-10 shrink-0 items-center gap-2 border-t text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed ? "w-full justify-center" : "w-full px-3",
          )}
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform duration-200",
              collapsed && "rotate-180",
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </motion.aside>
    </MotionConfig>
  );
}
