"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from "@/components/common/logo";
import { cn } from "@/lib/utils";
import type { SidebarItem } from "./sidebar";

interface MobileNavProps {
  items: SidebarItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  footer?: ReactNode;
}

export function MobileNav({ items, open, onOpenChange, footer }: MobileNavProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-y-0 left-0 flex h-full w-[min(19rem,90vw)] max-w-none flex-col gap-0 rounded-none border-r p-0 shadow-lifted data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:w-72">
        <DialogTitle className="sr-only">Main navigation</DialogTitle>
        <DialogDescription className="sr-only">Application menu</DialogDescription>

        <div className="flex h-16 shrink-0 items-center border-b pl-5 pr-14">
          <Logo size="md" />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                      item.active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge != null ? (
                      <Badge
                        variant="secondary"
                        className="px-1.5 text-[10px]"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {footer ? (
          <div className="shrink-0 border-t p-3">{footer}</div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
