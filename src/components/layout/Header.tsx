"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Search, Menu, X, ChevronDown, ChevronRight, LogOut, LayoutDashboard, Shield,
  Megaphone, Target, Palette, Code, BarChart3, Mail, Globe, Zap,
  Building2, Users, Star, ArrowRight, Briefcase, Sparkles, TrendingUp
} from "lucide-react";
import { useAuth } from "@/components/providers/SessionProvider";

const serviceCategories = [
  {
    title: "Marketing",
    items: [
      { name: "SEO Agencies", href: "/seo-agencies", icon: TrendingUp, desc: "Boost search rankings" },
      { name: "PPC Agencies", href: "/ppc-agencies", icon: Target, desc: "Paid advertising experts" },
      { name: "Social Media", href: "/social-media-agencies", icon: Megaphone, desc: "Social strategy & management" },
      { name: "Content Marketing", href: "/content-marketing-agencies", icon: Sparkles, desc: "Content that converts" },
      { name: "Email Marketing", href: "/email-marketing-agencies", icon: Mail, desc: "Email campaigns & automation" },
    ],
  },
  {
    title: "Design & Development",
    items: [
      { name: "Web Design", href: "/web-design-agencies", icon: Palette, desc: "Beautiful, modern websites" },
      { name: "Digital Marketing", href: "/digital-marketing-agencies", icon: BarChart3, desc: "Full-service digital" },
      { name: "Branding", href: "/branding-agencies", icon: Zap, desc: "Brand identity & strategy" },
    ],
  },
];

const quickLinks = [
  { name: "Browse Agencies", href: "/agencies", icon: Building2 },
  { name: "Get Free Quotes", href: "/get-quotes", icon: Star },
  { name: "How It Works", href: "/how-it-works", icon: Globe },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, loading, logout } = useAuth();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleMegaEnter = () => {
    if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current);
    setMegaMenuOpen(true);
  };
  const handleMegaLeave = () => {
    megaMenuTimeout.current = setTimeout(() => setMegaMenuOpen(false), 150);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">AH</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-navy leading-tight">AgencyHub</span>
              <span className="text-[10px] text-gray-400 font-medium leading-tight tracking-wide hidden sm:block">FIND YOUR PERFECT AGENCY</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Mega Menu - Services */}
            <div
              ref={megaMenuRef}
              className="relative"
              onMouseEnter={handleMegaEnter}
              onMouseLeave={handleMegaLeave}
            >
              <button
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  megaMenuOpen
                    ? "text-brand bg-blue-50"
                    : "text-gray-600 hover:text-navy hover:bg-gray-50"
                }`}
              >
                Services
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Mega Menu Dropdown */}
              {megaMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[640px] bg-white rounded-2xl shadow-xl border border-gray-100 mt-2 overflow-hidden">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-8">
                      {serviceCategories.map((cat) => (
                        <div key={cat.title}>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat.title}</p>
                          <div className="space-y-1">
                            {cat.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                                onClick={() => setMegaMenuOpen(false)}
                              >
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                                  <item.icon className="w-4.5 h-4.5 text-brand group-hover:text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800 group-hover:text-navy">{item.name}</p>
                                  <p className="text-xs text-gray-400">{item.desc}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                    <Link
                      href="/services"
                      className="flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
                      onClick={() => setMegaMenuOpen(false)}
                    >
                      View All Services
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-navy hover:bg-gray-50 rounded-lg transition-all"
              >
                {link.name}
              </Link>
            ))}

            <Link
              href="/blog"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-navy hover:bg-gray-50 rounded-lg transition-all"
            >
              Blog
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/agencies"
              className="p-2 text-gray-400 hover:text-navy hover:bg-gray-50 rounded-lg transition-all"
              aria-label="Search agencies"
            >
              <Search className="w-5 h-5" />
            </Link>

            {loading ? (
              <div className="flex items-center gap-3 pl-2">
                <div className="w-20 h-5 bg-gray-100 rounded animate-pulse" />
                <div className="w-32 h-10 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border transition-all ${
                    userMenuOpen
                      ? "border-brand bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-sm font-semibold uppercase">
                    {user.name?.charAt(0) || user.email.charAt(0)}
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[100px]">{user.name || "Account"}</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[100px]">{user.email}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 xl:hidden">
                      <p className="text-sm font-medium text-gray-800 truncate">{user.name || "Account"}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Dashboard
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="w-4 h-4 text-gray-400" />
                          Admin Panel
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-navy hover:bg-gray-50 rounded-lg transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-5 py-2.5 bg-gradient-to-r from-brand to-brand-dark text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-brand/25 transition-all"
                >
                  List Your Agency
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-white z-50 overflow-y-auto">
            <div className="px-4 py-5 space-y-1">
              {/* Quick Links */}
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <link.icon className="w-4.5 h-4.5 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              ))}

              <Link
                href="/blog"
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Briefcase className="w-4.5 h-4.5 text-gray-500" />
                </div>
                <span className="text-sm font-medium">Blog</span>
              </Link>

              {/* Services Accordion */}
              <div className="border-t border-gray-100 mt-3 pt-3">
                <button
                  onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  className="flex items-center justify-between w-full px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Sparkles className="w-4.5 h-4.5 text-brand" />
                    </div>
                    <span className="text-sm font-medium">Services</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileServicesOpen && (
                  <div className="pl-4 pr-2 pb-2 space-y-4">
                    {serviceCategories.map((cat) => (
                      <div key={cat.title}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{cat.title}</p>
                        {cat.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            <item.icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    ))}
                    <Link
                      href="/services"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand"
                      onClick={() => setMobileOpen(false)}
                    >
                      View All Services <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Auth Section */}
              <div className="border-t border-gray-100 mt-3 pt-4 space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                ) : user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-semibold uppercase shrink-0">
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{user.name || "Account"}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-sm font-medium text-gray-700 rounded-xl border border-gray-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-sm font-medium text-gray-700 rounded-xl border border-gray-200"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-red-600 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signin"
                      className="flex items-center justify-center py-3 text-sm font-medium text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="flex items-center justify-center py-3 text-sm font-semibold text-white bg-gradient-to-r from-brand to-brand-dark rounded-xl shadow-sm"
                      onClick={() => setMobileOpen(false)}
                    >
                      List Your Agency
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
