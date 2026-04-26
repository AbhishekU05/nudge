import "server-only";

import { headers } from "next/headers";

type LocalizedMonthlyPrice = {
  inline: string;
  standalone: string;
};

const EURO_COUNTRIES = new Set([
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
]);

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

function getCountryCode(headerList: Headers) {
  const fromGeoHeader =
    headerList.get("x-vercel-ip-country") ??
    headerList.get("cf-ipcountry") ??
    headerList.get("cloudfront-viewer-country") ??
    headerList.get("x-country-code") ??
    headerList.get("x-geo-country");

  if (fromGeoHeader && fromGeoHeader.length === 2) {
    return fromGeoHeader.toUpperCase();
  }

  return getCountryFromAcceptLanguage(headerList.get("accept-language"));
}

function getCurrencyForCountry(countryCode: string | null) {
  if (countryCode === "IN") {
    return { amount: 100, currency: "INR" };
  }

  if (countryCode === "GB") {
    return { amount: 1, currency: "GBP" };
  }

  if (EURO_COUNTRIES.has(countryCode ?? "")) {
    return { amount: 1, currency: "EUR" };
  }

  if (countryCode === "CA") {
    return { amount: 1, currency: "CAD" };
  }

  if (countryCode === "AU") {
    return { amount: 1, currency: "AUD" };
  }

  if (countryCode === "NZ") {
    return { amount: 1, currency: "NZD" };
  }

  if (countryCode === "SG") {
    return { amount: 1, currency: "SGD" };
  }

  return { amount: 1, currency: "USD" };
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
  const countryCode = getCountryCode(headerList);
  const { amount, currency } = getCurrencyForCountry(countryCode);
  const monthlyPrice = formatMonthlyPrice(amount, currency);

  return {
    inline: `about ${monthlyPrice}`,
    standalone: `About ${monthlyPrice}`,
  } satisfies LocalizedMonthlyPrice;
}
