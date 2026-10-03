import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Clock,
  Code2,
  Compass,
  Dices,
  FlaskConical,
  GraduationCap,
  Hammer,
  MessageSquareText,
  Trophy,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { TrackId } from "@/content/types";

const stepIcons: LucideIcon[] = [ClipboardList, Compass, Hammer];

const trackIcons: Record<TrackId, LucideIcon> = {
  trading: TrendingUp,
  research: FlaskConical,
  development: Code2,
};

// Keyed by the visible name in content/membership.ts; an unlisted name simply renders no icon.
const activityIcons: Record<string, LucideIcon> = {
  "Education sessions": GraduationCap,
  "Mock trading and games": Dices,
  "Interview prep": MessageSquareText,
  "Firm events and competitions": Trophy,
};

const expectationIcons: Record<string, LucideIcon> = {
  "Time commitment": Clock,
  Attendance: CalendarCheck,
  Prerequisites: BookOpen,
};

type GlyphProps = { icon?: LucideIcon; className?: string };

/** Decorative line icon: thin stroke, navy, hidden from assistive tech (the adjacent text carries the meaning). */
export function Glyph({ icon: Icon, className = "" }: GlyphProps) {
  if (!Icon) return null;
  return <Icon aria-hidden="true" strokeWidth={1.5} className={`size-6 shrink-0 text-navy ${className}`} />;
}

export const stepIcon = (i: number) => stepIcons[i];
export const trackIcon = (id: TrackId) => trackIcons[id];
export const activityIcon = (name: string) => activityIcons[name];
export const expectationIcon = (term: string) => expectationIcons[term];
