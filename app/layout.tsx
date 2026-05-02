import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duely — automated payment reminders",
  description: "Send polite payment reminders automatically and get paid without awkward follow-ups.",
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
