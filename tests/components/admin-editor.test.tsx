import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/lib/admin/undo-action", () => ({ undoChange: vi.fn(async () => ({})) }));
const path = vi.hoisted(() => ({ current: "/admin/photos" }));
vi.mock("next/navigation", () => ({ usePathname: () => path.current, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@vercel/blob/client", () => ({ upload: vi.fn() }));

import { ImageUpload } from "@/components/admin/ImageUpload";
import { SaveToast } from "@/components/admin/SaveToast";
import { SlotsForm } from "@/components/admin/SlotsForm";

describe("SaveToast", () => {
  it("says the save is going live and offers Undo and View on site", () => {
    render(<SaveToast state={{ ok: "Saved · live in a few seconds", undoId: 42, viewHref: "/", at: 1 }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Saved · live in a few seconds");
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on site/ })).toHaveAttribute("href", "/");
  });

  it("shows nothing before the first save", () => {
    render(<SaveToast state={{}} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("can be dismissed", () => {
    render(<SaveToast state={{ ok: "Saved", at: 2 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("ImageUpload", () => {
  it("asks for a JPEG instead of an iPhone HEIC photo", async () => {
    const { container } = render(<ImageUpload name="image" folder="photos" value={null} onChange={vi.fn()} label="Photo" />);
    const input = container.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "IMG_0001.HEIC", { type: "image/heic" })] } });
    expect(await screen.findByText(/HEIC photo\. Export it as a JPEG/)).toBeInTheDocument();
  });

  it("carries the current image as JSON in a hidden field", () => {
    const image = { src: "https://x.public.blob.vercel-storage.com/a.jpg", width: 10, height: 10 };
    const { container } = render(<ImageUpload name="image" folder="photos" value={image} onChange={vi.fn()} label="Photo" />);
    expect((container.querySelector("input[name=image]") as HTMLInputElement).value).toBe(JSON.stringify(image));
  });
});

describe("SlotsForm", () => {
  it("offers every library photo in each of the three slots", () => {
    render(
      <SlotsForm
        page="home"
        title="Home photos"
        hint="Hint"
        slotLabels={["Slot 1", "Slot 2", "Slot 3"]}
        options={[
          { id: "a", caption: "General meeting" },
          { id: "b", caption: "Closing Q&A" },
        ]}
        slots={["a", null, null]}
        action={vi.fn(async () => ({}))}
      />,
    );
    const slot1 = screen.getByLabelText("Slot 1") as HTMLSelectElement;
    expect(slot1.value).toBe("a");
    expect(Array.from(slot1.options).map((o) => o.textContent)).toEqual(["Empty", "General meeting", "Closing Q&A"]);
    expect(screen.getByRole("button", { name: "Save home photos" })).toBeDisabled();
  });
});
