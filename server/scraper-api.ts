import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';

const PORT = parseInt(process.env.SCRAPER_API_PORT || '3001', 10);
const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const DEFAULT_SCHEDULE = process.env.SYNC_SCHEDULE || '0 */6 * * *';
const SCHEDULE_CONFIG_PATH = path.resolve(import.meta.dirname!, 'schedule-config.json');
const GITHUB_TRENDING_URL = 'https://github.com/trending';

type TimeRange = 'daily' | 'weekly' | 'monthly';
const VALID_SINCE: TimeRange[] = ['daily', 'weekly', 'monthly'];

interface TrendingRepo {
  rank: number;
  owner: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: string;
  forks: string;
  todayStars: string;
}

interface PbProject {
  id?: string;
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  stars_today: number;
  owner_avatar: string;
  source: string;
  collected_at: string;
}

interface ScheduleConfig {
  enabled: boolean;
  cron: string;
}

// ── Helpers ──

function buildTrendingUrl(language?: string, since?: string): string {
  let url = GITHUB_TRENDING_URL;
  if (language) url += `/${encodeURIComponent(language.toLowerCase())}`;
  if (since) url += `?since=${encodeURIComponent(since)}`;
  return url;
}

function parseTrendingHtml(html: string, limit: number): TrendingRepo[] {
  const $ = cheerio.load(html);
  const repos: TrendingRepo[] = [];

  $('article.Box-row').each((index, element) => {
    if (index >= limit) return false;

    const $article = $(element);
    const titleLink = $article.find('h2 a').attr('href') || '';
    const parts = titleLink.split('/').filter(Boolean);
    const owner = parts[0] || '';
    const name = parts[1] || '';
    const url = titleLink ? `https://github.com${titleLink}` : '';
    const description = $article.find('p').first().text().trim() || '';
    const language = $article.find('[itemprop="programmingLanguage"]').text().trim() || '';
    const starsText = $article.find('a[href$="/stargazers"]').text().trim() || '0';
    const forksText = $article.find('a[href$="/forks"]').text().trim() || '0';
    const todayStarsText = $article.find('span.d-inline-block.float-sm-right').text().trim() || '0 stars today';

    repos.push({
      rank: index + 1,
      owner,
      name,
      url,
      description,
      language,
      stars: starsText.replace(/,/g, ''),
      forks: forksText.replace(/,/g, ''),
      todayStars: todayStarsText.replace(' stars today', '').replace(/,/g, '').trim(),
    });
  });

  return repos;
}

async function fetchTrending(language?: string, since?: string, limit: number = 25): Promise<TrendingRepo[]> {
  const url = buildTrendingUrl(language, since);
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 60000,
  });
  return parseTrendingHtml(response.data, limit);
}

// ── PocketBase sync ──

async function doSync(language?: string, since?: string): Promise<{ total: number; created: number; updated: number; errors: number }> {
  console.log(`[scraper-api] Syncing trending data to PocketBase at ${PB_URL}`);
  const repos = await fetchTrending(language, since, 25);
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const repo of repos) {
    try {
      const fullName = `${repo.owner}/${repo.name}`;
      const searchResp = await axios.get(`${PB_URL}/api/collections/gh_trending_projects/records`, {
        params: { filter: `name="${fullName}"`, perPage: 1 },
        timeout: 5000,
      });

      const existing = searchResp.data?.items?.[0];
      const projectData: PbProject = {
        name: fullName,
        description: repo.description,
        url: `https://github.com/${fullName}`,
        language: repo.language,
        stars: parseInt(repo.stars) || 0,
        forks: parseInt(repo.forks) || 0,
        stars_today: parseInt(repo.todayStars) || 0,
        owner_avatar: '',
        source: 'trending',
        collected_at: new Date().toISOString(),
      };

      if (existing) {
        await axios.patch(`${PB_URL}/api/collections/gh_trending_projects/records/${existing.id}`, {
          stars: projectData.stars,
          forks: projectData.forks,
          stars_today: projectData.stars_today,
        }, { timeout: 5000 });
        updated++;
      } else {
        await axios.post(`${PB_URL}/api/collections/gh_trending_projects/records`, projectData, { timeout: 5000 });
        created++;
      }
    } catch (err) {
      errors++;
    }
  }

  console.log(`[scraper-api] Sync complete: created=${created}, updated=${updated}, errors=${errors}`);
  return { total: repos.length, created, updated, errors };
}

// ── Scheduler ──

let scheduledTask: cron.ScheduledTask | null = null;
let currentSchedule: ScheduleConfig = { enabled: true, cron: DEFAULT_SCHEDULE };

function loadScheduleConfig(): ScheduleConfig {
  try {
    if (fs.existsSync(SCHEDULE_CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(SCHEDULE_CONFIG_PATH, 'utf-8'));
      return { enabled: data.enabled !== false, cron: data.cron || DEFAULT_SCHEDULE };
    }
  } catch (e) {
    console.warn('[scraper-api] Failed to load schedule config, using default');
  }
  return { enabled: true, cron: DEFAULT_SCHEDULE };
}

function saveScheduleConfig(config: ScheduleConfig) {
  try {
    fs.writeFileSync(SCHEDULE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('[scraper-api] Failed to save schedule config');
  }
}

function startScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  if (!currentSchedule.enabled) {
    console.log('[scraper-api] Scheduler is disabled');
    return;
  }

  if (!cron.validate(currentSchedule.cron)) {
    console.error(`[scraper-api] Invalid cron expression: "${currentSchedule.cron}", scheduler disabled`);
    return;
  }

  scheduledTask = cron.schedule(currentSchedule.cron, async () => {
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    console.log(`[scraper-api] Scheduled sync triggered at ${now}`);
    try {
      const stats = await doSync();
      console.log(`[scraper-api] Scheduled sync done: created=${stats.created}, updated=${stats.updated}`);
    } catch (err) {
      console.error(`[scraper-api] Scheduled sync failed:`, err instanceof Error ? err.message : err);
    }
  });

  console.log(`[scraper-api] Scheduler started: "${currentSchedule.cron}"`);
  const firstRun = scheduledTask.getNextRun();
  console.log(`[scraper-api] Next run: ${firstRun.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
}

// Load persisted config and start
currentSchedule = loadScheduleConfig();
startScheduler();

// ── HTTP Server ──

function parseUrl(reqUrl: string, host: string) {
  const u = new URL(reqUrl, `http://${host || 'localhost'}`);
  const sinceRaw = u.searchParams.get('since')?.toLowerCase() || 'daily';
  const since = VALID_SINCE.includes(sinceRaw as TimeRange) ? (sinceRaw as TimeRange) : 'daily';
  const language = u.searchParams.get('language') || undefined;
  const limit = Math.min(Math.max(parseInt(u.searchParams.get('limit') || '25', 10) || 25, 1), 50);
  const pathname = u.pathname.replace(/\/+$/, '') || '/';
  return { since, language, limit, pathname };
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function handleTrending(
  res: http.ServerResponse,
  since: TimeRange,
  language: string | undefined,
  limit: number,
) {
  try {
    const repos = await fetchTrending(language, since, limit);
    json(res, 200, { success: true, params: { since, language, limit }, count: repos.length, data: repos });
  } catch (err) {
    json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

async function handleSync(
  res: http.ServerResponse,
  since: TimeRange,
  language: string | undefined,
) {
  try {
    const stats = await doSync(language, since);
    json(res, 200, { success: true, stats });
  } catch (err) {
    json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

function handleGetSchedule(res: http.ServerResponse) {
  const nextRun = scheduledTask?.getNextRun()?.toISOString() || null;
  json(res, 200, {
    success: true,
    schedule: {
      enabled: currentSchedule.enabled,
      cron: currentSchedule.enabled ? currentSchedule.cron : null,
    },
    nextRun,
  });
}

function handleSetSchedule(res: http.ServerResponse, body: string) {
  try {
    const data = JSON.parse(body);

    if (data.enabled === false) {
      currentSchedule = { enabled: false, cron: currentSchedule.cron };
      saveScheduleConfig(currentSchedule);
      startScheduler();
      json(res, 200, { success: true, message: 'Scheduler disabled', schedule: currentSchedule });
      return;
    }

    if (data.cron) {
      if (!cron.validate(data.cron)) {
        json(res, 400, { success: false, error: `Invalid cron expression: "${data.cron}"` });
        return;
      }
      currentSchedule = { enabled: true, cron: data.cron };
      saveScheduleConfig(currentSchedule);
      startScheduler();
      json(res, 200, { success: true, message: `Schedule updated to "${data.cron}"`, schedule: currentSchedule });
      return;
    }

    json(res, 400, { success: false, error: 'Provide "cron" expression or "enabled": false' });
  } catch (err) {
    json(res, 400, { success: false, error: 'Invalid JSON body' });
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { since, language, limit, pathname } = parseUrl(req.url!, req.headers.host || '');

  switch (pathname) {
    case '/api/trending':
      if (req.method !== 'GET') { json(res, 405, { error: 'Method not allowed' }); return; }
      handleTrending(res, since, language, limit);
      break;

    case '/api/sync':
      if (req.method !== 'GET' && req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return; }
      handleSync(res, since, language);
      break;

    case '/api/schedule':
      if (req.method === 'GET') {
        handleGetSchedule(res);
      } else if (req.method === 'POST') {
        readBody(req).then((body) => handleSetSchedule(res, body));
      } else if (req.method === 'DELETE') {
        currentSchedule = { enabled: false, cron: currentSchedule.cron };
        saveScheduleConfig(currentSchedule);
        startScheduler();
        json(res, 200, { success: true, message: 'Scheduler disabled', schedule: currentSchedule });
      } else {
        json(res, 405, { error: 'Method not allowed' });
      }
      break;

    case '/api/health':
      json(res, 200, { status: 'ok' });
      break;

    default:
      json(res, 404, { success: false, error: 'Not found' });
  }
});

server.listen(PORT, () => {
  console.log(`[scraper-api] GitHub Trending API running at http://localhost:${PORT}`);
  console.log(`[scraper-api]   GET  /api/trending?since=daily&language=&limit=25`);
  console.log(`[scraper-api]   GET  /api/sync     (manual trigger: fetch + save to PocketBase)`);
  console.log(`[scraper-api]   GET  /api/schedule (view schedule config)`);
  console.log(`[scraper-api]   POST /api/schedule (set schedule: {"cron":"0 */6 * * *"})`);
  console.log(`[scraper-api]   DEL  /api/schedule (disable scheduler)`);
  console.log(`[scraper-api]   GET  /api/health`);
  console.log(`[scraper-api] PB_URL=${PB_URL}`);
});

export { server };
