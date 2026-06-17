// Global "Where to Watch" directory — the official broadcasters (incl. World Cup
// rights-holders) by country. Free-to-air public broadcasters can be opened in
// Aurora's Live TV (public IPTV catalog); licensed/geo-locked services link out to
// their official app/site. We never restream paywalled or DRM-protected feeds.

export type BroadcasterCategory = "sports" | "news" | "general";
export type BroadcasterAccess = "free" | "provider";

export interface Broadcaster {
  id: string;
  name: string;
  country: string;
  iptvCode: string; // ISO 3166-1 alpha-2 (lowercase; "uk" for the UK, matching iptv-org)
  flag: string;
  category: BroadcasterCategory;
  access: BroadcasterAccess;
  url: string; // official site
  logo: string; // best-effort logo (falls back to a gradient if it 404s)
}

interface Meta {
  code: string;
  flag: string;
}

const C: Record<string, Meta> = {
  Afghanistan: { code: "af", flag: "🇦🇫" },
  Argentina: { code: "ar", flag: "🇦🇷" },
  Aruba: { code: "aw", flag: "🇦🇼" },
  Australia: { code: "au", flag: "🇦🇺" },
  Austria: { code: "at", flag: "🇦🇹" },
  Azerbaijan: { code: "az", flag: "🇦🇿" },
  Belgium: { code: "be", flag: "🇧🇪" },
  Barbados: { code: "bb", flag: "🇧🇧" },
  Bolivia: { code: "bo", flag: "🇧🇴" },
  Brazil: { code: "br", flag: "🇧🇷" },
  Canada: { code: "ca", flag: "🇨🇦" },
  "Chinese Taipei": { code: "tw", flag: "🇹🇼" },
  Chile: { code: "cl", flag: "🇨🇱" },
  Colombia: { code: "co", flag: "🇨🇴" },
  Croatia: { code: "hr", flag: "🇭🇷" },
  "Curaçao": { code: "cw", flag: "🇨🇼" },
  Ecuador: { code: "ec", flag: "🇪🇨" },
  "El Salvador": { code: "sv", flag: "🇸🇻" },
  Fiji: { code: "fj", flag: "🇫🇯" },
  Finland: { code: "fi", flag: "🇫🇮" },
  Guatemala: { code: "gt", flag: "🇬🇹" },
  Guyana: { code: "gy", flag: "🇬🇾" },
  Honduras: { code: "hn", flag: "🇭🇳" },
  Hungary: { code: "hu", flag: "🇭🇺" },
  Iceland: { code: "is", flag: "🇮🇸" },
  Israel: { code: "il", flag: "🇮🇱" },
  "Korea Republic": { code: "kr", flag: "🇰🇷" },
  Macau: { code: "mo", flag: "🇲🇴" },
  Malta: { code: "mt", flag: "🇲🇹" },
  Mexico: { code: "mx", flag: "🇲🇽" },
  "New Zealand": { code: "nz", flag: "🇳🇿" },
  Norway: { code: "no", flag: "🇳🇴" },
  Panama: { code: "pa", flag: "🇵🇦" },
  Paraguay: { code: "py", flag: "🇵🇾" },
  Peru: { code: "pe", flag: "🇵🇪" },
  Poland: { code: "pl", flag: "🇵🇱" },
  Spain: { code: "es", flag: "🇪🇸" },
  Suriname: { code: "sr", flag: "🇸🇷" },
  Sweden: { code: "se", flag: "🇸🇪" },
  Switzerland: { code: "ch", flag: "🇨🇭" },
  "Trinidad and Tobago": { code: "tt", flag: "🇹🇹" },
  "United Kingdom": { code: "uk", flag: "🇬🇧" },
  Uruguay: { code: "uy", flag: "🇺🇾" },
  USA: { code: "us", flag: "🇺🇸" },
  Venezuela: { code: "ve", flag: "🇻🇪" },
};

// Normalized lookup so accented names (e.g. "Curaçao") match regardless of
// composed/decomposed Unicode form.
const C_NFC = new Map(Object.entries(C).map(([k, v]) => [k.normalize("NFC"), v] as const));
function metaFor(country: string): Meta | undefined {
  return C[country] ?? C_NFC.get(country.normalize("NFC"));
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function b(
  name: string,
  country: string,
  category: BroadcasterCategory,
  access: BroadcasterAccess,
  domain: string,
): Broadcaster {
  const meta = metaFor(country);
  return {
    id: slug(`${name}-${country}`),
    name,
    country,
    iptvCode: meta?.code ?? "",
    flag: meta?.flag ?? "🏳️",
    category,
    access,
    url: `https://${domain}`,
    logo: `https://logo.clearbit.com/${domain}`,
  };
}

// DirecTV GO / DSports repeat across many Latin-American territories (as in the list).
const DGO = (country: string) => b("DGO", country, "sports", "provider", "directvgo.com");
const DSPORTS = (country: string) => b("DSPORTS", country, "sports", "provider", "directvsports.com");

export const BROADCASTERS: Broadcaster[] = [
  b("Ariana News", "Afghanistan", "news", "free", "ariananews.af"),
  b("Ariana Television", "Afghanistan", "general", "free", "arianatelevision.com"),
  DGO("Argentina"),
  DSPORTS("Argentina"),
  DGO("Aruba"),
  DSPORTS("Aruba"),
  b("SBS", "Australia", "general", "free", "sbs.com.au"),
  b("SBS On Demand", "Australia", "general", "free", "sbs.com.au"),
  b("ORF", "Austria", "general", "free", "orf.at"),
  b("ServusTV On", "Austria", "general", "free", "servustv.com"),
  b("Ictimai TV", "Azerbaijan", "general", "free", "ictimai.tv"),
  DGO("Barbados"),
  DSPORTS("Barbados"),
  b("RTBF Auvio", "Belgium", "general", "free", "rtbf.be"),
  b("Sporza", "Belgium", "sports", "free", "sporza.be"),
  b("Tipik", "Belgium", "general", "free", "tipik.be"),
  b("VRT MAX", "Belgium", "general", "free", "vrt.be"),
  b("VRT Canvas", "Belgium", "general", "free", "vrt.be"),
  b("Red Uno de Bolivia", "Bolivia", "general", "free", "reduno.com.bo"),
  b("Unitel", "Bolivia", "general", "free", "unitel.bo"),
  b("CazéTV", "Brazil", "sports", "free", "youtube.com"),
  b("RDS", "Canada", "sports", "provider", "rds.ca"),
  b("TSN1", "Canada", "sports", "provider", "tsn.ca"),
  b("DGO", "Chile", "sports", "provider", "directvgo.com"),
  b("DSPORTS", "Chile", "sports", "provider", "directvsports.com"),
  b("ELTA Sports 1", "Chinese Taipei", "sports", "provider", "elta.tv"),
  b("Caracol Televisión", "Colombia", "general", "free", "caracoltv.com"),
  DGO("Colombia"),
  DSPORTS("Colombia"),
  b("RCN Televisión", "Colombia", "general", "free", "canalrcn.com"),
  b("Win Sports", "Colombia", "sports", "provider", "winsports.co"),
  b("HRT", "Croatia", "general", "free", "hrt.hr"),
  b("HRTi", "Croatia", "general", "free", "hrti.hrt.hr"),
  DGO("Curaçao"),
  DSPORTS("Curaçao"),
  DGO("Ecuador"),
  DSPORTS("Ecuador"),
  b("Teleamazonas", "Ecuador", "general", "free", "teleamazonas.com"),
  b("Canal 4 TV", "El Salvador", "general", "free", "tcs.com.sv"),
  b("Tigo Sports El Salvador", "El Salvador", "sports", "provider", "tigosports.com"),
  b("FBC Sports", "Fiji", "sports", "provider", "fbc.com.fj"),
  b("Fiji One", "Fiji", "general", "free", "fijione.tv"),
  b("MTV Urheilu 1", "Finland", "sports", "provider", "mtv.fi"),
  b("Canal 11", "Guatemala", "general", "free", "canalonce.gt"),
  b("Canal 3", "Guatemala", "general", "free", "canaltres.com.gt"),
  b("Tigo Sports Guatemala", "Guatemala", "sports", "provider", "tigosports.gt"),
  DGO("Guyana"),
  DSPORTS("Guyana"),
  b("Televicentro", "Honduras", "general", "free", "televicentro.hn"),
  b("M4 Sport", "Hungary", "sports", "free", "mediaklikk.hu"),
  b("RÚV 2", "Iceland", "general", "free", "ruv.is"),
  b("KAN 11", "Israel", "general", "free", "kan.org.il"),
  b("KAN BOX", "Israel", "general", "free", "kan.org.il"),
  b("MAKAN", "Israel", "general", "free", "kan.org.il"),
  b("JTBC", "Korea Republic", "general", "provider", "jtbc.co.kr"),
  b("TDM Sport", "Macau", "sports", "free", "tdm.com.mo"),
  b("TVMsport+", "Malta", "sports", "provider", "tvm.com.mt"),
  b("Canal 5", "Mexico", "general", "free", "canal5.com"),
  b("Las Estrellas", "Mexico", "general", "free", "lasestrellas.tv"),
  b("TUDN", "Mexico", "sports", "provider", "tudn.com"),
  b("ViX", "Mexico", "general", "provider", "vix.com"),
  b("TVNZ 1", "New Zealand", "general", "free", "tvnz.co.nz"),
  b("TVNZ+", "New Zealand", "general", "free", "tvnz.co.nz"),
  b("TVNZ+ Pay Pass", "New Zealand", "sports", "provider", "tvnz.co.nz"),
  b("NRK Sport", "Norway", "sports", "free", "nrk.no"),
  b("TV 2", "Norway", "general", "provider", "tv2.no"),
  b("RPC", "Panama", "general", "free", "rpctv.com"),
  b("Tigo Sports Panama", "Panama", "sports", "provider", "tigosports.com"),
  b("TVMAX", "Panama", "sports", "free", "tvmax-9.com"),
  b("TVN Panama", "Panama", "general", "free", "tvn-2.com"),
  b("TVN Pass", "Panama", "general", "provider", "tvn-2.com"),
  b("GEN", "Paraguay", "general", "free", "gen.com.py"),
  b("POPU TV", "Paraguay", "general", "free", "popu.tv"),
  b("Trece", "Paraguay", "general", "free", "trece.com.py"),
  b("Unicanal", "Paraguay", "general", "free", "unicanal.com.py"),
  b("América Televisión", "Peru", "general", "free", "americatv.com.pe"),
  DGO("Peru"),
  DSPORTS("Peru"),
  b("TVP Sport", "Poland", "sports", "free", "sport.tvp.pl"),
  b("RTVE Play", "Spain", "general", "free", "rtve.es"),
  DGO("Suriname"),
  DSPORTS("Suriname"),
  b("SVT2", "Sweden", "general", "free", "svt.se"),
  b("RSI", "Switzerland", "general", "free", "rsi.ch"),
  b("RTS", "Switzerland", "general", "free", "rts.ch"),
  b("SRF", "Switzerland", "general", "free", "srf.ch"),
  DGO("Trinidad and Tobago"),
  DSPORTS("Trinidad and Tobago"),
  b("ITVX", "United Kingdom", "general", "free", "itv.com"),
  DGO("Uruguay"),
  DSPORTS("Uruguay"),
  b("FOX", "USA", "sports", "provider", "foxsports.com"),
  b("Peacock", "USA", "general", "provider", "peacocktv.com"),
  b("Telemundo", "USA", "general", "provider", "telemundo.com"),
  b("Universo", "USA", "general", "provider", "nbc.com"),
  DGO("Venezuela"),
  DSPORTS("Venezuela"),
];

export const BROADCASTER_CATEGORIES: { id: BroadcasterCategory; label: string; emoji: string }[] = [
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "news", label: "News", emoji: "📰" },
  { id: "general", label: "General", emoji: "📺" },
];

/** Unique countries present, with flags and counts, sorted by name. */
export function broadcasterCountries(): { country: string; flag: string; iptvCode: string; count: number }[] {
  const map = new Map<string, { country: string; flag: string; iptvCode: string; count: number }>();
  for (const x of BROADCASTERS) {
    const cur = map.get(x.country);
    if (cur) cur.count++;
    else map.set(x.country, { country: x.country, flag: x.flag, iptvCode: x.iptvCode, count: 1 });
  }
  return [...map.values()].sort((a, z) => a.country.localeCompare(z.country));
}

/** Query the directory by country (name or ISO code), free-text, and/or category. */
export function findBroadcasters(opts: {
  country?: string;
  query?: string;
  category?: BroadcasterCategory;
  limit?: number;
}): Broadcaster[] {
  const cq = opts.country?.trim().toLowerCase();
  const q = opts.query?.trim().toLowerCase();
  return BROADCASTERS.filter((x) => {
    if (opts.category && x.category !== opts.category) return false;
    // A 2-letter input is treated as an exact ISO code (avoids "us" matching "aUStralia").
    if (cq && !(cq.length === 2 ? x.iptvCode === cq : x.country.toLowerCase().includes(cq))) return false;
    if (q && !`${x.name} ${x.country}`.toLowerCase().includes(q)) return false;
    return true;
  }).slice(0, opts.limit ?? 12);
}

/** Allowlist of official URLs — used to validate agent "watch" actions. */
export const BROADCASTER_URLS = new Set(BROADCASTERS.map((x) => x.url));

