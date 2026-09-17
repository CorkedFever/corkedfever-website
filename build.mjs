// Builds docs/index.html from projects.json. No dependencies: `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const root = new URL(".", import.meta.url);
const { site, projects } = JSON.parse(readFileSync(new URL("projects.json", root), "utf8"));

const STATUSES = {
  live: { heading: "NOW SHOWING", lede: "Out in the world and installable today.", badge: "ON AIR" },
  production: { heading: "IN PRODUCTION", lede: "Being built right now. Playable on my machine, not yet on yours.", badge: "IN PRODUCTION" },
  planned: { heading: "COMING SOON", lede: "On the list. No promises about when.", badge: "COMING SOON" },
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

for (const p of projects) {
  if (!STATUSES[p.status]) throw new Error(`${p.name}: status must be one of ${Object.keys(STATUSES).join(", ")}`);
  if (!/^#[0-9a-f]{6}$/i.test(p.accent)) throw new Error(`${p.name}: accent must be a #RRGGBB colour`);
}

// Channel numbers follow the order in projects.json, across all sections.
projects.forEach((p, i) => { p.channel = i + 1; });

const card = (p) => `
      <article class="ch ${p.status}" style="--ch: ${p.accent}">
        <div class="top">
          <span class="no">CH ${p.channel}</span>
          <span class="badge">${p.status === "live" ? "● " : ""}${STATUSES[p.status].badge}${p.stage ? ` · ${esc(p.stage).toUpperCase()}` : ""}</span>
        </div>
        <h3>${esc(p.name)}</h3>
        <div class="kind">${esc(p.kind)}</div>
        <p class="tagline">${esc(p.tagline)}</p>
        <p>${esc(p.description)}</p>${p.built?.length ? `
        <ul class="built">${p.built.map((b) => `
          <li>${esc(b)}</li>`).join("")}
        </ul>` : ""}
        <div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>${p.links?.length ? `
        <div class="links">${p.links.map((l) => `<a class="btn" href="${esc(l.url)}">${esc(l.label)}</a>`).join("")}</div>` : ""}
      </article>`;

const sections = Object.entries(STATUSES)
  .map(([status, s]) => {
    const list = projects.filter((p) => p.status === status);
    if (!list.length) return "";
    return `
  <section id="${status}">
    <h2>${s.heading}</h2>
    <p class="lede">${s.lede}</p>
    <div class="channels">${list.map(card).join("")}
    </div>
  </section>`;
  })
  .join("\n");

const bars = projects.map((p) => `<span style="background: ${p.accent}" title="${esc(p.name)}"></span>`).join("");

// The test card's colour bars, and the favicon's, are the projects' accents too.
const barRects = (x0, width, y, height, indent) =>
  projects.map((p, i) => {
    const x = x0 + (width * i) / projects.length;
    return `${indent}<rect x="${x.toFixed(1)}" y="${y}" width="${(width / projects.length + 0.5).toFixed(1)}" height="${height}" fill="${p.accent}"/>`;
  }).join("\n");

const favicon = "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><clipPath id="c"><rect x="4" y="10" width="56" height="44" rx="8"/></clipPath>` +
  `<g clip-path="url(#c)"><rect width="64" height="64" fill="#0B0B10"/>${barRects(4, 56, 10, 30, "")}</g>` +
  `<rect x="4" y="10" width="56" height="44" rx="8" fill="none" stroke="#4A4A60" stroke-width="3"/></svg>`);

const html = readFileSync(new URL("template.html", root), "utf8")
  .replaceAll("{{SITE_URL}}", esc(site.url))
  .replaceAll("{{GITHUB}}", esc(site.github))
  .replace("{{FAVICON}}", favicon)
  .replace("{{MARK_BARS}}", barRects(58, 124, 28, 70, "        "))
  .replace("{{BARS}}", bars)
  .replace("{{SECTIONS}}", sections);

const leftover = html.match(/\{\{[A-Z_]+\}\}/);
if (leftover) throw new Error(`template placeholder not filled: ${leftover[0]}`);

mkdirSync(new URL("docs/", root), { recursive: true });
writeFileSync(new URL("docs/index.html", root), html);
console.log(`docs/index.html: ${projects.length} projects`);
