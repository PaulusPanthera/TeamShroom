// scripts/discord-next-event.mjs
// v2.0.0-beta
// Build-time sync: fetch a Discord scheduled event and write it into data/home.json

import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.DISCORD_API_BASE || 'https://discord.com/api/v10';
const HOME_JSON_PATH = process.env.HOME_JSON_PATH || 'data/home.json';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
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

async function discordListScheduledEvents({ guildId }) {
  const url = `${API_BASE}/guilds/${guildId}/scheduled-events?with_user_count=true`;
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

function pickNextUpcomingEvent(events) {
  const list = Array.isArray(events) ? events : [];
  const now = Date.now();

  const normalized = list
    .map((e) => {
      const startMs = Date.parse(e?.scheduled_start_time || '');
      return {
        event: e,
        startMs: Number.isNaN(startMs) ? null : startMs,
        status: Number(e?.status)
      };
    })
    .filter((x) => x.startMs !== null);

  // Prefer: scheduled + in the future.
  const futureScheduled = normalized
    .filter((x) => x.status === 1)
    .filter((x) => x.startMs >= now)
    .sort((a, b) => a.startMs - b.startMs);

  if (futureScheduled.length) return futureScheduled[0].event;

  // Fallback: any scheduled event, earliest by start time.
  const anyScheduled = normalized
    .filter((x) => x.status === 1)
    .sort((a, b) => a.startMs - b.startMs);

  if (anyScheduled.length) return anyScheduled[0].event;

  return null;
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

if (!GUILD_ID) {
  fail('DISCORD_GUILD_ID env variable missing');
}

// Optional override: allow pinning a specific event id for emergencies.
const pinnedEventId = String(EVENT_ID || '').trim();

// -----------------------------
// Fetch + write
// -----------------------------

let event = null;

if (pinnedEventId) {
  event = await discordGetScheduledEvent({ guildId: GUILD_ID, eventId: pinnedEventId });
} else {
  const events = await discordListScheduledEvents({ guildId: GUILD_ID });
  event = pickNextUpcomingEvent(events);
}

if (!event) {
  console.log('No Discord scheduled event found. Keeping existing nextEvent payload.');
}

// Discord scheduled event fields: name / description / scheduled_start_time
// https://discord.com/developers/docs/resources/guild-scheduled-event
const title = String(event?.name || '').trim();
const subtitle = compactSubtitle(event?.description);
const timeText = formatBerlinTime(event?.scheduled_start_time);
const eventId = String(event?.id || pinnedEventId || '').trim();
const canonicalUrl = eventId ? `https://discord.com/events/${GUILD_ID}/${eventId}` : '';

const home = normalizeHomePayload(await loadHomeJson());
if (!home) {
  fail(`Invalid Home JSON shape at ${HOME_JSON_PATH}`);
}

home.generatedAt = new Date().toISOString();
home.source = 'discord-bot';

home.data[0].nextEvent = {
  ...(home.data[0].nextEvent || {}),
  title: title || (home.data[0].nextEvent?.title || 'Next Event'),
  subtitle: subtitle || (home.data[0].nextEvent?.subtitle || ''),
  timeText: timeText || (home.data[0].nextEvent?.timeText || ''),
  url: canonicalUrl || (home.data[0].nextEvent?.url || '')
};

await writeHomeJson(home);
console.log(`Synced Discord event -> ${HOME_JSON_PATH}`);
