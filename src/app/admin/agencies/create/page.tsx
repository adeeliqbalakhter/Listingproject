"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

interface AgencyForm {
  name: string;
  tagline: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  foundedYear: string;
  companySize: string;
  hourlyRate: string;
  address: string;
  linkedinUrl: string;
  logo: string;
  coverImage: string;
}

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

  const [form, setForm] = useState<AgencyForm>({
    name: "",
    tagline: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    foundedYear: "",
    companySize: "",
    hourlyRate: "",
    address: "",
    linkedinUrl: "",
    logo: "",
    coverImage: "",
  });

  const update = (field: keyof AgencyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        linkedinUrl: s.linkedinUrl || prev.linkedinUrl,
      }));
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
    try {
      const res = await fetch("/api/admin/agencies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          foundedYear: form.foundedYear ? parseInt(form.foundedYear) : undefined,
          socialLinks: form.linkedinUrl ? { linkedin: form.linkedinUrl } : undefined,
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
    <div className="max-w-3xl mx-auto">
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
        <p className="text-xs text-gray-400 mt-2">Paste a LinkedIn company URL to auto-fill available data. You can edit everything after.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-navy text-sm mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name *</label>
              <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Agency name" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input type="text" value={form.tagline} onChange={(e) => update("tagline", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Short description" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" placeholder="About the agency..." />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-navy text-sm mb-4 flex items-center gap-2">
            <Image className="w-4 h-4" /> Images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              {form.logo ? (
                <div className="relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden mb-2">
                  <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => update("logo", "")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                </div>
              ) : null}
              <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand transition-colors">
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
                <span className="text-sm text-gray-500">{uploadingLogo ? "Uploading..." : "Upload logo"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload("logo", e.target.files[0])} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
              {form.coverImage ? (
                <div className="relative w-full h-24 rounded-lg border border-gray-200 overflow-hidden mb-2">
                  <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => update("coverImage", "")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                </div>
              ) : null}
              <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand transition-colors">
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
                <span className="text-sm text-gray-500">{uploadingCover ? "Uploading..." : "Upload cover"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload("coverImage", e.target.files[0])} />
              </label>
            </div>
          </div>
        </div>

        {/* Contact & Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-navy text-sm mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Contact & Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="https://agency.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="info@agency.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" value={form.foundedYear} onChange={(e) => update("foundedYear", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="2015" min="1900" max="2030" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select value={form.companySize} onChange={(e) => update("companySize", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white appearance-none">
                  <option value="">Select size</option>
                  {companySizes.map((s) => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.hourlyRate} onChange={(e) => update("hourlyRate", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="$100 - $200" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="New York, NY, USA" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
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
