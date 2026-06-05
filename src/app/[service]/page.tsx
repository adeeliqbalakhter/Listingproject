import Link from "next/link";
import { Star, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const serviceData: Record<
  string,
  {
    name: string;
    title: string;
    description: string;
    longDescription: string;
    benefits: string[];
  }
> = {
  "seo-agencies": {
    name: "SEO",
    title: "Top SEO Agencies",
    description:
      "Find and compare the best SEO agencies worldwide. Read verified reviews and get free quotes from top-rated search engine optimization experts.",
    longDescription:
      "Search Engine Optimization (SEO) is essential for driving organic traffic to your website. The right SEO agency can help you rank higher on Google, increase your visibility, and attract qualified leads. Browse our curated directory of verified SEO agencies with proven track records.",
    benefits: [
      "Increase organic search rankings",
      "Drive more qualified traffic to your website",
      "Improve site authority and domain rating",
      "Get more leads without paying for ads",
      "Build long-term sustainable growth",
    ],
  },
  "ppc-agencies": {
    name: "PPC",
    title: "Top PPC Agencies",
    description:
      "Find and compare the best PPC agencies worldwide. Read verified reviews and get free quotes from top-rated pay-per-click advertising experts.",
    longDescription:
      "Pay-Per-Click (PPC) advertising delivers immediate, measurable results. A skilled PPC agency can maximize your ad spend across Google Ads, Bing Ads, and social platforms. Browse our vetted PPC agencies to find the perfect partner for your campaigns.",
    benefits: [
      "Get immediate visibility and traffic",
      "Target specific audiences with precision",
      "Maximize return on ad spend (ROAS)",
      "Scale campaigns quickly and effectively",
      "Access detailed performance reporting",
    ],
  },
  "social-media-agencies": {
    name: "Social Media",
    title: "Top Social Media Agencies",
    description:
      "Find and compare the best social media agencies worldwide. Read verified reviews and get free quotes from top-rated social media marketing experts.",
    longDescription:
      "Social media is where your customers spend their time. A great social media agency builds your brand presence, engages your audience, and drives conversions across platforms like Instagram, TikTok, LinkedIn, and Facebook.",
    benefits: [
      "Build brand awareness and loyalty",
      "Engage directly with your audience",
      "Create compelling content that converts",
      "Manage community and reputation",
      "Run effective social ad campaigns",
    ],
  },
  "web-design-agencies": {
    name: "Web Design",
    title: "Top Web Design Agencies",
    description:
      "Find and compare the best web design agencies worldwide. Read verified reviews and get free quotes from top-rated website design and development experts.",
    longDescription:
      "Your website is your digital storefront. A professional web design agency creates beautiful, fast, and conversion-optimized websites that represent your brand and drive business results.",
    benefits: [
      "Get a professional, modern website",
      "Improve user experience and conversions",
      "Build mobile-responsive designs",
      "Optimize for speed and performance",
      "Create SEO-friendly site architecture",
    ],
  },
  "content-marketing-agencies": {
    name: "Content Marketing",
    title: "Top Content Marketing Agencies",
    description:
      "Find and compare the best content marketing agencies worldwide. Read verified reviews and get free quotes from top-rated content strategy experts.",
    longDescription:
      "Content marketing builds trust and authority with your audience. A skilled content agency creates compelling articles, videos, infographics, and more that attract, engage, and convert your target audience.",
    benefits: [
      "Build authority in your industry",
      "Attract organic traffic through valuable content",
      "Nurture leads through the buyer's journey",
      "Improve SEO with quality content",
      "Establish thought leadership",
    ],
  },
  "email-marketing-agencies": {
    name: "Email Marketing",
    title: "Top Email Marketing Agencies",
    description:
      "Find and compare the best email marketing agencies worldwide. Read verified reviews and get free quotes from top-rated email marketing experts.",
    longDescription:
      "Email marketing delivers the highest ROI of any digital marketing channel. An expert email agency helps you build lists, create compelling campaigns, automate flows, and drive revenue from your subscriber base.",
    benefits: [
      "Highest ROI marketing channel",
      "Build and nurture customer relationships",
      "Automate customer journeys",
      "Drive repeat purchases and retention",
      "Get detailed analytics and insights",
    ],
  },
  "branding-agencies": {
    name: "Branding",
    title: "Top Branding Agencies",
    description:
      "Find and compare the best branding agencies worldwide. Read verified reviews and get free quotes from top-rated brand strategy and identity experts.",
    longDescription:
      "Your brand is more than a logo — it's how customers perceive and experience your business. A branding agency develops your brand strategy, visual identity, messaging, and positioning to differentiate you in the market.",
    benefits: [
      "Define your brand strategy and positioning",
      "Create a memorable visual identity",
      "Develop consistent brand messaging",
      "Stand out from competitors",
      "Build emotional connections with customers",
    ],
  },
  "digital-marketing-agencies": {
    name: "Digital Marketing",
    title: "Top Digital Marketing Agencies",
    description:
      "Find and compare the best digital marketing agencies worldwide. Read verified reviews and get free quotes from full-service digital marketing experts.",
    longDescription:
      "A full-service digital marketing agency handles all aspects of your online presence — from SEO and PPC to social media and content. Perfect for businesses wanting a single partner for their entire digital strategy.",
    benefits: [
      "One partner for all digital channels",
      "Integrated marketing strategy",
      "Consistent brand messaging across channels",
      "Holistic analytics and reporting",
      "Cost-effective bundled services",
    ],
  },
};

const mockAgencies = [
  { name: "GrowthPulse Digital", slug: "growthpulse-digital", rating: 4.9, reviews: 127, location: "New York, US", size: "51-200" },
  { name: "ClickBoost Agency", slug: "clickboost-agency", rating: 4.8, reviews: 94, location: "London, UK", size: "11-50" },
  { name: "NexGen Marketing", slug: "nexgen-marketing", rating: 4.8, reviews: 83, location: "Toronto, CA", size: "11-50" },
  { name: "Digital Spark Co", slug: "digital-spark-co", rating: 4.7, reviews: 156, location: "Sydney, AU", size: "51-200" },
  { name: "Elevate Media", slug: "elevate-media", rating: 4.7, reviews: 72, location: "Berlin, DE", size: "11-50" },
  { name: "Pixel Perfect Studio", slug: "pixel-perfect-studio", rating: 4.6, reviews: 61, location: "Dubai, UAE", size: "1-10" },
];

type Params = Promise<{ service: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { service: serviceSlug } = await params;
  const service = serviceData[serviceSlug];
  if (!service) return {};
  return {
    title: `${service.title} - Find the Best ${service.name} Agencies | AgencyHub`,
    description: service.description,
    openGraph: {
      title: `${service.title} | AgencyHub`,
      description: service.description,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(serviceData).map((service) => ({ service }));
}

export default async function ServicePage({ params }: { params: Params }) {
  const { service: serviceSlug } = await params;
  const service = serviceData[serviceSlug];

  if (!service) {
    notFound();
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {service.title}
          </h1>
          <p className="mt-3 text-lg text-gray-300 max-w-2xl">
            {service.description}
          </p>
          <div className="mt-6">
            <Link
              href="/get-quotes"
              className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors"
            >
              Get Free Quotes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Agency List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-navy mb-6">
              Best {service.name} Agencies ({mockAgencies.length})
            </h2>
            <div className="space-y-4">
              {mockAgencies.map((agency) => (
                <Link
                  key={agency.slug}
                  href={`/agencies/${agency.slug}`}
                  className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-brand/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-brand to-navy-light rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">
                        {agency.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy">
                          {agency.name}
                        </h3>
                        <CheckCircle className="w-4 h-4 text-brand shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {agency.rating}
                          </span>
                          <span className="text-sm text-gray-400">
                            ({agency.reviews} reviews)
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {agency.location}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {agency.size} employees
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-navy mb-3">
                About {service.name} Agencies
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {service.longDescription}
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-navy mb-3">
                Benefits of Hiring a {service.name} Agency
              </h3>
              <ul className="space-y-2.5">
                {service.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="bg-brand rounded-xl p-6 text-white">
              <h3 className="font-semibold text-lg">
                Need a {service.name} Agency?
              </h3>
              <p className="mt-2 text-sm text-blue-100">
                Tell us about your project and get matched with the best agencies
                for free.
              </p>
              <Link
                href="/get-quotes"
                className="mt-4 inline-block bg-white text-brand px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
              >
                Get Free Quotes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy mb-4">
            How to Find the Best {service.name} Agency
          </h2>
          <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
            <p>
              Choosing the right {service.name.toLowerCase()} agency is crucial for
              your business growth. Here are key factors to consider when evaluating
              agencies on AgencyHub:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Verified Reviews:</strong> Read honest feedback from real
                clients who have worked with the agency.
              </li>
              <li>
                <strong>Portfolio & Case Studies:</strong> Review their past work to
                understand their capabilities and style.
              </li>
              <li>
                <strong>Industry Experience:</strong> Look for agencies with
                experience in your specific industry.
              </li>
              <li>
                <strong>Pricing Transparency:</strong> Compare hourly rates, project
                minimums, and pricing models.
              </li>
              <li>
                <strong>Communication Style:</strong> Ensure their communication
                approach aligns with your expectations.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
