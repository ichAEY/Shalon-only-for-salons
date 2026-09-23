import site from "../site-data.mjs";
import {
  bookingMode,
  clientTranslationKeys,
  contactOptions,
  galleryGroups,
  hasUsableLink,
  minutesFromClock,
  normalizedLocales,
  UI_TRANSLATION_KEYS,
  visibleServiceGroups,
} from "../template-rules.mjs";

const fail = (message) => {
  throw new Error(`site-data.mjs: ${message}`);
};

const arrays = [
  ["about.facts", site.about.facts],
  ["contacts.channels", site.contacts.channels],
  ["media.portfolio", site.media.portfolio],
  ["media.galleryGroups", site.media.galleryGroups],
  ["services.groups", site.services.groups],
  ["team.members", site.team.members],
  ["reviews", site.reviews],
  ["seo.keywords", site.seo.keywords],
];

for (const [label, value] of arrays) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
}

const serviceGroups = visibleServiceGroups(site);
const serviceIds = serviceGroups.map((group) => group.id);
if (new Set(serviceIds).size !== serviceIds.length) fail("service group ids must be unique");
for (const group of serviceGroups) {
  if (!group.label) fail(`service group ${group.id} must have a label`);
  for (const [index, service] of group.services.entries()) {
    if (!String(service?.name || "").trim()) fail(`service ${index + 1} in ${group.id} must have a name`);
  }
}

const rawGalleryGroups = Array.isArray(site.media.galleryGroups) ? site.media.galleryGroups : [];
const galleryIds = rawGalleryGroups.map((group, index) => String(group?.id || `gallery-${index + 1}`).trim());
if (new Set(galleryIds).size !== galleryIds.length) fail("gallery group ids must be unique");
galleryGroups(site);

const members = site.team.members;
const memberIds = members.map((member, index) => String(member?.id || `member-${index + 1}`).trim());
if (new Set(memberIds).size !== memberIds.length) fail("team member ids must be unique");
for (const [index, member] of members.entries()) {
  if (!String(member?.id || "").trim()) fail(`team member ${index + 1} must have an id`);
  if (!String(member?.name || "").trim()) fail(`team member ${index + 1} must have a name`);
}

if (site.reviews.length > 9) fail("publish at most 9 verified reviews");
for (const [index, review] of site.reviews.entries()) {
  if (!String(review?.author || "").trim()) fail(`review ${index + 1} must have a verified author`);
  if (!String(review?.text || "").trim()) fail(`review ${index + 1} must preserve the source text`);
  if (!String(review?.source || site.template.reviewSource || "").trim()) fail(`review ${index + 1} must identify its source`);
}

if (!String(site.location.timeZone || "").trim()) fail("location.timeZone must exist");
if (minutesFromClock(site.location.openTime) === null) fail("location.openTime must use HH:MM");
if (minutesFromClock(site.location.closeTime) === null) fail("location.closeTime must use HH:MM");
if (!String(site.seo.siteUrl || "").trim()) fail("seo.siteUrl must exist");

const publishedUrls = [
  ...Object.values(site.links || {}),
  site.contacts.phoneHref,
  ...site.contacts.channels.map((channel) => channel?.url),
  ...serviceGroups.flatMap((group) => group.services.map((service) => service?.url)),
].filter((value) => typeof value === "string");

if (publishedUrls.some((value) => /instagram\.com|instagr\.am/i.test(value))) {
  fail("Instagram links are forbidden in published salon data");
}

const locales = normalizedLocales(site).map((locale) => locale.code);
if (new Set(locales).size !== locales.length) fail("locale codes must be unique");

const published = Boolean(String(site.brand.name || "").trim());
if (published) {
  if (site.template.preview === true) fail("published salon must set template.preview to false");
  if (!String(site.location.city || "").trim()) fail("published salon must have a city");
  if (!String(site.location.address || "").trim()) fail("published salon must have an address");
  if (!serviceGroups.length) fail("published salon must have at least one confirmed service group");
  if (!site.media.portfolio.some((image) => hasUsableLink(image?.src))) fail("published salon must have at least one portfolio image");
  if (/placeholder\.svg(?:$|\?)/.test(String(site.media.heroImage))) fail("published salon must replace the hero placeholder");
  if (/placeholder\.svg(?:$|\?)/.test(String(site.media.aboutImage))) fail("published salon must replace the about placeholder");
  if (bookingMode(site) === "contact" && contactOptions(site).length === 0) {
    fail("published salon without direct booking must have a verified contact option");
  }

  const localLocale = String(site.template.localLocale || "ru").toLowerCase();
  const clientKeys = clientTranslationKeys(site);
  for (const locale of locales.filter((code) => code !== "ru")) {
    const dictionary = site.i18n?.translations?.[locale];
    if (!dictionary || typeof dictionary !== "object") fail(`missing translation dictionary for ${locale}`);
    const required = locale === localLocale && locale !== "en"
      ? [...clientKeys, ...UI_TRANSLATION_KEYS]
      : clientKeys;
    const missing = [...new Set(required)].filter((key) => !String(dictionary[key] || "").trim());
    if (missing.length) fail(`missing ${locale} translations: ${missing.slice(0, 8).join(" | ")}`);
  }
}

for (const value of [site.media.heroImage, site.media.aboutImage, site.media.favicon]) {
  if (!hasUsableLink(value)) fail("hero, about and favicon image paths must exist");
}

console.log("TANEM salon template rules are valid.");
