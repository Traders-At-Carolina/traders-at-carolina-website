import { Container } from "@/components/Container";

// Temporary placeholder; replaced by spec 01 (Home).
export default function Home() {
  return (
    <Container className="py-24">
      <p className="eyebrow">Quantitative finance at UNC</p>
      <h1 className="mt-4 max-w-[14ch] text-display">
        Rigor, <em>practiced</em> together.
      </h1>
      <p className="mt-6 max-w-prose text-lead text-ink-2">
        Traders at Carolina prepares UNC students for careers in quantitative trading, research and
        engineering — no prior finance experience required.
      </p>
      <p className="mt-10 text-caption text-ink-3 tabular">
        Members 120+ · Founded 2019 · 0123456789
      </p>
    </Container>
  );
}
