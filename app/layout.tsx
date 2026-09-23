import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "./template.css";
import site from "../site-data.mjs";

export const metadata: Metadata = {
  metadataBase: new URL(site.seo.siteUrl || "https://example.com/"),
  title: site.seo.title,
  description: site.seo.description,
  keywords: site.seo.keywords,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.seo.title,
    description: site.seo.description,
    type: "website",
    locale: site.seo.locale,
    images: [site.media.heroImage],
  },
  icons: {
    icon: site.media.favicon,
    shortcut: site.media.favicon,
  },
};

const metrikaCode = site.analytics.yandexMetrikaId
  ? `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${site.analytics.yandexMetrikaId}','ym');ym(${site.analytics.yandexMetrikaId},'init',{ssr:true,webvisor:true,clickmap:true,trackLinks:true,accurateTrackBounce:true});`
  : "";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        {children}
        {metrikaCode ? <script dangerouslySetInnerHTML={{ __html: metrikaCode }} /> : null}
      </body>
    </html>
  );
}
