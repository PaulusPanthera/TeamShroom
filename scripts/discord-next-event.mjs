// scripts/discord-next-event.mjs
// v2.0.0-beta
// Build-time sync: fetch a Discord scheduled event and write it into data/home.json

import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.DISCORD_API_BASE || 'https://discord.com/api/v10';
const HOME_JSON_PATH = process.env.HOME_JSON_PATH || 'data/home.json';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const EVENT_URL = process.env.DISCORD_EVENT_URL || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const EVENT_ID = process.env.DISCORD_EVENT_ID || '';

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function parseIdsFromEventUrl(url) {
  const u = String(url || '').trim();
  if (!u) return null;

  // Expected: https://discord.com/events/<guildId>/<eventId>
  const m = u.match(/discord\.com\/events\/(\d{5,})\/(\d{5,})/i);
  if (!m) return null;
  return { guildId: m[1], eventId: m[2] };
}

function formatBerlinTime(iso) {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  // Keep the UI stable: "YYYY-MM-DD HH:mm CET/CEST"
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });

  const parts = dtf.formatToParts(date);
  const get = (type) => parts.find(p => p.type === type)?.value || '';

  const yyyy = get('year');
  const mm = get('month');
  const dd = get('day');
  const hh = get('hour');
  const min = get('minute');
  const tz = get('timeZoneName');

  if (!yyyy || !mm || !dd || !hh || !min) return '';
  return `${yyyy}-${mm}-${dd} ${hh}:${min} ${tz || ''}`.trim();
}

function compactSubtitle(desc) {
  const raw = String(desc || '').trim();
  if (!raw) return '';
  const singleLine = raw.replace(/\s+/g, ' ');
  if (singleLine.length <= 52) return singleLine;
  return `${singleLine.slice(0, 49)}...`;
}

async function discordGetScheduledEvent({ guildId, eventId }) {
  const url = `${API_BASE}/guilds/${guildId}/scheduled-events/${eventId}?with_user_count=true`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`DISCORD_HTTP_${res.status}: ${body || res.statusText}`);
  }

  return res.json();
}

async function loadHomeJson() {
  const fullPath = path.resolve(HOME_JSON_PATH);
  const txt = await fs.readFile(fullPath, 'utf8');
  return JSON.parse(txt);
}

async function writeHomeJson(payload) {
  const fullPath = path.resolve(HOME_JSON_PATH);
  await fs.writeFile(fullPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function normalizeHomePayload(home) {
  if (!home || typeof home !== 'object') return null;
  if (!Array.isArray(home.data) || !home.data.length) return null;
  if (!home.data[0] || typeof home.data[0] !== 'object') return null;
  return home;
}

// -----------------------------
// Resolve inputs
// -----------------------------

if (!BOT_TOKEN) {
  fail('DISCORD_BOT_TOKEN env variable missing');
}

const parsed = parseIdsFromEventUrl(EVENT_URL);
const guildId = parsed?.guildId || GUILD_ID;
const eventId = parsed?.eventId || EVENT_ID;

if (!guildId || !eventId) {
  fail('Missing DISCORD_EVENT_URL or (DISCORD_GUILD_ID + DISCORD_EVENT_ID)');
}

// -----------------------------
// Fetch + write
// -----------------------------

const event = await discordGetScheduledEvent({ guildId, eventId });

// Discord scheduled event fields: name / description / scheduled_start_time
// https://discord.com/developers/docs/resources/guild-scheduled-event
const title = String(event?.name || '').trim() || 'Next Event';
const subtitle = compactSubtitle(event?.description);
const timeText = formatBerlinTime(event?.scheduled_start_time);
const canonicalUrl = `https://discord.com/events/${guildId}/${eventId}`;

const home = normalizeHomePayload(await loadHomeJson());
if (!home) {
  fail(`Invalid Home JSON shape at ${HOME_JSON_PATH}`);
}

home.generatedAt = new Date().toISOString();
home.source = 'discord-bot';

home.data[0].nextEvent = {
  ...(home.data[0].nextEvent || {}),
  title,
  subtitle,
  timeText: timeText || (home.data[0].nextEvent?.timeText || ''),
  url: canonicalUrl
};

await writeHomeJson(home);
console.log(`Synced Discord event -> ${HOME_JSON_PATH}`);
