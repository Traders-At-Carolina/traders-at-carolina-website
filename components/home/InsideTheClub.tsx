import Image from "next/image";
import { Card } from "@/components/Card";
import { Grid } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { HomeContent, HomePhoto } from "@/content/types";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { formatEventDateTime } from "@/lib/format";

type InsideTheClubProps = {
  index: number;
  title: string;
  photos: HomePhoto[];
  /** Already filtered to upcoming events by the caller. */
  upcoming?: HomeContent["upcoming"];
};

function Photo({ photo, ratio, sizes, className = "" }: { photo: HomePhoto; ratio: HomePhoto["ratio"]; sizes: string; className?: string }) {
  return (
    <figure className={className}>
      <div className={`relative overflow-hidden ${ratio === "4:5" ? "aspect-[4/5]" : "aspect-[3/2]"}`}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          placeholder={photo.src.blurDataURL ? "blur" : "empty"}
          className="object-cover saturate-[0.88]"
        />
      </div>
      <figcaption className="mt-3 text-caption text-ink-3">{photo.caption}</figcaption>
    </figure>
  );
}

function UpcomingCard({ upcoming }: { upcoming: NonNullable<HomeContent["upcoming"]> }) {
  const when = parseEasternDateTime(upcoming.date);
  const external = upcoming.link ? /^https?:\/\//.test(upcoming.link.href) : false;
  return (
    <Card>
      <Eyebrow>Upcoming</Eyebrow>
      <h3 className="mt-3 text-h3">{upcoming.title}</h3>
      <p className="mt-3 text-body tabular">
        <time dateTime={when.toISOString()}>{formatEventDateTime(when)}</time>
      </p>
      <p className="mt-1 text-caption text-ink-3">{upcoming.location}</p>
      {upcoming.link ? (
        <p className="mt-5">
          <TextLink href={upcoming.link.href} external={external} arrow track={{ cta: "upcoming-event", target: upcoming.title }}>
            {upcoming.link.label}
          </TextLink>
        </p>
      ) : null}
    </Card>
  );
}

/**
 * § 04 — event photos and an optional Upcoming card (spec 01 §3.4).
 * DOM order is photo, card, remaining photos (the mobile reading order); desktop placement is set per layout.
 */
export function InsideTheClub({ index, title, photos, upcoming }: InsideTheClubProps) {
  const [first, second, third] = photos;

  return (
    <Section labelledBy="inside-title">
      <SectionHeader index={index} eyebrow="Inside the club" title={title} id="inside-title" />
      <Reveal className="mt-12 md:mt-16">
        {upcoming ? (
          // Photo (cols 1–6) · photo (cols 7–9) · Upcoming card (cols 10–12). Room for two photos only.
          <Grid className="items-start gap-y-10">
            <Photo photo={first} ratio={first.ratio} sizes="(min-width: 1024px) 50vw, 100vw" className="col-span-12 lg:col-span-6" />
            <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:col-start-10 lg:row-start-1">
              <UpcomingCard upcoming={upcoming} />
            </div>
            <Photo
              photo={second}
              ratio={second.ratio}
              sizes="(min-width: 1024px) 25vw, 100vw"
              className="col-span-12 md:col-span-6 lg:col-span-3 lg:col-start-7 lg:row-start-1"
            />
          </Grid>
        ) : third ? (
          // Three photos: one large lead (cols 1–8) with the other two stacked beside it (cols 9–12).
          // Below 1024px the lead runs full width and the pair sits side by side under it.
          <Grid className="items-start gap-y-10">
            <Photo photo={first} ratio="3:2" sizes="(min-width: 1024px) 66vw, 100vw" className="col-span-12 lg:col-span-8 lg:col-start-1 lg:row-span-2 lg:row-start-1" />
            {[second, third].map((photo, i) => (
              <Photo
                key={photo.src.src}
                photo={photo}
                ratio="3:2"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className={`col-span-12 md:col-span-6 lg:col-span-4 lg:col-start-9 ${i === 0 ? "lg:row-start-1" : "lg:row-start-2"}`}
              />
            ))}
          </Grid>
        ) : (
          // Two photos: cols 1–7 and 8–12.
          <Grid className="items-start gap-y-10">
            <Photo photo={first} ratio={first.ratio} sizes="(min-width: 768px) 58vw, 100vw" className="col-span-12 md:col-span-7" />
            <Photo photo={second} ratio={second.ratio} sizes="(min-width: 768px) 42vw, 100vw" className="col-span-12 md:col-span-5" />
          </Grid>
        )}
      </Reveal>
    </Section>
  );
}
