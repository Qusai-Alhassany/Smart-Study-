import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartStudy | Your AI study companion",
  description: "Personalized study plans, coursework tracking, focus sessions, and AI-powered practice questions for university students.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
