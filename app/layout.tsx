import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MedCoach AI — AI-assisted medical education",
    template: "%s · MedCoach AI",
  },
  description:
    "Premium AI-powered medical education platform: tutor, notes, flashcards, MCQ bank, clinical cases and mock exams for MBBS and international medical examinations.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
