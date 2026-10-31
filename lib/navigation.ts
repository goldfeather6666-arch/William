import {
  Brain,
  FileText,
  Layers,
  LayoutDashboard,
  Library,
  MessageSquare,
  BookOpen,
  GraduationCap,
  NotebookPen,
  SlidersHorizontal,
  TestTube2,
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
 * Primary application navigation. Used by the sidebar, mobile nav and
 * command palette. The `active` state is derived per-route by the shell.
 */
export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Tutor", href: "/tutor", icon: MessageSquare },
  { label: "Flashcards", href: "/flashcards", icon: Layers },
  { label: "MCQ Bank", href: "/mcq", icon: Brain },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Clinical Cases", href: "/cases", icon: Stethoscope },
  { label: "Mock Exams", href: "/exams", icon: NotebookPen },
  { label: "Study Planner", href: "/planner", icon: CalendarClock },
  { label: "Library", href: "/library", icon: Library },
  { label: "Pharmacology", href: "/pharmacology", icon: TestTube2 },
  { label: "OSCE", href: "/osce", icon: BookOpen },
  { label: "Visual Studio", href: "/visual", icon: Shapes },
];

export const ACCOUNT_NAV: NavItem[] = [
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Settings", href: "/settings", icon: SlidersHorizontal },
];

import { CalendarClock, Shapes, Stethoscope } from "lucide-react";
