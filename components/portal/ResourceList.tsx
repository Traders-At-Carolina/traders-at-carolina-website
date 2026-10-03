import { TextLink } from "@/components/TextLink";
import type { TrackId } from "@/content/types";
import type { PortalResource } from "@/lib/data/portal";

type ResourceListProps = {
  resources: PortalResource[];
  trackNames: Partial<Record<TrackId, string>>;
  className?: string;
};

/**
 * Portal resources as links, already filtered for the viewer and sorted pinned first (spec 06 §8). Each opens in a new
 * tab: a url, or /portal/files/{id} for an uploaded file. The caption names its tracks; none means every track.
 */
export function ResourceList({ resources, trackNames, className = "" }: ResourceListProps) {
  return (
    <ul className={`flex flex-col gap-4 ${className}`}>
      {resources.map((resource) => {
        const tracks = resource.tracks.map((id) => trackNames[id] ?? id).join(" · ");
        return (
          <li key={resource.id}>
            <TextLink href={resource.href} external>
              {resource.title}
            </TextLink>
            {resource.description ? <p className="mt-1 max-w-prose text-body text-ink-2">{resource.description}</p> : null}
            {tracks ? <p className="mt-1 text-caption text-ink-3">{tracks}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
