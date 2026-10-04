"use client";

import { Building2, CalendarDays, Clock, Handshake, IdCard, type LucideIcon, Search, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type KeyboardEvent, type MouseEvent, type RefObject, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ADMIN_SECTIONS, screenFor } from "@/lib/admin/nav";
import { filterItems, PALETTE_ACTIONS, readRecent, recordRecent } from "@/lib/admin/palette";
import { type SearchKind, type SearchResult, searchAdmin } from "@/lib/admin/search";
import { cx } from "./ui/cx";
import { useModal } from "./ui/Dialog";

const DEBOUNCE_MS = 200;
const MIN_QUERY = 2;

const KIND_ICON: Record<SearchKind, LucideIcon> = {
  member: User,
  event: CalendarDays,
  officer: IdCard,
  sponsor: Handshake,
  placement: Building2,
};

type Entry = { id: string; label: string; sub?: string; href: string; icon: LucideIcon };
type Group = { label: string; entries: Entry[] };

const ALL_SCREENS = ADMIN_SECTIONS.flatMap((s) => s.screens);

/**
 * The ⌘K command palette (spec 11 §5.1). Opens on ⌘K / Ctrl+K anywhere in the console or from the top-bar button;
 * Esc closes and focus goes back to the opener. Jumps to screens, actions and records; it never writes data.
 */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const pathname = usePathname();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Remember each screen visited, for Recent.
  useEffect(() => {
    const href = screenFor(pathname)?.href;
    if (href) recordRecent(href);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) inputRef.current?.select();
        else onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Capture the opener before anything inside the dialog takes focus.
  useLayoutEffect(() => {
    if (open && !wasOpen.current) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
  }, [open]);

  useModal(ref, open);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const href = screenFor(pathname)?.href;
      if (href) recordRecent(href);
      inputRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener?.isConnected) opener.focus();
    }
    // pathname is read for the snapshot on open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Search the console"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      className="mx-auto mt-[12vh] mb-auto w-[calc(100%-2rem)] max-w-[640px] animate-ui-pop overflow-hidden rounded-ui-lg border border-ui-border bg-ui-surface p-0 text-ui-text shadow-ui-pop backdrop:bg-ui-text/40"
    >
      {open ? <PaletteBody inputRef={inputRef} currentHref={screenFor(pathname)?.href} onClose={close} /> : null}
    </dialog>
  );
}

function PaletteBody({ inputRef, currentHref, onClose }: { inputRef: RefObject<HTMLInputElement | null>; currentHref?: string; onClose: () => void }) {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent] = useState(readRecent);
  const [found, setFound] = useState<{ q: string; results: SearchResult[] }>({ q: "", results: [] });
  const requestRef = useRef(0);

  const term = query.trim();
  const searching = term.length >= MIN_QUERY;

  // Records: debounced, and only the newest request's answer is kept.
  useEffect(() => {
    const id = ++requestRef.current;
    if (term.length < MIN_QUERY) return;
    const timer = setTimeout(() => {
      searchAdmin(term)
        .catch(() => [] as SearchResult[])
        .then((results) => {
          if (id === requestRef.current) setFound({ q: term, results });
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const loading = searching && found.q !== term;

  const groups = useMemo<Group[]>(() => {
    const screenEntry = (prefix: string) => (s: (typeof ALL_SCREENS)[number]): Entry => ({ id: `${prefix}:${s.href}`, label: s.label, sub: s.description, href: s.href, icon: s.icon });
    if (!term) {
      const recentScreens = recent
        .filter((href) => href !== currentHref)
        .map((href) => ALL_SCREENS.find((s) => s.href === href))
        .filter((s): s is (typeof ALL_SCREENS)[number] => s !== undefined)
        .map((s) => ({ ...screenEntry("recent")(s), icon: Clock }));
      return [
        { label: "Recent", entries: recentScreens },
        { label: "Screens", entries: ALL_SCREENS.map(screenEntry("screen")) },
      ].filter((g) => g.entries.length > 0);
    }
    const records = found.q === term ? found.results : [];
    return [
      { label: "Screens", entries: filterItems(ALL_SCREENS, term).map(screenEntry("screen")) },
      { label: "Actions", entries: filterItems(PALETTE_ACTIONS, term).map((a) => ({ id: `action:${a.href}`, label: a.label, sub: a.description, href: a.href, icon: a.icon })) },
      { label: "Records", entries: records.map((r) => ({ id: `record:${r.kind}:${r.id}`, label: r.label, sub: r.sub, href: r.href, icon: KIND_ICON[r.kind] })) },
    ].filter((g) => g.entries.length > 0);
  }, [term, recent, currentHref, found]);

  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);
  const starts = useMemo(() => groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.entries.length, 0)), [groups]);
  const activeIndex = flat.length ? Math.min(active, flat.length - 1) : -1;
  const optionId = (i: number) => `${listboxId}-option-${i}`;

  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView?.({ block: "nearest" });
    // optionId only depends on listboxId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const go = (entry: Entry, newTab: boolean) => {
    if (newTab) window.open(entry.href, "_blank", "noopener,noreferrer");
    else router.push(entry.href);
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!flat.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) go(flat[activeIndex], e.metaKey || e.ctrlKey);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="font-ui">
      <div className="flex items-center gap-3 border-b border-ui-border px-4">
        <Search aria-hidden className="size-4 shrink-0 text-ui-text-3" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search screens, actions and records"
          aria-expanded={flat.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search screens, actions and records…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="h-12 w-full bg-transparent text-ui-base text-ui-text outline-none placeholder:text-ui-text-3"
        />
      </div>
      <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
        <div role="listbox" id={listboxId} aria-label="Results">
          {groups.map((group, gi) => (
            <div key={group.label} role="group" aria-label={group.label} className="mb-1 last:mb-0">
              <div role="presentation" className="px-2 pt-2 pb-1 text-ui-hint font-medium tracking-wide text-ui-text-3 uppercase">
                {group.label}
              </div>
              {group.entries.map((entry, ei) => {
                const i = starts[gi] + ei;
                const selected = i === activeIndex;
                const Icon = entry.icon;
                return (
                  <div
                    key={entry.id}
                    id={optionId(i)}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => {
                      if (!selected) setActive(i);
                    }}
                    onMouseDown={(e: MouseEvent) => e.preventDefault()}
                    onClick={(e: MouseEvent) => go(entry, e.metaKey || e.ctrlKey)}
                    className={cx("flex min-h-11 cursor-pointer items-center gap-3 rounded-ui-md px-2 py-1.5", selected && "bg-ui-subtle")}
                  >
                    <Icon aria-hidden className={cx("size-4 shrink-0", selected ? "text-ui-accent" : "text-ui-text-3")} />
                    <span className="min-w-0 flex-1 truncate text-ui-base">
                      <span className="font-medium text-ui-text">{entry.label}</span>
                      {entry.sub ? <span className="ml-2 text-ui-label text-ui-text-3">{entry.sub}</span> : null}
                    </span>
                    {selected ? (
                      <span aria-hidden className="shrink-0 text-ui-label text-ui-text-3">
                        ↵
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div role="status" aria-live="polite">
          {loading ? (
            <p className="px-2 py-2 text-ui-label text-ui-text-3">Searching…</p>
          ) : flat.length === 0 ? (
            <p className="px-2 py-6 text-center text-ui-base text-ui-text-2">No results{term ? <> for &ldquo;{term}&rdquo;</> : null}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-4 border-t border-ui-border bg-ui-canvas px-4 py-2 text-ui-hint text-ui-text-3">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> to move
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↵</Kbd> to open
        </span>
        <span className="flex items-center gap-1">
          <Kbd>esc</Kbd> to close
        </span>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return <kbd className="inline-flex min-w-5 items-center justify-center rounded-ui-sm border border-ui-border bg-ui-surface px-1 font-ui text-ui-hint text-ui-text-2">{children}</kbd>;
}
