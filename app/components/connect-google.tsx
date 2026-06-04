"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConnectGoogle({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function disconnect() {
    setLoading(true);
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!connected) {
    return (
      <a
        href="/api/auth/google"
        className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
      >
        Connect Google Health
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={disconnect}
      disabled={loading}
      className="inline-flex items-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {loading ? "Disconnecting…" : "Disconnect"}
    </button>
  );
}
