import assert from "node:assert/strict";
import test from "node:test";
import {
  bookingMode,
  contactOptions,
  galleryGroups,
  minutesFromClock,
  totalServices,
  visibleServiceGroups,
} from "../template-rules.mjs";

test("service groups remain data-driven without a category cap", () => {
  const site = {
    services: {
      groups: Array.from({ length: 12 }, (_, index) => ({
        id: `group-${index}`,
        label: `Group ${index}`,
        services: [{ name: `Service ${index}` }],
      })),
    },
  };
  assert.equal(visibleServiceGroups(site).length, 12);
  assert.equal(totalServices(site), 12);
});

test("booking falls back to verified contact channels", () => {
  const site = {
    links: { bookingUrl: "" },
    contacts: {
      phoneDisplay: "+7 900 000-00-00",
      phoneHref: "tel:+79000000000",
      channels: [
        { type: "telegram", label: "Telegram", url: "https://t.me/example" },
        { type: "instagram", label: "Instagram", url: "https://instagram.com/example" },
      ],
    },
  };
  assert.equal(bookingMode(site), "contact");
  assert.deepEqual(contactOptions(site).map((item) => item.kind), ["phone", "telegram"]);
});

test("direct booking wins when the link is configured", () => {
  assert.equal(bookingMode({ links: { bookingUrl: "https://example.com/book" } }), "direct");
});

test("gallery ignores empty image items", () => {
  const site = { media: { galleryGroups: [{ id: "works", label: "Works", images: [{ src: "" }, { src: "/one.webp" }] }] } };
  assert.equal(galleryGroups(site)[0].images.length, 1);
});

test("opening hours accept valid 24-hour clocks", () => {
  assert.equal(minutesFromClock("09:30"), 570);
  assert.equal(minutesFromClock("24:00"), null);
  assert.equal(minutesFromClock("bad"), null);
});
