/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function makeHandler(rows, databaseError = null) {
  const source = fs.readFileSync(
    path.join(__dirname, "../app/api/db/removeGame/route.ts"),
    "utf8"
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  const client = {
    from(table) {
      assert.equal(table, "games");
      const filters = {};
      return {
        delete() { return this; },
        eq(field, value) { filters[field] = String(value); return this; },
        async select() {
          if (databaseError) return { data: null, error: databaseError };
          const removed = rows.filter((row) =>
            Object.entries(filters).every(([key, value]) => String(row[key]) === value)
          );
          for (const row of removed) rows.splice(rows.indexOf(row), 1);
          return { data: removed.map(({ key }) => ({ key })), error: null };
        },
      };
    },
  };
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === "@/utils/supabase/server") return { createClient: async () => client };
      throw new Error(`Unexpected import: ${name}`);
    },
    Response,
    console: { error() {} },
  });
  return exports.DELETE;
}

const request = (body) => new Request("http://localhost/api/db/removeGame", {
  method: "DELETE",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

test("removes only the specified owner's copy, preserving other owners and games", async () => {
  const rows = [
    { key: 1, gameid: 42, ownerid: 1 },
    { key: 2, gameid: 42, ownerid: 2 },
    { key: 3, gameid: 99, ownerid: 1 },
  ];
  const response = await makeHandler(rows)(request({ gameId: 42, userId: "1" }));
  assert.equal(response.status, 200);
  assert.deepEqual(rows.map((row) => row.key), [2, 3]);
});

test("rejects invalid IDs without deleting anything", async () => {
  const rows = [{ key: 1, gameid: 42, ownerid: 1 }];
  const response = await makeHandler(rows)(request({ gameId: 42, userId: "" }));
  assert.equal(response.status, 400);
  assert.equal(rows.length, 1);
});

test("reports missing ownership and database failures", async () => {
  const rows = [{ key: 1, gameid: 42, ownerid: 1 }];
  const missing = await makeHandler(rows)(request({ gameId: 42, userId: 2 }));
  assert.equal(missing.status, 404);
  const failure = await makeHandler(rows, { message: "failure" })(request({ gameId: 42, userId: 1 }));
  assert.equal(failure.status, 500);
  assert.equal(rows.length, 1);
});
