import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("SEO and Meta configuration", () => {
  const rootDir = process.cwd();
  const indexHtmlPath = path.resolve(rootDir, "index.html");
  const robotsTxtPath = path.resolve(rootDir, "public/robots.txt");
  const sitemapXmlPath = path.resolve(rootDir, "public/sitemap.xml");

  it("index.html に必須の基本メタタグが含まれていること", () => {
    const html = fs.readFileSync(indexHtmlPath, "utf-8");

    // Title
    expect(html).toContain("<title>重賞カレンダー | JRA & NAR Graded Races Calendar</title>");

    // Canonical URL
    expect(html).toContain(
      '<link rel="canonical" href="https://meshi-z.github.io/horse-racing-calender/" />'
    );

    // Description (日英キーワード含有)
    expect(html).toContain('name="description"');
    expect(html).toContain("JRA（中央競馬）およびNAR（地方競馬・ダートグレード・ばんえい）の全重賞レース日程");
    expect(html).toContain("Comprehensive schedule and confirmed race times for JRA & NAR graded horse racing in Japan");

    // Keywords
    expect(html).toContain('name="keywords"');
    expect(html).toContain("JRA, NAR, 地方競馬, ダートグレード");
    expect(html).toContain("horse racing, Japan, race calendar, graded races");
  });

  it("index.html にOGPタグおよびTwitter Cardが設定されていること", () => {
    const html = fs.readFileSync(indexHtmlPath, "utf-8");

    // OGP
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain(
      'property="og:url" content="https://meshi-z.github.io/horse-racing-calender/"'
    );
    expect(html).toContain(
      'property="og:title" content="重賞カレンダー | JRA & NAR Graded Races Calendar"'
    );
    expect(html).toContain(
      'property="og:description" content="JRA（中央競馬）およびNAR（地方競馬）の全重賞レース日程・確定発走時刻・出走条件をタイムラインと月間カレンダーで確認できるオフライン対応Webアプリ。"'
    );
    expect(html).toContain(
      'property="og:image" content="https://meshi-z.github.io/horse-racing-calender/icons/icon-512.png"'
    );
    expect(html).toContain('property="og:locale" content="ja_JP"');
    expect(html).toContain('property="og:locale:alternate" content="en_US"');
    expect(html).toContain('property="og:locale:alternate" content="fr_FR"');
    expect(html).toContain('property="og:locale:alternate" content="zh_HK"');

    // Twitter
    expect(html).toContain('name="twitter:card" content="summary"');
    expect(html).toContain(
      'name="twitter:title" content="重賞カレンダー | JRA & NAR Graded Races Calendar"'
    );
    expect(html).toContain(
      'name="twitter:description" content="JRA（中央競馬）およびNAR（地方競馬）の全重賞レース日程・確定発走時刻・出走条件をタイムラインと月間カレンダーで確認できるオフライン対応Webアプリ。"'
    );
    expect(html).toContain(
      'name="twitter:image" content="https://meshi-z.github.io/horse-racing-calender/icons/icon-512.png"'
    );
  });

  it("index.html にSchema.org準拠のJSON-LD構造化データが含まれており有効なJSONであること", () => {
    const html = fs.readFileSync(indexHtmlPath, "utf-8");
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    );

    expect(jsonLdMatch).not.toBeNull();
    const jsonText = jsonLdMatch![1].trim();

    const data = JSON.parse(jsonText);
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("WebApplication");
    expect(data.name).toBe("重賞カレンダー");
    expect(data.alternateName).toContain("Graded Races Calendar");
    expect(data.alternateName).toContain("JRA & NAR Graded Races Calendar");
    expect(data.alternateName).toContain("Calendrier des Courses de Groupe");
    expect(data.alternateName).toContain("分級賽行事曆");
    expect(data.alternateName).toContain("香港・日本・歐美重賞賽程");
    expect(data.description).toContain("JRA（中央競馬）およびNAR（地方競馬・ダートグレード・ばんえい）");
    expect(data.inLanguage).toContain("ja");
    expect(data.inLanguage).toContain("en");
    expect(data.inLanguage).toContain("fr");
    expect(data.inLanguage).toContain("zh-HK");
    expect(data.applicationCategory).toBe("SportsApplication");
    expect(data.url).toBe("https://meshi-z.github.io/horse-racing-calender/");
  });

  it("public/robots.txt が存在し、全クローラー許可とサイトマップURLが指定されていること", () => {
    expect(fs.existsSync(robotsTxtPath)).toBe(true);
    const content = fs.readFileSync(robotsTxtPath, "utf-8");
    expect(content).toContain("User-agent: *");
    expect(content).toContain("Allow: /");
    expect(content).toContain(
      "Sitemap: https://meshi-z.github.io/horse-racing-calender/sitemap.xml"
    );
  });

  it("public/sitemap.xml が存在し、トップページのURLが含まれていること", () => {
    expect(fs.existsSync(sitemapXmlPath)).toBe(true);
    const content = fs.readFileSync(sitemapXmlPath, "utf-8");
    expect(content).toContain("<loc>https://meshi-z.github.io/horse-racing-calender/</loc>");
    expect(content).toContain("<changefreq>daily</changefreq>");
  });
});
