"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsLeft, FolderOpen, Home, Stethoscope, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = { href: string; label: string; icon: React.ElementType };

const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/tutor", label: "AI Tutor", icon: Sparkles },
  { href: "/library", label: "Knowledge Library", icon: FolderOpen },
];

function Item({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const link = (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

export function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-[width] duration-200 lg:relative lg:z-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </span>
            {open && <span className="font-display text-base font-semibold">MedCoach</span>}
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Toggle sidebar">
            {open ? <ChevronsLeft className="h-4 w-4" /> : <X className="h-4 w-4 lg:hidden" />}
          </Button>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {primaryNav.map((item) => (
            <Item key={item.href} item={item} collapsed={!open} active={pathname === item.href} />
          ))}
        </nav>
        <div className="p-3">
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            {open ? "MedCoach AI · educational use only" : <span className="sr-only">Educational use only</span>}
          </div>
        </div>
      </aside>
    </>
  );
}
