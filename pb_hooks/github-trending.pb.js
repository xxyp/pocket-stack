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
    const articles = dao.findRecordsByFilter("gh_trending_articles", `project = "${projectId}"`, "-created", 0, 0);
    articles.forEach(a => dao.deleteRecord(a));
  } catch (e) {
    console.error("Error deleting articles:", e.message);
  }
}

// Helper: delete existing images for a project
function deleteImagesByProject(dao, projectId) {
  try {
    const images = dao.findRecordsByFilter("gh_trending_images", `project = "${projectId}"`, "-created", 0, 0);
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

          // Search articles and images
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
