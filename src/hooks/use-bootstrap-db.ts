"use client";

import { useEffect } from "react";
import type { PunchItem, Project } from "@/lib/types";
import { useCloseout } from "@/lib/store";

interface BootstrapResponse {
  projects: Project[];
  items: PunchItem[];
}

export function useBootstrapDb() {
  const hydrated = useCloseout((s) => s.hydrated);
  const setData = useCloseout((s) => s.setData);
  const setConnectionState = useCloseout((s) => s.setConnectionState);

  useEffect(() => {
    if (hydrated) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/bootstrap");
        if (!res.ok) throw new Error(`Bootstrap failed (${res.status})`);
        const payload = (await res.json()) as BootstrapResponse;
        if (!active) return;
        setData(payload.projects, payload.items);
      } catch {
        if (!active) return;
        setConnectionState(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [hydrated, setData, setConnectionState]);
}
