import Image from "next/image";
import { Grid } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import type { HomePhoto } from "@/content/types";

type PhotoBandProps = {
  /** One photo runs wide; two sit side by side. */
  photos: HomePhoto[];
};

function Photo({ photo, sizes, ratio, className = "" }: { photo: HomePhoto; sizes: string; ratio: string; className?: string }) {
  return (
    <figure className={className}>
      <div className={`relative overflow-hidden ${ratio}`}>
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

/** Photo-only section between the content sections on /membership: a wide panorama, or a pair. */
export function PhotoBand({ photos }: PhotoBandProps) {
  if (photos.length === 0) return null;
  const wide = photos.length === 1;
  return (
    <Section density="compact">
      <Reveal>
        <Grid className="items-start gap-y-10">
          {photos.map((photo) => (
            <Photo
              key={photo.src.src}
              photo={photo}
              ratio={wide ? "aspect-[3/2] md:aspect-[21/9]" : "aspect-[3/2]"}
              sizes={wide ? "(min-width: 1280px) 1200px, 100vw" : "(min-width: 768px) 50vw, 100vw"}
              className={wide ? "col-span-12" : "col-span-12 md:col-span-6"}
            />
          ))}
        </Grid>
      </Reveal>
    </Section>
  );
}
