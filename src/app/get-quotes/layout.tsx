import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agencyhub.com";

export const metadata: Metadata = {
  title: "Get Free Quotes from Top Marketing Agencies",
  description:
    "Tell us about your project and receive free proposals from vetted marketing agencies. Compare quotes, portfolios, and reviews.",
  openGraph: {
    title: "Get Free Quotes from Top Marketing Agencies | AgencyHub",
    description:
      "Submit your project and receive proposals from verified marketing agencies within 48 hours.",
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Free Quotes from Top Marketing Agencies | AgencyHub",
    description:
      "Submit your project and receive proposals from verified marketing agencies within 48 hours.",
  },
  alternates: {
    canonical: "/get-quotes",
  },
};

export default function GetQuotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
