import { mulberry32 } from "@/lib/random-walk";

/**
 * Fermi markets (spec 03 §3.7): quote a low–high spread on a big-number question, scored like a market —
 * inside the spread pays more the tighter it is; a miss pays nothing. Everything lives on a log10 axis.
 */

export type FermiQuestion = {
  id: string;
  prompt: string;
  value: number;
  /** Shown after the number on reveal, e.g. "km". */
  unit?: string;
  /** A rounded or estimated figure, shown as "≈ 2.9B" rather than every digit. */
  approx?: boolean;
  /** One-line Fermi breakdown or source. */
  why: string;
};

export const ROUNDS = 3;
export const MAX_ROUND_SCORE = 100;
/** Points lost per order of magnitude of spread width (10× wide scores 75). */
export const WIDTH_PENALTY = 25;
/** A hit never scores below this, however wide. */
export const MIN_HIT_SCORE = 5;

/**
 * Answers are stable facts, exact counts or well-cited estimates. Year-stamped figures drift: officers should
 * refresh them (and spot-check the rest) before each recruiting season.
 */
export const QUESTIONS: FermiQuestion[] = [
  { id: "seconds-year", prompt: "How many seconds are in a (non-leap) year?", value: 31_536_000, why: "60 × 60 × 24 × 365." },
  { id: "seconds-day", prompt: "How many seconds are in a day?", value: 86_400, why: "60 × 60 × 24." },
  { id: "minutes-year", prompt: "How many minutes are in a (non-leap) year?", value: 525_600, why: "60 × 24 × 365." },
  { id: "days-80", prompt: "How many days are in an 80-year life?", value: 29_220, why: "80 × 365.25." },
  {
    id: "heartbeats",
    prompt: "How many times does a heart beat over an 80-year life?",
    value: 2.9e9,
    approx: true,
    why: "About 70 beats a minute × 60 × 24 × 365 × 80.",
  },
  { id: "us-pop", prompt: "What was the US population in 2024?", value: 340e6, approx: true, why: "Census Bureau estimate for July 2024: about 340 million." },
  { id: "world-pop", prompt: "What was the world population in 2024?", value: 8.2e9, approx: true, why: "UN estimate for 2024: about 8.2 billion." },
  { id: "nc-pop", prompt: "What was North Carolina's population in 2023?", value: 10.8e6, approx: true, why: "Census Bureau estimate for July 2023: about 10.8 million." },
  { id: "nyc-pop", prompt: "What was New York City's population in 2023?", value: 8.3e6, approx: true, why: "Census Bureau estimate for July 2023: about 8.3 million." },
  {
    id: "ever-lived",
    prompt: "Roughly how many people have ever lived?",
    value: 117e9,
    approx: true,
    why: "The Population Reference Bureau's estimate: about 117 billion, so today's 8 billion are under 7% of everyone.",
  },
  { id: "unc-students", prompt: "How many students were enrolled at UNC-Chapel Hill in fall 2024?", value: 32_000, approx: true, why: "About 20,000 undergraduates and 12,000 graduate and professional students." },
  { id: "hp-words", prompt: "How many words are in the seven Harry Potter books combined?", value: 1_084_000, approx: true, why: "Seven books averaging about 155,000 words." },
  { id: "moon", prompt: "How far is the Moon from Earth, in kilometres?", value: 384_400, unit: "km", why: "The average Earth–Moon distance; about 30 Earths side by side." },
  { id: "sun", prompt: "How far is the Sun from Earth, in kilometres?", value: 149.6e6, unit: "km", approx: true, why: "One astronomical unit: light takes about 8 minutes 20 seconds to cover it." },
  { id: "light-ms", prompt: "How fast does light travel, in metres per second?", value: 299_792_458, unit: "m/s", why: "Exact by definition of the metre: about 300,000 km every second." },
  { id: "light-year", prompt: "How many kilometres are in a light-year?", value: 9.46e12, unit: "km", approx: true, why: "300,000 km/s × 31.6 million seconds in a year." },
  { id: "circumference", prompt: "How long is Earth's equator, in kilometres?", value: 40_075, unit: "km", why: "The metre was first defined so the pole-to-equator distance was 10,000 km." },
  { id: "everest", prompt: "How tall is Mount Everest, in metres?", value: 8_849, unit: "m", why: "The 2020 China–Nepal survey: 8,848.86 m." },
  {
    id: "steps-equator",
    prompt: "How many steps would it take to walk around the equator, at 0.75 m a step?",
    value: 53.4e6,
    approx: true,
    why: "40,075 km ÷ 0.75 m: about 53 million.",
  },
  { id: "hairs", prompt: "About how many hairs are on a typical human head?", value: 100_000, approx: true, why: "Roughly 100,000, a little more for blondes and fewer for redheads." },
  { id: "cells", prompt: "About how many cells are in the human body?", value: 37e12, approx: true, why: "A 2013 estimate tallying organ by organ: about 37 trillion." },
  { id: "trees", prompt: "About how many trees are on Earth?", value: 3e12, approx: true, why: "A 2015 study combining satellite and ground counts: about 3 trillion." },
  { id: "pool", prompt: "How many litres of water fill an Olympic swimming pool?", value: 2_500_000, unit: "L", why: "50 m × 25 m × 2 m = 2,500 m³, and each m³ is 1,000 L." },
  { id: "747", prompt: "What's the maximum takeoff weight of a Boeing 747-400, in kilograms?", value: 397_000, unit: "kg", approx: true, why: "Boeing's figure: 396,890 kg, about 875,000 lb." },
  { id: "m1", prompt: "How many transistors are on Apple's M1 chip?", value: 16e9, approx: true, why: "Apple's figure at launch in 2020: 16 billion." },
  { id: "dollar-mile", prompt: "How many $1 bills, stacked flat, make a pile one mile high?", value: 14.7e6, approx: true, why: "A bill is about 0.0043 in thick; 63,360 in ÷ 0.0043 is about 14.7 million." },
  { id: "us-gdp", prompt: "What was US GDP in 2023, in dollars?", value: 27.4e12, unit: "USD", approx: true, why: "BEA's nominal figure: about $27.4 trillion." },
  { id: "us-debt", prompt: "What was the US federal debt in mid-2024, in dollars?", value: 35e12, unit: "USD", approx: true, why: "Treasury's total public debt passed $35 trillion in July 2024." },
  { id: "trading-days", prompt: "How many trading days does the NYSE have in a typical year?", value: 252, why: "365 days, minus 104 weekend days, minus about 9 market holidays." },
  { id: "bitcoin", prompt: "What's the maximum number of bitcoin that can ever exist?", value: 21_000_000, why: "Fixed by the protocol: the block reward halves every 210,000 blocks." },
  { id: "mcdonalds", prompt: "How many McDonald's restaurants were there worldwide at the end of 2023?", value: 41_800, approx: true, why: "McDonald's 2023 annual report: about 41,800." },
  { id: "starbucks", prompt: "How many Starbucks stores were in the US in 2023?", value: 16_300, approx: true, why: "Starbucks' fiscal 2023 report: about 16,300 US stores." },
  { id: "flights", prompt: "About how many commercial flights take off worldwide each day?", value: 100_000, approx: true, why: "Roughly 100,000 a day before and since the pandemic dip." },
  { id: "searches", prompt: "About how many Google searches happen each day?", value: 8.5e9, approx: true, why: "A widely cited estimate: about 8.5 billion a day, nearly 100,000 a second." },
  { id: "poker-hands", prompt: "How many different 5-card poker hands can be dealt from a 52-card deck?", value: 2_598_960, why: "52 choose 5 = (52 × 51 × 50 × 49 × 48) ÷ 120." },
  { id: "lottery", prompt: "How many ways are there to pick 6 numbers from 1 to 49?", value: 13_983_816, why: "49 choose 6, which is why a single ticket wins about once in 14 million draws." },
  { id: "ipv4", prompt: "How many IPv4 addresses are there?", value: 4_294_967_296, why: "Addresses are 32 bits: 2³² of them." },
  { id: "rubiks", prompt: "How many positions can a 3×3 Rubik's Cube reach?", value: 4.3252e19, approx: true, why: "43,252,003,274,489,856,000: about 43 quintillion." },
  { id: "deck-orders", prompt: "How many ways can a 52-card deck be shuffled?", value: 8.0658e67, approx: true, why: "52! — every well-shuffled deck is almost certainly a first in history." },
  {
    id: "seconds-ad",
    prompt: "How many seconds have passed since 1 January in the year 1 AD (as of 2024)?",
    value: 6.39e10,
    approx: true,
    why: "2,023 years × about 31.6 million seconds a year.",
  },
];

/** `n` distinct questions in a seeded order. */
export function pickRounds(seed: number, n: number = ROUNDS, bank: FermiQuestion[] = QUESTIONS): FermiQuestion[] {
  const rand = mulberry32(seed);
  const pool = [...bank];
  // Partial Fisher–Yates: stop once the first n are fixed.
  for (let i = 0; i < Math.min(n, pool.length); i++) {
    const j = i + Math.floor(rand() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

const SUFFIXES: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, t: 1e12, trillion: 1e12 };

/** "250k", "3.5 m", "2e9", "1,200,000", "4 billion" → a positive number; anything else → null. */
export function parseAmount(text: string): number | null {
  const match = text.trim().toLowerCase().replace(/[,_$\s]/g, "").match(/^(\d*\.?\d+(?:e[+-]?\d+)?)([a-z]*)$/);
  if (!match) return null;
  const [, num, suffix] = match;
  const multiplier = suffix === "" ? 1 : SUFFIXES[suffix];
  if (multiplier === undefined) return null;
  const value = Number(num) * multiplier;
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function isHit(low: number, high: number, value: number): boolean {
  return value >= low && value <= high;
}

/** Inside the spread: 100 − 25 per order of magnitude wide, never below 5. Outside: 0. */
export function scoreSpread(low: number, high: number, value: number): number {
  if (!isHit(low, high, value)) return 0;
  return Math.max(MIN_HIT_SCORE, Math.round(MAX_ROUND_SCORE - WIDTH_PENALTY * Math.log10(high / low)));
}

/** How many times too low or too high the spread was; 1 for a hit. */
export function missFactor(low: number, high: number, value: number): number {
  if (value < low) return low / value;
  if (value > high) return value / high;
  return 1;
}

const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const superscript = (n: number) => [...String(n)].map((d) => SUPERSCRIPT[Number(d)]).join("");
const NAMES = ["", "K", "M", "B", "T"];

/** Compact: 950, 31.5M, 4.29B, 9.46T, then 4.3 × 10¹⁹. Three significant figures at most. */
export function formatAmount(n: number): string {
  if (n >= 1e15) {
    let exp = Math.floor(Math.log10(n));
    let mantissa = Number((n / 10 ** exp).toPrecision(2));
    if (mantissa >= 10) {
      mantissa /= 10;
      exp += 1;
    }
    return `${mantissa} × 10${superscript(exp)}`;
  }
  if (n < 1000) return String(Number(n.toPrecision(3)));
  let k = Math.min(NAMES.length - 1, Math.floor(Math.log10(n) / 3));
  let scaled = Number((n / 10 ** (3 * k)).toPrecision(3));
  if (scaled >= 1000 && k < NAMES.length - 1) {
    k += 1;
    scaled = Number((n / 10 ** (3 * k)).toPrecision(3));
  }
  return `${scaled}${NAMES[k]}`;
}

/** Exact answers in full ("31,536,000"); approximate or astronomical ones compact ("≈ 2.9B"). */
export function formatAnswer(q: FermiQuestion): string {
  const number = !q.approx && q.value < 1e15 ? q.value.toLocaleString("en-US") : formatAmount(q.value);
  return `${q.approx ? "≈ " : ""}${number}${q.unit ? ` ${q.unit}` : ""}`;
}

/** "4.2×" below 10, "37×" below 1,000, then compact: "166K×". */
export function formatRatio(ratio: number): string {
  if (ratio < 10) return `${Number(ratio.toFixed(1))}×`;
  if (ratio < 1000) return `${Math.round(ratio)}×`;
  return `${formatAmount(ratio)}×`;
}

export type Domain = { min: number; max: number };

/** Before any input: 1 to 1T. Never depends on the answer until it's revealed. */
export const DEFAULT_DOMAIN: Domain = { min: 0, max: 12 };
const PAD = 1;
const MIN_SPAN = 4;

/** Whole powers of ten covering every point with one order of padding each side, at least four orders wide. */
export function axisDomain(points: number[]): Domain {
  const valid = points.filter((p) => p > 0 && Number.isFinite(p));
  if (valid.length === 0) return DEFAULT_DOMAIN;
  const min = Math.max(0, Math.floor(Math.log10(Math.min(...valid))) - PAD);
  const max = Math.max(min + MIN_SPAN, Math.ceil(Math.log10(Math.max(...valid))) + PAD);
  return { min, max };
}

/** Position on the axis as a percentage, clamped to the line. */
export function axisPercent(n: number, d: Domain): number {
  const pct = ((Math.log10(n) - d.min) / (d.max - d.min)) * 100;
  return Math.min(100, Math.max(0, pct));
}

/** "1", "10", "100", "1K" … "100T", then "10¹⁵". */
export function tickLabel(exp: number): string {
  if (exp >= 15) return `10${superscript(exp)}`;
  return `${10 ** (exp % 3)}${NAMES[Math.floor(exp / 3)]}`;
}

/** Exponents to label: every power when the axis is short, otherwise a step (in thousands where possible) keeping it to about six labels. */
export function axisTicks(d: Domain, maxLabels = 6): number[] {
  const span = d.max - d.min;
  let step = Math.max(1, Math.ceil(span / maxLabels));
  if (step > 1 && step < 3) step = 3;
  if (step > 3) step = Math.ceil(step / 3) * 3;
  const first = Math.ceil(d.min / step) * step;
  const ticks: number[] = [];
  for (let e = first; e <= d.max; e += step) ticks.push(e);
  return ticks;
}
