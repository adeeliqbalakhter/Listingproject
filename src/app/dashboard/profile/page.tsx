"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Upload,
  Save,
  Search,
  Loader2,
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Languages as LanguagesIcon,
  Globe2,
  X,
  ChevronRight,
  ExternalLink,
  Share2,
  PieChart,
  Package,
  HelpCircle,
  Wrench,
  Sparkles,
  MessageSquareText,
} from "lucide-react";

type LocationItem = { id: string; name: string; slug: string; code?: string };
type ServiceItem = { id: string; name: string; slug: string };
type IndustryItem = { id: string; name: string; slug: string };

const SOCIAL_PLATFORMS = [
  { key: "linkedinUrl", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { key: "twitterUrl", label: "Twitter / X", placeholder: "https://x.com/..." },
  { key: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/..." },
] as const;

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
};

const TIMEZONE_OPTIONS = [
  "UTC-12:00 (Baker Island)", "UTC-11:00 (Samoa)", "UTC-10:00 (Hawaii)", "UTC-09:00 (Alaska)",
  "UTC-08:00 (Pacific Time)", "UTC-07:00 (Mountain Time)", "UTC-06:00 (Central Time)",
  "UTC-05:00 (Eastern Time)", "UTC-04:00 (Atlantic Time)", "UTC-03:00 (Buenos Aires)",
  "UTC-02:00 (Mid-Atlantic)", "UTC-01:00 (Azores)", "UTC+00:00 (GMT/London)",
  "UTC+01:00 (CET/Paris)", "UTC+02:00 (EET/Cairo)", "UTC+03:00 (Moscow/Riyadh)",
  "UTC+03:30 (Tehran)", "UTC+04:00 (Dubai/Baku)", "UTC+04:30 (Kabul)",
  "UTC+05:00 (Karachi/Tashkent)", "UTC+05:30 (IST/Mumbai)", "UTC+05:45 (Kathmandu)",
  "UTC+06:00 (Dhaka/Almaty)", "UTC+06:30 (Yangon)", "UTC+07:00 (Bangkok/Jakarta)",
  "UTC+08:00 (Singapore/Beijing)", "UTC+09:00 (Tokyo/Seoul)", "UTC+09:30 (Adelaide)",
  "UTC+10:00 (Sydney/Melbourne)", "UTC+11:00 (Solomon Islands)", "UTC+12:00 (Auckland/Fiji)",
  "UTC+13:00 (Tonga)",
];

type SocialLink = { platform: string; url: string };

type OfficeLocation = {
  label: string;
  address: string;
  cityId: string;
  countryId: string;
  latitude: string;
  longitude: string;
  isHeadquarters: boolean;
};

type ServiceFocusItem = { serviceId: string; percentage: number };

type PackageTier = {
  label: string;
  price: string;
  frequency: string;
  audience: string;
  features: Array<{ name: string; type: "text" | "checkmark"; value: string }>;
};

type PackageItem = {
  serviceLine: string;
  focusArea: string;
  name: string;
  description: string;
  tiers: PackageTier[];
};

type TeamInfo = {
  story: string;
  teamPhoto: string;
  videoUrl: string;
  setsApart: string[];
  quickFacts: string[];
  tools: string[];
  faq: Array<{ question: string; answer: string }>;
};

const emptyOffice = (): OfficeLocation => ({
  label: "", address: "", cityId: "", countryId: "", latitude: "", longitude: "", isHeadquarters: false,
});

const emptyTier = (label: string): PackageTier => ({
  label, price: "", frequency: "", audience: "", features: [],
});

const emptyPackage = (): PackageItem => ({
  serviceLine: "", focusArea: "", name: "", description: "",
  tiers: [emptyTier("Small Tier"), emptyTier("Medium Tier"), emptyTier("Large Tier")],
});

const emptyTeamInfo = (): TeamInfo => ({
  story: "", teamPhoto: "", videoUrl: "", setsApart: [], quickFacts: [], tools: [], faq: [],
});

const PIE_COLORS = [
  "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa",
  "#7dd3fc", "#155e75", "#0e7490", "#0891b2", "#06b6d4",
  "#059669", "#10b981", "#34d399", "#6ee7b7", "#a78bfa",
  "#8b5cf6", "#7c3aed", "#f59e0b", "#f97316", "#ef4444",
];

// ─── Section definitions ───
const SECTIONS = [
  { id: "company", label: "Company Information", icon: Building2 },
  { id: "team", label: "About The Team", icon: Users },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "services", label: "Service Lines", icon: PieChart },
  { id: "industries", label: "Industries", icon: Building2 },
  { id: "packages", label: "Packages", icon: Package },
  { id: "seo", label: "SEO Settings", icon: Search },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ─── Simple SVG pie chart ───
function PieChartSVG({ items, colors }: { items: { label: string; pct: number }[]; colors: string[] }) {
  const valid = items.filter((i) => i.pct > 0);
  if (valid.length === 0) return <div className="w-48 h-48 rounded-full bg-gray-100 mx-auto" />;

  let cumulative = 0;
  const slices: Array<{ startAngle: number; endAngle: number; color: string; label: string; pct: number }> = [];
  valid.forEach((item, i) => {
    const start = cumulative;
    cumulative += item.pct;
    slices.push({ startAngle: start * 3.6, endAngle: cumulative * 3.6, color: colors[i % colors.length], label: item.label, pct: item.pct });
  });

  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const cx = 100, cy = 100, r = 90;

  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
      {slices.map((s, i) => {
        const largeArc = s.endAngle - s.startAngle > 180 ? 1 : 0;
        const x1 = cx + r * Math.cos(toRad(s.startAngle));
        const y1 = cy + r * Math.sin(toRad(s.startAngle));
        const x2 = cx + r * Math.cos(toRad(s.endAngle));
        const y2 = cy + r * Math.sin(toRad(s.endAngle));
        const midAngle = toRad((s.startAngle + s.endAngle) / 2);
        const labelR = 55;
        const lx = cx + labelR * Math.cos(midAngle);
        const ly = cy + labelR * Math.sin(midAngle);
        return (
          <g key={i}>
            <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={s.color} stroke="white" strokeWidth="2" />
            {s.pct >= 8 && <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">{s.pct}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Helper: parse JSONB ───
function parseJsonField(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return null; } }
  return raw;
}

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<SectionId>("company");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittingForReview, setSubmittingForReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [existingAgencyId, setExistingAgencyId] = useState<string | null>(null);
  const [agencyStatus, setAgencyStatus] = useState<string | null>(null);
  const [agencySlug, setAgencySlug] = useState<string | null>(null);

  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailVerifyError, setEmailVerifyError] = useState<string | null>(null);

  const [countries, setCountries] = useState<LocationItem[]>([]);
  const [citiesList, setCitiesList] = useState<LocationItem[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceItem[]>([]);
  const [industryOptions, setIndustryOptions] = useState<IndustryItem[]>([]);

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([{ platform: "linkedinUrl", url: "" }]);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [form, setForm] = useState({
    name: "", tagline: "", description: "", website: "", email: "", phone: "",
    countryId: "", cityId: "", address: "", foundedYear: "", companySize: "",
    hourlyRate: "", minProjectSize: "", metaTitle: "", metaDescription: "",
  });

  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
  const [timezones, setTimezones] = useState<string[]>([]);
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [officeCities, setOfficeCities] = useState<Record<number, LocationItem[]>>({});
  const [serviceFocus, setServiceFocus] = useState<ServiceFocusItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [teamInfo, setTeamInfo] = useState<TeamInfo>(emptyTeamInfo());
  const [toolInput, setToolInput] = useState("");

  // ─── Section completion tracking ───
  const sectionComplete = useMemo(() => {
    const filled = (v: string) => v.trim().length > 0;
    return {
      company: filled(form.name) && filled(form.email),
      team: filled(teamInfo.story) || teamInfo.setsApart.length > 0,
      locations: offices.length > 0,
      social: socialLinks.some((s) => filled(s.url)),
      services: serviceFocus.length > 0 && serviceFocus.reduce((a, b) => a + b.percentage, 0) === 100,
      industries: selectedIndustryIds.length > 0,
      packages: packages.length > 0 && packages.some((p) => filled(p.name)),
      seo: filled(form.metaTitle),
    };
  }, [form, teamInfo, offices, socialLinks, serviceFocus, selectedIndustryIds, packages]);

  // ─── Data loading ───
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(me => {
      if (!me?.data?.id) { setLoading(false); return; }
      setCurrentUser({ id: me.data.id, email: me.data.email, role: me.data.role });
      return loadProfile(me.data.id);
    }).catch(() => setLoading(false));
  }, []);

  const loadProfile = useCallback((_userId: string) => {
    Promise.all([
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/industries").then((r) => r.json()),
      fetch("/api/agencies/mine").then((r) => r.json()),
    ])
      .then(([loc, svc, ind, mineRes]) => {
        setCountries(loc.data || []);
        setServiceOptions(svc.data || []);
        setIndustryOptions(ind.data || []);

        const agency = mineRes.data?.agency ?? null;
        if (!agency) return;

        setExistingAgencyId(agency.id);
        setAgencyStatus(agency.status || null);
        setAgencySlug(agency.slug || null);

        setForm({
          name: agency.name || "", tagline: agency.tagline || "", description: agency.description || "",
          website: agency.website || "", email: agency.email || "", phone: agency.phone || "",
          countryId: agency.country_id || "", cityId: agency.city_id || "", address: agency.address || "",
          foundedYear: agency.founded_year?.toString() || "", companySize: agency.company_size || "",
          hourlyRate: agency.hourly_rate || "", minProjectSize: agency.min_project_size?.toString() || "",
          metaTitle: agency.meta_title || "", metaDescription: agency.meta_description || "",
        });

        if (agency.serviceIds?.length) setSelectedServiceIds(agency.serviceIds);
        if (agency.industryIds?.length) setSelectedIndustryIds(agency.industryIds);

        const langs = parseJsonField(agency.languages);
        if (Array.isArray(langs)) setLanguages(langs.map((v) => String(v)).filter(Boolean));
        const tzs = parseJsonField(agency.timezones);
        if (Array.isArray(tzs)) setTimezones(tzs.map((v) => String(v)).filter(Boolean));

        const locs = parseJsonField(agency.locations);
        if (Array.isArray(locs)) {
          const parsed = locs.filter((o): o is Record<string, unknown> => o != null && typeof o === "object").map((o) => ({
            label: o.label ? String(o.label) : "", address: o.address ? String(o.address) : "",
            cityId: o.cityId ? String(o.cityId) : "", countryId: o.countryId ? String(o.countryId) : "",
            latitude: o.latitude != null ? String(o.latitude) : "", longitude: o.longitude != null ? String(o.longitude) : "",
            isHeadquarters: Boolean(o.isHeadquarters),
          }));
          setOffices(parsed);
          parsed.forEach((o, idx) => {
            if (o.countryId) {
              fetch(`/api/locations?countryId=${o.countryId}`).then((r) => r.json())
                .then((data) => setOfficeCities((prev) => ({ ...prev, [idx]: data.data || [] }))).catch(() => {});
            }
          });
        }

        const sf = parseJsonField(agency.service_focus);
        if (Array.isArray(sf)) setServiceFocus(sf.filter((s): s is ServiceFocusItem => s && typeof s === "object" && "serviceId" in s && "percentage" in s));

        const pkgs = parseJsonField(agency.packages);
        if (Array.isArray(pkgs)) setPackages(pkgs.map((p: Record<string, unknown>) => ({
          serviceLine: String(p.serviceLine || ""), focusArea: String(p.focusArea || ""),
          name: String(p.name || ""), description: String(p.description || ""),
          tiers: Array.isArray(p.tiers) ? (p.tiers as Array<Record<string, unknown>>).map((t) => ({
            label: String(t.label || ""), price: String(t.price || ""), frequency: String(t.frequency || ""),
            audience: String(t.audience || ""),
            features: Array.isArray(t.features) ? (t.features as Array<Record<string, unknown>>).map((f) => ({
              name: String(f.name || ""), type: (f.type === "checkmark" ? "checkmark" : "text") as "text" | "checkmark",
              value: String(f.value || ""),
            })) : [],
          })) : [emptyTier("Small Tier"), emptyTier("Medium Tier"), emptyTier("Large Tier")],
        })));

        const ti = parseJsonField(agency.team_info);
        if (ti && typeof ti === "object") {
          const t = ti as Record<string, unknown>;
          setTeamInfo({
            story: String(t.story || ""), teamPhoto: String(t.teamPhoto || ""), videoUrl: String(t.videoUrl || ""),
            setsApart: Array.isArray(t.setsApart) ? t.setsApart.map(String).filter(Boolean) : [],
            quickFacts: Array.isArray(t.quickFacts) ? t.quickFacts.map(String).filter(Boolean) : [],
            tools: Array.isArray(t.tools) ? t.tools.map(String).filter(Boolean) : [],
            faq: Array.isArray(t.faq) ? (t.faq as Array<Record<string, unknown>>).map((f) => ({ question: String(f.question || ""), answer: String(f.answer || "") })) : [],
          });
        }

        if (agency.logo) setLogoPreview(agency.logo);
        if (agency.cover_image) setCoverPreview(agency.cover_image);

        if (agency.social_links && typeof agency.social_links === "object") {
          const keyMap: Record<string, string> = { linkedin: "linkedinUrl", twitter: "twitterUrl", facebook: "facebookUrl", instagram: "instagramUrl" };
          const mapped = Object.entries(agency.social_links as Record<string, string>)
            .filter(([key]) => key in keyMap).map(([key, url]) => ({ platform: keyMap[key], url: url || "" }));
          if (mapped.length > 0) setSocialLinks(mapped);
        }

        if (agency.email) setEmailVerified(true);
        if (agency.country_id) {
          fetch(`/api/locations?countryId=${agency.country_id}`).then((r) => r.json())
            .then((data) => setCitiesList(data.data || [])).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadCities = useCallback((countryId: string) => {
    if (!countryId) { setCitiesList([]); return; }
    fetch(`/api/locations?countryId=${countryId}`).then((r) => r.json()).then((data) => setCitiesList(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => { if (form.countryId) loadCities(form.countryId); }, [form.countryId, loadCities]);

  // ─── Handlers ───
  const handleSendEmailOtp = async () => {
    if (!form.email.trim() || !form.name.trim()) { setEmailVerifyError("Please enter agency name and email first."); return; }
    setEmailVerifying(true); setEmailVerifyError(null);
    try {
      const res = await fetch("/api/agencies/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, agencyName: form.name }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send code");
      setEmailOtpSent(true);
    } catch (err) { setEmailVerifyError(err instanceof Error ? err.message : "Failed to send code"); }
    finally { setEmailVerifying(false); }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode.length !== 6) return;
    setEmailVerifying(true); setEmailVerifyError(null);
    try {
      const res = await fetch("/api/agencies/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, code: emailOtpCode }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      setEmailVerified(true); setEmailOtpSent(false);
    } catch (err) { setEmailVerifyError(err instanceof Error ? err.message : "Verification failed"); }
    finally { setEmailVerifying(false); }
  };

  const autoSeo = useCallback(() => {
    const title = form.tagline ? `${form.name} - ${form.tagline}`.slice(0, 70) : form.name.slice(0, 70);
    const desc = form.description ? form.description.slice(0, 160) : `${form.name} is a professional agency. ${form.tagline || ""}`.slice(0, 160);
    setForm((prev) => ({ ...prev, metaTitle: prev.metaTitle || title, metaDescription: prev.metaDescription || desc }));
  }, [form.name, form.tagline, form.description]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "countryId") setForm((prev) => ({ ...prev, cityId: "" }));
    if (name === "email") { setEmailVerified(false); setEmailOtpSent(false); setEmailOtpCode(""); setEmailVerifyError(null); }
  };

  const handleImageUpload = async (file: File, type: "logo" | "cover") => {
    const setter = type === "logo" ? setUploadingLogo : setUploadingCover;
    const previewSetter = type === "logo" ? setLogoPreview : setCoverPreview;
    setter(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("category", type);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.data?.url) previewSetter(json.data.url);
      else setMessage({ type: "error", text: json.error || "Upload failed" });
    } catch { setMessage({ type: "error", text: "Upload failed" }); }
    finally { setter(false); }
  };

  const addSocialLink = () => {
    const used = socialLinks.map((s) => s.platform);
    const available = SOCIAL_PLATFORMS.find((p) => !used.includes(p.key));
    if (available) setSocialLinks([...socialLinks, { platform: available.key, url: "" }]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setMessage({ type: "error", text: "Agency name is required." }); return; }
    autoSeo(); setSaving(true); setMessage(null);

    const socialData: Record<string, string> = {};
    socialLinks.forEach((link) => { if (link.url.trim()) socialData[link.platform] = link.url.trim(); });

    const payload: Record<string, unknown> = {
      ...form,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      minProjectSize: form.minProjectSize ? Number(form.minProjectSize.replace(/[^0-9]/g, "")) : undefined,
      ...socialData,
      serviceIds: selectedServiceIds,
      industryIds: selectedIndustryIds,
      countryId: form.countryId || undefined,
      cityId: form.cityId || undefined,
      languages: languages.length > 0 ? languages : undefined,
      timezones: timezones.length > 0 ? timezones : undefined,
      locations: offices.length > 0
        ? offices.filter((o) => [o.label, o.address, o.cityId, o.countryId, o.latitude, o.longitude].some((v) => String(v || "").trim() !== ""))
            .map((o) => ({ label: o.label.trim() || undefined, address: o.address.trim() || undefined, cityId: o.cityId || undefined, countryId: o.countryId || undefined, latitude: o.latitude.trim() ? Number(o.latitude) : undefined, longitude: o.longitude.trim() ? Number(o.longitude) : undefined, isHeadquarters: o.isHeadquarters || undefined }))
        : undefined,
      serviceFocus: serviceFocus.length > 0 ? serviceFocus : undefined,
      packages: packages.length > 0 ? packages.filter((p) => p.name.trim()) : undefined,
      teamInfo: teamInfo.story || teamInfo.setsApart.length > 0 || teamInfo.tools.length > 0 || teamInfo.faq.length > 0 ? teamInfo : undefined,
    };

    if (logoPreview) payload.logo = logoPreview;
    if (coverPreview) payload.coverImage = coverPreview;
    Object.keys(payload).forEach((k) => { if (payload[k] === "" || payload[k] === undefined) delete payload[k]; });

    try {
      let res;
      if (existingAgencyId) {
        res = await fetch(`/api/agencies/${existingAgencyId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        res = await fetch("/api/agencies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: existingAgencyId ? "Agency updated successfully!" : "Agency created successfully!" });
        if (json.data?.id) setExistingAgencyId(json.data.id);
        if (json.data?.status) setAgencyStatus(json.data.status);
        if (json.data?.slug) setAgencySlug(json.data.slug);
      } else {
        setMessage({ type: "error", text: json.error || "Something went wrong" });
      }
    } catch { setMessage({ type: "error", text: "Network error. Please try again." }); }
    finally { setSaving(false); }
  };

  const handleSubmitForReview = async () => {
    if (!existingAgencyId) return;
    if (form.email && !emailVerified) { setMessage({ type: "error", text: "Please verify your company email before submitting for review." }); return; }
    setSubmittingForReview(true); setMessage(null);
    try {
      const res = await fetch(`/api/agencies/${existingAgencyId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "pending" }) });
      const json = await res.json();
      if (res.ok) { setAgencyStatus("pending"); setMessage({ type: "success", text: "Your agency has been submitted for review!" }); }
      else setMessage({ type: "error", text: json.error || "Failed to submit for review." });
    } catch { setMessage({ type: "error", text: "Network error. Please try again." }); }
    finally { setSubmittingForReview(false); }
  };

  // ─── Service Focus helpers ───
  const focusTotal = serviceFocus.reduce((a, b) => a + b.percentage, 0);

  const addServiceToFocus = (serviceId: string) => {
    if (serviceFocus.find((s) => s.serviceId === serviceId)) return;
    setServiceFocus((prev) => [...prev, { serviceId, percentage: 10 }]);
  };

  const removeServiceFromFocus = (serviceId: string) => {
    setServiceFocus((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  const updateFocusPercentage = (serviceId: string, pct: number) => {
    setServiceFocus((prev) => prev.map((s) => s.serviceId === serviceId ? { ...s, percentage: pct } : s));
  };

  const pieItems = useMemo(() =>
    serviceFocus.map((sf) => ({
      label: serviceOptions.find((s) => s.id === sf.serviceId)?.name || "Unknown",
      pct: sf.percentage,
    })),
  [serviceFocus, serviceOptions]);

  // ─── Render ───
  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors";
  const selectClass = `${inputClass} bg-white`;

  return (
    <div className="flex gap-8 max-w-full">
      {/* ─── Section Sidebar ─── */}
      <div className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-navy text-sm">Sections</h2>
            {agencySlug && (
              <Link href={`/agencies/${agencySlug}`} target="_blank" className="text-xs text-brand hover:underline flex items-center gap-1">
                Preview <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">Complete each section to build your profile.</p>
          <nav className="space-y-0.5">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              const done = sectionComplete[sec.id];
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-50 text-brand" : "text-gray-600 hover:bg-gray-50 hover:text-navy"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className="flex-1 text-left truncate">{sec.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 min-w-0">
        {/* Mobile section tabs */}
        <div className="lg:hidden mb-4 overflow-x-auto">
          <div className="flex gap-1 pb-2">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeSection === sec.id ? "bg-blue-50 text-brand" : "text-gray-500 hover:text-navy"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status banner */}
        {existingAgencyId && agencyStatus && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            agencyStatus === "draft" ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
            : agencyStatus === "pending" ? "bg-blue-50 text-blue-800 border border-blue-200"
            : agencyStatus === "active" ? "bg-green-50 text-green-800 border border-green-200"
            : agencyStatus === "suspended" ? "bg-red-50 text-red-800 border border-red-200"
            : "bg-gray-50 text-gray-700 border border-gray-200"
          }`}>
            {agencyStatus === "draft" && (
              <div className="flex items-center justify-between">
                <p>Your profile is a draft. Submit for review when ready.</p>
                <button onClick={handleSubmitForReview} disabled={submittingForReview}
                  className="ml-4 shrink-0 flex items-center gap-2 bg-brand text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-60">
                  {submittingForReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {submittingForReview ? "Submitting..." : "Submit for Review"}
                </button>
              </div>
            )}
            {agencyStatus === "pending" && <p>Your agency is pending admin approval.</p>}
            {agencyStatus === "active" && <p>Your agency is live. {agencySlug && <a href={`/agencies/${agencySlug}`} className="underline font-medium">View public profile</a>}</p>}
            {agencyStatus === "suspended" && <p className="font-semibold">Your listing has been suspended. Contact support@agencyhub.com.</p>}
            {agencyStatus === "rejected" && <p>Your agency was not approved. Please update and resubmit.</p>}
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* COMPANY INFORMATION */}
        {/* ════════════════════════════════════════════ */}
        {activeSection === "company" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">Company Information</h2>

            {/* Cover + Logo */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-40 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center border-b border-gray-100 relative group cursor-pointer overflow-hidden"
                onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleImageUpload(f, "cover"); }; i.click(); }}>
                {coverPreview ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  : <div className="text-center"><ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" /><p className="text-xs text-gray-400">Cover Image</p>
                    <button className="mt-1 text-xs text-brand font-medium flex items-center gap-1 mx-auto">{uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload</button></div>}
              </div>
              <div className="px-6 py-3 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center -mt-10 relative z-10 bg-white cursor-pointer overflow-hidden"
                  onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleImageUpload(f, "logo"); }; i.click(); }}>
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    : <div className="text-center">{uploadingLogo ? <Loader2 className="w-4 h-4 text-gray-400 mx-auto animate-spin" /> : <Upload className="w-4 h-4 text-gray-400 mx-auto" />}<span className="text-[9px] text-gray-400">Logo</span></div>}
                </div>
                <div><p className="text-sm font-medium text-navy">{form.name || "Your Agency"}</p><p className="text-xs text-gray-500">{form.tagline || "Your tagline"}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="grid sm:grid-cols-3 gap-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label><input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Your agency name" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Company Website</label><input name="website" value={form.website} onChange={handleChange} className={inputClass} placeholder="https://yourwebsite.com" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sales Email *</label>
                  <div className="flex gap-2">
                    <input name="email" value={form.email} onChange={handleChange} className={`flex-1 ${inputClass}`} placeholder="contact@agency.com" />
                    {form.email && !emailVerified && !emailOtpSent && (
                      <button type="button" onClick={handleSendEmailOtp} disabled={emailVerifying} className="shrink-0 px-3 py-2 bg-brand text-white rounded-lg text-xs font-medium hover:bg-brand-dark disabled:opacity-50">
                        {emailVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                      </button>
                    )}
                    {emailVerified && <span className="shrink-0 inline-flex items-center gap-1 px-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200"><CheckCircle2 className="w-3 h-3" /></span>}
                  </div>
                  {emailOtpSent && !emailVerified && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 mb-1">Code sent to <strong>{form.email}</strong></p>
                      <div className="flex gap-2">
                        <input type="text" value={emailOtpCode} onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="w-24 border border-blue-300 rounded-lg px-2 py-1.5 text-xs text-center tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-brand/20" />
                        <button type="button" onClick={handleVerifyEmailOtp} disabled={emailVerifying || emailOtpCode.length !== 6} className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-medium disabled:opacity-50">{emailVerifying ? "..." : "Confirm"}</button>
                      </div>
                    </div>
                  )}
                  {emailVerifyError && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {emailVerifyError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  {(() => {
                    const selCountry = countries.find((c) => c.id === form.countryId);
                    const pCode = selCountry?.code ? PHONE_CODES[selCountry.code] : "";
                    return (
                      <div className="flex gap-2">
                        {pCode && <span className="inline-flex items-center px-2 bg-gray-100 border border-gray-300 rounded-lg text-xs text-gray-600 font-mono">{pCode}</span>}
                        <input name="phone" value={form.phone} onChange={handleChange} className={`flex-1 ${inputClass}`} placeholder={pCode ? `${pCode} XXX XXXX` : "+1 (555) 000-0000"} />
                      </div>
                    );
                  })()}
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Founding Year</label>
                  <select name="foundedYear" value={form.foundedYear} onChange={handleChange} className={selectClass}>
                    <option value="">Select year</option>
                    {Array.from({ length: 80 }, (_, i) => 2026 - i).map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Total Employees</label>
                  <select name="companySize" value={form.companySize} onChange={handleChange} className={selectClass}>
                    <option value="">Select size</option>
                    <option value="1-10">1-10</option><option value="11-50">11-50</option><option value="51-200">51-200</option>
                    <option value="201-500">201-500</option><option value="501-1000">501-1000</option><option value="1000+">1000+</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline <span className="text-gray-400 text-xs">{form.tagline.length}/500</span></label>
                  <input name="tagline" value={form.tagline} onChange={handleChange} onBlur={autoSeo} maxLength={500} className={inputClass} placeholder="Short tagline" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate</label>
                  <select name="hourlyRate" value={form.hourlyRate} onChange={handleChange} className={selectClass}>
                    <option value="">Select rate</option>
                    <option>Under $25</option><option>$25 - $49</option><option>$50 - $99</option><option>$100 - $149</option><option>$150 - $199</option><option>$200+</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Min. Project Size</label>
                  <select name="minProjectSize" value={form.minProjectSize} onChange={handleChange} className={selectClass}>
                    <option value="">Select minimum</option>
                    <option value="1000">$1,000</option><option value="5000">$5,000</option><option value="10000">$10,000</option><option value="25000">$25,000</option><option value="50000">$50,000+</option>
                  </select>
                </div>
              </div>

              {/* Languages */}
              <div className="mt-6 border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5"><LanguagesIcon className="w-4 h-4 text-brand" /> Languages Spoken</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {languages.map((lang) => (
                    <span key={lang} className="inline-flex items-center gap-1 bg-blue-50 text-brand text-xs font-medium px-2.5 py-1 rounded-full">
                      {lang}<button type="button" onClick={() => setLanguages((p) => p.filter((l) => l !== lang))} className="hover:text-brand-dark"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={languageInput} onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = languageInput.trim(); if (v && !languages.includes(v) && languages.length < 30) { setLanguages((p) => [...p, v]); setLanguageInput(""); } } }}
                    placeholder="e.g. English, Spanish..." maxLength={60} className={`flex-1 ${inputClass}`} />
                  <button type="button" onClick={() => { const v = languageInput.trim(); if (v && !languages.includes(v) && languages.length < 30) { setLanguages((p) => [...p, v]); setLanguageInput(""); } }}
                    disabled={!languageInput.trim()} className="px-3 py-2 bg-brand text-white rounded-lg text-xs font-medium hover:bg-brand-dark disabled:opacity-50"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6 border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 text-xs">{form.description.length}/5000</span></label>
                <textarea name="description" value={form.description} onChange={handleChange} onBlur={autoSeo} rows={6} maxLength={5000} className={`${inputClass} resize-y`} placeholder="Describe your agency, services, and expertise." />
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* ABOUT THE TEAM */}
        {/* ════════════════════════════════════════════ */}
        {activeSection === "team" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">About The Team</h2>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              {/* Our Story */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Our Story</label>
                <p className="text-xs text-gray-500 mb-2">Share what makes your team unique — vision, mission, and values.</p>
                <textarea value={teamInfo.story} onChange={(e) => setTeamInfo((p) => ({ ...p, story: e.target.value }))} rows={5} maxLength={5000} className={`${inputClass} resize-y`} placeholder="Type your story here..." />
              </div>

              {/* Team Photo */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Team Photo</label>
                <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand/40 transition-colors"
                  onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = async (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; const fd = new FormData(); fd.append("file", f); fd.append("category", "team"); const res = await fetch("/api/upload", { method: "POST", body: fd }); const json = await res.json(); if (res.ok && json.data?.url) setTeamInfo((p) => ({ ...p, teamPhoto: json.data.url })); }; i.click(); }}>
                  {teamInfo.teamPhoto ? <img src={teamInfo.teamPhoto} alt="Team" className="w-full h-full object-cover rounded-lg" />
                    : <div className="text-center"><Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" /><p className="text-xs text-gray-400">Add a PNG, JPG, BIS or WEBP file (max 12 MB)</p></div>}
                </div>
                {teamInfo.teamPhoto && <button type="button" onClick={() => setTeamInfo((p) => ({ ...p, teamPhoto: "" }))} className="mt-1 text-xs text-red-500 hover:text-red-700">Remove</button>}
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Team Video Link <span className="text-xs text-gray-400 font-normal">Optional</span></label>
                <input value={teamInfo.videoUrl} onChange={(e) => setTeamInfo((p) => ({ ...p, videoUrl: e.target.value }))} className={inputClass} placeholder="YouTube or Vimeo URL" />
              </div>

              {/* Meet the Team - link to Team page */}
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-bold text-gray-800 mb-1">Meet the Team</label>
                <p className="text-xs text-gray-500 mb-3">Add team members to feature on your company profile.</p>
                <Link href="/dashboard/team" className="inline-flex items-center gap-2 text-sm text-brand font-medium hover:text-brand-dark">
                  <Users className="w-4 h-4" /> Manage team in Team Members <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* What Sets Us Apart */}
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-bold text-gray-800 mb-1">What Sets Us Apart <span className="text-xs text-gray-400 font-normal">Optional</span></label>
                <p className="text-xs text-gray-500 mb-3">Describe up to 6 standout qualities.</p>
                {teamInfo.setsApart.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={item} onChange={(e) => setTeamInfo((p) => ({ ...p, setsApart: p.setsApart.map((v, idx) => idx === i ? e.target.value : v) }))} maxLength={300} className={`flex-1 ${inputClass}`} />
                    <button type="button" onClick={() => setTeamInfo((p) => ({ ...p, setsApart: p.setsApart.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {teamInfo.setsApart.length < 6 && (
                  <button type="button" onClick={() => setTeamInfo((p) => ({ ...p, setsApart: [...p.setsApart, ""] }))} className="text-sm text-brand font-medium flex items-center gap-1 hover:text-brand-dark"><Plus className="w-4 h-4" /> Add What Sets Us Apart</button>
                )}
              </div>

              {/* Quick Facts */}
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-bold text-gray-800 mb-1">Quick Facts <span className="text-xs text-gray-400 font-normal">Optional</span></label>
                <p className="text-xs text-gray-500 mb-3">Add up to 6 quick facts about your team.</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {teamInfo.quickFacts.map((fact, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {fact}<button type="button" onClick={() => setTeamInfo((p) => ({ ...p, quickFacts: p.quickFacts.filter((_, idx) => idx !== i) }))} className="hover:text-gray-900"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                {teamInfo.quickFacts.length < 6 && (
                  <button type="button" onClick={() => {
                    const v = prompt("Enter a quick fact:");
                    if (v?.trim()) setTeamInfo((p) => ({ ...p, quickFacts: [...p.quickFacts, v.trim()] }));
                  }} className="text-sm text-brand font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Add Quick Fact</button>
                )}
              </div>

              {/* Tools & Technology */}
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5"><Wrench className="w-4 h-4 text-brand" /> Tools and Technology <span className="text-xs text-gray-400 font-normal">Optional</span></label>
                <p className="text-xs text-gray-500 mb-3">List tools and technology your team uses.</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {teamInfo.tools.map((tool, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-brand text-xs font-medium px-2.5 py-1 rounded-full">
                      {tool}<button type="button" onClick={() => setTeamInfo((p) => ({ ...p, tools: p.tools.filter((_, idx) => idx !== i) }))} className="hover:text-brand-dark"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={toolInput} onChange={(e) => setToolInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = toolInput.trim(); if (v && !teamInfo.tools.includes(v) && teamInfo.tools.length < 30) { setTeamInfo((p) => ({ ...p, tools: [...p.tools, v] })); setToolInput(""); } } }}
                    placeholder="Search for tools and technology" className={`flex-1 ${inputClass}`} />
                </div>
              </div>

              {/* FAQ */}
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5"><MessageSquareText className="w-4 h-4 text-brand" /> Commonly Asked Questions <span className="text-xs text-gray-400 font-normal">Optional</span></label>
                <p className="text-xs text-gray-500 mb-3">Add up to 5 commonly asked questions about your team.</p>
                {teamInfo.faq.map((item, i) => (
                  <div key={i} className="mb-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <input value={item.question} onChange={(e) => setTeamInfo((p) => ({ ...p, faq: p.faq.map((f, idx) => idx === i ? { ...f, question: e.target.value } : f) }))} placeholder="Question" maxLength={300} className={`flex-1 ${inputClass}`} />
                      <button type="button" onClick={() => setTeamInfo((p) => ({ ...p, faq: p.faq.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600 mt-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea value={item.answer} onChange={(e) => setTeamInfo((p) => ({ ...p, faq: p.faq.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f) }))} placeholder="Answer" maxLength={1000} rows={2} className={`${inputClass} resize-y`} />
                  </div>
                ))}
                {teamInfo.faq.length < 5 && (
                  <button type="button" onClick={() => setTeamInfo((p) => ({ ...p, faq: [...p.faq, { question: "", answer: "" }] }))} className="text-sm text-brand font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Add My Own Question and Answer</button>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* LOCATIONS */}
        {/* ════════════════════════════════════════════ */}
        {activeSection === "locations" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy">Locations</h2>
              <button type="button" onClick={() => setOffices((p) => [...p, emptyOffice()])} className="flex items-center gap-1.5 border border-brand text-brand px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand/5"><Plus className="w-4 h-4" /> Add Office</button>
            </div>

            {/* Timezones */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><Globe2 className="w-4 h-4 text-brand" /> Timezones</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {timezones.map((tz) => (
                  <span key={tz} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {tz}<button type="button" onClick={() => setTimezones((p) => p.filter((t) => t !== tz))} className="hover:text-gray-900"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <select value="" onChange={(e) => { const v = e.target.value; if (v && !timezones.includes(v)) setTimezones((p) => [...p, v]); }} className={selectClass}>
                <option value="">Select a timezone to add...</option>
                {TIMEZONE_OPTIONS.filter((tz) => !timezones.includes(tz)).map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            {/* Office cards */}
            {offices.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No offices added yet. Click &quot;Add Office&quot; to add your first location.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {offices.map((office, i) => {
                  const update = (patch: Partial<OfficeLocation>) => setOffices((p) => p.map((o, idx) => idx === i ? { ...o, ...patch } : o));
                  const cities = officeCities[i] || [];
                  const hasCoords = office.latitude.trim() && office.longitude.trim();
                  return (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-navy text-sm">{office.label || (office.isHeadquarters ? "Headquarters" : `Office #${i + 1}`)}</p>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={office.isHeadquarters} onChange={(e) => setOffices((p) => p.map((o, idx) => idx === i ? { ...o, isHeadquarters: e.target.checked } : e.target.checked ? { ...o, isHeadquarters: false } : o))} className="rounded border-gray-300 text-brand focus:ring-brand/20" /> HQ
                          </label>
                          <button type="button" onClick={() => { setOffices((p) => p.filter((_, idx) => idx !== i)); setOfficeCities((p) => { const n = { ...p }; delete n[i]; return n; }); }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input value={office.label} onChange={(e) => update({ label: e.target.value })} placeholder="Label (e.g. Headquarters, EU Office)" maxLength={120} className={`sm:col-span-2 ${inputClass}`} />
                        <input value={office.address} onChange={(e) => update({ address: e.target.value })} placeholder="Street address" maxLength={300} className={`sm:col-span-2 ${inputClass}`} />
                        <select value={office.countryId} onChange={(e) => { const cid = e.target.value; update({ countryId: cid, cityId: "" }); if (cid) fetch(`/api/locations?countryId=${cid}`).then((r) => r.json()).then((d) => setOfficeCities((p) => ({ ...p, [i]: d.data || [] }))).catch(() => {}); else setOfficeCities((p) => ({ ...p, [i]: [] })); }} className={selectClass}>
                          <option value="">Select country</option>
                          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={office.cityId} onChange={(e) => update({ cityId: e.target.value })} disabled={!office.countryId} className={`${selectClass} disabled:opacity-50`}>
                          <option value="">{office.countryId ? "Select city" : "Select country first"}</option>
                          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input value={office.latitude} onChange={(e) => update({ latitude: e.target.value })} placeholder="Latitude (e.g. 40.7128)" inputMode="decimal" className={inputClass} />
                        <input value={office.longitude} onChange={(e) => update({ longitude: e.target.value })} placeholder="Longitude (e.g. -74.0060)" inputMode="decimal" className={inputClass} />
                        {hasCoords && (
                          <div className="sm:col-span-2 rounded-lg overflow-hidden border border-gray-200">
                            <iframe title={`Map for ${office.label || `Office #${i + 1}`}`} width="100%" height="200" style={{ border: 0 }} loading="lazy"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(office.longitude) - 0.01},${Number(office.latitude) - 0.01},${Number(office.longitude) + 0.01},${Number(office.latitude) + 0.01}&layer=mapnik&marker=${office.latitude},${office.longitude}`} />
                            <p className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50">{office.latitude}, {office.longitude}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* SOCIAL MEDIA */}
        {/* ════════════════════════════════════════════ */}
        {activeSection === "social" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">Social Media</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-4">
                {socialLinks.map((link, index) => {
                  const platformInfo = SOCIAL_PLATFORMS.find((p) => p.key === link.platform);
                  const usedPlatforms = socialLinks.map((s) => s.platform);
                  return (
                    <div key={index} className="flex gap-3 items-start">
                      <select value={link.platform} onChange={(e) => setSocialLinks(socialLinks.map((l, i) => i === index ? { ...l, platform: e.target.value } : l))} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white min-w-[140px]">
                        {SOCIAL_PLATFORMS.map((p) => <option key={p.key} value={p.key} disabled={usedPlatforms.includes(p.key) && p.key !== link.platform}>{p.label}</option>)}
                      </select>
                      <input value={link.url} onChange={(e) => setSocialLinks(socialLinks.map((l, i) => i === index ? { ...l, url: e.target.value } : l))} placeholder={platformInfo?.placeholder || "https://..."} className={`flex-1 ${inputClass}`} />
                      <button onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== index))} className="p-2.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
              {socialLinks.length < SOCIAL_PLATFORMS.length && (
                <button onClick={addSocialLink} className="mt-4 text-sm text-brand font-medium flex items-center gap-1 hover:text-brand-dark"><Plus className="w-4 h-4" /> Add Link</button>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* SERVICE LINES (pie chart + percentage) */}
        {/* ════════════════════════════════════════════ */}
        {activeSection === "services" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">Service Lines</h2>
            <p className="text-sm text-gray-600">Allocate service lines based on how much of your business focuses on that line of work. A service line must be 10% or greater. All service lines must add up to 100%.</p>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Search & add */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search for a Service Line</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {serviceFocus.map((sf) => {
                    const svc = serviceOptions.find((s) => s.id === sf.serviceId);
                    return svc ? (
                      <span key={sf.serviceId} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200">
                        {svc.name}<button type="button" onClick={() => removeServiceFromFocus(sf.serviceId)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ) : null;
                  })}
                </div>
                <select value="" onChange={(e) => { if (e.target.value) addServiceToFocus(e.target.value); }} className={selectClass}>
                  <option value="">Select a service to add...</option>
                  {serviceOptions.filter((s) => !serviceFocus.find((sf) => sf.serviceId === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {serviceFocus.length > 0 && (
                <div className="mt-6 grid lg:grid-cols-2 gap-8">
                  {/* Pie chart */}
                  <div className="flex items-center justify-center">
                    <PieChartSVG items={pieItems} colors={PIE_COLORS} />
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4">
                    {serviceFocus.map((sf, i) => {
                      const svc = serviceOptions.find((s) => s.id === sf.serviceId);
                      return (
                        <div key={sf.serviceId}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-sm font-medium text-gray-800">{svc?.name || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700 w-10 text-right">{sf.percentage}%</span>
                              <button type="button" onClick={() => removeServiceFromFocus(sf.serviceId)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-5">0%</span>
                            <input type="range" min={0} max={100} step={5} value={sf.percentage}
                              onChange={(e) => updateFocusPercentage(sf.serviceId, Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand" />
                            <span className="text-xs text-gray-400 w-8">100%</span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className={`font-bold text-lg flex items-center gap-1 ${focusTotal === 100 ? "text-emerald-600" : "text-red-600"}`}>
                        {focusTotal === 100 && <CheckCircle2 className="w-4 h-4" />}
                        {focusTotal}%
                      </span>
                    </div>
                    {focusTotal !== 100 && <p className="text-xs text-red-500">Service line allocations must total exactly 100%.</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* INDUSTRIES */}
        {/* ════════════════════════════════════════════ */}
        {activeSection === "industries" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">Industries</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {industryOptions.length === 0 ? (
                <p className="text-sm text-gray-500">No industries available.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {industryOptions.map((ind) => {
                    const selected = selectedIndustryIds.includes(ind.id);
                    return (
                      <label key={ind.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${selected ? "border-brand bg-blue-50 text-brand" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                        <input type="checkbox" checked={selected} onChange={() => setSelectedIndustryIds((p) => selected ? p.filter((id) => id !== ind.id) : [...p, ind.id])} className="sr-only" />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-brand border-brand" : "border-gray-300"}`}>
                          {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        {ind.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* PACKAGES */}
        {/* ════════════════════════════════════════════ */}
        {activeSection === "packages" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy">Packages</h2>
              <button type="button" onClick={() => setPackages((p) => [...p, emptyPackage()])} className="flex items-center gap-1.5 border border-brand text-brand px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand/5"><Plus className="w-4 h-4" /> Create a Package</button>
            </div>

            {packages.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No packages created yet. Create your first service package.</p>
              </div>
            ) : packages.map((pkg, pi) => {
              const updatePkg = (patch: Partial<PackageItem>) => setPackages((p) => p.map((pk, idx) => idx === pi ? { ...pk, ...patch } : pk));
              return (
                <div key={pi} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-navy">Package #{pi + 1}</h3>
                    <button type="button" onClick={() => setPackages((p) => p.filter((_, i) => i !== pi))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  {/* Service line & focus */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Service Line</label>
                      <select value={pkg.serviceLine} onChange={(e) => updatePkg({ serviceLine: e.target.value })} className={selectClass}>
                        <option value="">Select</option>
                        {serviceOptions.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Focus Areas <span className="text-gray-400 font-normal">Optional</span></label>
                      <input value={pkg.focusArea} onChange={(e) => updatePkg({ focusArea: e.target.value })} className={inputClass} placeholder="e.g. Out of home advertising" />
                    </div>
                  </div>

                  {/* Name & description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Package Name <span className="text-gray-400">{pkg.name.length}/80</span></label>
                    <input value={pkg.name} onChange={(e) => updatePkg({ name: e.target.value })} maxLength={80} className={inputClass} placeholder="Give your package a title" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Description <span className="text-gray-400">{pkg.description.length}/500</span></label>
                    <textarea value={pkg.description} onChange={(e) => updatePkg({ description: e.target.value })} maxLength={500} rows={2} className={`${inputClass} resize-y`} placeholder="Describe your package in 1-3 sentences." />
                  </div>

                  {/* Tiers */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-3">Setup your tiers</label>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {(pkg.tiers || []).map((tier, ti) => (
                        <div key={ti} className="border border-gray-200 rounded-lg p-4 space-y-3">
                          <p className="font-semibold text-navy text-sm">{tier.label}</p>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input value={tier.price} onChange={(e) => updatePkg({ tiers: pkg.tiers.map((t, i) => i === ti ? { ...t, price: e.target.value } : t) })} className={`${inputClass} pl-8`} placeholder="e.g. $100" />
                            </div>
                            <select value={tier.frequency} onChange={(e) => updatePkg({ tiers: pkg.tiers.map((t, i) => i === ti ? { ...t, frequency: e.target.value } : t) })} className="border border-gray-300 rounded-lg px-2 py-2 text-xs bg-white">
                              <option value="">Frequency</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="yearly">Yearly</option>
                              <option value="one-time">One-time</option>
                              <option value="per-project">Per project</option>
                            </select>
                          </div>
                          <textarea value={tier.audience} onChange={(e) => updatePkg({ tiers: pkg.tiers.map((t, i) => i === ti ? { ...t, audience: e.target.value } : t) })} placeholder="Who is the audience? (e.g. Best for local companies)" rows={2} maxLength={200} className={`${inputClass} resize-none text-xs`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Add Package Features</label>
                    {(pkg.tiers[0]?.features || []).map((feat, fi) => (
                      <div key={fi} className="flex items-center gap-2 mb-2">
                        <input value={feat.name} onChange={(e) => {
                          const newTiers = pkg.tiers.map((t) => ({ ...t, features: t.features.map((f, i) => i === fi ? { ...f, name: e.target.value } : f) }));
                          updatePkg({ tiers: newTiers });
                        }} className={`flex-1 ${inputClass}`} placeholder="Feature name" />
                        <button type="button" onClick={() => {
                          const newTiers = pkg.tiers.map((t) => ({ ...t, features: t.features.filter((_, i) => i !== fi) }));
                          updatePkg({ tiers: newTiers });
                        }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      const newFeature = { name: "", type: "text" as const, value: "" };
                      const newTiers = pkg.tiers.map((t) => ({ ...t, features: [...(t.features || []), newFeature] }));
                      updatePkg({ tiers: newTiers });
                    }} className="text-sm text-brand font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Add Features</button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* SEO SETTINGS */}
        {/* ════════════════════════════════════════════ */}
        {activeSection === "seo" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">SEO Settings</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title ({(form.metaTitle || "").length}/70)</label>
                <input name="metaTitle" value={form.metaTitle} onChange={handleChange} maxLength={70} className={inputClass} placeholder="Auto-generated from name + tagline" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description ({(form.metaDescription || "").length}/160)</label>
                <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} maxLength={160} rows={2} className={`${inputClass} resize-none`} placeholder="Auto-generated from description" />
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <p className="text-xs text-green-700 mb-1">www.agencyhub.com &rsaquo; agencies &rsaquo; {form.name ? form.name.toLowerCase().replace(/\s+/g, "-") : "your-agency"}</p>
                <p className="text-lg text-blue-800 font-medium">{form.metaTitle || form.name || "Agency Name"}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{form.metaDescription || form.description || "Your agency description will appear here."}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
