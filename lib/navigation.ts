import {
  BookOpenCheck,
  CalendarClock,
  FileQuestion,
  FolderOpen,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquareStack,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  adminOnly?: boolean;
}

/**
 * Primary application navigation — routes that are implemented in the app.
 * New modules are added here as they ship so every link stays functional.
 */
export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Tutor", href: "/tutor", icon: MessageSquare },
  { label: "Flashcards", href: "/flashcards", icon: SquareStack },
  { label: "MCQ Practice", href: "/practice", icon: FileQuestion },
  { label: "Mock Exams", href: "/exam", icon: BookOpenCheck },
  { label: "Clinical Cases", href: "/cases", icon: HeartPulse },
  { label: "Study Planner", href: "/planner", icon: CalendarClock },
  { label: "Knowledge Library", href: "/library", icon: FolderOpen },
];

export const ACCOUNT_NAV: NavItem[] = [
  { label: "Profile", href: "/settings", icon: UserRound },
  { label: "Settings", href: "/settings", icon: SlidersHorizontal },
  { label: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
];

/** Icons used by empty/quick actions on pages. */
export const NAV_ICONS = { Sparkles, Settings };
