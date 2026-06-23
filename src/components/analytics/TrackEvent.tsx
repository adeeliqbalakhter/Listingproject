"use client";

import { useEffect, useCallback } from "react";

export function TrackProfileView({ agencyId }: { agencyId: string }) {
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/agencies/${agencyId}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "profile_view" }),
    }).catch(() => {});
  }, [agencyId]);

  return null;
}

export function TrackClick({
  agencyId,
  event,
  href,
  children,
  className,
  target,
  rel,
}: {
  agencyId: string;
  event: "website_click" | "phone_click" | "email_click";
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}) {
  const handleClick = useCallback(() => {
    fetch(`/api/agencies/${agencyId}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    }).catch(() => {});
  }, [agencyId, event]);

  return (
    <a href={href} onClick={handleClick} className={className} target={target} rel={rel}>
      {children}
    </a>
  );
}
