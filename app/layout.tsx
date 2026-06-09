import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duely — Invoice Management and Automation for Small Agencies",
  description: "Automated follow-ups, payment tracking, and reminders from your own Gmail. Built for small agencies.",
  openGraph: {
    title: "Duely — Invoice Management and Automation for Small Agencies",
    description: "Automated follow-ups, payment tracking, and reminders from your own Gmail. Built for small agencies.",
    siteName: "Duely",
  },
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
      <body className="min-h-full flex flex-col">
        {children}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-QMCVL1RL2L" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QMCVL1RL2L');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wzuugmsshn");
          `}
        </Script>
      </body>
    </html>
  );
}
