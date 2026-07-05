#!/usr/bin/env node
/**
 * MeshiSpin セットアップ確認スクリプト
 * 使い方: npm run check:setup
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  try {
    const raw = readFileSync(path, "utf8");
    const env = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

function ok(label, detail = "") {
  console.log(`  OK  ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail = "") {
  console.log(`  NG  ${label}${detail ? ` — ${detail}` : ""}`);
}

async function checkSupabase(url, anonKey) {
  console.log("\n[1] Supabase 接続");
  if (!url || !anonKey) {
    fail("環境変数", "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定");
    return false;
  }

  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    fail("URL 形式", url);
    return false;
  }

  try {
    const res = await fetch(`${url}/rest/v1/sessions?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(10000)
    });
    if (res.status === 200) ok("REST API", host);
    else fail("REST API", `HTTP ${res.status}`);
  } catch (e) {
    fail("接続", `${host}: ${e.message}`);
    return false;
  }

  const tables = ["sessions", "members", "votes", "roulette_additions"];
  let allTables = true;
  console.log("\n[2] テーブル存在確認");
  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        signal: AbortSignal.timeout(10000)
      });
      if (res.status === 200) {
        ok(table);
      } else {
        const body = await res.text();
        fail(table, body.slice(0, 120));
        allTables = false;
      }
    } catch (e) {
      fail(table, e.message);
      allTables = false;
    }
  }

  if (!allTables) {
    console.log("\n  → Supabase SQL Editor で supabase/schema.sql を実行してください。");
  }
  return allTables;
}

async function checkPlaces(apiKey) {
  console.log("\n[3] Google Places API");
  if (!apiKey) {
    fail("環境変数", "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY を設定");
    return false;
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName"
      },
      body: JSON.stringify({
        includedTypes: ["restaurant"],
        maxResultCount: 3,
        locationRestriction: {
          circle: {
            center: { latitude: 35.6812, longitude: 139.7671 },
            radius: 500
          }
        }
      }),
      signal: AbortSignal.timeout(15000)
    });
    const json = await res.json();
    if (!res.ok) {
      fail("Places API (New)", json.error?.message ?? `HTTP ${res.status}`);
      return false;
    }
    ok("Places API (New)", `${json.places?.length ?? 0} 件（東京駅付近）`);
    return true;
  } catch (e) {
    fail("Places API (New)", e.message);
    return false;
  }
}

function printAuthReminder() {
  console.log("\n[4] Dashboard で手動確認が必要な項目");
  console.log("  - Authentication > Providers: Google 有効化");
  console.log("  - URL Configuration:");
  console.log("      Site URL: http://localhost:3000");
  console.log("      Redirect: http://localhost:3000/auth/callback");
  console.log("  - Database > Replication: members / votes / roulette_additions を Realtime 有効化");
}

async function main() {
  console.log("MeshiSpin セットアップ確認\n========================");
  const env = loadEnvLocal();
  const supabaseOk = await checkSupabase(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const placesOk = await checkPlaces(env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);
  printAuthReminder();

  console.log("\n========================");
  if (supabaseOk && placesOk) {
    console.log("結果: 主要な外部連携は OK です。npm run dev で E2E 確認へ進んでください。");
    process.exit(0);
  }
  console.log("結果: 上記 NG を修正してから再度 npm run check:setup を実行してください。");
  process.exit(1);
}

main();
