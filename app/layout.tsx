import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://duely.in"),
  title: {
    default: "Duely — Collect what you're owed, keep the relationship",
    template: "%s | Duely",
  },
  description:
    "Track outstanding invoices, payment promises, partial payments, and follow-ups. Collections management built for freelancers and agencies.",
  openGraph: {
    siteName: "Duely",
    locale: "en_US",
    type: "website",
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
  const eeatSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    author: { "@type": "Organization", name: "Duely" },
    datePublished: "2024-01-01",
    dateModified: "2026-06-18",
  };

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preload" as="image" href="/logo.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(eeatSchema).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black"
        >
          Skip to main content
        </a>
        {children}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-QMCVL1RL2L" strategy="afterInteractive" />
        <Script async id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QMCVL1RL2L');
          `}
        </Script>
        <Script async id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wzuugmsshn");
          `}
        </Script>
        {/* Affonso affiliate tracking — first-party mode via /r proxy (ad-blocker resistant) */}
        <Script
          id="affonso-pixel"
          strategy="afterInteractive"
          src="/r/pixel.js"
          data-affonso="cmr3tysca000xltgmzylwzqz7"
          data-cookie_duration="30"
          data-api-base="/r"
        />
        <Script id="betterstack-rum" strategy="afterInteractive">
          {`
            !function(b,e,t,r){
              b[t]=b[t]||function(...args){(b[t].q=b[t].q||[]).push(args)};
              b[t].l=+new Date;
              var s=e.createElement('script'); s.async=1; s.crossOrigin='anonymous';
              s.src='https://betterstack.net/b.js?t='+r;
              (e.head||e.getElementsByTagName('head')[0]).appendChild(s);
            }(window,document,'betterstack','3BUPZJJCj2ZCEx8XqNKhcerc');
            betterstack('init', { environment: 'production' });
          `}
        </Script>
      </body>
    </html>
  );
}
