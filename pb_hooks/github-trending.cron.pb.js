/// <reference path="../pb_data/types.d.ts" />

// GitHub Trending - Scheduled Sync (every 6 hours)

// ── HTML Parser (shared with github-trending.pb.js) ──

function parseTrendingHtml(html, limit) {
  const repos = [];
  var articleRegex = /<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
  var match;
  while ((match = articleRegex.exec(html)) !== null && repos.length < limit) {
    var articleHtml = match[1];

    var hrefMatch = articleHtml.match(/href="\/([^\/]+)\/([^\/"\?]+)"/);
    if (!hrefMatch) continue;
    var owner = hrefMatch[1];
    var name = hrefMatch[2];
    var fullName = owner + "/" + name;

    var descMatch = articleHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    var description = descMatch ? descMatch[1].trim() : "";
    description = description.replace(/<[^>]*>/g, "").trim();

    var langMatch = articleHtml.match(/itemprop="programmingLanguage">([^<]*)<\/span>/);
    var language = langMatch ? langMatch[1].trim() : "";

    var starsMatch = articleHtml.match(/href="[^"]*\/stargazers"[^>]*>[\s\n]*([\d,]+)/);
    var stars = starsMatch ? parseInt(starsMatch[1].replace(/,/g, ""), 10) : 0;

    var forksMatch = articleHtml.match(/href="[^"]*\/forks"[^>]*>[\s\n]*([\d,]+)/);
    var forks = forksMatch ? parseInt(forksMatch[1].replace(/,/g, ""), 10) : 0;

    var todayMatch = articleHtml.match(/float-sm-right[^>]*>[\s\n]*([\d,]+)/);
    if (!todayMatch) todayMatch = articleHtml.match(/float-right[^>]*>[\s\n]*([\d,]+)/);
    var starsToday = todayMatch ? parseInt(todayMatch[1].replace(/,/g, ""), 10) : 0;

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

cronAdd("github-trending-sync", "0 */6 * * *", function() {
  try {
    var autoSync = true;
    try {
      var setting = $app.findFirstRecordByFilter("gh_trending_settings", "key = 'auto_sync'");
      if (setting) autoSync = setting.get("value") === true || setting.get("value") === "true";
    } catch (e) {}

    if (!autoSync) {
      console.log("GitHub Trending auto-sync is disabled, skipping");
      return;
    }

    var language = "";
    var since = "daily";
    try {
      var langSetting = $app.findFirstRecordByFilter("gh_trending_settings", "key = 'language'");
      if (langSetting && langSetting.get("value")) language = String(langSetting.get("value"));
      var sinceSetting = $app.findFirstRecordByFilter("gh_trending_settings", "key = 'since'");
      if (sinceSetting && sinceSetting.get("value")) since = String(sinceSetting.get("value"));
    } catch (e) {}

    console.log("Auto-sync started: language=" + language + ", since=" + since);

    // Direct HTML scraping from GitHub
    var trendingUrl = "https://github.com/trending";
    if (language) trendingUrl += "/" + encodeURIComponent(language.toLowerCase());
    var params = [];
    if (since) params.push("since=" + encodeURIComponent(since));
    if (params.length > 0) trendingUrl += "?" + params.join("&");

    var resp = $http.send({
      url: trendingUrl,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      },
      timeout: 60000
    });

    if (resp.statusCode !== 200) {
      console.error("GitHub Trending error:", resp.statusCode);
      return;
    }

    var html = toString(resp.body);
    var projects = parseTrendingHtml(html, 25);
    var created = 0;
    var updated = 0;

    for (var pi = 0; pi < projects.length; pi++) {
      try {
        var item = projects[pi];
        var existing = null;
        try {
          existing = $app.findFirstRecordByFilter("gh_trending_projects",
            "name = {:name}", { "name": item.name });
        } catch (e) {}

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
          try {
            var readmeResp = $http.send({
              url: "https://raw.githubusercontent.com/" + item.name + "/master/README.md",
              method: "GET",
              timeout: 10000
            });
            if (readmeResp.statusCode === 200) {
              updateRecord(record, { readme: toString(readmeResp.body) });
            } else {
              var readmeResp2 = $http.send({
                url: "https://raw.githubusercontent.com/" + item.name + "/main/README.md",
                method: "GET",
                timeout: 10000
              });
              if (readmeResp2.statusCode === 200) {
                updateRecord(record, { readme: toString(readmeResp2.body) });
              }
            }
          } catch (e) {}

          created++;
        }
      } catch (err) {
        console.error("Error processing project in cron:", err.message);
      }
    }

    console.log("Sync complete: created=" + created + ", updated=" + updated);
  } catch (err) {
    console.error("Cron error:", err.message);
  }
});
