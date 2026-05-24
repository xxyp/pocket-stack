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
