export const SITE_URL = "https://duely.in";
export const SITE_NAME = "Duely";

export const organizationSchema = {
  "@type": "Organization" as const,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  description:
    "Duely is a collections management tool for freelancers, small agencies, and independent consultants. Track outstanding invoices, payment promises, partial payments, and automated follow-ups.",
  sameAs: ["https://x.com/AbhishekU008"],
};

export const websiteSchema = {
  "@type": "WebSite" as const,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Collections management for freelancers and agencies. Track invoices, payment promises, and send reminders from your own Gmail.",
  potentialAction: {
    "@type": "SearchAction" as const,
    target: {
      "@type": "EntryPoint" as const,
      urlTemplate: `${SITE_URL}/articles?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};
