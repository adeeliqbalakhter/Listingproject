"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X, ChevronDown } from "lucide-react";

const services = [
  { name: "SEO Agencies", href: "/seo-agencies" },
  { name: "PPC Agencies", href: "/ppc-agencies" },
  { name: "Social Media Agencies", href: "/social-media-agencies" },
  { name: "Web Design Agencies", href: "/web-design-agencies" },
  { name: "Content Marketing Agencies", href: "/content-marketing-agencies" },
  { name: "Email Marketing Agencies", href: "/email-marketing-agencies" },
  { name: "Branding Agencies", href: "/branding-agencies" },
  { name: "Digital Marketing Agencies", href: "/digital-marketing-agencies" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AH</span>
            </div>
            <span className="text-xl font-bold text-navy">AgencyHub</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-navy transition-colors">
                Services <ChevronDown className="w-4 h-4" />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 mt-1">
                  {services.map((service) => (
                    <Link
                      key={service.href}
                      href={service.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand transition-colors"
                    >
                      {service.name}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      href="/services"
                      className="block px-4 py-2 text-sm font-medium text-brand hover:bg-blue-50 transition-colors"
                    >
                      View All Services →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/agencies"
              className="text-sm font-medium text-gray-700 hover:text-navy transition-colors"
            >
              Browse Agencies
            </Link>
            <Link
              href="/get-quotes"
              className="text-sm font-medium text-gray-700 hover:text-navy transition-colors"
            >
              Get Quotes
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-gray-700 hover:text-navy transition-colors"
            >
              Blog
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/agencies"
              className="p-2 text-gray-500 hover:text-navy transition-colors"
              aria-label="Search agencies"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-gray-700 hover:text-navy transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
            >
              List Your Agency
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-500"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/agencies"
              className="block text-sm font-medium text-gray-700 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Browse Agencies
            </Link>
            <Link
              href="/get-quotes"
              className="block text-sm font-medium text-gray-700 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Get Quotes
            </Link>
            <Link
              href="/blog"
              className="block text-sm font-medium text-gray-700 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Blog
            </Link>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Services
              </p>
              {services.map((service) => (
                <Link
                  key={service.href}
                  href={service.href}
                  className="block text-sm text-gray-600 py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {service.name}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-center text-gray-700 py-2 border border-gray-300 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-medium text-center text-white bg-brand py-2 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                List Your Agency
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
