import { sameState } from "@/lib/admin/same-state";
import { FormError } from "@/lib/admin/action";
import {
  deletePerson,
  deletePlacement,
  deleteSponsor,
  getPerson,
  getPlacement,
  getSeasonSetting,
  getSponsor,
  getTrack,
  insertPerson,
  insertPlacement,
  insertSponsor,
  personSnapshot,
  placementSnapshot,
  setOrders,
  setSeasonSetting,
  setWallOrders,
  sponsorSnapshot,
  tierOrder,
  trackSnapshot,
  updatePerson,
  updatePlacement,
  updateSponsor,
  updateTrack,
  wallOrder,
  type PersonSnapshot,
  type PlacementSnapshot,
  type SponsorSnapshot,
  type TrackSnapshot,
} from "@/lib/admin/lists-db";
import { deleteEvent, eventSnapshot, getEvent, getSetting, insertEvent, setSetting, updateEvent, type EventSnapshot } from "@/lib/admin/settings-db";
import type { Handler } from "@/lib/admin/undo";
import { TAGS } from "@/lib/data/public";

const CHANGED = "This item has changed since. Undo the newer change first.";
const same = sameState;

/**
 * One Undo handler per website list (spec 06 §3). Each refuses unless the item still looks exactly as the change left
 * it, so Undo never overwrites a later edit, then restores the recorded state through the same data functions.
 */
export function rowHandler<S extends { id: string }>(cfg: {
  label: string;
  tags: string[];
  viewHref: string;
  current: (id: string) => Promise<S | undefined>;
  insert: (state: S) => Promise<S>;
  update: (id: string, state: S) => Promise<{ before: S; after: S }>;
  remove: (id: string) => Promise<S>;
}): Handler {
  const check = async (id: string, expected: unknown) => {
    if (!same(await cfg.current(id), expected)) throw new FormError(CHANGED);
  };
  return {
    label: cfg.label,
    tags: cfg.tags,
    viewHref: () => cfg.viewHref,
    remove: async (id, entry) => {
      await check(id, entry.after);
      return { before: await cfg.remove(id) };
    },
    recreate: async (state) => ({ after: await cfg.insert(state as S) }),
    restore: async (id, state, entry) => {
      await check(id, entry.after);
      return cfg.update(id, state as S);
    },
  };
}

const omitId = <S extends { id: string }>(s: S) => {
  const { id: _id, ...rest } = s;
  void _id;
  return rest;
};

const sponsor = rowHandler<SponsorSnapshot>({
  label: "Sponsor",
  tags: [TAGS.sponsors],
  viewHref: "/about",
  current: async (id) => {
    const r = await getSponsor(id);
    return r && sponsorSnapshot(r);
  },
  insert: (s) => insertSponsor(s),
  update: (id, s) => updateSponsor(id, omitId(s)),
  remove: deleteSponsor,
});

const placement = rowHandler<PlacementSnapshot>({
  label: "Placement",
  tags: [TAGS.placements],
  viewHref: "/team",
  current: async (id) => {
    const r = await getPlacement(id);
    return r && placementSnapshot(r);
  },
  insert: (s) => insertPlacement(s),
  update: async (id, s) => {
    const { before, after } = await updatePlacement(id, omitId(s));
    await setWallOrders([{ id, wallOrder: s.wallOrder }]);
    return { before, after: { ...after, wallOrder: s.wallOrder } };
  },
  remove: deletePlacement,
});

const person = rowHandler<PersonSnapshot>({
  label: "Officer",
  tags: [TAGS.people],
  viewHref: "/team",
  current: async (id) => {
    const r = await getPerson(id);
    return r && personSnapshot(r);
  },
  insert: (s) => insertPerson(s),
  update: (id, s) => {
    const { slug: _slug, ...rest } = omitId(s);
    void _slug;
    return updatePerson(id, rest);
  },
  remove: deletePerson,
});

const track: Handler = {
  label: "Track",
  tags: [TAGS.tracks],
  viewHref: () => "/membership",
  restore: async (id, state, entry) => {
    const current = await getTrack(id as TrackSnapshot["id"]);
    if (!current || !same(trackSnapshot(current), entry.after)) throw new FormError(CHANGED);
    return updateTrack(id as TrackSnapshot["id"], omitId(state as TrackSnapshot));
  },
};

const season: Handler = {
  label: "Academic year",
  tags: [TAGS.season],
  viewHref: () => "/team",
  restore: async (_id, state, entry) => {
    if (!same(await getSeasonSetting(), entry.after)) throw new FormError(CHANGED);
    return setSeasonSetting(state);
  },
};

type Orders = { rows: Array<{ id: string; sortOrder: number }> };
const peopleOrder: Handler = {
  label: "Officer order",
  tags: [TAGS.people],
  viewHref: () => "/team",
  restore: async (group, state, entry) => {
    const now = await tierOrder(group as PersonSnapshot["group"]);
    if (!same(now, (entry.after as Orders).rows)) throw new FormError(CHANGED);
    await setOrders((state as Orders).rows);
    return { before: entry.after, after: state };
  },
};

type WallOrders = { rows: Array<{ id: string; wallOrder: number | null }> };
const wall: Handler = {
  label: "Wall order",
  tags: [TAGS.placements],
  viewHref: () => "/team",
  restore: async (_id, state, entry) => {
    if (!same(await wallOrder(), (entry.after as WallOrders).rows)) throw new FormError(CHANGED);
    await setWallOrders((state as WallOrders).rows);
    return { before: entry.after, after: state };
  },
};

const event = rowHandler<EventSnapshot>({
  label: "Event",
  tags: [TAGS.events],
  viewHref: "/",
  current: async (id) => {
    const r = await getEvent(id);
    return r && eventSnapshot(r);
  },
  insert: (s) => insertEvent(s),
  update: (id, s) => updateEvent(id, omitId(s)),
  remove: deleteEvent,
});

const recruiting: Handler = {
  label: "Recruiting",
  tags: [TAGS.recruiting],
  viewHref: () => "/apply",
  restore: async (_id, state, entry) => {
    if (!same((await getSetting("recruiting")) ?? null, entry.after)) throw new FormError(CHANGED);
    return setSetting("recruiting", state);
  },
};

export const LIST_UNDO_HANDLERS: Record<string, Handler> = {
  sponsor,
  placement,
  person,
  track,
  season,
  "people-order": peopleOrder,
  "wall-order": wall,
  event,
  recruiting,
};

export const LIST_AREAS: Record<string, string> = {
  sponsor: "Sponsors",
  placement: "Placements",
  person: "Officers",
  track: "Tracks",
  season: "Academic year",
  "people-order": "Officer order",
  "wall-order": "Wall order",
  event: "Events",
  recruiting: "Recruiting",
};
