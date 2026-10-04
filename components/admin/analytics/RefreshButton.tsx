"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/admin/ui/Button";

/** Re-renders the page from the server. Results are cached for 5 minutes, so this picks up anything newer than that. */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="secondary" icon={RefreshCw} pending={pending} onClick={() => startTransition(() => router.refresh())}>
      Refresh
    </Button>
  );
}
