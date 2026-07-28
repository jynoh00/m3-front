import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const pages = ["Login", "Join", "Posts", "Create", "Edit", "Profile", "Password"];

test("includes every migrated React page", async () => {
  await Promise.all(pages.map((page) => access(new URL(`src/pages/${page}Page.jsx`, root))));
});

test("uses only the external REST API client", async () => {
  const [api, packageJson] = await Promise.all([
    readFile(new URL("src/lib/api.js", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(api, /VITE_API_BASE_URL/);
  assert.match(api, /http:\/\/localhost:8080/);
  assert.doesNotMatch(packageJson, /next|vinext|cloudflare|wrangler|drizzle/i);

  await Promise.all([
    access(new URL("db", root)).then(() => assert.fail("db folder exists"), () => undefined),
    access(new URL("worker", root)).then(() => assert.fail("worker folder exists"), () => undefined),
    access(new URL(".openai", root)).then(() => assert.fail(".openai folder exists"), () => undefined),
  ]);
});
