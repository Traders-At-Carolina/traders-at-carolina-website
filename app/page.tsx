import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { validateHome } from "@/lib/validate-home";

validateHome(home);

export const metadata: Metadata = {
  title: { absolute: "Traders at Carolina · Quantitative Finance at UNC" },
  description: home.hero.subhead,
};

export default function Page() {
  return <HomePage home={home} recruiting={site.recruiting} now={new Date()} />;
}
