import { describe, expect, it } from "vitest";
import { changedFields } from "@/lib/admin/diff";
import { fitWithin, isHeic, uploadPathname } from "@/lib/admin/image-prep";
import { photoSnapshot, slotProblem } from "@/lib/admin/photos";
import { planUndo } from "@/lib/admin/undo-plan";

describe("fitWithin", () => {
  it("scales the long edge down to the limit and keeps the aspect ratio", () => {
    expect(fitWithin(4800, 3200, 2400)).toEqual({ width: 2400, height: 1600 });
    expect(fitWithin(3000, 6000, 2400)).toEqual({ width: 1200, height: 2400 });
  });

  it("leaves images that already fit alone", () => {
    expect(fitWithin(1200, 800, 2400)).toEqual({ width: 1200, height: 800 });
  });
});

describe("isHeic", () => {
  it("catches iPhone photos by type or extension", () => {
    expect(isHeic({ type: "image/heic", name: "IMG_1.HEIC" })).toBe(true);
    expect(isHeic({ type: "", name: "IMG_2.heif" })).toBe(true);
    expect(isHeic({ type: "image/jpeg", name: "IMG_3.jpg" })).toBe(false);
  });
});

describe("uploadPathname", () => {
  it("puts uploads under uploads/<folder>/ with a safe file name", () => {
    expect(uploadPathname("photos", "Mock Trading Night (2).JPG")).toBe("uploads/photos/mock-trading-night-2.jpg");
    expect(uploadPathname("logos", "../../evil.svg")).toBe("uploads/logos/evil.svg");
  });
});

describe("slotProblem", () => {
  it("lets Home have 0, 2 or 3 photos", () => {
    expect(slotProblem("home", [])).toBeNull();
    expect(slotProblem("home", ["a", "b"])).toBeNull();
    expect(slotProblem("home", ["a", "b", "c"])).toBeNull();
    expect(slotProblem("home", ["a"])).toMatch(/at least 2/);
  });

  it("lets Membership have 0, 1 or 3 photos", () => {
    expect(slotProblem("membership", ["a"])).toBeNull();
    expect(slotProblem("membership", ["a", "b"])).toMatch(/third photo/);
  });

  it("rejects the same photo in two slots of one page", () => {
    expect(slotProblem("home", ["a", "a"])).toMatch(/once/);
  });
});

describe("photoSnapshot", () => {
  it("keeps the photo's content and drops slot and timestamp columns", () => {
    const row = {
      id: "p1",
      image: { src: "https://x.public.blob.vercel-storage.com/a.jpg", width: 10, height: 10 },
      alt: "A",
      caption: "C",
      ratio: "3:2" as const,
      homeOrder: 1,
      membershipOrder: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(photoSnapshot(row)).toEqual({ id: "p1", image: row.image, alt: "A", caption: "C", ratio: "3:2" });
  });
});

describe("changedFields", () => {
  it("lists each field that changed, with its old and new value", () => {
    expect(changedFields({ alt: "A", caption: "Old", ratio: "3:2" }, { alt: "A", caption: "New", ratio: "4:5" })).toEqual([
      { field: "caption", before: "Old", after: "New" },
      { field: "ratio", before: "3:2", after: "4:5" },
    ]);
  });

  it("treats a create or delete as every field changing", () => {
    expect(changedFields(null, { caption: "New" })).toEqual([{ field: "caption", before: undefined, after: "New" }]);
    expect(changedFields({ caption: "Old" }, null)).toEqual([{ field: "caption", before: "Old", after: undefined }]);
  });
});

describe("planUndo", () => {
  const entry = { id: 7, entity: "photo", entityId: "p1", before: { caption: "Old" }, after: { caption: "New" } };

  it("restores the before state of the latest change to an item", () => {
    expect(planUndo(entry, 7)).toEqual({ kind: "restore", state: { caption: "Old" } });
  });

  it("deletes a created item and recreates a deleted one", () => {
    expect(planUndo({ ...entry, before: null }, 7)).toEqual({ kind: "remove" });
    expect(planUndo({ ...entry, after: null }, 7)).toEqual({ kind: "recreate", state: { caption: "Old" } });
  });

  it("refuses when the item changed since, or the entry can't be undone", () => {
    expect(planUndo(entry, 9)).toEqual({ kind: "refuse", reason: "This item has changed since. Undo the newer change first." });
    expect(planUndo({ ...entry, entityId: null }, 7).kind).toBe("refuse");
    expect(planUndo({ ...entry, before: null, after: null }, 7).kind).toBe("refuse");
  });
});
