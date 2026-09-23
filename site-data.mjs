const publicBase = process.env.NEXT_PUBLIC_BASE_PATH || "";

const site = {
  basePath: publicBase,

  template: {
    preview: true,
    localLocale: "ru",
    reviewSource: "",
  },

  brand: {
    name: "",
    subtitle: "",
    logo: "",
    introLogo: "",
  },

  hero: {
    kicker: "",
    description: "",
  },

  about: {
    lead: "",
    text: "",
    facts: [],
  },

  location: {
    country: "",
    countryCode: "",
    city: "",
    address: "",
    shortAddress: "",
    schedule: "",
    scheduleNote: "",
    timeZone: "UTC",
    openTime: "00:00",
    closeTime: "00:00",
  },

  contacts: {
    phoneDisplay: "",
    phoneHref: "",
    channels: [],
  },

  links: {
    bookingUrl: "",
    reviewsUrl: "",
    mapUrl: "",
    routeUrl: "",
    mapEmbedUrl: "",
  },

  reputation: {
    rating: "",
    reviewCount: "",
  },

  media: {
    favicon: `${publicBase}/placeholder.svg`,
    heroImage: `${publicBase}/placeholder.svg`,
    heroVideo: "",
    heroPoster: "",
    aboutImage: `${publicBase}/placeholder.svg`,
    portfolio: [],
    galleryGroups: [],
  },

  services: {
    groups: [],
  },

  team: {
    title: "",
    subtitle: "",
    members: [],
  },

  reviews: [],

  i18n: {
    locales: [
      { code: "ru", label: "RU" },
      { code: "en", label: "EN" },
    ],
    translations: {
      en: {},
    },
  },

  seo: {
    siteUrl: "https://example.com/",
    title: "TANEM — шаблон салона",
    description: "Чистый шаблон цифрового офиса салона TANEM.",
    keywords: [],
    locale: "ru_RU",
  },

  analytics: {
    yandexMetrikaId: "",
  },
};

export default site;
