/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import siteData from "../site-data.mjs";
import {
  bookingMode,
  contactOptions,
  galleryGroups as normalizedGalleryGroups,
  hasUsableLink,
  minutesFromClock,
  normalizedLocales,
  salonInitial,
  totalServices,
  translationFor,
  visibleServiceGroups,
} from "../template-rules.mjs";

type ImageItem = { src: string; alt?: string };
type Service = {
  name: string;
  description?: string;
  duration?: string;
  price?: string;
  url?: string;
};
type ServiceGroup = { id: string; label: string; services: Service[] };
type GalleryGroup = { id: string; label: string; images: ImageItem[] };
type Member = {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  photo?: string;
  categories?: string[];
  gallery?: ImageItem[];
};
type Review = { author: string; text: string; source?: string };
type ContactOption = { kind: string; label: string; value?: string; url: string };
type SalonSite = {
  basePath: string;
  template: { preview?: boolean; localLocale?: string; reviewSource?: string };
  brand: { name: string; subtitle: string; logo?: string; introLogo?: string };
  hero: { kicker?: string; description?: string };
  about: { lead?: string; text?: string; facts?: string[] };
  location: {
    country?: string;
    countryCode?: string;
    city?: string;
    address?: string;
    shortAddress?: string;
    schedule?: string;
    scheduleNote?: string;
    timeZone: string;
    openTime: string;
    closeTime: string;
  };
  contacts: { phoneDisplay?: string; phoneHref?: string; channels?: unknown[] };
  links: {
    bookingUrl?: string;
    reviewsUrl?: string;
    mapUrl?: string;
    routeUrl?: string;
    mapEmbedUrl?: string;
  };
  reputation: { rating?: string; reviewCount?: string };
  media: {
    favicon?: string;
    heroImage: string;
    heroVideo?: string;
    heroPoster?: string;
    aboutImage: string;
    portfolio?: ImageItem[];
    galleryGroups?: GalleryGroup[];
  };
  services: { groups?: ServiceGroup[] };
  team: { title?: string; subtitle?: string; members?: Member[] };
  reviews?: Review[];
  i18n: { locales?: { code: string; label: string }[]; translations?: Record<string, Record<string, string>> };
};

const site = siteData as unknown as SalonSite;
const placeholder = `${site.basePath || ""}/placeholder.svg`;

function Icon({ name }: { name: string }) {
  if (name === "calendar") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2.2"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01"/></svg>;
  }
  if (name === "clock") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 1.8"/></svg>;
  }
  if (name === "pin") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>;
  }
  if (name === "phone") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h3l1.3 4-2 1.5c1 2 2.6 3.6 4.6 4.6l1.5-2L19 13.5v3c0 1.1-.9 2-2 2C10.4 18.5 5.5 13.6 5.5 7A2 2 0 0 1 7 4Z"/></svg>;
  }
  if (name === "message") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H9l-4 3v-13Z"/></svg>;
  }
  if (name === "sparkles") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 .9 3.1L16 7l-3.1.9L12 11l-.9-3.1L8 7l3.1-.9L12 3ZM6 13l.7 2.3L9 16l-2.3.7L6 19l-.7-2.3L3 16l2.3-.7L6 13ZM17.5 12l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8.8-2.7Z"/></svg>;
  }
  if (name === "arrow") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/></svg>;
}

function currentMinutes(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
    return value("hour") * 60 + value("minute");
  } catch {
    return null;
  }
}

function salonOpenState() {
  const open = minutesFromClock(site.location.openTime);
  const close = minutesFromClock(site.location.closeTime);
  const now = currentMinutes(site.location.timeZone);
  if (open === null || close === null || now === null || open === close) return null;
  return open < close ? now >= open && now < close : now >= open || now < close;
}

export default function SalonTemplate() {
  const locales = useMemo(() => normalizedLocales(site), []);
  const defaultLocale = String(site.template.localLocale || locales[0]?.code || "ru").toLowerCase();
  const [locale, setLocale] = useState(defaultLocale);
  const [introVisible, setIntroVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [activeServiceGroup, setActiveServiceGroup] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryGroupId, setGalleryGroupId] = useState("");
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [openState, setOpenState] = useState<boolean | null>(() => salonOpenState());
  const [stickyVisible, setStickyVisible] = useState(false);
  const reviewTrackRef = useRef<HTMLDivElement>(null);

  const t = useCallback((value: unknown) => translationFor(site, locale, String(value || "")), [locale]);
  const brandName = t(site.brand.name || "Название салона");
  const brandSubtitle = t(site.brand.subtitle || "Подзаголовок");
  const city = t(site.location.city || "Город");
  const address = t(site.location.address || "Адрес салона");
  const shortAddress = t(site.location.shortAddress || site.location.address || "Адрес салона");
  const rating = String(site.reputation.rating || "5,0");
  const serviceCount = totalServices(site);
  const directBooking = bookingMode(site) === "direct";
  const contacts = contactOptions(site) as ContactOption[];
  const previewMode = site.template.preview === true;

  const actualServiceGroups = visibleServiceGroups(site) as ServiceGroup[];
  const serviceGroups: ServiceGroup[] = actualServiceGroups.length
    ? actualServiceGroups
    : [{ id: "template", label: "Категория", services: [{ name: "Услуга", duration: "", price: "Цена" }] }];

  const selectedServiceGroups = activeServiceGroup
    ? serviceGroups.filter((group) => group.id === activeServiceGroup)
    : serviceGroups;
  const flatVisibleServices = selectedServiceGroups.flatMap((group) => group.services.map((service) => ({ group, service })));
  const visibleServices = servicesExpanded ? flatVisibleServices : flatVisibleServices.slice(0, 7);

  const portfolio: ImageItem[] = Array.isArray(site.media.portfolio) && site.media.portfolio.length
    ? site.media.portfolio.filter((image) => hasUsableLink(image?.src))
    : previewMode ? Array.from({ length: 7 }, (_, index) => ({ src: placeholder, alt: `${t("Фотография")} ${index + 1}` })) : [];

  const actualGalleryGroups = normalizedGalleryGroups(site) as GalleryGroup[];
  const galleryGroups: GalleryGroup[] = [
    { id: "portfolio", label: "Все", images: portfolio },
    ...actualGalleryGroups.filter((group) => group.id !== "portfolio"),
  ].filter((group) => group.images.length > 0);
  const activeGalleryGroup = galleryGroups.find((group) => group.id === galleryGroupId) || galleryGroups[0];
  const activeGalleryImage = galleryIndex === null || !activeGalleryGroup ? null : activeGalleryGroup.images[galleryIndex];

  const members: Member[] = Array.isArray(site.team.members) && site.team.members.length
    ? site.team.members
    : previewMode ? [0, 1, 2, 3].map((index) => ({ id: `member-${index + 1}`, name: "Специалист", role: "Направление", photo: placeholder })) : [];
  const reviews: Review[] = Array.isArray(site.reviews) && site.reviews.length
    ? site.reviews.slice(0, 9)
    : previewMode ? [0, 1, 2].map((index) => ({ author: `${t("Отзыв")} ${index + 1}`, text: t("Описание салона будет добавлено при заполнении шаблона."), source: t("Источник") })) : [];
  const aboutFacts = Array.isArray(site.about.facts) && site.about.facts.length
    ? site.about.facts
    : previewMode ? ["Информация о салоне", "Информация о салоне", "Информация о салоне"] : [];

  const isModalOpen = bookingOpen || galleryOpen || galleryIndex !== null || activeMember !== null || menuOpen;

  useEffect(() => {
    const saved = window.localStorage.getItem("tanem-salon-language");
    const available = locales.map((item: { code: string }) => item.code);
    let nextLocale = "";
    if (saved && available.includes(saved)) {
      nextLocale = saved;
    } else {
      const browserLanguages = navigator.languages || [navigator.language];
      nextLocale = browserLanguages
        .map((item) => String(item).toLowerCase().split("-")[0])
        .find((item) => available.includes(item)) || "";
    }
    const timer = window.setTimeout(() => {
      if (nextLocale) setLocale(nextLocale);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [locales]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 1750);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setOpenState(salonOpenState()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    if (isModalOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isModalOpen]);

  useEffect(() => {
    const closeTopLayer = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (galleryIndex !== null) setGalleryIndex(null);
      else if (activeMember) setActiveMember(null);
      else if (galleryOpen) setGalleryOpen(false);
      else if (bookingOpen) setBookingOpen(false);
      else setMenuOpen(false);
    };
    window.addEventListener("keydown", closeTopLayer);
    return () => window.removeEventListener("keydown", closeTopLayer);
  }, [activeMember, bookingOpen, galleryIndex, galleryOpen]);

  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    document.querySelectorAll(".salon-reveal").forEach((element) => revealObserver.observe(element));
    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    let scheduled = false;
    const sync = () => {
      scheduled = false;
      const hero = document.getElementById("top");
      const contactsSection = document.getElementById("contacts");
      if (!hero || !contactsSection) return;
      const afterHero = hero.getBoundingClientRect().bottom < 80;
      const beforeContacts = contactsSection.getBoundingClientRect().top > window.innerHeight * 0.82;
      setStickyVisible(afterHero && beforeContacts);
    };
    const requestSync = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync, { passive: true });
    return () => {
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, []);

  const selectLocale = (code: string) => {
    setLocale(code);
    window.localStorage.setItem("tanem-salon-language", code);
  };

  const openBooking = useCallback((url?: string) => {
    const directUrl = url && hasUsableLink(url) ? url : site.links.bookingUrl;
    if (hasUsableLink(directUrl)) {
      window.open(directUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setBookingOpen(true);
  }, []);

  const openGallery = (groupId?: string, index: number | null = null) => {
    if (!galleryGroups.length) return;
    setGalleryGroupId(groupId || galleryGroups[0].id);
    setGalleryOpen(true);
    setGalleryIndex(index);
  };

  const moveGallery = (direction: number) => {
    if (galleryIndex === null || !activeGalleryGroup?.images.length) return;
    setGalleryIndex((galleryIndex + direction + activeGalleryGroup.images.length) % activeGalleryGroup.images.length);
  };

  const scrollReviews = (direction: number) => {
    const node = reviewTrackRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.min(node.clientWidth * 0.82, 440), behavior: "smooth" });
  };

  return (
    <main className="salon-app" data-locale={locale}>
      {introVisible ? (
        <div className="salon-intro" aria-label={brandName}>
          {hasUsableLink(site.brand.introLogo) ? <img src={site.brand.introLogo} alt={brandName} /> : (
            <div className="salon-intro-wordmark">
              <strong>{brandName}</strong>
              <span>{brandSubtitle}</span>
            </div>
          )}
        </div>
      ) : null}

      <header className="salon-header">
        <a className="salon-brand" href="#top" aria-label={brandName}>
          {hasUsableLink(site.brand.logo) ? <img src={site.brand.logo} alt={brandName} /> : (
            <><strong>{brandName}</strong><span>{brandSubtitle}</span></>
          )}
        </a>
        <nav className="salon-desktop-nav" aria-label="Основная навигация">
          <a href="#services">{t("Услуги")}</a>
          <a href="#portfolio">{t("Наши работы")}</a>
          <a href="#about">{t("О нас")}</a>
          <a href="#reviews">{t("Отзывы")}</a>
          <a href="#contacts">{t("Контакты")}</a>
        </nav>
        <div className="salon-header-actions">
          {locales.length > 1 ? (
            <div className="salon-language" role="group" aria-label="Language">
              {locales.map((item: { code: string; label: string }, index: number) => (
                <span key={item.code}>
                  {index > 0 ? <i aria-hidden="true">/</i> : null}
                  <button type="button" className={locale === item.code ? "active" : ""} onClick={() => selectLocale(item.code)}>{item.label}</button>
                </span>
              ))}
            </div>
          ) : null}
          {hasUsableLink(site.contacts.phoneHref) ? <a className="salon-header-phone" href={site.contacts.phoneHref}><Icon name="phone"/><span>{site.contacts.phoneDisplay}</span></a> : null}
          <button className="salon-header-book salon-shine" type="button" onClick={() => openBooking()}>{t("Записаться")}</button>
          <button className="salon-menu-button" type="button" aria-label="Меню" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><i/><i/><i/></button>
        </div>
      </header>

      <section className="salon-hero" id="top">
        <div className="salon-hero-copy">
          <div className="salon-hero-inner">
            {site.hero.kicker ? <p className="salon-kicker">{t(site.hero.kicker)}</p> : null}
            <h1>{brandName}</h1>
            <p className="salon-hero-subtitle">{brandSubtitle}</p>
            {site.hero.description ? <p className="salon-hero-description">{t(site.hero.description)}</p> : null}
            <div className="salon-hero-info">
              <div className="salon-info-item">
                <span className={`salon-info-icon ${openState === true ? "is-open" : openState === false ? "is-closed" : ""}`}><Icon name="clock"/></span>
                <span><strong>{openState === null ? t("Режим работы") : openState ? t("Открыто") : t("Закрыто")}</strong><small>{site.location.schedule ? t(site.location.schedule) : `${site.location.openTime}–${site.location.closeTime}`}</small></span>
              </div>
              <i className="salon-info-divider" aria-hidden="true"/>
              <div className="salon-info-item">
                <span className="salon-info-icon"><Icon name="pin"/></span>
                <span><strong>{city}</strong><small>{shortAddress}</small></span>
              </div>
            </div>
            <div className="salon-hero-actions">
              <button className="salon-primary salon-shine" type="button" onClick={() => openBooking()}><Icon name="calendar"/><span>{directBooking ? t("Записаться онлайн") : t("Записаться")}</span></button>
              <a className="salon-secondary" href="#portfolio"><Icon name="sparkles"/><span>{t("Смотреть работы")}</span></a>
            </div>
          </div>
        </div>
        <button className="salon-hero-media" type="button" aria-label={t("Открыть галерею")} onClick={() => openGallery(galleryGroups[0]?.id)}>
          {hasUsableLink(site.media.heroVideo) ? (
            <video autoPlay muted loop playsInline preload="metadata" poster={site.media.heroPoster || site.media.heroImage}><source src={site.media.heroVideo}/></video>
          ) : <img src={site.media.heroImage || placeholder} alt={brandName} fetchPriority="high"/>}
          <span className="salon-media-hint"><Icon name="sparkles"/>{t("Открыть галерею")}</span>
        </button>
      </section>

      <nav className="salon-mobile-section-nav" aria-label="Навигация по разделам">
        {portfolio.length ? <a href="#portfolio">{t("Портфолио")}</a> : null}<a href="#services">{t("Услуги")}</a><a href="#about">{t("О нас")}</a>{members.length ? <a href="#team">{t("Наша команда")}</a> : null}{reviews.length ? <a href="#reviews">{t("Отзывы")}</a> : null}<a href="#contacts">{t("Контакты")}</a>
      </nav>

      {portfolio.length ? <section className="salon-portfolio salon-reveal" id="portfolio">
        <div className="salon-section-shell">
          <div className="salon-section-heading">
            <p className="salon-kicker">{t("Портфолио")}</p>
            <h2>{t("Наши работы")}</h2>
          </div>
          <div className="salon-portfolio-grid">
            {portfolio.slice(0, 7).map((image, index) => (
              <button key={`${image.src}-${index}`} type="button" className="salon-work" onClick={() => openGallery("portfolio", index)}>
                <img src={image.src || placeholder} alt={t(image.alt || `${t("Фотография")} ${index + 1}`)} loading={index < 3 ? "eager" : "lazy"}/>
              </button>
            ))}
          </div>
          <button className="salon-outline-button" type="button" onClick={() => openGallery("portfolio")}>{t("Открыть галерею")}<Icon name="arrow"/></button>
        </div>
      </section> : null}

      <section className="salon-services salon-reveal" id="services">
        <div className="salon-services-shell">
          <aside className="salon-service-aside">
            <p className="salon-kicker">{t("Услуги")}</p>
            <h2>{t("Выберите услугу")}</h2>
            <p>{t("Как вам удобнее записаться?")}</p>
            <dl>
              <div><dt><Icon name="clock"/>{t("Режим работы")}</dt><dd>{site.location.schedule ? t(site.location.schedule) : `${site.location.openTime}–${site.location.closeTime}`}</dd></div>
              <div><dt><Icon name="pin"/>{city}</dt><dd>{shortAddress}</dd></div>
            </dl>
            <button className="salon-primary salon-shine" type="button" onClick={() => openBooking()}>{t("Записаться")}</button>
          </aside>
          <div className="salon-service-main">
            <p className="salon-kicker">{t("Услуги")}</p>
            <h2>{t("Услуги и цены")}</h2>
            <div className="salon-service-tabs" role="tablist" aria-label={t("Услуги")}>
              {serviceGroups.length > 1 ? <button type="button" className={!activeServiceGroup ? "active" : ""} onClick={() => { setActiveServiceGroup(""); setServicesExpanded(false); }}>{t("Все")}</button> : null}
              {serviceGroups.map((group) => <button type="button" key={group.id} className={activeServiceGroup === group.id || serviceGroups.length === 1 ? "active" : ""} onClick={() => { setActiveServiceGroup(group.id); setServicesExpanded(false); }}>{t(group.label)}</button>)}
            </div>
            <div className="salon-service-list">
              {visibleServices.map(({ group, service }, index) => (
                <article className="salon-service-card" key={`${group.id}-${service.name}-${index}`}>
                  <div className="salon-service-copy">
                    <span className="salon-service-category">{t(group.label)}</span>
                    <h3>{t(service.name)}</h3>
                    {service.description ? <p>{t(service.description)}</p> : null}
                  </div>
                  <div className="salon-service-meta">
                    {service.duration ? <small>{t(service.duration)}</small> : null}
                    <strong>{t(service.price || "Цена")}</strong>
                    <button type="button" onClick={() => openBooking(service.url)}>{t("Записаться")}<span>→</span></button>
                  </div>
                </article>
              ))}
            </div>
            {flatVisibleServices.length > 7 ? <button className={`salon-more-services ${servicesExpanded ? "open" : ""}`} type="button" onClick={() => setServicesExpanded((value) => !value)}><span>{servicesExpanded ? t("Свернуть услуги") : t("Открыть все услуги")}</span><span>⌄</span></button> : null}
          </div>
        </div>
      </section>

      <section className="salon-about salon-reveal" id="about">
        <div className="salon-section-shell">
          <p className="salon-kicker">{t("О салоне")}</p>
          <div className="salon-about-card">
            <div className="salon-about-visual">
              <img src={site.media.aboutImage || placeholder} alt={brandName} loading="lazy"/>
              <div className="salon-rating"><span>★</span><strong>{rating}</strong><small>{t("Отзывы")}</small></div>
            </div>
            <div className="salon-about-copy">
              <h2>{t(site.about.lead || brandName)}</h2>
              <p>{t(site.about.text || "Описание салона будет добавлено при заполнении шаблона.")}</p>
              <div className="salon-about-facts">
                {aboutFacts.slice(0, 3).map((fact, index) => <div key={`${fact}-${index}`}><strong>{t(fact)}</strong><span>0{index + 1}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {members.length ? <section className="salon-team salon-reveal" id="team">
        <div className="salon-section-shell">
          <p className="salon-kicker">{t(site.team.title || "Наша команда")}</p>
          <h2>{t(site.team.subtitle || "Мастера своего дела")}</h2>
          <div className="salon-team-grid">
            {members.map((member) => (
              <button type="button" className="salon-member" key={member.id} onClick={() => setActiveMember(member)}>
                <span className="salon-member-photo"><img src={member.photo || placeholder} alt={t(member.name)} loading="lazy"/></span>
                <strong>{t(member.name)}</strong>
                <span>{t(member.role || "Направление")}</span>
              </button>
            ))}
          </div>
          <p className="salon-swipe-hint">{t("Листайте")} <span>→</span></p>
        </div>
      </section> : null}

      {reviews.length ? <section className="salon-reviews salon-reveal" id="reviews">
        <div className="salon-section-shell">
          <div className="salon-reviews-heading">
            <p className="salon-kicker">{t("Отзывы")}</p>
            <h2>{t("Что говорят гости")}</h2>
            <div className="salon-review-score"><strong>{rating}</strong><span aria-label="5 из 5">★★★★★</span><small>{site.reputation.reviewCount ? `${site.reputation.reviewCount} · ${site.template.reviewSource || ""}` : t("Отзывы")}</small></div>
          </div>
          <div className="salon-review-track" ref={reviewTrackRef}>
            {reviews.map((review, index) => (
              <article className="salon-review-card" key={`${review.author}-${index}`}>
                <header><span>{Array.from(review.author || "T")[0]?.toUpperCase()}</span><div><strong>{review.author}</strong><small>{review.source || site.template.reviewSource || t("Источник")}</small></div></header>
                <blockquote>{review.text}</blockquote>
              </article>
            ))}
          </div>
          <div className="salon-review-actions">
            <div><button type="button" aria-label="Предыдущие отзывы" onClick={() => scrollReviews(-1)}>←</button><button type="button" aria-label="Следующие отзывы" onClick={() => scrollReviews(1)}>→</button></div>
            {hasUsableLink(site.links.reviewsUrl) ? <a href={site.links.reviewsUrl} target="_blank" rel="noopener noreferrer">{t("Смотреть все отзывы")}<Icon name="arrow"/></a> : null}
          </div>
        </div>
      </section> : null}

      <section className="salon-contact salon-reveal" id="contacts">
        <div className="salon-section-shell salon-contact-shell">
          <div className="salon-contact-copy">
            <div className="salon-contact-heading"><p className="salon-kicker">{t("Контакты")}</p><span className={openState ? "open" : ""}><Icon name="clock"/>{openState === null ? t("Режим работы") : openState ? t("Открыто") : t("Закрыто")}</span></div>
            <h2>{t("Ждём вас")}</h2>
            <div className="salon-contact-list">
              <a href={site.links.mapUrl || site.links.routeUrl || "#"} target={hasUsableLink(site.links.mapUrl || site.links.routeUrl) ? "_blank" : undefined} rel="noopener noreferrer"><span><Icon name="pin"/></span><div><strong>{address}</strong><small>{city}</small></div></a>
              {contacts.map((contact, index) => <a href={contact.url} target={contact.kind === "phone" ? undefined : "_blank"} rel="noopener noreferrer" key={`${contact.kind}-${index}`}><span><Icon name={contact.kind === "phone" ? "phone" : "message"}/></span><div><strong>{contact.value || t(contact.label)}</strong><small>{t(contact.label)}</small></div></a>)}
              <div className="salon-contact-static"><span><Icon name="clock"/></span><div><strong>{site.location.schedule ? t(site.location.schedule) : `${site.location.openTime}–${site.location.closeTime}`}</strong><small>{t(site.location.scheduleNote || "Режим работы")}</small></div></div>
            </div>
          </div>
          <div className="salon-contact-map">
            {hasUsableLink(site.links.mapEmbedUrl) ? <iframe title={`${t("Открыть карту")} — ${brandName}`} loading="lazy" src={site.links.mapEmbedUrl}/> : <img src={placeholder} alt={t("Открыть карту")}/>}
            {hasUsableLink(site.links.routeUrl || site.links.mapUrl) ? <a href={site.links.routeUrl || site.links.mapUrl} target="_blank" rel="noopener noreferrer">{t("Построить маршрут")}<Icon name="arrow"/></a> : null}
          </div>
        </div>
        <a className="salon-tanem" href="https://tanem.ru/" target="_blank" rel="noopener noreferrer"><span>{salonInitial({ brand: { name: "TANEM" } })}</span><p>{t("Создано в")} <strong>TANEM.ru</strong></p></a>
      </section>

      <div className={`salon-mobile-sticky ${stickyVisible && !isModalOpen ? "visible" : ""}`} aria-hidden={!stickyVisible}><strong>{serviceCount || "—"} {t("Услуги")}</strong><button className="salon-shine" type="button" onClick={() => openBooking()}>{t("Записаться")}</button></div>

      {menuOpen ? (
        <div className="salon-menu-layer" role="dialog" aria-modal="true" aria-label="Меню" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <div className="salon-menu-panel"><button type="button" className="salon-layer-close" aria-label={t("Закрыть")} onClick={() => setMenuOpen(false)}>×</button><strong>{brandName}</strong><nav>{[["services", "Услуги"], ["portfolio", "Наши работы"], ["about", "О нас"], ["team", "Наша команда"], ["reviews", "Отзывы"], ["contacts", "Контакты"]].map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{t(label)}<span>→</span></a>)}</nav></div>
        </div>
      ) : null}

      {bookingOpen ? (
        <div className="salon-layer salon-booking-layer" role="dialog" aria-modal="true" aria-label={t("Как вам удобнее записаться?")} onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingOpen(false); }}>
          <div className="salon-booking-panel"><button type="button" className="salon-layer-close" aria-label={t("Закрыть")} onClick={() => setBookingOpen(false)}>×</button><p className="salon-kicker">{t("Записаться")}</p><h2>{t("Как вам удобнее записаться?")}</h2><p>{t("Выберите удобный способ связи")}</p><div>{contacts.length ? contacts.map((contact, index) => <a href={contact.url} key={`${contact.kind}-${index}`} target={contact.kind === "phone" ? undefined : "_blank"} rel="noopener noreferrer"><span><Icon name={contact.kind === "phone" ? "phone" : "message"}/><strong>{t(contact.label)}</strong></span><em>{contact.value || "→"}</em></a>) : <span className="salon-empty-state">{t("Контакты")}</span>}</div></div>
        </div>
      ) : null}

      {galleryOpen ? (
        <div className="salon-gallery-layer" role="dialog" aria-modal="true" aria-label={t("Галерея")}>
          <header><button type="button" onClick={() => { setGalleryOpen(false); setGalleryIndex(null); }}>←</button><div><strong>{t("Галерея")}</strong><span>{brandName}</span></div><i/></header>
          <div className="salon-gallery-tabs">{galleryGroups.map((group) => <button type="button" className={activeGalleryGroup.id === group.id ? "active" : ""} key={group.id} onClick={() => { setGalleryGroupId(group.id); setGalleryIndex(null); }}>{t(group.label)}</button>)}</div>
          <div className="salon-gallery-grid">{activeGalleryGroup.images.map((image, index) => <button type="button" key={`${image.src}-${index}`} onClick={() => setGalleryIndex(index)}><img src={image.src} alt={t(image.alt || `${t("Фотография")} ${index + 1}`)} loading="lazy"/></button>)}</div>
        </div>
      ) : null}

      {activeGalleryImage ? (
        <div className="salon-lightbox" role="dialog" aria-modal="true" aria-label={activeGalleryImage.alt || t("Фотография")} onMouseDown={(event) => { if (event.target === event.currentTarget) setGalleryIndex(null); }}>
          <button className="salon-layer-close" type="button" aria-label={t("Закрыть")} onClick={() => setGalleryIndex(null)}>×</button><button className="salon-lightbox-arrow previous" type="button" aria-label="Предыдущая фотография" onClick={() => moveGallery(-1)}>←</button><figure><img src={activeGalleryImage.src} alt={t(activeGalleryImage.alt || "Фотография")}/><figcaption>{String((galleryIndex || 0) + 1).padStart(2, "0")} / {String(activeGalleryGroup.images.length).padStart(2, "0")}</figcaption></figure><button className="salon-lightbox-arrow next" type="button" aria-label="Следующая фотография" onClick={() => moveGallery(1)}>→</button>
        </div>
      ) : null}

      {activeMember ? (
        <div className="salon-layer salon-member-layer" role="dialog" aria-modal="true" aria-label={t(activeMember.name)} onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveMember(null); }}>
          <article className="salon-member-panel"><button type="button" className="salon-layer-close" aria-label={t("Закрыть")} onClick={() => setActiveMember(null)}>×</button><img src={activeMember.photo || placeholder} alt={t(activeMember.name)}/><div><p className="salon-kicker">{t("Профиль")}</p><h2>{t(activeMember.name)}</h2><strong>{t(activeMember.role || "Направление")}</strong>{activeMember.bio ? <p>{t(activeMember.bio)}</p> : null}{Array.isArray(activeMember.categories) && activeMember.categories.length ? <ul>{activeMember.categories.map((category) => <li key={category}>{t(category)}</li>)}</ul> : null}<button className="salon-primary salon-shine" type="button" onClick={() => { setActiveMember(null); openBooking(); }}>{t("Записаться")}</button></div></article>
        </div>
      ) : null}
    </main>
  );
}
