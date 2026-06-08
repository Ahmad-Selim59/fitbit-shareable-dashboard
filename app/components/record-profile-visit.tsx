"use client";

import { useEffect } from "react";
import { addRecentVisit } from "@/lib/recent-visits";

export function RecordProfileVisit({
  slug,
  displayName,
  hasViewerPassword,
}: {
  slug: string;
  displayName: string;
  hasViewerPassword: boolean;
}) {
  useEffect(() => {
    addRecentVisit({ slug, displayName, hasViewerPassword });
  }, [slug, displayName, hasViewerPassword]);

  return null;
}
