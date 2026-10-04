import { sameState } from "@/lib/admin/same-state";
import { FormError } from "@/lib/admin/action";
import { setSetting } from "@/lib/admin/settings-db";
import {
  announcementSnapshot,
  announcementValues,
  deleteAnnouncement,
  deletePortalLink,
  deleteResource,
  getAnnouncement,
  getPortalLink,
  getResource,
  insertAnnouncement,
  insertPortalLink,
  insertResource,
  linkOrder,
  portalLinkSnapshot,
  resourceSnapshot,
  sectionOrder,
  setLinkOrders,
  setResourceOrders,
  updateAnnouncement,
  updatePortalLink,
  updateResource,
  type AnnouncementState,
  type LinkOrder,
  type PortalLinkSnapshot,
  type ResourceOrder,
  type ResourceSnapshot,
} from "@/lib/admin/portal-db";
import type { Handler } from "@/lib/admin/undo";
import { readPortalSetting } from "@/lib/members/settings";

const CHANGED = "This item has changed since. Undo the newer change first.";


/** The portal reads its getters per request, uncached, so undo has no cache tags to expire (spec 06 §8). */
const TAGS: string[] = [];
const VIEW = "/portal";

/** Undo for one row: refuses unless the row still looks exactly as the change left it, then restores the recorded state. */
function rowHandler<S extends { id: string }>(cfg: {
  label: string;
  current: (id: string) => Promise<S | undefined>;
  insert: (state: S) => Promise<S>;
  update: (id: string, state: S) => Promise<{ before: S; after: S }>;
  remove: (id: string) => Promise<S>;
}): Handler {
  const check = async (id: string, expected: unknown) => {
    if (!sameState((await cfg.current(id)) ?? null, expected)) throw new FormError(CHANGED);
  };
  return {
    label: cfg.label,
    tags: TAGS,
    viewHref: () => VIEW,
    remove: async (id, entry) => {
      await check(id, entry.after);
      return { before: await cfg.remove(id) };
    },
    recreate: async (state) => ({ after: await cfg.insert(state as unknown as S) }),
    restore: async (id, state, entry) => {
      await check(id, entry.after);
      return cfg.update(id, state as unknown as S);
    },
  };
}

const omitId = <S extends { id: string }>(s: S): Omit<S, "id"> => {
  const { id: _id, ...rest } = s;
  void _id;
  return rest;
};

const resource = rowHandler<ResourceSnapshot>({
  label: "Resource",
  current: async (id) => {
    const r = await getResource(id);
    return r && resourceSnapshot(r);
  },
  insert: (s) => insertResource(s),
  update: (id, s) => updateResource(id, omitId(s)),
  remove: deleteResource,
});

const announcement = rowHandler<AnnouncementState>({
  label: "Announcement",
  current: async (id) => {
    const r = await getAnnouncement(id);
    return r && announcementSnapshot(r);
  },
  insert: (s) => insertAnnouncement({ id: s.id, ...announcementValues(omitId(s)) }),
  update: (id, s) => updateAnnouncement(id, announcementValues(omitId(s))),
  remove: deleteAnnouncement,
});

const link = rowHandler<PortalLinkSnapshot>({
  label: "Member link",
  current: async (id) => {
    const r = await getPortalLink(id);
    return r && portalLinkSnapshot(r);
  },
  insert: (s) => insertPortalLink(s),
  update: (id, s) => updatePortalLink(id, omitId(s)),
  remove: deletePortalLink,
});

type Rows<T> = { rows: T };

/** Entity id "learning:pinned" or "learning:rest": one section's pinned or unpinned group. */
export function parseOrderGroup(id: string): { section: ResourceSnapshot["section"]; pinned: boolean } {
  const [section, group] = id.split(":");
  if (!["learning", "interview-prep", "recruiting", "other"].includes(section) || (group !== "pinned" && group !== "rest")) throw new FormError("Unknown section.");
  return { section: section as ResourceSnapshot["section"], pinned: group === "pinned" };
}

const resourceOrder: Handler = {
  label: "Resource order",
  tags: TAGS,
  viewHref: () => VIEW,
  restore: async (id, state, entry) => {
    const { section, pinned } = parseOrderGroup(id);
    if (!sameState(await sectionOrder(section, pinned), (entry.after as Rows<ResourceOrder>).rows)) throw new FormError(CHANGED);
    await setResourceOrders((state as Rows<ResourceOrder>).rows);
    return { before: entry.after, after: state };
  },
};

const linksOrder: Handler = {
  label: "Member link order",
  tags: TAGS,
  viewHref: () => VIEW,
  restore: async (_id, state, entry) => {
    if (!sameState(await linkOrder(), (entry.after as Rows<LinkOrder>).rows)) throw new FormError(CHANGED);
    await setLinkOrders((state as Rows<LinkOrder>).rows);
    return { before: entry.after, after: state };
  },
};

/** Portal settings. The action records `before` as the effective value (the defaults before the first save), so every save undoes. */
const settings: Handler = {
  label: "Portal settings",
  tags: TAGS,
  viewHref: () => VIEW,
  restore: async (_id, state, entry) => {
    if (!sameState(await readPortalSetting(), entry.after)) throw new FormError(CHANGED);
    return setSetting("portal", state);
  },
};

export const PORTAL_UNDO_HANDLERS: Record<string, Handler> = {
  resource,
  announcement,
  "portal-link": link,
  "resource-order": resourceOrder,
  "portal-link-order": linksOrder,
  "portal-settings": settings,
};

export const PORTAL_AREAS: Record<string, string> = {
  resource: "Resources",
  announcement: "Announcements",
  "portal-link": "Member links",
  "resource-order": "Resource order",
  "portal-link-order": "Member link order",
  "portal-settings": "Portal settings",
};
