import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";
import { EvaluatorBar } from "@/components/navigation/EvaluatorBar";
import { Footer } from "@/components/navigation/Footer";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Digital Heroes | Golf Performance, Charity & Reward Draws",
  description:
    "Track your golf Stableford performance, support vetted charities with monthly subscription pledges, and participate in transparent reward draws.",
  openGraph: {
    title: "Digital Heroes — Play Your Game. Give With Purpose. Win Something Back.",
    description:
      "A modern fintech and social impact golf ecosystem. Stableford score tracking, charity contributions, and verified monthly reward draws.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#080c14] text-slate-100 antialiased selection:bg-brand-500 selection:text-slate-950`}>
        <EvaluatorBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

