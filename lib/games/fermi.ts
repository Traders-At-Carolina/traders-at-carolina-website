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
/** Largest answer in the bank: quotable in billions, never astronomical. */
export const MAX_ANSWER = 1e10;
export const MAX_ROUND_SCORE = 100;
/** Points lost per order of magnitude of spread width (10× wide scores 75). */
export const WIDTH_PENALTY = 25;
/** A hit never scores below this, however wide. */
export const MIN_HIT_SCORE = 5;

/**
 * Answers are stable facts, exact counts or well-cited estimates, all between 100 and 10 billion so they can be
 * quoted with k, m and b. Year-stamped figures drift: officers should refresh them (and spot-check the rest)
 * before each recruiting season.
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
  { id: "unc-students", prompt: "How many students were enrolled at UNC-Chapel Hill in fall 2024?", value: 32_000, approx: true, why: "About 20,000 undergraduates and 12,000 graduate and professional students." },
  { id: "hp-words", prompt: "How many words are in the seven Harry Potter books combined?", value: 1_084_000, approx: true, why: "Seven books averaging about 155,000 words." },
  { id: "moon", prompt: "How far is the Moon from Earth, in kilometres?", value: 384_400, unit: "km", why: "The average Earth–Moon distance; about 30 Earths side by side." },
  { id: "sun", prompt: "How far is the Sun from Earth, in kilometres?", value: 149.6e6, unit: "km", approx: true, why: "One astronomical unit: light takes about 8 minutes 20 seconds to cover it." },
  { id: "light-ms", prompt: "How fast does light travel, in metres per second?", value: 299_792_458, unit: "m/s", why: "Exact by definition of the metre: about 300,000 km every second." },
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
  { id: "pool", prompt: "How many litres of water fill an Olympic swimming pool?", value: 2_500_000, unit: "L", why: "50 m × 25 m × 2 m = 2,500 m³, and each m³ is 1,000 L." },
  { id: "747", prompt: "What's the maximum takeoff weight of a Boeing 747-400, in kilograms?", value: 397_000, unit: "kg", approx: true, why: "Boeing's figure: 396,890 kg, about 875,000 lb." },
  { id: "dollar-mile", prompt: "How many $1 bills, stacked flat, make a pile one mile high?", value: 14.7e6, approx: true, why: "A bill is about 0.0043 in thick; 63,360 in ÷ 0.0043 is about 14.7 million." },
  { id: "trading-days", prompt: "How many trading days does the NYSE have in a typical year?", value: 252, why: "365 days, minus 104 weekend days, minus about 9 market holidays." },
  { id: "bitcoin", prompt: "What's the maximum number of bitcoin that can ever exist?", value: 21_000_000, why: "Fixed by the protocol: the block reward halves every 210,000 blocks." },
  { id: "mcdonalds", prompt: "How many McDonald's restaurants were there worldwide at the end of 2023?", value: 41_800, approx: true, why: "McDonald's 2023 annual report: about 41,800." },
  { id: "starbucks", prompt: "How many Starbucks stores were in the US in 2023?", value: 16_300, approx: true, why: "Starbucks' fiscal 2023 report: about 16,300 US stores." },
  { id: "flights", prompt: "About how many commercial flights take off worldwide each day?", value: 100_000, approx: true, why: "Roughly 100,000 a day before and since the pandemic dip." },
  { id: "searches", prompt: "About how many Google searches happen each day?", value: 8.5e9, approx: true, why: "A widely cited estimate: about 8.5 billion a day, nearly 100,000 a second." },
  { id: "poker-hands", prompt: "How many different 5-card poker hands can be dealt from a 52-card deck?", value: 2_598_960, why: "52 choose 5 = (52 × 51 × 50 × 49 × 48) ÷ 120." },
  { id: "lottery", prompt: "How many ways are there to pick 6 numbers from 1 to 49?", value: 13_983_816, why: "49 choose 6, which is why a single ticket wins about once in 14 million draws." },
  { id: "ipv4", prompt: "How many IPv4 addresses are there?", value: 4_294_967_296, why: "Addresses are 32 bits: 2³² of them." },
  { id: "minutes-week", prompt: "How many minutes are in a week?", value: 10_080, why: "60 × 24 × 7." },
  { id: "hours-year", prompt: "How many hours are in a (non-leap) year?", value: 8_760, why: "24 × 365." },
  { id: "billion-seconds", prompt: "How many days does it take for a billion seconds to pass?", value: 11_574, approx: true, why: "1,000,000,000 ÷ 86,400 seconds a day: about 31.7 years." },
  { id: "marathon", prompt: "How long is a marathon, in metres?", value: 42_195, unit: "m", why: "Fixed at 26 miles 385 yards since the 1908 London Olympics." },
  { id: "bones", prompt: "How many bones are in an adult human body?", value: 206, why: "Babies start with about 300; many fuse as they grow." },
  { id: "chess-squares", prompt: "How many squares of any size are on a chessboard?", value: 204, why: "1² + 2² + … + 8²: 64 small squares, 49 two-by-twos, and so on." },
  { id: "line-up-5", prompt: "In how many orders can 5 people stand in a line?", value: 120, why: "5! = 5 × 4 × 3 × 2 × 1." },
  { id: "two-cards", prompt: "How many different 2-card hands can be dealt from a 52-card deck?", value: 1_326, why: "52 choose 2 = 52 × 51 ÷ 2." },
  { id: "pins", prompt: "How many different 4-digit PINs are there?", value: 10_000, why: "10 choices for each of 4 digits: 10⁴." },
  { id: "lowercase-6", prompt: "How many 6-letter passwords can be made from lowercase letters alone?", value: 308_915_776, why: "26 choices for each of 6 letters: 26⁶." },
  { id: "dean-dome", prompt: "How many seats are in UNC's Dean E. Smith Center?", value: 21_750, approx: true, why: "About 21,750: one of the largest on-campus arenas in college basketball." },
  { id: "chapel-hill", prompt: "What was Chapel Hill's population in the 2020 census?", value: 61_960, approx: true, why: "The 2020 census counted about 62,000, students included." },
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

/**
 * Plain numbers, decimals and k / m / b / t shorthand, any case: "250", "2.5", "300k", "3.5 M", "1.2b", "4t",
 * "1,200,000", "4 billion" (and "2e9"). A trailing dot ("2.") reads as 2, so typing "2.5k" never passes through an
 * invalid state. Anything else → null.
 */
export function parseAmount(text: string): number | null {
  const match = text.trim().toLowerCase().replace(/[,_$\s]/g, "").match(/^((?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z]*)$/);
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

/** Compact: 950, 150.5, 2.5, then 31.5M, 4.29B, 9.46T (three significant figures), then 4.3 × 10¹⁹. Below 1,000 keeps four, so typed decimals survive. */
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
  if (n < 1000) return String(Number(n.toPrecision(4)));
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
