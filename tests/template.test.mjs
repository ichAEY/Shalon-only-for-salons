import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import site from "../site-data.mjs";

const html = fs.readFileSync("out/index.html", "utf8");
const css = fs.readFileSync("app/template.css", "utf8");
const component = fs.readFileSync("app/salon-template.tsx", "utf8");

test("static export builds from the empty template", () => {
  assert.match(html, /site-root/);
  assert.match(html, /salon-app/);
});

test("base client data is empty", () => {
  assert.equal(site.brand.name, "");
  assert.equal(site.location.city, "");
  assert.equal(site.contacts.phoneDisplay, "");
  assert.equal(site.services.groups.length, 0);
  assert.equal(site.team.members.length, 0);
  assert.equal(site.reviews.length, 0);
  assert.equal(site.media.portfolio.length, 0);
});

test("the engine has one component and one canonical stylesheet", () => {
  assert.ok(fs.existsSync("app/salon-template.tsx"));
  assert.ok(fs.existsSync("app/template.css"));
  assert.equal(fs.readdirSync("app").filter((name) => name.endsWith(".css")).length, 1);
});

test("all required salon sections remain structural", () => {
  for (const id of ["top", "portfolio", "services", "about", "team", "reviews", "contacts"]) {
    assert.match(component, new RegExp(`id=\\"${id}\\"`));
  }
});

test("rotated touch phones cannot enter the desktop layout", () => {
  assert.match(css, /@media \(min-width: 1024px\) and \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /@media \(orientation: landscape\) and \(pointer: coarse\)/);
});

test("the clean engine has no mutation observers or injected style layers", () => {
  assert.doesNotMatch(component, /MutationObserver|createElement\(["']style|innerHTML\s*=/);
  assert.doesNotMatch(component, /requestAnimationFrame\([^)]*requestAnimationFrame/);
});

test("the engine uses a neutral salon namespace", () => {
  assert.match(component, /className="salon-app"/);
  assert.doesNotMatch(component, /className="(?:mobile|desktop)"/);
  assert.ok(Object.values(site.brand).every((value) => value === ""));
});

test("motion and scroll behavior have accessibility fallbacks", () => {
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /event\.key !== "Escape"/);
});
