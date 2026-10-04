import { clerkClient } from "@clerk/nextjs/server";
import { Gamepad2, Trophy, UserRound } from "lucide-react";
import { GameRowActions } from "@/components/admin/GameRowActions";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { contactNamesByScore } from "@/lib/admin/games-undo";
import { requirePage } from "@/lib/auth/admin";
import type { Game } from "@/lib/games/scores";
import { listContacts, recentScores, topScores } from "@/lib/games/scores-db";
import { deleteGameContact, deleteGameScore } from "./actions";

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

/** Delete for one score row; the dialog names the volunteered contact that goes with it (spec 11 §5.4). */
function DeleteScore({ row, contacts }: { row: { id: number; game: Game; score: number }; contacts: Map<number, string> }) {
  const contact = contacts.get(row.id);
  const what = `${GAME_LABEL[row.game]} score ${row.score}`;
  return (
    <GameRowActions
      action={deleteGameScore}
      id={row.id}
      name={what}
      title={`Delete this ${what}?`}
      description={`It comes off the leaderboard.${contact ? ` Its volunteered contact (${contact}) is deleted too.` : ""} You can undo this right after.`}
    />
  );
}

const actionsHead = (
  <TH className="w-px">
    <span className="sr-only">Actions</span>
  </TH>
);

const count = (n: number) => <span className="font-normal text-ui-text-3 tabular-nums">({n})</span>;

/** Officers only (spec 03 §3.7): volunteered contacts, top scores per game and recent plays. */
export default async function GameScoresPage({ searchParams }: PageProps<"/admin/games">) {
  await requirePage();
  const [{ saved }, contacts, sprintTop, fermiTop, recent] = await Promise.all([searchParams, listContacts(), topScores("sprint"), topScores("fermi"), recentScores()]);
  const [names, contactOf] = await Promise.all([
    accountNames([...sprintTop, ...fermiTop, ...recent].flatMap((r) => (r.userId ? [r.userId] : []))),
    contactNamesByScore([...sprintTop, ...fermiTop, ...recent].map((r) => r.id)),
  ]);

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
                  {actionsHead}
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
                    <TD className="text-right">
                      <GameRowActions
                        action={deleteGameContact}
                        id={c.id}
                        name={`contact ${c.name}`}
                        title={`Delete ${c.name}'s contact?`}
                        description="Their name and email are removed. The score stays on the leaderboard. You can undo this right after."
                      />
                    </TD>
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
                      {actionsHead}
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
                        <TD className="text-right">
                          <DeleteScore row={{ id: r.id, game, score: r.score }} contacts={contactOf} />
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
                  {actionsHead}
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
                    <TD className="text-right">
                      <DeleteScore row={r} contacts={contactOf} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
      <SavedFromParam saved={saved} />
    </>
  );
}
