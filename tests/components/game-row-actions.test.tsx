import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/admin/undo-action", () => ({ undoChange: vi.fn(async () => ({})) }));
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/games", useRouter: () => ({ push }) }));

import { GameRowActions } from "@/components/admin/GameRowActions";
import type { ActionState } from "@/lib/admin/action";

const props = { id: 12, name: "Mental math sprint score 41", title: "Delete this Mental math sprint score 41?", description: "Its volunteered contact (Ada) is deleted too." };

describe("GameRowActions", () => {
  it("asks first, saying what else goes, then submits the row id and moves to the Undo toast", async () => {
    const action = vi.fn(async (_p: ActionState, f: FormData): Promise<ActionState> => ({ ok: "Deleted.", undoId: 77, redirectTo: `/admin/games?saved=77&id=${f.get("id")}`, at: 1 }));
    render(<GameRowActions action={action} {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Mental math sprint score 41" }));
    expect(screen.getByText("Its volunteered contact (Ada) is deleted too.")).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/games?saved=77&id=12"));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does nothing when cancelled", () => {
    const action = vi.fn(async (): Promise<ActionState> => ({}));
    render(<GameRowActions action={action} {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Mental math sprint score 41" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Its volunteered contact (Ada) is deleted too.")).not.toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("shows a refusal", async () => {
    const action = vi.fn(async (): Promise<ActionState> => ({ error: "Only admins can do that.", at: 2 }));
    render(<GameRowActions action={action} {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Mental math sprint score 41" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Only admins can do that.")).toBeInTheDocument();
  });
});
