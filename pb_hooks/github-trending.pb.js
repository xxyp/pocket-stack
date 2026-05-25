/// <reference path="../pb_data/types.d.ts" />

// GitHub Trending Module - Custom API Routes
const SERPER_API_KEY = $os.getenv("SERPER_API_KEY") || "5f1b1a39a5ec6a4312cf53e067b50972500755c2";

// ── HTML Parser (no Cheerio available in Goja) ──

function parseTrendingHtml(html, limit) {
  const repos = [];
  // Match each article.Box-row
  var articleRegex = /<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
  var match;
  while ((match = articleRegex.exec(html)) !== null && repos.length < limit) {
    var articleHtml = match[1];

    // Owner & name from href="/owner/name"
    var hrefMatch = articleHtml.match(/href="\/([^\/]+)\/([^\/"\?]+)"/);
    if (!hrefMatch) continue;
    var owner = hrefMatch[1];
    var name = hrefMatch[2];
    var fullName = owner + "/" + name;

    // Description (first <p>)
    var descMatch = articleHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    var description = descMatch ? descMatch[1].trim() : "";
    // Strip any HTML tags inside description
    description = description.replace(/<[^>]*>/g, "").trim();

    // Programming language
    var langMatch = articleHtml.match(/itemprop="programmingLanguage">([^<]*)<\/span>/);
    var language = langMatch ? langMatch[1].trim() : "";

    // Stars (from /stargazers link)
    var starsMatch = articleHtml.match(/href="[^"]*\/stargazers"[^>]*>[\s\n]*([\d,]+)/);
    var stars = starsMatch ? parseInt(starsMatch[1].replace(/,/g, ""), 10) : 0;

    // Forks (from /forks link)
    var forksMatch = articleHtml.match(/href="[^"]*\/forks"[^>]*>[\s\n]*([\d,]+)/);
    var forks = forksMatch ? parseInt(forksMatch[1].replace(/,/g, ""), 10) : 0;

    // Today/this week/this month stars
    var todayMatch = articleHtml.match(/float-sm-right[^>]*>[\s\n]*([\d,]+)/);
    if (!todayMatch) todayMatch = articleHtml.match(/float-right[^>]*>[\s\n]*([\d,]+)/);
    var starsToday = todayMatch ? parseInt(todayMatch[1].replace(/,/g, ""), 10) : 0;

    // Owner avatar
    var avatarMatch = articleHtml.match(/<img[^>]*src="([^"]*avatars[^"]*)"[^>]*>/);
    var avatar = avatarMatch ? avatarMatch[1] : "";

    repos.push({
      owner: owner,
      name: fullName,
      repository: name,
      description: description,
      language: language,
      stars: stars,
      forks: forks,
      stars_today: starsToday,
      owner_avatar: avatar,
    });
  }
  return repos;
}

function getLanguageColor(lang) {
  var colors = {
    "typescript": "#3178c6",
    "javascript": "#f1e05a",
    "python": "#3572A5",
    "go": "#00ADD8",
    "rust": "#dea584",
    "java": "#b07219",
    "c": "#555555",
    "c++": "#f34b7d",
    "c#": "#178600",
    "php": "#4F5D95",
    "ruby": "#701516",
    "swift": "#F05138",
    "kotlin": "#A97BFF",
    "dart": "#00B4AB",
    "scala": "#c22d40",
    "shell": "#89e051",
    "html": "#e34c26",
    "css": "#563d7c",
    "vue": "#41b883",
    "svelte": "#ff3e00",
    "lua": "#000080",
    "perl": "#0298c3",
    "haskell": "#5e5086",
    "elixir": "#4e2a59",
    "clojure": "#db5855",
    "zig": "#ec915c",
    "solidity": "#AA6746",
    "objective-c": "#438eff",
  };
  return colors[lang.toLowerCase()] || "#858585";
}

// ── PocketBase helpers ──

function findProjectByName(name) {
  try {
    return $app.findFirstRecordByFilter("gh_trending_projects", "name = {:name}", { "name": name });
  } catch (e) {
    return null;
  }
}

function deleteArticlesByProject(projectId) {
  try {
    var articles = $app.findRecordsByFilter("gh_trending_articles", "project = {:id}", "", 9999, 0, { "id": projectId });
    articles.forEach(function(a) { $app.delete(a); });
  } catch (e) {
    console.error("Error deleting articles:", e.message);
  }
}

function deleteImagesByProject(projectId) {
  try {
    var images = $app.findRecordsByFilter("gh_trending_images", "project = {:id}", "", 9999, 0, { "id": projectId });
    images.forEach(function(img) { $app.delete(img); });
  } catch (e) {
    console.error("Error deleting images:", e.message);
  }
}

function saveRecord(collectionName, data) {
  var collection = $app.findCollectionByNameOrId(collectionName);
  var record = new Record(collection, data);
  var form = new RecordUpsertForm($app, record);
  form.submit();
  return record;
}

function updateRecord(record, changes) {
  var keys = Object.keys(changes);
  for (var i = 0; i < keys.length; i++) {
    record.set(keys[i], changes[keys[i]]);
  }
  var form = new RecordUpsertForm($app, record);
  form.submit();
}

// ── External search helpers (Serper.dev) ──

function searchArticles(projectName, projectId) {
  try {
    var resp = $http.send({
      url: "https://google.serper.dev/search",
      method: "POST",
      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: projectName + " github", num: 5 }),
      timeout: 15000
    });
    if (resp.statusCode !== 200) return;
    var data = resp.json;
    if (!data.organic || !Array.isArray(data.organic)) return;
    data.organic.forEach(function(item) {
      try {
        saveRecord("gh_trending_articles", {
          project: projectId,
          title: item.title || "",
          url: item.link || "",
          snippet: item.snippet || "",
          source: "serper"
        });
      } catch (e) {
        console.error("Error saving article:", e.message);
      }
    });
  } catch (e) {
    console.error("Error searching articles for " + projectName + ":", e.message);
  }
}

function searchImages(projectName, projectId) {
  try {
    var resp = $http.send({
      url: "https://google.serper.dev/images",
      method: "POST",
      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: projectName + " github", num: 5 }),
      timeout: 15000
    });
    if (resp.statusCode !== 200) return;
    var data = resp.json;
    if (!data.images || !Array.isArray(data.images)) return;
    data.images.forEach(function(item, index) {
      try {
        saveRecord("gh_trending_images", {
          project: projectId,
          image_url: item.imageUrl || item.link || "",
          alt_text: item.title || projectName,
          source: "serper",
          is_cover: index === 0
        });
      } catch (e) {
        console.error("Error saving image:", e.message);
      }
    });
  } catch (e) {
    console.error("Error searching images for " + projectName + ":", e.message);
  }
}

function fetchReadme(projectName) {
  try {
    var resp = $http.send({
      url: "https://raw.githubusercontent.com/" + projectName + "/master/README.md",
      method: "GET",
      timeout: 10000
    });
    if (resp.statusCode === 200) return toString(resp.body);
    var resp2 = $http.send({
      url: "https://raw.githubusercontent.com/" + projectName + "/main/README.md",
      method: "GET",
      timeout: 10000
    });
    if (resp2.statusCode === 200) return toString(resp2.body);
    return "";
  } catch (e) {
    return "";
  }
}

// ── Routes ──

// POST /api/github-trending/refresh
routerAdd("POST", "/api/github-trending/refresh", function(e) {
  try {
    var query = e.requestInfo().query;
    var language = query.language || "";
    var since = query.since || "daily";
    var search = query.search !== "false";

    // Direct HTML scraping from GitHub
    var trendingUrl = "https://github.com/trending";
    if (language) trendingUrl += "/" + encodeURIComponent(language.toLowerCase());
    var params = [];
    if (since) params.push("since=" + encodeURIComponent(since));
    if (params.length > 0) trendingUrl += "?" + params.join("&");

    console.log("Fetching trending data from:", trendingUrl);

    var resp = $http.send({
      url: trendingUrl,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html"
      },
      timeout: 60000
    });

    if (resp.statusCode !== 200) {
      e.json(502, { success: false, error: "GitHub returned status " + resp.statusCode });
      return;
    }

    var html = toString(resp.body);
    var projects = parseTrendingHtml(html, 25);

    if (projects.length === 0) {
      e.json(502, { success: false, error: "Failed to parse any projects from GitHub Trending" });
      return;
    }

    var created = 0;
    var updated = 0;
    var errors = 0;

    for (var pi = 0; pi < projects.length; pi++) {
      try {
        var item = projects[pi];
        var existing = findProjectByName(item.name);

        if (existing) {
          updateRecord(existing, {
            stars: item.stars,
            forks: item.forks,
            stars_today: item.stars_today
          });
          updated++;
        } else {
          var record = saveRecord("gh_trending_projects", {
            name: item.name,
            description: item.description,
            url: "https://github.com/" + item.name,
            language: item.language,
            stars: item.stars,
            forks: item.forks,
            stars_today: item.stars_today,
            owner_avatar: item.owner_avatar,
            source: "trending",
            collected_at: new Date().toISOString()
          });

          // Fetch README
          var readme = fetchReadme(item.name);
          if (readme) updateRecord(record, { readme: readme });

          // Search articles and images
          if (search !== false) {
            deleteArticlesByProject(record.id);
            deleteImagesByProject(record.id);
            searchArticles(item.name, record.id);
            searchImages(item.name, record.id);
          }

          created++;
        }
      } catch (err) {
        console.error("Error processing project:", err.message);
        errors++;
      }
    }

    e.json(200, {
      success: true,
      stats: { total: projects.length, created: created, updated: updated, errors: errors }
    });
  } catch (err) {
    e.json(500, { success: false, error: err.message });
  }
});

// GET /api/github-trending/status
routerAdd("GET", "/api/github-trending/status", function(e) {
  try {
    e.json(200, {
      success: true,
      stats: {
        projects: $app.countRecords("gh_trending_projects"),
        articles: $app.countRecords("gh_trending_articles"),
        images: $app.countRecords("gh_trending_images")
      }
    });
  } catch (err) {
    e.json(500, { success: false, error: err.message });
  }
});
