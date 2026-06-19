import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agencyhub.com";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch with AgencyHub",
  description:
    "Have questions about finding or listing a marketing agency? Contact the AgencyHub team. We typically respond within 24 hours.",
  openGraph: {
    title: "Contact AgencyHub",
    description:
      "Get in touch with our team for questions about marketing agency listings, partnerships, or support.",
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact AgencyHub",
    description:
      "Get in touch with our team for questions about marketing agency listings, partnerships, or support.",
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
