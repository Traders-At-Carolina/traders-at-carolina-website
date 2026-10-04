import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const session = vi.hoisted(() => ({ admin: true }));
const updateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ updateTag, revalidatePath: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: session.admin ? "user_1" : null }),
  currentUser: async () => (session.admin ? { publicMetadata: { role: "admin" }, emailAddresses: [], primaryEmailAddress: { emailAddress: "admin@example.com" } } : null),
}));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));

import { adminAction, FormError, parseForm, publish } from "@/lib/admin/action";

describe("adminAction", () => {
  beforeEach(() => {
    session.admin = true;
  });

  it("runs the change as the signed-in admin and stamps the result", async () => {
    const state = await adminAction(async (who) => ({ ok: `saved by ${who.actorEmail}` }));
    expect(state.ok).toBe("saved by admin@example.com");
    expect(typeof state.at).toBe("number");
  });

  it("refuses non-admins without running the change", async () => {
    session.admin = false;
    const run = vi.fn();
    expect(await adminAction(run)).toMatchObject({ error: "Only admins can do that." });
    expect(run).not.toHaveBeenCalled();
  });

  it("turns rule failures into form and field errors, and anything else into a safe message", async () => {
    expect(await adminAction(async () => Promise.reject(new FormError("Nope", { caption: "Too long" })))).toMatchObject({
      error: "Nope",
      fieldErrors: { caption: "Too long" },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await adminAction(async () => Promise.reject(new Error("db down")))).toMatchObject({
      error: "Something went wrong, and nothing was saved. Try again.",
    });
  });
});

describe("parseForm", () => {
  const schema = z.object({ caption: z.string().min(1, "Add a caption."), ratio: z.enum(["3:2", "4:5"], { error: "Pick a crop." }) });

  it("returns parsed data", () => {
    expect(parseForm(schema, { caption: "Hi", ratio: "3:2" })).toEqual({ caption: "Hi", ratio: "3:2" });
  });

  it("reports the first problem for each field", () => {
    try {
      parseForm(schema, { caption: "", ratio: "1:1" });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FormError);
      expect((e as FormError).fieldErrors).toEqual({ caption: "Add a caption.", ratio: "Pick a crop." });
    }
  });
});

describe("publish", () => {
  it("expires each collection tag so public pages regenerate", () => {
    publish("photos", "people");
    expect(updateTag.mock.calls).toEqual([["photos"], ["people"]]);
  });
});
