/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const xmldom = require("@xmldom/xmldom");

function makeHandler(reply) {
  const source = fs.readFileSync(path.join(__dirname, "../app/api/bgg/search/route.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  const calls = [];
  const axios = {
    create: () => ({ get: async (url, options) => {
      calls.push({ url, options });
      if (reply instanceof Error) throw reply;
      return { data: reply };
    } }),
    isAxiosError: (error) => !!error.isAxiosError,
  };
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === "axios") return axios;
      if (name === "@xmldom/xmldom") return xmldom;
      throw new Error(`Unexpected import: ${name}`);
    },
    Response,
    process: { env: {} },
    console: { error() {} },
  });
  return { handler: exports.GET, calls };
}

const request = (query) => ({ nextUrl: new URL(`http://localhost/api/bgg/search?query=${encodeURIComponent(query)}`) });

test("searches base games and returns primary names and years, filtering expansions", async () => {
  const { handler, calls } = makeHandler(`<?xml version="1.0"?>
    <items total="3">
      <item type="boardgame" id="1"><name type="alternate" value="Alt"/><name type="primary" value="A &amp; B"/><yearpublished value="2022"/></item>
      <item type="boardgameexpansion" id="2"><name type="primary" value="Expansion"/></item>
      <item type="boardgame" id="3"><name type="primary" value="Unknown Year"/><yearpublished value="0"/></item>
    </items>`);
  const response = await handler(request(" A & B "));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    results: [{ gameid: "1", name: "A & B", year: "2022" }, { gameid: "3", name: "Unknown Year", year: null }],
    truncated: false,
  });
  assert.equal(calls[0].options.params.query, "A & B");
  assert.equal(calls[0].options.params.type, "boardgame");
});

test("distinguishes no results, invalid queries, and malformed BGG responses", async () => {
  const empty = makeHandler('<items total="0"/>');
  assert.deepEqual(await (await empty.handler(request("missing"))).json(), { results: [], truncated: false });
  assert.equal((await empty.handler(request(" "))).status, 400);
  assert.equal(empty.calls.length, 1);
  const invalid = makeHandler("<html>upstream error</html>");
  assert.equal((await invalid.handler(request("test"))).status, 502);
});

test("reports BGG throttling and limits large result sets", async () => {
  const error = new Error("rate limited");
  error.isAxiosError = true;
  error.response = { status: 429 };
  assert.equal((await makeHandler(error).handler(request("test"))).status, 429);
  const items = Array.from({ length: 101 }, (_, index) => `<item type="boardgame" id="${index + 1}"><name value="Game ${index + 1}"/></item>`).join("");
  const response = await makeHandler(`<items>${items}</items>`).handler(request("game"));
  const result = await response.json();
  assert.equal(result.results.length, 100);
  assert.equal(result.truncated, true);
});
