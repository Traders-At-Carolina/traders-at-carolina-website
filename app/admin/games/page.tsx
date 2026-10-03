import { clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";
import { requirePage } from "@/lib/auth/admin";
import type { Game } from "@/lib/games/scores";
import { listContacts, recentScores, topScores } from "@/lib/games/scores-db";

export const metadata = { title: "Game scores" };

const GAME_LABEL: Record<Game, string> = { sprint: "Mental math sprint", fermi: "Fermi markets" };
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });

/** Names and emails for signed-in players, so officers see who scored rather than a Clerk id. */
async function accountNames(userIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return new Map();
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ userId: ids, limit: ids.length });
  return new Map(
    data.map((u) => [u.id, [u.fullName, u.primaryEmailAddress?.emailAddress].filter(Boolean).join(" · ") || u.id]),
  );
}

function Who({ userId, playerId, names }: { userId: string | null; playerId: string; names: Map<string, string> }) {
  return userId ? <>{names.get(userId) ?? userId}</> : <span className="text-ink-3">Anonymous · {playerId.slice(0, 8)}</span>;
}

/** Officers only (spec 03 §3.7): volunteered contacts, top scores per game and recent plays. */
export default async function GameScoresPage() {
  await requirePage();
  const [contacts, sprintTop, fermiTop, recent] = await Promise.all([listContacts(), topScores("sprint"), topScores("fermi"), recentScores()]);
  const names = await accountNames([...sprintTop, ...fermiTop, ...recent].flatMap((r) => (r.userId ? [r.userId] : [])));

  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
      <p>
        <Link href="/admin" className="link-underline text-navy">
          Admin
        </Link>
      </p>
      <h1 className="mt-4 text-h1">Game scores</h1>
      <p className="mt-4 max-w-prose text-body text-ink-2">
        Every play of the membership games. Names and emails were volunteered after a top-10% score by visitors who weren&apos;t signed in;
        use them only for recruiting outreach.
      </p>

      <section className="mt-12" aria-labelledby="contacts-title">
        <h2 id="contacts-title" className="text-h3">
          Contacts ({contacts.length})
        </h2>
        <table className="mt-4 w-full text-left text-body">
          <thead className="text-caption text-ink-3">
            <tr>
              <th className="py-2 pr-4 font-normal">Name</th>
              <th className="py-2 pr-4 font-normal">Email</th>
              <th className="py-2 pr-4 font-normal">Game</th>
              <th className="py-2 pr-4 font-normal">Score</th>
              <th className="py-2 font-normal">When</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-rule">
                <td className="py-2 pr-4">{c.name}</td>
                <td className="py-2 pr-4">{c.email ?? <span className="text-ink-3">—</span>}</td>
                <td className="py-2 pr-4">{GAME_LABEL[c.game]}</td>
                <td className="py-2 pr-4 tabular">{c.score}</td>
                <td className="py-2 tabular">{date.format(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 ? <p className="mt-4 text-caption text-ink-3">No contacts yet.</p> : null}
      </section>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        {(
          [
            ["sprint", sprintTop],
            ["fermi", fermiTop],
          ] as const
        ).map(([game, rows]) => (
          <section key={game} aria-labelledby={`top-${game}`}>
            <h2 id={`top-${game}`} className="text-h3">
              Top 10 · {GAME_LABEL[game]}
            </h2>
            <ol className="mt-4">
              {rows.map((r, i) => (
                <li key={r.id} className="flex gap-4 border-t border-rule py-2 text-body">
                  <span className="w-6 text-ink-3 tabular">{i + 1}</span>
                  <span className="w-12 tabular">{r.score}</span>
                  <span className="flex-1">
                    <Who userId={r.userId} playerId={r.playerId} names={names} />
                  </span>
                </li>
              ))}
            </ol>
            {rows.length === 0 ? <p className="mt-4 text-caption text-ink-3">No plays yet.</p> : null}
          </section>
        ))}
      </div>

      <section className="mt-12" aria-labelledby="recent-title">
        <h2 id="recent-title" className="text-h3">
          Recent plays
        </h2>
        <table className="mt-4 w-full text-left text-body">
          <thead className="text-caption text-ink-3">
            <tr>
              <th className="py-2 pr-4 font-normal">When</th>
              <th className="py-2 pr-4 font-normal">Game</th>
              <th className="py-2 pr-4 font-normal">Score</th>
              <th className="py-2 font-normal">Player</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="border-t border-rule">
                <td className="py-2 pr-4 tabular">{date.format(r.createdAt)}</td>
                <td className="py-2 pr-4">{GAME_LABEL[r.game]}</td>
                <td className="py-2 pr-4 tabular">{r.score}</td>
                <td className="py-2">
                  <Who userId={r.userId} playerId={r.playerId} names={names} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
