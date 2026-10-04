import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignOutButton } from "@/components/SignOutButton";
import { SignOutNow } from "@/components/SignOutNow";

const signOut = vi.fn();
vi.mock("@clerk/nextjs", () => ({ useClerk: () => ({ signOut }) }));

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`;
}
function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

afterEach(() => {
  clearCookie("__client_uat");
  clearCookie("__client_uat_abc123");
  signOut.mockReset();
});

describe("SignOutButton", () => {
  it("renders nothing for a signed-out visitor", () => {
    const { container } = render(<SignOutButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when Clerk's cookie says signed out (0)", () => {
    setCookie("__client_uat", "0");
    const { container } = render(<SignOutButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a circular plain link to the sign-out page, fixed in the bottom-left corner, for a signed-in visitor", () => {
    setCookie("__client_uat", "1791131274");
    render(<SignOutButton />);
    const link = screen.getByRole("link", { name: "Sign out" });
    expect(link).toHaveAttribute("href", "/account/sign-out");
    expect(link).toHaveAttribute("rel", "nofollow");
    expect(link.className).toMatch(/\bfixed\b/);
    expect(link.className).toMatch(/\bbottom-4\b/);
    expect(link.className).toMatch(/\bleft-4\b/);
    expect(link.className).toMatch(/\brounded-full\b/);
    expect(link.className).toMatch(/\bsize-11\b/);
  });

  it("recognises the instance-suffixed cookie Clerk sets in development", () => {
    setCookie("__client_uat_abc123", "1791131274");
    render(<SignOutButton />);
    expect(screen.getByRole("link", { name: "Sign out" })).toBeInTheDocument();
  });
});

describe("SignOutNow", () => {
  it("ends the session and returns to the home page", () => {
    render(<SignOutNow />);
    expect(signOut).toHaveBeenCalledWith({ redirectUrl: "/" });
    expect(screen.getByRole("status")).toHaveTextContent("Signing you out");
  });
});
