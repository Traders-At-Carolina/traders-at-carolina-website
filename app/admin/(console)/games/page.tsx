import { clerkClient } from "@clerk/nextjs/server";
import { Gamepad2, Trophy, UserRound } from "lucide-react";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
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
  return userId ? <>{names.get(userId) ?? userId}</> : <span className="text-ui-text-3">Anonymous · <span className="font-mono text-ui-hint">{playerId.slice(0, 8)}</span></span>;
}

const count = (n: number) => <span className="font-normal text-ui-text-3 tabular-nums">({n})</span>;

/** Officers only (spec 03 §3.7): volunteered contacts, top scores per game and recent plays. */
export default async function GameScoresPage() {
  await requirePage();
  const [contacts, sprintTop, fermiTop, recent] = await Promise.all([listContacts(), topScores("sprint"), topScores("fermi"), recentScores()]);
  const names = await accountNames([...sprintTop, ...fermiTop, ...recent].flatMap((r) => (r.userId ? [r.userId] : [])));

  return (
    <>
      <PageHeader
        title="Game scores"
        description="Every play of the membership games. Names and emails were volunteered after a top-10% score by visitors who weren't signed in; use them only for recruiting outreach."
      />

      <div className="flex flex-col gap-6">
        <Card aria-labelledby="contacts-title">
          <CardHeader id="contacts-title" title={<>Contacts {count(contacts.length)}</>} description="Volunteered for recruiting outreach only." />
          {contacts.length === 0 ? (
            <EmptyState icon={UserRound} title="No contacts yet" description="Visitors can leave a name and email after a top-10% score." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Game</TH>
                  <TH className="text-right">Score</TH>
                  <TH>When</TH>
                </TR>
              </THead>
              <TBody>
                {contacts.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD className="text-ui-text-2">{c.email ?? <span className="text-ui-text-3">—</span>}</TD>
                    <TD className="whitespace-nowrap text-ui-text-2">{GAME_LABEL[c.game]}</TD>
                    <TD className="text-right font-medium tabular-nums">{c.score}</TD>
                    <TD className="whitespace-nowrap text-ui-text-2 tabular-nums">{date.format(c.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {(
            [
              ["sprint", sprintTop],
              ["fermi", fermiTop],
            ] as const
          ).map(([game, rows]) => (
            <Card key={game} aria-labelledby={`top-${game}`}>
              <CardHeader id={`top-${game}`} title={`Top 10 · ${GAME_LABEL[game]}`} />
              {rows.length === 0 ? (
                <EmptyState icon={Trophy} title="No plays yet" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH className="w-12 text-right">Rank</TH>
                      <TH className="w-20 text-right">Score</TH>
                      <TH>Player</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((r, i) => (
                      <TR key={r.id}>
                        <TD className="text-right text-ui-text-3 tabular-nums">{i + 1}</TD>
                        <TD className="text-right font-medium tabular-nums">{r.score}</TD>
                        <TD>
                          <Who userId={r.userId} playerId={r.playerId} names={names} />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          ))}
        </div>

        <Card aria-labelledby="recent-title">
          <CardHeader id="recent-title" title="Recent plays" />
          {recent.length === 0 ? (
            <EmptyState icon={Gamepad2} title="No plays yet" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Game</TH>
                  <TH className="text-right">Score</TH>
                  <TH>Player</TH>
                </TR>
              </THead>
              <TBody>
                {recent.map((r) => (
                  <TR key={r.id}>
                    <TD className="whitespace-nowrap text-ui-text-2 tabular-nums">{date.format(r.createdAt)}</TD>
                    <TD className="whitespace-nowrap text-ui-text-2">{GAME_LABEL[r.game]}</TD>
                    <TD className="text-right font-medium tabular-nums">{r.score}</TD>
                    <TD>
                      <Who userId={r.userId} playerId={r.playerId} names={names} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
