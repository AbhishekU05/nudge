import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duely — Collect what you're owed, keep the relationship",
  description: "Track what clients owe, follow up without the awkwardness, and get paid. Collections management built for freelancers and agencies.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
