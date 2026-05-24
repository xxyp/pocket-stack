# GitHub 热点项目抓取模块 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 GitHub 热门项目抓取模块，通过 PocketBase pb_hooks 后端代理抓取 Trending 数据，集成 Serper.dev 搜索相关文章和图片，前端提供浏览和管理界面。

**Architecture:** 纯前端模块 + PocketBase pb_hooks 方式。pb_hooks 提供自定义 API 触发抓取和定时任务，Serper.dev 搜索文章和图片。前端模块遵循项目 `import.meta.glob` 自动注册模式。

**Tech Stack:** React 19, PocketBase (pb_hooks JS), Serper.dev API, GitHub Trending API

---

### 文件清单

| 文件 | 说明 |
|------|------|
| `src/modules/github-trending/migrations/gh_trending_projects.json` | 项目集合迁移定义 |
| `src/modules/github-trending/migrations/gh_trending_articles.json` | 文章集合迁移定义 |
| `src/modules/github-trending/migrations/gh_trending_images.json` | 图片集合迁移定义 |
| `src/modules/github-trending/migrations/gh_trending_settings.json` | 设置集合迁移定义 |
| `pb_hooks/github-trending.pb.js` | 自定义 API 路由 + 抓取 + 搜索逻辑 |
| `pb_hooks/github-trending.cron.pb.js` | 定时抓取任务 |
| `src/modules/github-trending/package.json` | 模块元信息 |
| `src/modules/github-trending/menu.ts` | 菜单配置 |
| `src/modules/github-trending/routes.tsx` | 路由定义 |
| `src/modules/github-trending/components/TrendingPage.tsx` | 热门项目列表 |
| `src/modules/github-trending/components/ProjectDetail.tsx` | 项目详情 |
| `src/modules/github-trending/components/CollectedProjects.tsx` | 采集管理 |
| `src/modules/github-trending/components/Settings.tsx` | 设置页 |

---

### Task 1: PocketBase 迁移文件

**Files:**
- Create: `src/modules/github-trending/migrations/gh_trending_projects.json`
- Create: `src/modules/github-trending/migrations/gh_trending_articles.json`
- Create: `src/modules/github-trending/migrations/gh_trending_images.json`
- Create: `src/modules/github-trending/migrations/gh_trending_settings.json`

- [ ] **Step 1: 创建 gh_trending_projects 集合定义**

```json
[
  {
    "id": "pbc_3748291011",
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "name": "gh_trending_projects",
    "type": "base",
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "hidden": false, "id": "text3208210256", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text1579384326", "max": 0, "min": 0, "name": "name", "pattern": "", "presentable": false, "primaryKey": false, "required": true, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text4274335913", "max": 0, "min": 0, "name": "description", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "url1521915893", "name": "url", "presentable": false, "required": true, "system": false, "type": "url" },
      { "hidden": false, "id": "url1843675174", "name": "homepage", "presentable": false, "required": false, "system": false, "type": "url" },
      { "autogeneratePattern": "", "hidden": false, "id": "text1843675174", "max": 0, "min": 0, "name": "language", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "number1621245011", "max": null, "min": 0, "name": "stars", "onlyInt": true, "presentable": false, "required": false, "system": false, "type": "number" },
      { "hidden": false, "id": "number2342451234", "max": null, "min": 0, "name": "forks", "onlyInt": true, "presentable": false, "required": false, "system": false, "type": "number" },
      { "hidden": false, "id": "number2893475623", "max": null, "min": 0, "name": "stars_today", "onlyInt": true, "presentable": false, "required": false, "system": false, "type": "number" },
      { "hidden": false, "id": "url2847561923", "name": "owner_avatar", "presentable": false, "required": false, "system": false, "type": "url" },
      { "autogeneratePattern": "", "hidden": false, "id": "text3928475612", "max": 0, "min": 0, "name": "readme", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "json3847561923", "maxSize": 0, "name": "tags", "presentable": false, "required": false, "system": false, "type": "json" },
      { "autogeneratePattern": "", "hidden": false, "id": "text4738291012", "max": 0, "min": 0, "name": "notes", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "select3748291012", "maxSelect": 1, "name": "source", "presentable": false, "required": true, "system": false, "type": "select", "values": ["trending", "search", "manual"] },
      { "hidden": false, "id": "date2938475612", "name": "collected_at", "presentable": false, "required": false, "system": false, "type": "date" },
      { "hidden": false, "id": "autodate_created", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate_updated", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "indexes": [],
    "system": false
  }
]
```

- [ ] **Step 2: 创建 gh_trending_articles 集合定义**

```json
[
  {
    "id": "pbc_3847562011",
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "name": "gh_trending_articles",
    "type": "base",
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "hidden": false, "id": "text3208210256", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "hidden": false, "id": "relation3748291011", "maxSelect": 1, "name": "project", "presentable": false, "required": true, "system": false, "type": "relation", "collectionId": "pbc_3748291011", "cascadeDelete": true },
      { "autogeneratePattern": "", "hidden": false, "id": "text1579384327", "max": 0, "min": 0, "name": "title", "pattern": "", "presentable": false, "primaryKey": false, "required": true, "system": false, "type": "text" },
      { "hidden": false, "id": "url3847561924", "name": "url", "presentable": false, "required": true, "system": false, "type": "url" },
      { "autogeneratePattern": "", "hidden": false, "id": "text3857461923", "max": 0, "min": 0, "name": "snippet", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text4857362910", "max": 0, "min": 0, "name": "content", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text4857362911", "max": 0, "min": 0, "name": "source", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "autodate_created", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate_updated", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "indexes": [],
    "system": false
  }
]
```

- [ ] **Step 3: 创建 gh_trending_images 集合定义**

```json
[
  {
    "id": "pbc_4857263011",
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "name": "gh_trending_images",
    "type": "base",
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "hidden": false, "id": "text3208210256", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "hidden": false, "id": "relation3748291011", "maxSelect": 1, "name": "project", "presentable": false, "required": true, "system": false, "type": "relation", "collectionId": "pbc_3748291011", "cascadeDelete": true },
      { "hidden": false, "id": "url4857263012", "name": "image_url", "presentable": false, "required": true, "system": false, "type": "url" },
      { "autogeneratePattern": "", "hidden": false, "id": "text4857263013", "max": 0, "min": 0, "name": "alt_text", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text4857263014", "max": 0, "min": 0, "name": "source", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "bool4857263015", "name": "is_cover", "presentable": false, "required": false, "system": false, "type": "bool" },
      { "hidden": false, "id": "autodate_created", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate_updated", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "indexes": [],
    "system": false
  }
]
```

- [ ] **Step 4: 创建 gh_trending_settings 集合定义**

```json
[
  {
    "id": "pbc_5968372011",
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "name": "gh_trending_settings",
    "type": "base",
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "hidden": false, "id": "text3208210256", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "autogeneratePattern": "", "hidden": false, "id": "text5968372012", "max": 0, "min": 0, "name": "key", "pattern": "", "presentable": false, "primaryKey": false, "required": true, "system": false, "type": "text" },
      { "hidden": false, "id": "json5968372013", "maxSize": 0, "name": "value", "presentable": false, "required": false, "system": false, "type": "json" },
      { "autogeneratePattern": "", "hidden": false, "id": "text5968372014", "max": 0, "min": 0, "name": "description", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "hidden": false, "id": "autodate_created", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate_updated", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_gh_trending_settings_key` ON `gh_trending_settings` (`key`)"
    ],
    "system": false
  }
]
```

---

### Task 2: pb_hooks 后端逻辑

**Files:**
- Create: `pb_hooks/github-trending.pb.js`
- Create: `pb_hooks/github-trending.cron.pb.js`

- [ ] **Step 1: 创建 github-trending.pb.js — 自定义 API 路由**

本文件包含：
1. `POST /api/github-trending/refresh` — 触发抓取 GitHub Trending，搜索文章和图片
2. `GET /api/github-trending/status` — 返回抓取统计

```javascript
/// <reference path="../pb_data/types.d.ts" />

// GitHub Trending Module - Custom API Routes
// Serper.dev API key from environment variable
const SERPER_API_KEY = $os.getenv("SERPER_API_KEY") || "5f1b1a39a5ec6a4312cf53e067b50972500755c2";

// Helper: get or create settings
function getSettings(dao, key, defaultValue) {
  try {
    const record = dao.findFirstRecordByFilter("gh_trending_settings", `key = "${key}"`);
    return record ? record.get("value") : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// Helper: find existing project by name
function findProjectByName(dao, name) {
  try {
    return dao.findFirstRecordByFilter("gh_trending_projects", `name = "${name}"`);
  } catch (e) {
    return null;
  }
}

// Helper: delete existing articles for a project
function deleteArticlesByProject(dao, projectId) {
  try {
    const articles = dao.findRecordsByFilter("gh_trending_articles", `project = "${projectId}"", "-created", 0, 0);
    articles.forEach(a => dao.deleteRecord(a));
  } catch (e) {
    console.error("Error deleting articles:", e.message);
  }
}

// Helper: delete existing images for a project
function deleteImagesByProject(dao, projectId) {
  try {
    const images = dao.findRecordsByFilter("gh_trending_images", `project = "${projectId}"", "-created", 0, 0);
    images.forEach(img => dao.deleteRecord(img));
  } catch (e) {
    console.error("Error deleting images:", e.message);
  }
}

// Helper: search articles via Serper.dev
function searchArticles(dao, projectName, projectId) {
  try {
    const resp = $http.send({
      url: "https://google.serper.dev/search",
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: projectName + " github",
        num: 5
      }),
      timeout: 15000
    });

    if (resp.statusCode !== 200) return;

    const data = resp.json;
    if (!data.organic || !Array.isArray(data.organic)) return;

    data.organic.forEach(item => {
      try {
        const record = dao.findRecordById("gh_trending_articles", "");
        record.set("project", projectId);
        record.set("title", item.title || "");
        record.set("url", item.link || "");
        record.set("snippet", item.snippet || "");
        record.set("source", "serper");
        dao.saveRecord(record);
      } catch (e) {
        console.error("Error saving article:", e.message);
      }
    });
  } catch (e) {
    console.error("Error searching articles for " + projectName + ":", e.message);
  }
}

// Helper: search images via Serper.dev
function searchImages(dao, projectName, projectId) {
  try {
    const resp = $http.send({
      url: "https://google.serper.dev/images",
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: projectName + " github",
        num: 5
      }),
      timeout: 15000
    });

    if (resp.statusCode !== 200) return;

    const data = resp.json;
    if (!data.images || !Array.isArray(data.images)) return;

    data.images.forEach((item, index) => {
      try {
        const record = dao.findRecordById("gh_trending_images", "");
        record.set("project", projectId);
        record.set("image_url", item.imageUrl || item.link || "");
        record.set("alt_text", item.title || projectName);
        record.set("source", "serper");
        record.set("is_cover", index === 0);
        dao.saveRecord(record);
      } catch (e) {
        console.error("Error saving image:", e.message);
      }
    });
  } catch (e) {
    console.error("Error searching images for " + projectName + ":", e.message);
  }
}

// Helper: fetch README from GitHub
function fetchReadme(projectName) {
  try {
    const resp = $http.send({
      url: "https://raw.githubusercontent.com/" + projectName + "/master/README.md",
      method: "GET",
      timeout: 10000
    });
    if (resp.statusCode === 200) {
      return resp.raw ? String(resp.raw) : "";
    }
    // Try main branch
    const resp2 = $http.send({
      url: "https://raw.githubusercontent.com/" + projectName + "/main/README.md",
      method: "GET",
      timeout: 10000
    });
    if (resp2.statusCode === 200) {
      return resp2.raw ? String(resp2.raw) : "";
    }
    return "";
  } catch (e) {
    return "";
  }
}

// POST /api/github-trending/refresh
routerAdd("POST", "/api/github-trending/refresh", (c) => {
  try {
    const query = c.query();
    const language = query.language || "";
    const since = query.since || "daily";
    const search = query.search !== "false"; // whether to search articles/images

    // Build trending API URL
    let trendingUrl = "https://github-trending-api.vercel.app/repositories";
    const params = [];
    if (language) params.push("language=" + encodeURIComponent(language));
    if (since) params.push("since=" + encodeURIComponent(since));
    if (params.length > 0) trendingUrl += "?" + params.join("&");

    console.log("Fetching trending data from:", trendingUrl);

    const trendingResp = $http.send({
      url: trendingUrl,
      method: "GET",
      timeout: 30000
    });

    if (trendingResp.statusCode !== 200) {
      c.json(502, { success: false, error: "GitHub Trending API returned " + trendingResp.statusCode });
      return;
    }

    const projects = trendingResp.json;
    if (!Array.isArray(projects)) {
      c.json(502, { success: false, error: "Invalid response from GitHub Trending API" });
      return;
    }

    const dao = $app.dao();
    let created = 0;
    let updated = 0;
    let errors = 0;

    projects.forEach(item => {
      try {
        const projectName = item.name || "";
        if (!projectName) return;

        const existing = findProjectByName(dao, projectName);

        if (existing) {
          existing.set("stars", item.stars || 0);
          existing.set("forks", item.forks || 0);
          existing.set("stars_today", item.currentPeriodStars || 0);
          dao.saveRecord(existing);
          updated++;
        } else {
          const record = dao.findRecordById("gh_trending_projects", "");
          record.set("name", projectName);
          record.set("description", item.description || "");
          record.set("url", item.url || "https://github.com/" + projectName);
          record.set("homepage", item.homepage || "");
          record.set("language", item.language || "");
          record.set("stars", item.stars || 0);
          record.set("forks", item.forks || 0);
          record.set("stars_today", item.currentPeriodStars || 0);
          record.set("owner_avatar", item.avatar || "");
          record.set("source", "trending");
          record.set("collected_at", new Date().toISOString());
          dao.saveRecord(record);

          // Fetch README
          var readme = fetchReadme(projectName);
          if (readme) {
            record.set("readme", readme);
            dao.saveRecord(record);
          }

          // Search articles and images (in background)
          if (search !== false) {
            searchArticles(dao, projectName, record.getId());
            searchImages(dao, projectName, record.getId());
          }

          created++;
        }
      } catch (e) {
        console.error("Error processing project:", e.message);
        errors++;
      }
    });

    c.json(200, {
      success: true,
      stats: {
        total: projects.length,
        created: created,
        updated: updated,
        errors: errors
      }
    });
  } catch (e) {
    c.json(500, { success: false, error: e.message });
  }
});

// GET /api/github-trending/status
routerAdd("GET", "/api/github-trending/status", (c) => {
  try {
    const dao = $app.dao();
    const totalProjects = dao.findRecordsByFilter("gh_trending_projects", "1=1", "-created", 0, 0);
    const totalArticles = dao.findRecordsByFilter("gh_trending_articles", "1=1", "-created", 0, 0);
    const totalImages = dao.findRecordsByFilter("gh_trending_images", "1=1", "-created", 0, 0);

    c.json(200, {
      success: true,
      stats: {
        projects: totalProjects.length,
        articles: totalArticles.length,
        images: totalImages.length
      }
    });
  } catch (e) {
    c.json(500, { success: false, error: e.message });
  }
});
```

- [ ] **Step 2: 创建 github-trending.cron.pb.js — 定时任务**

```javascript
/// <reference path="../pb_data/types.d.ts" />

// GitHub Trending - Scheduled Sync
// Runs every 6 hours: fetch trending projects automatically

cronAdd("github-trending-sync", "0 */6 * * *", () => {
  try {
    const dao = $app.dao();

    // Check if auto sync is enabled
    let autoSync = true;
    try {
      const setting = dao.findFirstRecordByFilter("gh_trending_settings", "key = 'auto_sync'");
      if (setting) autoSync = setting.get("value") === true || setting.get("value") === "true";
    } catch (e) {
      // Settings collection might not exist yet, default to true
    }

    if (!autoSync) {
      console.log("GitHub Trending auto-sync is disabled, skipping scheduled task");
      return;
    }

    // Get language and since settings
    let language = "";
    let since = "daily";
    try {
      const langSetting = dao.findFirstRecordByFilter("gh_trending_settings", "key = 'language'");
      if (langSetting && langSetting.get("value")) language = String(langSetting.get("value"));

      const sinceSetting = dao.findFirstRecordByFilter("gh_trending_settings", "key = 'since'");
      if (sinceSetting && sinceSetting.get("value")) since = String(sinceSetting.get("value"));
    } catch (e) {}

    console.log("GitHub Trending auto-sync started: language=" + language + ", since=" + since);

    // Build trending API URL
    let trendingUrl = "https://github-trending-api.vercel.app/repositories";
    const params = [];
    if (language) params.push("language=" + encodeURIComponent(language));
    if (since) params.push("since=" + encodeURIComponent(since));
    if (params.length > 0) trendingUrl += "?" + params.join("&");

    const trendingResp = $http.send({
      url: trendingUrl,
      method: "GET",
      timeout: 30000
    });

    if (trendingResp.statusCode !== 200) {
      console.error("GitHub Trending API error:", trendingResp.statusCode);
      return;
    }

    const projects = trendingResp.json;
    if (!Array.isArray(projects)) return;

    let created = 0;
    let updated = 0;

    projects.forEach(item => {
      try {
        const projectName = item.name || "";
        if (!projectName) return;

        let existing = null;
        try {
          existing = dao.findFirstRecordByFilter("gh_trending_projects", "name = '" + projectName.replace(/'/g, "''") + "'");
        } catch (e) {}

        if (existing) {
          existing.set("stars", item.stars || 0);
          existing.set("forks", item.forks || 0);
          existing.set("stars_today", item.currentPeriodStars || 0);
          dao.saveRecord(existing);
          updated++;
        } else {
          const record = dao.findRecordById("gh_trending_projects", "");
          record.set("name", projectName);
          record.set("description", item.description || "");
          record.set("url", item.url || "https://github.com/" + projectName);
          record.set("homepage", item.homepage || "");
          record.set("language", item.language || "");
          record.set("stars", item.stars || 0);
          record.set("forks", item.forks || 0);
          record.set("stars_today", item.currentPeriodStars || 0);
          record.set("owner_avatar", item.avatar || "");
          record.set("source", "trending");
          record.set("collected_at", new Date().toISOString());
          dao.saveRecord(record);

          // Fetch README works, articles/images search not in cron to avoid rate limits
          try {
            var readmeResp = $http.send({
              url: "https://raw.githubusercontent.com/" + projectName + "/master/README.md",
              method: "GET",
              timeout: 10000
            });
            if (readmeResp.statusCode === 200) {
              record.set("readme", String(readmeResp.raw || ""));
              dao.saveRecord(record);
            } else {
              var readmeResp2 = $http.send({
                url: "https://raw.githubusercontent.com/" + projectName + "/main/README.md",
                method: "GET",
                timeout: 10000
              });
              if (readmeResp2.statusCode === 200) {
                record.set("readme", String(readmeResp2.raw || ""));
                dao.saveRecord(record);
              }
            }
          } catch (e) {}

          created++;
        }
      } catch (e) {
        console.error("Error processing project in cron:", e.message);
      }
    });

    console.log("GitHub Trending sync complete: created=" + created + ", updated=" + updated);
  } catch (e) {
    console.error("GitHub Trending cron error:", e.message);
  }
});
```

---

### Task 3: 前端模块结构

**Files:**
- Create: `src/modules/github-trending/package.json`
- Create: `src/modules/github-trending/menu.ts`
- Create: `src/modules/github-trending/routes.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@pocketstack/github-trending",
  "version": "1.0.0",
  "title": "GitHub 热点",
  "description": "GitHub 热门项目抓取与素材管理",
  "private": true,
  "type": "module",
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

- [ ] **Step 2: 创建 menu.ts**

```ts
import { FireIcon } from '@heroicons/react/24/outline';

export const menu = {
  title: 'GitHub 热点',
  icon: FireIcon,
  children: [
    { title: '热门项目', path: '/github-trending' },
    { title: '采集管理', path: '/github-trending/collected' },
    { title: '抓取设置', path: '/github-trending/settings' },
  ],
};
```

- [ ] **Step 3: 创建 routes.tsx**

```tsx
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';
import { TrendingPage } from './components/TrendingPage';
import { ProjectDetail } from './components/ProjectDetail';
import { CollectedProjects } from './components/CollectedProjects';
import { Settings } from './components/Settings';

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<MainLayout />}>
      <Route path="github-trending" element={<TrendingPage />} />
      <Route path="github-trending/collected" element={<CollectedProjects />} />
      <Route path="github-trending/settings" element={<Settings />} />
      <Route path="github-trending/:id" element={<ProjectDetail />} />
    </Route>
  </Route>
);
```

---

### Task 4: TrendingPage 组件

**Files:**
- Create: `src/modules/github-trending/components/TrendingPage.tsx`

- [ ] **Step 1: 创建 TrendingPage.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FireIcon,
  ArrowPathIcon,
  StarIcon,
  CodeBracketIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  stars_today: number;
  owner_avatar: string;
  source: string;
  collected_at: string;
  created: string;
}

export function TrendingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('');
  const [since, setSince] = useState('daily');
  const [status, setStatus] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const records = await pb.collection('gh_trending_projects').getFullList<Project>({
        sort: '-stars',
        requestKey: null,
      });
      setProjects(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch projects:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setStatus(null);
    try {
      const params = new URLSearchParams();
      if (language) params.set('language', language);
      if (since) params.set('since', since);

      const resp = await fetch(`/api/github-trending/refresh?${params.toString()}`, {
        method: 'POST',
      });
      const data = await resp.json();

      if (data.success) {
        toast.success(`抓取完成：新增 ${data.stats.created}，更新 ${data.stats.updated}`);
        setStatus(`新增 ${data.stats.created} 个项目，更新 ${data.stats.updated} 个`);
        fetchProjects();
      } else {
        toast.error(`抓取失败: ${data.error}`);
      }
    } catch (error: any) {
      toast.error(`请求失败: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <FireIcon className="h-8 w-8 text-primary" />
            GitHub 热门项目
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            抓取 GitHub Trending 热门项目，自动搜索相关文章和图片素材
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">所有语言</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="c++">C++</option>
          </select>

          <select
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="daily">今日</option>
            <option value="weekly">本周</option>
            <option value="monthly">本月</option>
          </select>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl"
          >
            {refreshing ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                抓取中...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                刷新
              </>
            )}
          </Button>
        </div>
      </div>

      {status && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {status}
        </div>
      )}

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-neutral-500">加载中...</div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FireIcon className="h-16 w-16 text-neutral-300 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              暂无数据
            </h2>
            <p className="text-neutral-500 text-center max-w-md mb-6">
              点击"刷新"按钮，从 GitHub Trending 抓取热门项目
            </p>
            <Button onClick={handleRefresh} disabled={refreshing} className="rounded-xl">
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              开始抓取
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/github-trending/${project.id}`}>
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    {project.owner_avatar ? (
                      <img
                        src={project.owner_avatar}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    {project.language && (
                      <span className="flex items-center gap-1">
                        <CodeBracketIcon className="h-4 w-4" />
                        {project.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-4 w-4" />
                      {formatNumber(project.stars)}
                    </span>
                    {project.stars_today > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.stars_today} 今日
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 5: ProjectDetail 组件

**Files:**
- Create: `src/modules/github-trending/components/ProjectDetail.tsx`

- [ ] **Step 1: 创建 ProjectDetail.tsx**

```tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeftIcon,
  StarIcon,
  ForkLeftIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  stars_today: number;
  owner_avatar: string;
  readme: string;
  tags: string[];
  notes: string;
  source: string;
  collected_at: string;
  created: string;
}

interface Article {
  id: string;
  title: string;
  url: string;
  snippet: string;
  content: string;
  source: string;
}

interface Image {
  id: string;
  image_url: string;
  alt_text: string;
  source: string;
  is_cover: boolean;
}

export function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [proj, arts, imgs] = await Promise.all([
          pb.collection('gh_trending_projects').getOne<Project>(id, { requestKey: null }),
          pb.collection('gh_trending_articles').getFullList<Article>({
            filter: `project = "${id}"`,
            sort: '-created',
            requestKey: null,
          }),
          pb.collection('gh_trending_images').getFullList<Image>({
            filter: `project = "${id}"`,
            sort: '-created',
            requestKey: null,
          }),
        ]);
        setProject(proj);
        setArticles(arts);
        setImages(imgs);
        setNote(proj.notes || '');
      } catch (error: any) {
        if (!error.isAbort) console.error('Failed to fetch project detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const saveNote = async () => {
    if (!project) return;
    try {
      setSaving(true);
      await pb.collection('gh_trending_projects').update(project.id, { notes: note });
    } catch (error: any) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  };

  const addTag = async () => {
    if (!project || !tagInput.trim()) return;
    const newTags = [...(project.tags || []), tagInput.trim()];
    try {
      await pb.collection('gh_trending_projects').update(project.id, { tags: newTags });
      setProject({ ...project, tags: newTags });
      setTagInput('');
    } catch (error: any) {
      console.error('Failed to add tag:', error);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    if (!project) return;
    const newTags = (project.tags || []).filter((t) => t !== tagToRemove);
    try {
      await pb.collection('gh_trending_projects').update(project.id, { tags: newTags });
      setProject({ ...project, tags: newTags });
    } catch (error: any) {
      console.error('Failed to remove tag:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Link to="/github-trending" className="text-primary hover:underline">← 返回列表</Link>
        <p className="mt-4 text-neutral-500">项目不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back button */}
      <Link
        to="/github-trending"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        返回列表
      </Link>

      {/* Project header */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {project.owner_avatar ? (
              <img src={project.owner_avatar} alt="" className="h-16 w-16 rounded-full" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {project.language && (
                  <span className="flex items-center gap-1 text-sm text-neutral-500">
                    <CodeBracketIcon className="h-4 w-4" />
                    {project.language}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-neutral-500">
                  <StarIcon className="h-4 w-4" />
                  {formatNumber(project.stars)}
                </span>
                <span className="flex items-center gap-1 text-sm text-neutral-500">
                  <ForkLeftIcon className="h-4 w-4" />
                  {formatNumber(project.forks)}
                </span>
                {project.stars_today > 0 && (
                  <Badge variant="secondary">今日 +{project.stars_today}</Badge>
                )}
                <span className="flex items-center gap-1 text-sm text-neutral-500">
                  <CalendarIcon className="h-4 w-4" />
                  {project.collected_at ? new Date(project.collected_at).toLocaleDateString('zh-CN') : '-'}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(project.url, '_blank')}>
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  查看 GitHub
                </Button>
                {project.homepage && (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(project.homepage, '_blank')}>
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    项目主页
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(project.tags || []).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">&times;</button>
              </Badge>
            ))}
            <div className="flex gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="添加标签..."
                className="h-7 rounded-md border border-neutral-200 px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
              />
              <Button size="sm" variant="ghost" onClick={addTag} className="h-7">+</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="readme" className="w-full">
        <TabsList>
          <TabsTrigger value="readme">概览</TabsTrigger>
          <TabsTrigger value="articles">文章 ({articles.length})</TabsTrigger>
          <TabsTrigger value="images">图片素材 ({images.length})</TabsTrigger>
          <TabsTrigger value="notes">笔记</TabsTrigger>
        </TabsList>

        <TabsContent value="readme" className="mt-4">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6">
              {project.readme ? (
                <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 max-h-[600px] overflow-y-auto">
                  {project.readme}
                </pre>
              ) : (
                <p className="text-neutral-500">暂无 README 数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles" className="mt-4 space-y-3">
          {articles.length === 0 ? (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="py-8 text-center text-neutral-500">暂无相关文章</CardContent>
            </Card>
          ) : (
            articles.map((article) => (
              <Card key={article.id} className="rounded-2xl border-none shadow-sm">
                <CardContent className="p-4">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {article.title}
                  </a>
                  {article.snippet && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                      {article.snippet}
                    </p>
                  )}
                  <span className="text-xs text-neutral-400 mt-1 block">来源: {article.source}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          {images.length === 0 ? (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="py-8 text-center text-neutral-500">暂无图片素材</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => (
                <Card key={image.id} className="rounded-2xl border-none shadow-sm overflow-hidden">
                  <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={image.image_url}
                      alt={image.alt_text}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {image.is_cover && (
                      <Badge className="absolute top-2 right-2">封面</Badge>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-neutral-500 truncate">{image.alt_text}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="记录你对这个项目的看法、用途、待办事项..."
                className="w-full min-h-[200px] rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={saveNote} disabled={saving} className="rounded-xl">
                  {saving ? '保存中...' : '保存笔记'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### Task 6: CollectedProjects 组件

**Files:**
- Create: `src/modules/github-trending/components/CollectedProjects.tsx`

- [ ] **Step 1: 创建 CollectedProjects.tsx**

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FolderIcon,
  StarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  tags: string[];
  notes: string;
  source: string;
  created: string;
}

export function CollectedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('gh_trending_projects').getFullList<Project>({
          sort: '-created',
          requestKey: null,
        });
        setProjects(records);
      } catch (error: any) {
        if (!error.isAbort) console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Extract unique tags
  const allTags = [...new Set(projects.flatMap((p) => p.tags || []))].sort();

  // Filter projects
  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.description || '').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedTag && !(p.tags || []).includes(selectedTag)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <FolderIcon className="h-8 w-8 text-primary" />
          采集管理
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          浏览所有已采集的 GitHub 项目，按标签筛选和搜索
        </p>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder="搜索项目名称或描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl pl-10"
          />
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTag === null ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
          >
            全部
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Project list */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="py-12 text-center text-neutral-500">
            暂无匹配的项目
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <Link key={project.id} to={`/github-trending/${project.id}`}>
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {project.language && (
                          <Badge variant="secondary" className="text-xs">{project.language}</Badge>
                        )}
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <StarIcon className="h-3 w-3" />
                          {project.stars}
                        </span>
                        {(project.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        <span className="text-xs text-neutral-400">
                          {new Date(project.created).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 7: Settings 组件

**Files:**
- Create: `src/modules/github-trending/components/Settings.tsx`

- [ ] **Step 1: 创建 Settings.tsx**

```tsx
import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Cog6ToothIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Setting {
  id: string;
  key: string;
  value: any;
}

export function Settings() {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultSettings = {
    language: { key: 'language', value: '' },
    since: { key: 'since', value: 'daily' },
    auto_sync: { key: 'auto_sync', value: true },
    sync_interval: { key: 'sync_interval', value: 6 },
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('gh_trending_settings').getFullList<Setting>({
          requestKey: null,
        });
        const map: Record<string, Setting> = {};
        records.forEach((r) => {
          map[r.key] = r;
        });
        // Merge with defaults
        Object.entries(defaultSettings).forEach(([key, def]) => {
          if (!map[key]) {
            map[key] = { id: '', key: def.key, value: def.value };
          }
        });
        setSettings(map);
      } catch (error: any) {
        if (!error.isAbort) console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const promises = Object.values(settings).map(async (setting) => {
        const data = { key: setting.key, value: setting.value };
        if (setting.id) {
          return pb.collection('gh_trending_settings').update(setting.id, data, { requestKey: null });
        } else {
          return pb.collection('gh_trending_settings').create(data, { requestKey: null });
        }
      });
      await Promise.all(promises);
      toast.success('设置已保存');

      // Re-fetch to get IDs for newly created records
      const records = await pb.collection('gh_trending_settings').getFullList<Setting>({ requestKey: null });
      const map: Record<string, Setting> = {};
      records.forEach((r) => { map[r.key] = r; });
      Object.entries(defaultSettings).forEach(([key, def]) => {
        if (!map[key]) map[key] = { id: '', key: def.key, value: def.value };
      });
      setSettings(map);
    } catch (error: any) {
      toast.error(`保存失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载设置中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Cog6ToothIcon className="h-8 w-8 text-primary" />
          抓取设置
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          配置 GitHub Trending 抓取参数和自动同步
        </p>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">抓取参数</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language */}
          <div className="space-y-2">
            <Label>筛选语言</Label>
            <select
              value={String(settings.language?.value || '')}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">所有语言</option>
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="java">Java</option>
            </select>
          </div>

          {/* Since */}
          <div className="space-y-2">
            <Label>时间范围</Label>
            <select
              value={String(settings.since?.value || 'daily')}
              onChange={(e) => updateSetting('since', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>

          {/* Auto sync */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto_sync"
              checked={Boolean(settings.auto_sync?.value)}
              onChange={(e) => updateSetting('auto_sync', e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <Label htmlFor="auto_sync">启用自动同步</Label>
          </div>

          {/* Sync interval */}
          {Boolean(settings.auto_sync?.value) && (
            <div className="space-y-2">
              <Label>同步间隔（小时）</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={Number(settings.sync_interval?.value) || 6}
                onChange={(e) => updateSetting('sync_interval', parseInt(e.target.value) || 6)}
                className="rounded-xl w-32"
              />
            </div>
          )}

          <div className="pt-4">
            <Button onClick={saveSettings} disabled={saving} className="rounded-xl">
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存设置'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Self-Review Checklist

- [x] **Spec coverage**: 所有 spec 中的数据结构（4 个 collections）、后端逻辑（pb_hooks API + cron）、前端页面（4 个页面）都有对应 task
- [x] **Placeholder scan**: 所有代码都是完整实现，无 TBD/TODO
- [x] **Type consistency**: collectionId 在迁移文件中引用一致（`pbc_3748291011` 对应 gh_trending_projects），前端 pb.collection() 名称与迁移文件一致
- [ ] **Route order**: `github-trending/:id` 路由放在 `github-trending/collected` 和 `github-trending/settings` 之后，避免 `:id` 匹配到固定路径
