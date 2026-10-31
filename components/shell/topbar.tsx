"use client";

import type { ReactNode } from "react";
import { Bell, Menu, Search, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenCommand?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  unreadCount?: number;
  user?: Profile | null;
  menuItems?: ReactNode;
}

function formatRole(role: Profile["role"]): string {
  return role
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function UserMenu({ user }: { user: Profile }) {
  const name = user.full_name ?? user.email ?? "Student";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          aria-label="Account menu"
        >
          <Avatar className="size-9">
            <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
            <AvatarFallback className="text-xs">
              {initials(name, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <span className="text-xs font-normal capitalize text-muted-foreground">
            {formatRole(user.role)}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/profile" className="cursor-pointer">
            <UserRound className="size-4" />
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/settings" className="cursor-pointer">
            Settings
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar({
  title,
  subtitle,
  onOpenCommand,
  onOpenNotifications,
  onOpenMenu,
  unreadCount = 0,
  user,
  menuItems,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur sm:px-4">
      {onOpenMenu ? (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      ) : null}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {onOpenCommand ? (
        <>
          <Button
            variant="outline"
            onClick={onOpenCommand}
            className="hidden h-9 w-56 justify-start gap-2 rounded-lg text-muted-foreground sm:inline-flex"
          >
            <Search className="size-4" />
            <span className="text-sm">Search…</span>
            <kbd className="kbd ml-auto">⌘K</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCommand}
            className="sm:hidden"
            aria-label="Search"
          >
            <Search className="size-5" />
          </Button>
        </>
      ) : null}

      {onOpenNotifications ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      ) : null}

      {menuItems ?? (user ? <UserMenu user={user} /> : null)}
    </header>
  );
}
