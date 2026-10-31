import {
  FolderOpen,
  LayoutDashboard,
  Library,
  MessageSquare,
  Settings,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

/**
 * Primary application navigation — routes that are implemented in the app.
 * New modules (flashcards, MCQ bank, cases, exams, planner, pharmacology, OSCE,
 * visual studio) are added here as they ship so every link stays functional.
 */
export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Tutor", href: "/tutor", icon: MessageSquare },
  { label: "Knowledge Library", href: "/library", icon: FolderOpen },
];

export const ACCOUNT_NAV: NavItem[] = [
  { label: "Profile", href: "/settings", icon: UserRound },
  { label: "Settings", href: "/settings", icon: SlidersHorizontal },
];

/** Icons used by empty/quick actions on pages. */
export const NAV_ICONS = { Sparkles, Settings, Library };
