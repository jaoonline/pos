import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Installation Guide | Shop POS",
  description: "Step-by-step guide to installing Shop POS on a new system",
};

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-zinc-950 p-4 text-sm text-zinc-100">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`step-${n}`} className="scroll-mt-6 space-y-3">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-3 pl-11 text-muted-foreground [&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:bg-muted [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:text-sm [&_code:not(pre_code)]:text-foreground">
        {children}
      </div>
    </section>
  );
}

const TOC = [
  "Install prerequisites",
  "Copy the project",
  "Install dependencies",
  "Create the database",
  "Configure environment variables",
  "Generate the Prisma client",
  "Run migrations and seed",
  "Start the app",
  "Production build",
  "Troubleshooting",
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Shop POS — Installation Guide
          </h1>
          <p className="text-muted-foreground">
            How to set the project up on a new computer or server, from a blank
            machine to a running app.
          </p>
          <Link href="/login" className="text-sm underline underline-offset-4">
            Go to login
          </Link>
        </header>

        <nav className="rounded-lg border bg-background p-4">
          <p className="mb-2 text-sm font-medium">On this page</p>
          <ol className="grid list-inside list-decimal gap-1 text-sm sm:grid-cols-2">
            {TOC.map((t, i) => (
              <li key={t}>
                <a href={`#step-${i + 1}`} className="underline-offset-4 hover:underline">
                  {t}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10 rounded-lg border bg-background p-6">
          <Step n={1} title="Install prerequisites">
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Node.js 20.9 or newer</strong> (includes npm). Check with{" "}
                <code>node -v</code>.
              </li>
              <li>
                <strong>PostgreSQL</strong> (a recent version) running locally or on a
                reachable server.
              </li>
              <li>
                <strong>Git</strong> (optional — only if you copy the project via a
                repository).
              </li>
            </ul>
          </Step>

          <Step n={2} title="Copy the project">
            <p>Clone the repository, or copy the project folder to the new system:</p>
            <Code>{`git clone <your-repository-url> pos
cd pos`}</Code>
            <p>
              If copying a folder manually, <strong>do not</strong> copy{" "}
              <code>node_modules</code>, <code>.next</code> or <code>generated</code> —
              they are rebuilt in the next steps. Do copy your <code>.env</code> file
              if you want the same settings (see step 5).
            </p>
          </Step>

          <Step n={3} title="Install dependencies">
            <Code>npm install</Code>
          </Step>

          <Step n={4} title="Create the database">
            <p>Create an empty PostgreSQL database and a user for it, for example:</p>
            <Code>{`psql -U postgres
CREATE USER pos_user WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE pos_db OWNER pos_user;
\\q`}</Code>
            <p>
              If you are restoring existing shop data, restore your backup into this
              database instead and skip the seed in step 7.
            </p>
          </Step>

          <Step n={5} title="Configure environment variables">
            <p>
              Copy the example file and edit it (on Windows PowerShell use{" "}
              <code>Copy-Item .env.example .env</code>):
            </p>
            <Code>cp .env.example .env</Code>
            <p>
              Then set these values in <code>.env</code>:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-foreground">
                  <tr>
                    <th className="py-2 pr-4">Variable</th>
                    <th className="py-2">What to put</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 pr-4 align-top">
                      <code>DATABASE_URL</code>
                    </td>
                    <td className="py-2">
                      <code>
                        postgresql://pos_user:password@localhost:5432/pos_db?schema=public
                      </code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">
                      <code>SESSION_SECRET</code>
                    </td>
                    <td className="py-2">
                      A long random string. Generate one with the command below.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">
                      <code>SEED_ADMIN_EMAIL</code>
                    </td>
                    <td className="py-2">Email of the first administrator account.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">
                      <code>SEED_ADMIN_PASSWORD</code>
                    </td>
                    <td className="py-2">Password of the first administrator account.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Code>{`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`}</Code>
            <p>
              Never commit <code>.env</code> or share the <code>SESSION_SECRET</code>.
              Use a different secret on every system.
            </p>
          </Step>

          <Step n={6} title="Generate the Prisma client">
            <p>
              The generated database client is not stored in the repository, so it must
              be created on every new system:
            </p>
            <Code>npx prisma generate</Code>
          </Step>

          <Step n={7} title="Run migrations and seed">
            <p>Create the database tables, then add the starter data:</p>
            <Code>{`npx prisma migrate deploy
npx prisma db seed`}</Code>
            <p>
              The seed creates the administrator account from your <code>.env</code>, a
              demo salesperson (<code>salesperson@shop.local</code>), default shop
              settings, sample categories, products and a demo customer. Change the
              default passwords after first login.
            </p>
          </Step>

          <Step n={8} title="Start the app">
            <Code>npm run dev</Code>
            <p>
              Open <code>http://localhost:3000</code> and sign in with the administrator
              credentials from your <code>.env</code>. If port 3000 is busy, use the port
              printed in the terminal.
            </p>
          </Step>

          <Step n={9} title="Production build">
            <p>For a real deployment, build and run the optimized version instead:</p>
            <Code>{`npm run build
npm run start`}</Code>
            <p>
              Keep the process running with a manager such as PM2 or a Windows service,
              and put it behind HTTPS.
            </p>
          </Step>

          <Step n={10} title="Troubleshooting">
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Cannot find module &quot;generated/prisma&quot;</strong> — run{" "}
                <code>npx prisma generate</code> (step 6).
              </li>
              <li>
                <strong>Can&apos;t reach database server</strong> — check PostgreSQL is
                running and <code>DATABASE_URL</code> has the right user, password, host
                and port.
              </li>
              <li>
                <strong>Redirected to login in a loop / session errors</strong> — make
                sure <code>SESSION_SECRET</code> is set, then restart the server.
              </li>
              <li>
                <strong>Port 3000 already in use</strong> — run{" "}
                <code>npm run dev -- -p 3001</code>.
              </li>
              <li>
                <strong>Run the tests</strong> with <code>npm run test</code>. They write
                to the database in <code>DATABASE_URL</code>, so don&apos;t run them
                against production data.
              </li>
            </ul>
          </Step>
        </div>
      </div>
    </div>
  );
}
