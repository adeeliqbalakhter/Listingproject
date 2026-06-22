"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Link2 as LinkedinIcon,
  Loader2,
  Upload,
  Building2,
  Globe,
  Mail,
  Phone,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertCircle,
  Search,
  Image,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type LocationItem = { id: string; name: string; slug: string; code?: string };
type ServiceItem = { id: string; name: string; slug: string };
type IndustryItem = { id: string; name: string; slug: string };

const SOCIAL_PLATFORMS = [
  { key: "linkedinUrl", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { key: "twitterUrl", label: "Twitter / X", placeholder: "https://x.com/..." },
  { key: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/..." },
] as const;

type SocialLink = { platform: string; url: string };

const PHONE_CODES: Record<string, string> = {
  AF: "+93", AL: "+355", DZ: "+213", AR: "+54", AU: "+61", AT: "+43",
  BD: "+880", BE: "+32", BR: "+55", BG: "+359", KH: "+855", CA: "+1",
  CL: "+56", CN: "+86", CO: "+57", CR: "+506", HR: "+385", CZ: "+420",
  DK: "+45", DO: "+1", EC: "+593", EG: "+20", EE: "+372", ET: "+251",
  FI: "+358", FR: "+33", DE: "+49", GH: "+233", GR: "+30", GT: "+502",
  HK: "+852", HU: "+36", IS: "+354", IN: "+91", ID: "+62", IR: "+98",
  IQ: "+964", IE: "+353", IL: "+972", IT: "+39", JM: "+1", JP: "+81",
  JO: "+962", KZ: "+7", KE: "+254", KW: "+965", LV: "+371", LB: "+961",
  LT: "+370", LU: "+352", MY: "+60", MX: "+52", MA: "+212", MM: "+95",
  NP: "+977", NL: "+31", NZ: "+64", NG: "+234", NO: "+47", OM: "+968",
  PK: "+92", PA: "+507", PE: "+51", PH: "+63", PL: "+48", PT: "+351",
  QA: "+974", RO: "+40", RU: "+7", SA: "+966", RS: "+381", SG: "+65",
  SK: "+421", SI: "+386", ZA: "+27", KR: "+82", ES: "+34", LK: "+94",
  SE: "+46", CH: "+41", TW: "+886", TZ: "+255", TH: "+66", TN: "+216",
  TR: "+90", UA: "+380", AE: "+971", GB: "+44", US: "+1", UY: "+598",
  VE: "+58", VN: "+84",
  BH: "+973", BO: "+591", BA: "+387", BW: "+267", BN: "+673", CM: "+237",
  CU: "+53", CY: "+357", FJ: "+679", GE: "+995", HT: "+509", HN: "+504",
  MT: "+356", MU: "+230", MD: "+373", MC: "+377", MN: "+976", ME: "+382",
  MZ: "+258", NA: "+264", NI: "+505", MK: "+389", PY: "+595", PR: "+1",
  RW: "+250", SN: "+221", TT: "+1", UG: "+256", UZ: "+998", ZM: "+260",
  ZW: "+263",
};

const companySizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export default function CreateAgencyPage() {
  const router = useRouter();
  const [scraping, setScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ slug: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [countries, setCountries] = useState<LocationItem[]>([]);
  const [citiesList, setCitiesList] = useState<LocationItem[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceItem[]>([]);
  const [industryOptions, setIndustryOptions] = useState<IndustryItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { platform: "linkedinUrl", url: "" },
  ]);

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    countryId: "",
    cityId: "",
    address: "",
    foundedYear: "",
    companySize: "",
    hourlyRate: "",
    minProjectSize: "",
    logo: "",
    coverImage: "",
    metaTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/industries").then((r) => r.json()),
    ]).then(([loc, svc, ind]) => {
      setCountries(loc.data || []);
      setServiceOptions(svc.data || []);
      setIndustryOptions(ind.data || []);
    }).catch(() => {});
  }, []);

  const loadCities = useCallback((countryId: string) => {
    if (!countryId) { setCitiesList([]); return; }
    fetch(`/api/locations?countryId=${countryId}`)
      .then((r) => r.json())
      .then((data) => setCitiesList(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.countryId) loadCities(form.countryId);
  }, [form.countryId, loadCities]);

  const selectedCountry = countries.find((c) => c.id === form.countryId);
  const phoneCode = selectedCountry?.code ? PHONE_CODES[selectedCountry.code] : "";

  useEffect(() => {
    if (phoneCode && !form.phone) {
      setForm((prev) => ({ ...prev, phone: phoneCode + " " }));
    }
  }, [phoneCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "countryId") {
      setForm((prev) => ({ ...prev, cityId: "", phone: "" }));
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addSocialLink = () => {
    const used = socialLinks.map((s) => s.platform);
    const available = SOCIAL_PLATFORMS.find((p) => !used.includes(p.key));
    if (available) setSocialLinks([...socialLinks, { platform: available.key, url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: "platform" | "url", value: string) => {
    setSocialLinks(socialLinks.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agencies/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Scrape failed");
      const s = json.data.scraped;
      setForm((prev) => ({
        ...prev,
        name: s.name || prev.name,
        description: s.description || prev.description,
        website: s.website || prev.website,
        companySize: s.companySize || prev.companySize,
      }));
      if (s.linkedinUrl) {
        setSocialLinks((prev) => {
          const existing = prev.find((l) => l.platform === "linkedinUrl");
          if (existing) return prev.map((l) => l.platform === "linkedinUrl" ? { ...l, url: s.linkedinUrl } : l);
          return [{ platform: "linkedinUrl", url: s.linkedinUrl }, ...prev];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape");
    } finally {
      setScraping(false);
    }
  };

  const handleFileUpload = async (field: "logo" | "coverImage", file: File) => {
    const setter = field === "logo" ? setUploadingLogo : setUploadingCover;
    setter(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", field === "logo" ? "logo" : "cover");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      update(field, json.data?.url || json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setter(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Agency name is required"); return; }
    setSubmitting(true);
    setError(null);

    const socialData: Record<string, string> = {};
    socialLinks.forEach((link) => {
      if (link.url.trim()) socialData[link.platform] = link.url.trim();
    });

    try {
      const res = await fetch("/api/admin/agencies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          tagline: form.tagline || undefined,
          description: form.description || undefined,
          website: form.website || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          countryId: form.countryId || undefined,
          cityId: form.cityId || undefined,
          address: form.address || undefined,
          foundedYear: form.foundedYear ? parseInt(form.foundedYear) : undefined,
          companySize: form.companySize || undefined,
          hourlyRate: form.hourlyRate || undefined,
          minProjectSize: form.minProjectSize ? Number(form.minProjectSize) : undefined,
          logo: form.logo || undefined,
          coverImage: form.coverImage || undefined,
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
          serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
          industryIds: selectedIndustryIds.length > 0 ? selectedIndustryIds : undefined,
          ...socialData,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create agency");
      setSuccess({ slug: json.data.agency.slug });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Agency Created!</h1>
          <p className="text-gray-500 mb-6">
            The agency profile has been created as <strong>Unclaimed</strong> and is now visible publicly.
            The agency owner can claim it from the public profile page.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/agencies/${success.slug}`}
              className="px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              View Public Profile
            </Link>
            <Link
              href="/admin/agencies"
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Agencies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/agencies" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Agencies
        </Link>
        <h1 className="text-2xl font-bold text-navy">Create Unclaimed Agency</h1>
        <p className="mt-1 text-gray-500">Create an agency profile that can be claimed by the real owner.</p>
      </div>

      {/* LinkedIn Scrape */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <LinkedinIcon className="w-5 h-5 text-[#0A66C2]" />
          <h2 className="font-semibold text-navy text-sm">Import from LinkedIn</h2>
          <span className="text-xs text-gray-400">(optional)</span>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder="https://www.linkedin.com/company/agency-name"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <button
            onClick={handleScrape}
            disabled={scraping || !scrapeUrl.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0A66C2] text-white rounded-lg text-sm font-medium hover:bg-[#004182] transition-colors disabled:opacity-50"
          >
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scraping ? "Fetching..." : "Import"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Paste a LinkedIn company URL to auto-fill available data.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover + Logo */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div
            className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center border-b border-gray-100 relative group cursor-pointer overflow-hidden"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/jpeg,image/png,image/webp";
              input.onchange = (ev) => {
                const file = (ev.target as HTMLInputElement).files?.[0];
                if (file) handleFileUpload("coverImage", file);
              };
              input.click();
            }}
          >
            {form.coverImage ? (
              <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Image className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Cover Image (1200 x 400 recommended)</p>
                <span className="mt-2 text-xs text-brand font-medium flex items-center gap-1 mx-auto justify-center">
                  {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload Cover Image
                </span>
              </div>
            )}
          </div>
          <div className="px-6 py-4 flex items-center gap-4">
            <div
              className="w-20 h-20 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center -mt-14 relative z-10 bg-white cursor-pointer overflow-hidden"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/jpeg,image/png,image/webp";
                input.onchange = (ev) => {
                  const file = (ev.target as HTMLInputElement).files?.[0];
                  if (file) handleFileUpload("logo", file);
                };
                input.click();
              }}
            >
              {form.logo ? (
                <img src={form.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="text-center">
                  {uploadingLogo ? <Loader2 className="w-5 h-5 text-gray-400 mx-auto animate-spin" /> : <Upload className="w-5 h-5 text-gray-400 mx-auto" />}
                  <span className="text-[10px] text-gray-400">Logo</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-navy">{form.name || "Agency Name"}</p>
              <p className="text-xs text-gray-500">{form.tagline || "Your tagline"}</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy mb-5 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand" /> Basic Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="Agency name" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
              <input name="tagline" value={form.tagline} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="Short description" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y" placeholder="About the agency..." />
              <p className="mt-1 text-xs text-gray-400">{form.description.length} characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5"><Globe className="w-3.5 h-3.5 inline mr-1" />Website</label>
              <input name="website" value={form.website} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="https://agency.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5"><Mail className="w-3.5 h-3.5 inline mr-1" />Email</label>
              <input name="email" value={form.email} onChange={handleChange} type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="info@agency.com" />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy mb-5 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand" /> Location
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <select name="countryId" value={form.countryId} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white">
                <option value="">Select a country</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <select name="cityId" value={form.cityId} onChange={handleChange} disabled={!form.countryId}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white disabled:opacity-50">
                <option value="">{form.countryId ? "Select a city" : "Select a country first"}</option>
                {citiesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5"><Phone className="w-3.5 h-3.5 inline mr-1" />Phone</label>
              <div className="flex gap-2">
                {phoneCode && (
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-600 font-mono">
                    {phoneCode}
                  </span>
                )}
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder={phoneCode ? `${phoneCode} XXX XXX XXXX` : "+1 (555) 000-0000"} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="Street address" />
            </div>
          </div>
        </section>

        {/* Company Details */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand" /> Company Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Founded Year</label>
              <input name="foundedYear" type="number" value={form.foundedYear} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="2020" min="1900" max={new Date().getFullYear()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5"><Users className="w-3.5 h-3.5 inline mr-1" />Company Size</label>
              <select name="companySize" value={form.companySize} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white">
                <option value="">Select size</option>
                {companySizes.map((s) => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5"><DollarSign className="w-3.5 h-3.5 inline mr-1" />Hourly Rate</label>
              <select name="hourlyRate" value={form.hourlyRate} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white">
                <option value="">Select rate</option>
                <option>Under $25</option>
                <option>$25 - $49</option>
                <option>$50 - $99</option>
                <option>$100 - $149</option>
                <option>$150 - $199</option>
                <option>$200+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Min. Project Size</label>
              <select name="minProjectSize" value={form.minProjectSize} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white">
                <option value="">Select minimum</option>
                <option value="1000">$1,000</option>
                <option value="5000">$5,000</option>
                <option value="10000">$10,000</option>
                <option value="25000">$25,000</option>
                <option value="50000">$50,000+</option>
              </select>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy mb-5">Services</h2>
          {serviceOptions.length === 0 ? (
            <p className="text-sm text-gray-500">No services available. Please run the setup first.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {serviceOptions.map((svc) => {
                const selected = selectedServiceIds.includes(svc.id);
                return (
                  <label key={svc.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      selected ? "border-brand bg-blue-50 text-brand" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    <input type="checkbox" checked={selected} className="sr-only"
                      onChange={() => setSelectedServiceIds((prev) => selected ? prev.filter((id) => id !== svc.id) : [...prev, svc.id])} />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected ? "bg-brand border-brand" : "border-gray-300"}`}>
                      {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    {svc.name}
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* Industries */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy mb-5">Industries</h2>
          {industryOptions.length === 0 ? (
            <p className="text-sm text-gray-500">No industries available. Please run the setup first.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {industryOptions.map((ind) => {
                const selected = selectedIndustryIds.includes(ind.id);
                return (
                  <label key={ind.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      selected ? "border-brand bg-blue-50 text-brand" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    <input type="checkbox" checked={selected} className="sr-only"
                      onChange={() => setSelectedIndustryIds((prev) => selected ? prev.filter((id) => id !== ind.id) : [...prev, ind.id])} />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected ? "bg-brand border-brand" : "border-gray-300"}`}>
                      {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    {ind.name}
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* Social Links */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-navy">Social Links</h2>
            {socialLinks.length < SOCIAL_PLATFORMS.length && (
              <button type="button" onClick={addSocialLink} className="text-sm text-brand font-medium flex items-center gap-1 hover:text-brand-dark">
                <Plus className="w-4 h-4" /> Add Link
              </button>
            )}
          </div>
          <div className="space-y-4">
            {socialLinks.map((link, index) => {
              const platformInfo = SOCIAL_PLATFORMS.find((p) => p.key === link.platform);
              const usedPlatforms = socialLinks.map((s) => s.platform);
              return (
                <div key={index} className="flex gap-3 items-start">
                  <select value={link.platform} onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white min-w-[140px]">
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p.key} value={p.key} disabled={usedPlatforms.includes(p.key) && p.key !== link.platform}>{p.label}</option>
                    ))}
                  </select>
                  <input value={link.url} onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                    placeholder={platformInfo?.placeholder || "https://..."} className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
                  <button type="button" onClick={() => removeSocialLink(index)} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* SEO */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy mb-5 flex items-center gap-2">
            <Search className="w-5 h-5 text-brand" /> SEO Settings
          </h2>
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title ({form.metaTitle.length}/70)</label>
              <input name="metaTitle" value={form.metaTitle} onChange={handleChange} maxLength={70}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="Auto-generated from name + tagline" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description ({form.metaDescription.length}/160)</label>
              <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} maxLength={160} rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none" placeholder="Auto-generated from description" />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
            <p className="text-xs text-green-700 mb-1">www.agencyhub.com &rsaquo; agencies &rsaquo; {form.name ? form.name.toLowerCase().replace(/\s+/g, "-") : "agency-name"}</p>
            <p className="text-lg text-blue-800 font-medium">{form.metaTitle || form.name || "Agency Name"}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{form.metaDescription || form.description || "Agency description will appear here."}</p>
          </div>
        </section>

        {/* Submit */}
        <div className="flex gap-3 justify-end pb-8">
          <Link href="/admin/agencies" className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={submitting || !form.name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            {submitting ? "Creating..." : "Create Unclaimed Agency"}
          </button>
        </div>
      </form>
    </div>
  );
}
