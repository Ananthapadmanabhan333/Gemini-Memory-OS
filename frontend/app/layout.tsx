import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gemini Memory OS - Cognitive Memory Architecture",
  description: "A production-grade persistent cognitive memory operating system layer for next-generation distributed AI agents inspired by Google DeepMind.",
  keywords: ["Gemini", "Project Astra", "LangGraph", "Cognitive Memory", "AI Agent OS", "DeepMind"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#03000a] text-slate-100 select-none">
        {children}
      </body>
    </html>
  );
}
