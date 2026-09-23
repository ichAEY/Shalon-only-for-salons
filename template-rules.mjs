const invalidLinks = new Set(["", "#", "about:blank"]);

export const UI_TRANSLATIONS = {
  en: {
    "Услуги": "Services",
    "Наши работы": "Our work",
    "О нас": "About us",
    "Отзывы": "Reviews",
    "Контакты": "Contacts",
    "Записаться": "Book now",
    "Записаться онлайн": "Book online",
    "Смотреть работы": "View our work",
    "Портфолио": "Portfolio",
    "Открыть галерею": "Open gallery",
    "Все": "All",
    "Услуги и цены": "Services and prices",
    "Выберите услугу": "Choose a service",
    "Открыть все услуги": "Show all services",
    "Свернуть услуги": "Show fewer services",
    "О салоне": "About the salon",
    "Наша команда": "Our team",
    "Мастера своего дела": "Experts in their craft",
    "Профиль": "Profile",
    "Портфолио мастера": "Specialist portfolio",
    "Что говорят гости": "What our guests say",
    "Смотреть все отзывы": "View all reviews",
    "Ждём вас": "We look forward to seeing you",
    "Открыть карту": "Open map",
    "Построить маршрут": "Get directions",
    "Позвонить": "Call",
    "Написать": "Message",
    "Режим работы": "Opening hours",
    "Открыто": "Open",
    "Закрыто": "Closed",
    "до": "until",
    "Как вам удобнее записаться?": "How would you like to book?",
    "Выберите удобный способ связи": "Choose the most convenient way to contact us",
    "Закрыть": "Close",
    "Назад": "Back",
    "Создано в": "Created with",
    "Название салона": "Salon name",
    "Подзаголовок": "Subtitle",
    "Город": "City",
    "Адрес салона": "Salon address",
    "Информация о салоне": "Salon information",
    "Описание салона будет добавлено при заполнении шаблона.": "The salon description will appear after the template is filled in.",
    "Категория": "Category",
    "Услуга": "Service",
    "Цена": "Price",
    "Команда салона": "Salon team",
    "Специалист": "Specialist",
    "Направление": "Speciality",
    "Отзыв": "Review",
    "Источник": "Source",
    "Фотография": "Photo",
    "Галерея": "Gallery",
    "Листайте": "Swipe",
  },
};

export const UI_TRANSLATION_KEYS = [...new Set(Object.keys(UI_TRANSLATIONS.en))];

export function hasUsableLink(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return Boolean(normalized) && !invalidLinks.has(normalized);
}

export function visibleServiceGroups(site) {
  const groups = Array.isArray(site?.services?.groups) ? site.services.groups : [];
  return groups
    .filter((group) => group && typeof group.id === "string" && group.id.trim())
    .map((group) => ({
      ...group,
      id: group.id.trim(),
      label: String(group.label || "").trim(),
      services: Array.isArray(group.services) ? group.services.filter(Boolean) : [],
    }))
    .filter((group) => group.services.length > 0);
}

export function totalServices(site) {
  return visibleServiceGroups(site).reduce((sum, group) => sum + group.services.length, 0);
}

export function galleryGroups(site) {
  const groups = Array.isArray(site?.media?.galleryGroups) ? site.media.galleryGroups : [];
  return groups
    .filter(Boolean)
    .map((group, index) => ({
      id: String(group.id || `gallery-${index + 1}`).trim(),
      label: String(group.label || "").trim(),
      images: Array.isArray(group.images) ? group.images.filter((image) => hasUsableLink(image?.src)) : [],
    }))
    .filter((group) => group.images.length > 0);
}

export function normalizedLocales(site) {
  const locales = Array.isArray(site?.i18n?.locales) ? site.i18n.locales : [];
  const normalized = locales
    .filter((locale) => locale && typeof locale.code === "string")
    .map((locale) => ({ code: locale.code.trim().toLowerCase(), label: String(locale.label || locale.code).trim().toUpperCase() }))
    .filter((locale) => locale.code);
  return normalized.length ? normalized : [{ code: "ru", label: "RU" }];
}

export function contactOptions(site) {
  const options = [];
  if (hasUsableLink(site?.contacts?.phoneHref)) {
    options.push({
      kind: "phone",
      label: "Позвонить",
      value: String(site?.contacts?.phoneDisplay || "").trim(),
      url: site.contacts.phoneHref.trim(),
    });
  }

  const channels = Array.isArray(site?.contacts?.channels) ? site.contacts.channels : [];
  for (const channel of channels) {
    const kind = String(channel?.type || "message").trim().toLowerCase();
    const url = String(channel?.url || "").trim();
    if (!hasUsableLink(url) || kind === "instagram" || /instagr(?:am\.com|\.am)/i.test(url)) continue;
    options.push({
      kind,
      label: String(channel?.label || "Написать").trim(),
      value: String(channel?.value || "").trim(),
      url,
    });
  }
  return options;
}

export function bookingMode(site) {
  return hasUsableLink(site?.links?.bookingUrl) ? "direct" : "contact";
}

export function translationFor(site, locale, source) {
  if (!source || locale === "ru") return source;
  const clientDictionary = site?.i18n?.translations?.[locale] || {};
  return clientDictionary[source] || UI_TRANSLATIONS?.[locale]?.[source] || source;
}

export function clientTranslationKeys(site) {
  const values = [
    site?.brand?.name,
    site?.brand?.subtitle,
    site?.hero?.kicker,
    site?.hero?.description,
    site?.about?.lead,
    site?.about?.text,
    site?.location?.country,
    site?.location?.city,
    site?.location?.address,
    site?.location?.shortAddress,
    site?.location?.schedule,
    site?.location?.scheduleNote,
    site?.team?.title,
    site?.team?.subtitle,
    ...(Array.isArray(site?.about?.facts) ? site.about.facts : []),
  ];

  for (const group of visibleServiceGroups(site)) {
    values.push(group.label);
    for (const service of group.services) {
      values.push(service?.name, service?.description, service?.duration, service?.price);
    }
  }

  for (const member of Array.isArray(site?.team?.members) ? site.team.members : []) {
    values.push(member?.name, member?.role, member?.bio);
  }

  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

export function salonInitial(site) {
  const name = String(site?.brand?.name || "TANEM").trim();
  return Array.from(name)[0]?.toUpperCase() || "T";
}

export function minutesFromClock(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
