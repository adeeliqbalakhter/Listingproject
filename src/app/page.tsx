import HomeClient from "@/components/home/HomeClient";

export default function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agencyhub.com";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AgencyHub",
      url: baseUrl,
      description:
        "Find the perfect marketing agency for your business. Compare top-rated agencies worldwide with verified reviews and free quotes.",
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/agencies?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AgencyHub",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description:
        "AgencyHub is the leading marketing agency directory. Browse verified agencies, read reviews, and get free quotes.",
      sameAs: [
        "https://twitter.com/agencyhub",
        "https://linkedin.com/company/agencyhub",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@agencyhub.com",
        availableLanguage: ["English"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
