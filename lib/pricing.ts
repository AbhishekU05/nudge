import "server-only";

import { headers } from "next/headers";

type LocalizedMonthlyPrice = {
  inline: string;
  standalone: string;
};

type BillingRegion = "india" | "international";

const INDIA_MONTHLY_PRICE = 2999;
const INTERNATIONAL_MONTHLY_PRICE = 29;

function getCountryFromAcceptLanguage(value: string | null) {
  if (!value) {
    return null;
  }

  const locales = value
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean);

  for (const locale of locales) {
    try {
      const region = new Intl.Locale(locale).region;
      if (region) {
        return region.toUpperCase();
      }
    } catch {
      const match = locale.match(/[-_]([A-Za-z]{2})$/);
      if (match) {
        return match[1].toUpperCase();
      }
    }
  }

  return null;
}

export async function getCountryCodeFromHeaders(headerList: Headers) {
  const fromGeoHeader =
    headerList.get("x-vercel-ip-country") ??
    headerList.get("cf-ipcountry") ??
    headerList.get("cloudfront-viewer-country") ??
    headerList.get("x-country-code") ??
    headerList.get("x-geo-country");

  if (fromGeoHeader && fromGeoHeader.length === 2) {
    return fromGeoHeader.toUpperCase();
  }

  if (process.env.NODE_ENV === "development") {
    try {
      const res = await fetch("https://ipapi.co/country/", {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length === 2) {
          return text.toUpperCase();
        }
      }
    } catch {
      // ignore
    }
  }

  return getCountryFromAcceptLanguage(headerList.get("accept-language"));
}

export function getBillingRegionForCountry(
  countryCode: string | null,
): BillingRegion {
  return countryCode === "IN" ? "india" : "international";
}

function getCurrencyForCountry(countryCode: string | null) {
  if (getBillingRegionForCountry(countryCode) === "india") {
    return { amount: INDIA_MONTHLY_PRICE, currency: "INR" };
  }

  return { amount: INTERNATIONAL_MONTHLY_PRICE, currency: "USD" };
}

function formatMonthlyPrice(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)}/month`;
}

export async function getLocalizedMonthlyPrice() {
  const headerList = await headers();
  const countryCode = await getCountryCodeFromHeaders(headerList);
  const { amount, currency } = getCurrencyForCountry(countryCode);
  const monthlyPrice = formatMonthlyPrice(amount, currency);

  return {
    inline: `about ${monthlyPrice}`,
    standalone: `About ${monthlyPrice}`,
  } satisfies LocalizedMonthlyPrice;
}
