"""Run a .sql file against the jazz Neon database without ever printing its address.

    python db/run.py db/migrations/0001_init.sql

The URL is read from $DATABASE_URL, or from the one line of a local secrets file passed as
$JAZZ_DB_FILE (it may wrap the URL in a psql command). Migrations go to the direct host, not
the pooler. A psql error is shown — it carries the SQL problem, never the password.
"""
import os
import re
import subprocess
import sys


def url() -> str:
    raw = os.environ.get("DATABASE_URL") or open(os.environ["JAZZ_DB_FILE"]).read()
    m = re.search(r"postgres(?:ql)?://[^\s'\"`]+", raw)
    if not m:
        sys.exit("no postgres URL in DATABASE_URL / JAZZ_DB_FILE")
    return m.group(0).replace("-pooler.", ".")


if __name__ == "__main__":
    address = url()  # read once: JAZZ_DB_FILE may be a pipe, <(…), which reads only once
    r = subprocess.run(["psql", address, "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", sys.argv[1]],
                       capture_output=True, text=True)
    out = (r.stdout + r.stderr).replace(address, "‹url›")
    print(out.strip() or "ok")
    sys.exit(r.returncode)
