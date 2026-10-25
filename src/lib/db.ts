import postgres from "postgres";

// Her data lives in Postgres on Neon (block base-de-datos, Mente docs/jazz/base-de-datos/ESQUEMA.md).
// Production goes through Neon's pooler, which speaks transaction mode: no prepared statements,
// and no startup options. A local run points DATABASE_URL at the direct host with DB_SCHEMA=dev,
// so it never touches her real rows.
let client: postgres.Sql | null = null;

export const hayBase = () => !!process.env.DATABASE_URL;

export function sql(): postgres.Sql {
  if (!client) {
    const schema = process.env.DB_SCHEMA;
    client = postgres(process.env.DATABASE_URL!, {
      prepare: false,
      max: 3,
      idle_timeout: 20,
      // Neon ignores a bare search_path startup parameter; `options` is the one it honours (measured)
      ...(schema && { connection: { options: `-c search_path=${schema}` } }),
    });
  }
  return client;
}

// A limit the DB enforces (3 open missions, 40 thoughts…) comes back as check_violation with
// the sentence for her already written in the trigger. Anything else is a real failure.
export function frase(e: unknown): string | null {
  const err = e as { code?: string; message?: string };
  return err?.code === "23514" && err.message ? err.message : null;
}

export const ms = (d: Date | null) => (d ? d.getTime() : null);

// The board shows a new mission at once under a temporary id (`nueva-…`) until the server's comes
// back; a tap in that gap sends the temporary one. It matches nothing — as it did with Blob.
export const esId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
