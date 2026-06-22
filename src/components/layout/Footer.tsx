import Link from "next/link";

const footerSections = [
  {
    title: "For Businesses",
    links: [
      { name: "Find Agencies", href: "/agencies" },
      { name: "Get Free Quotes", href: "/get-quotes" },
      { name: "Compare Agencies", href: "/compare" },
      { name: "How It Works", href: "/how-it-works" },
      { name: "Agency Reviews", href: "/reviews" },
    ],
  },
  {
    title: "For Agencies",
    links: [
      { name: "List Your Agency", href: "/auth/signup" },
      { name: "Pricing Plans", href: "/pricing" },
      { name: "Agency Dashboard", href: "/dashboard" },
      { name: "Success Stories", href: "/success-stories" },
      { name: "Claim Your Profile", href: "/agencies" },
    ],
  },
  {
    title: "Services",
    links: [
      { name: "SEO Agencies", href: "/seo-agencies" },
      { name: "PPC Agencies", href: "/ppc-agencies" },
      { name: "Social Media Agencies", href: "/social-media-agencies" },
      { name: "Web Design Agencies", href: "/web-design-agencies" },
      { name: "Content Marketing", href: "/content-marketing-agencies" },
      { name: "Digital Marketing", href: "/digital-marketing-agencies" },
      { name: "Branding Agencies", href: "/branding-agencies" },
      { name: "Email Marketing", href: "/email-marketing-agencies" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Blog", href: "/blog" },
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
      { name: "Careers", href: "/careers" },
    ],
  },
];

const legalLinks = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="bg-navy">
      {/* CTA Banner */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Ready to find your perfect agency?
              </h2>
              <p className="text-gray-400 mt-2 text-sm md:text-base">
                Join thousands of businesses that found their ideal marketing partner on AgencyHub.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/get-quotes"
                className="px-6 py-3 bg-white text-navy text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Get Free Quotes
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors whitespace-nowrap"
              >
                List Your Agency
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold text-sm mb-4 tracking-wide">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo + Copyright */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand to-brand-dark rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs tracking-tight">AH</span>
                </div>
                <span className="text-white font-bold">AgencyHub</span>
              </Link>
              <span className="hidden md:block text-gray-600">|</span>
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} AgencyHub. All rights reserved.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
