/** Collection: 5 rows × 3 columns. */
const PAGE_SIZE = 15;
const PAGE_WINDOW = 5;
/** Public tabs: category tags for peinture/miniature; artist match for nicolle. */
const SECTIONS = ["peinture", "miniature", "nicolle"];
const SECTION_LABELS = {
  peinture: "Peintures",
  miniature: "Miniatures",
  nicolle: "Victor-Jean NICOLLE",
};
const CONTACT_MAIL = "vittet.claude@yahoo.fr";

const filters = [...document.querySelectorAll(".filter")];
const grid = document.getElementById("art-grid");
const collectionStatus = document.getElementById("collection-status");
const collectionEndLabel = document.getElementById("collection-end-label");
const collectionPanel = document.getElementById("collection-panel");
const pagination = document.getElementById("pagination");
const pagePrev = pagination.querySelector(".page-prev");
const pageNext = pagination.querySelector(".page-next");
const pageNumbers = document.getElementById("page-numbers");
const dialog = document.querySelector(".lightbox");
const dialogPhoto = dialog.querySelector(".lightbox-photo");
const dialogImage = dialog.querySelector(".lightbox-photo img");
const dialogLoupe = dialog.querySelector(".lightbox-loupe");
const dialogZoomGauge = dialog.querySelector(".lightbox-zoom-gauge");
const dialogZoomRange = dialog.querySelector(".lightbox-zoom-range");
const dialogZoomGaugeValue = dialog.querySelector(".lightbox-zoom-gauge-value");
const dialogZoomStatus = dialog.querySelector(".lightbox-zoom-status");
const dialogArtist = document.getElementById("lightbox-artist");
const dialogTitle = document.getElementById("lightbox-title");
const dialogSupport = document.getElementById("lightbox-support");
const dialogSupportBlock = document.getElementById("lightbox-support-block");
const dialogDimensions = document.getElementById("lightbox-dimensions");
const dialogDimensionsBlock = document.getElementById("lightbox-dimensions-block");
const dialogNote = dialog.querySelector(".lightbox-note");
const dialogNoteBlock = document.getElementById("lightbox-note-block");
const dialogCta = document.getElementById("lightbox-cta");
const dialogPos = dialog.querySelector(".lightbox-pos");
const dialogPrev = dialog.querySelector(".lightbox-prev");
const dialogNext = dialog.querySelector(".lightbox-next");
let siteSearch = document.getElementById("site-search");
let siteSearchInput = document.getElementById("site-search-input");
let searchPage = document.getElementById("recherche");
let searchStatus = document.getElementById("search-status");
let searchLede = document.getElementById("search-lede");
let searchGrid = document.getElementById("search-grid");
const heroStage = document.querySelector(".hero-stage");
const heroViewport = document.querySelector(".hero-viewport");
const heroDots = document.getElementById("hero-dots");
const heroTitle = document.getElementById("hero-title");
const heroArtist = document.getElementById("hero-artist");
const heroCurrent = document.querySelector(".hero-current");
const heroTotal = document.querySelector(".hero-total");
const heroLive = document.getElementById("hero-live");
const heroPrevBtn = heroStage.querySelector(".hero-prev");
const heroNextBtn = heroStage.querySelector(".hero-next");

/** Slides DOM du hero — remplacées par les œuvres carousel=1 si présentes. */
let slides = [...document.querySelectorAll(".hero-slide")];
/** Œuvres liées aux slides hero (pour lightbox). */
let heroWorks = [];

let heroIndex = 0;
let openButton = null;
let opener = null;
let works = [];
let activeSection = "peinture";
let currentPage = 1;
let cardObserver = null;
let cards = [];
let searchCards = [];
let searchQuery = "";
let searchMode = false;
let lightboxSource = "grid";

/** Lightbox loupe — web par défaut ; original lazy au zoom. */
const LOUPE_ZOOM_MIN = 1;
/** Chrome loupe (Quitter + jauge) : masqué après idle, réaffiché à l’action. */
const LOUPE_CHROME_IDLE_MS = 3000;
let lightboxDisplaySrc = "";
let lightboxOriginalSrc = "";
let lightboxZoomed = false;
let lightboxZoomLoading = false;
let lightboxZoomToken = 0;
/** Taille affichée lightbox normale (avant loupe) — base 100 %. */
let lightboxDefaultFit = { w: 0, h: 0 };
let zoomPan = { x: 0, y: 0 };
/** Facteur CSS relatif au contain loupe courant. */
let zoomScale = 1;
/**
 * Niveau utilisateur : 1 = 100 % du fit lightbox.
 * Plafond = loupeZoomMax = min(naturalW/displayW, naturalH/displayH) (pas d’upscale).
 */
let zoomLevel = LOUPE_ZOOM_MIN;
/** Max jauge pour l’œuvre courante (≥ 1). Si native déjà atteinte → 1 + jauge désactivée. */
let loupeZoomMax = 1;
let zoomDrag = null;
let zoomMoved = false;
let loupeChromeTimer = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function wrap(index, length) {
  return (index % length + length) % length;
}

function prefersReduce() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (error) {
    return false;
  }
}

function categoriesOf(work) {
  const raw = work.categories;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return raw.split(/\s+/).filter(Boolean);
  return [];
}

function factsLine(work) {
  return [work.support, work.dimensions].filter(Boolean).join(" · ");
}

/**
 * Soft artist match for the NICOLLE tab: fold case/accents, require NICOLLE
 * + Victor (covers Victor-Jean / Victor Jean / NICOLLE / Nicolle).
 * Excludes homonyms like Nicolas TAUNAY / Louis Nicolas BLARENBERGHE.
 */
function isNicolleArtist(work) {
  const artist = foldText(work && work.artist)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return artist.includes("nicolle") && artist.includes("victor");
}

function sectionOf(work) {
  if (isNicolleArtist(work)) return "nicolle";
  const cats = categoriesOf(work).map((item) => item.toLowerCase());
  if (cats.includes("miniature")) return "miniature";
  if (cats.includes("peinture")) return "peinture";
  const text = `${work.note || ""} ${work.support || ""} ${work.title || ""} ${work.id || ""}`.toLowerCase();
  if (text.includes("miniature")) return "miniature";
  return "peinture";
}

/** Collection grid: section only — carousel=1 stays in hero, excluded from #collection. */
function worksFor(section) {
  const pool = works.filter((work) => !work.carousel);
  if (section === "nicolle") return pool.filter(isNicolleArtist);
  return pool.filter((work) => sectionOf(work) === section);
}

/** Same-origin relative path (CMS + front share host). No cross-host rewrite. */
function assetPath(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return String(path).replace(/^\//, "");
}

/**
 * Public API contract (one resolution path):
 * - display = web derivative when present, else image
 * - preview = vignette
 * - original = loupe source only when distinct from display
 */
function workAssetPaths(work) {
  const display = assetPath((work && (work.web || work.image)) || "");
  const preview = assetPath(
    (work && (work.preview || work.web || work.image)) || ""
  );
  const rawOriginal = assetPath((work && work.original) || "");
  const original =
    rawOriginal && rawOriginal !== display ? rawOriginal : "";
  return { display, preview, original };
}

function countFor(name) {
  return worksFor(name).length;
}

function refreshCounts() {
  let firstAvailable = null;
  filters.forEach((button) => {
    const name = button.dataset.filter;
    const count = countFor(name);
    const countEl = button.querySelector(".filter-count");
    if (countEl) countEl.textContent = `(${count})`;
    const empty = count === 0;
    button.classList.toggle("is-empty", empty);
    button.disabled = empty;
    button.hidden = empty;
    button.setAttribute("aria-disabled", empty ? "true" : "false");
    if (!empty && !firstAvailable) firstAvailable = name;
  });
  return firstAvailable;
}

function pageCount(total) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

function pageWindow(current, total, size = PAGE_WINDOW) {
  if (total <= size) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const half = Math.floor(size / 2);
  let start = Math.max(1, current - half);
  let end = start + size - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - size + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function cardsForSource(source = lightboxSource) {
  if (source === "search") return searchCards.filter((card) => !card.hidden);
  return cards.filter((card) => !card.hidden);
}

function bindCard(button, source = "grid") {
  button.addEventListener("click", () => {
    opener = button;
    lightboxSource = source;
    const visible = cardsForSource(source);
    fillDialogFromDataset(button.dataset, {
      imageAlt: button.querySelector("img")?.alt || "",
      positionLabel: positionLabelForButton(button, source),
      navEnabled: visible.length > 1,
    });
    dialog.showModal();
    dialog.querySelector(".lightbox-close").focus();
  });
}

function positionLabelForButton(button, source = lightboxSource) {
  const visible = cardsForSource(source);
  const position = visible.indexOf(button.closest(".art-card"));
  return position >= 0 ? `${position + 1} / ${visible.length}` : "";
}

function makeCard(work, { source = "grid" } = {}) {
  const section = sectionOf(work);
  const article = document.createElement("article");
  article.className = "art-card";
  article.dataset.category = section;
  article.dataset.id = work.id || "";

  const button = document.createElement("button");
  button.className = "art-open";
  button.type = "button";
  const assets = workAssetPaths(work);
  button.dataset.image = assets.display;
  button.dataset.original = assets.original;
  button.dataset.preview = assets.preview;
  button.dataset.title = work.title || "";
  button.dataset.artist = work.artist || "";
  button.dataset.support = work.support || "";
  button.dataset.dimensions = work.dimensions || "";
  button.dataset.note = work.note || "";
  button.setAttribute("aria-label", `Agrandir ${work.title || "l’œuvre"}`);

  const img = document.createElement("img");
  img.className = "art-preview";
  img.src = assets.preview;
  img.alt = work.alt || work.title || "";
  img.loading = "lazy";
  button.append(img);

  const meta = document.createElement("div");
  meta.className = "art-meta";
  const title = document.createElement("h3");
  title.textContent = work.title || "Sans titre";
  const artist = document.createElement("span");
  artist.className = "art-artist";
  artist.textContent = work.artist || "Galerie Vittet";
  const factsText = factsLine(work);
  /* Ordre DOM: titre → auteur → taille */
  meta.append(title, artist);
  if (factsText) {
    const facts = document.createElement("p");
    facts.className = "art-facts";
    facts.textContent = factsText;
    meta.append(facts);
  }

  article.append(button, meta);
  bindCard(button, source);
  return article;
}

function observeCard(card) {
  if (!document.documentElement.classList.contains("motion") || !cardObserver) {
    card.classList.add("is-in");
    return;
  }
  card.setAttribute("data-reveal", "");
  if (!card.style.getPropertyValue("--reveal-delay")) {
    const pool = searchCards.includes(card) ? searchCards : cards;
    const delay = `${(Math.max(0, pool.indexOf(card)) % 3) * 90}ms`;
    card.style.setProperty("--reveal-delay", delay);
  }
  cardObserver.observe(card);
}

function renderPageNumbers(totalPages) {
  pageNumbers.replaceChildren();
  const pages = pageWindow(currentPage, totalPages);
  pages.forEach((page) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-num" + (page === currentPage ? " is-active" : "");
    button.textContent = String(page);
    button.setAttribute("aria-label", `Page ${page}`);
    if (page === currentPage) button.setAttribute("aria-current", "page");
    button.addEventListener("click", () => goToPage(page));
    pageNumbers.append(button);
  });
}

function goToPage(page) {
  const total = pageCount(worksFor(activeSection).length);
  if (page < 1 || page > total || page === currentPage) return;
  currentPage = page;
  renderPage();
  collectionPanel.scrollIntoView({ behavior: prefersReduce() ? "auto" : "smooth", block: "start" });
}

function renderPage() {
  const filtered = worksFor(activeSection);
  const totalPages = pageCount(filtered.length);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageWorks = filtered.slice(start, start + PAGE_SIZE);

  grid.classList.remove("is-loading");
  grid.removeAttribute("aria-busy");
  grid.replaceChildren();
  cards = pageWorks.map(makeCard);
  cards.forEach((card, index) => {
    grid.append(card);
    const delay = `${(index % 3) * 90}ms`;
    card.style.setProperty("--reveal-delay", delay);
    observeCard(card);
  });

  refreshCounts();
  renderPageNumbers(totalPages);
  pagePrev.disabled = currentPage <= 1;
  pageNext.disabled = currentPage >= totalPages;
  pagination.hidden = filtered.length === 0 || totalPages <= 1;
  const label = SECTION_LABELS[activeSection] || activeSection;
  if (!filtered.length) {
    collectionStatus.hidden = false;
    collectionStatus.textContent = `Aucune œuvre dans « ${label} » pour le moment.`;
  } else {
    collectionStatus.hidden = true;
    collectionStatus.textContent = "";
  }
  const from = filtered.length ? start + 1 : 0;
  const to = start + pageWorks.length;
  collectionEndLabel.textContent = filtered.length
    ? `${label} · ${from}–${to} sur ${filtered.length}`
    : `${label} · aucune œuvre`;

  if (dialog.open && lightboxSource === "grid") {
    const visible = cardsForSource("grid");
    if (openButton && !visible.includes(openButton.closest(".art-card"))) {
      dialog.close();
    } else if (openButton) {
      fillDialogFromDataset(openButton.dataset, {
        imageAlt: openButton.querySelector("img")?.alt || "",
        positionLabel: positionLabelForButton(openButton, "grid"),
        navEnabled: visible.length > 1,
      });
    }
  }
}

function applySection(name, { resetPage = true } = {}) {
  if (!SECTIONS.includes(name)) name = "peinture";
  if (countFor(name) === 0) {
    const fallback = SECTIONS.find((section) => countFor(section) > 0);
    if (fallback) name = fallback;
  }
  activeSection = name;
  if (resetPage) currentPage = 1;
  filters.forEach((button) => {
    const on = button.dataset.filter === name;
    button.classList.toggle("active", on);
    button.setAttribute("aria-selected", on ? "true" : "false");
  });
  const activeTab = filters.find((button) => button.dataset.filter === name);
  if (activeTab) collectionPanel.setAttribute("aria-labelledby", activeTab.id);
  renderPage();
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled || button.hidden) return;
    applySection(button.dataset.filter);
  });
});

pagePrev.addEventListener("click", () => goToPage(currentPage - 1));
pageNext.addEventListener("click", () => goToPage(currentPage + 1));

/** Same-origin Functions only — D1 via `/api/oeuvres` (no cross-host fallback). */
const OEUVRES_API = "/api/oeuvres";

async function loadWorks() {
  const response = await fetch(OEUVRES_API, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${OEUVRES_API} ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json") && !type.includes("text/json") && !type.includes("+json")) {
    const text = await response.text();
    if (text.trimStart().startsWith("<")) throw new Error(`${OEUVRES_API} html`);
    return normalizePayload(JSON.parse(text));
  }
  return normalizePayload(await response.json());
}

/** Front order ASC (API déjà triée ; filet client). */
function compareByFrontOrder(a, b) {
  const oa = Number(a.order) || 0;
  const ob = Number(b.order) || 0;
  if (oa !== ob) return oa - ob;
  return String(a.id || "").localeCompare(String(b.id || ""));
}

/**
 * Contract: GET /api/oeuvres → { oeuvres: exposed[] } (carousel flag included).
 * Hero = carousel; collection tabs = exposed && !carousel (front filter).
 */
function normalizePayload(data) {
  const list = Array.isArray(data && data.oeuvres) ? data.oeuvres : [];
  return list
    .filter((item) => item && (item.preview || item.image) && (item.title || item.artist))
    .map((item) => ({
      id: item.id || "",
      artist: item.artist || "",
      title: item.title || "",
      note: item.note || "",
      signed_dated: item.signed_dated || "",
      support: item.support || "",
      dimensions: item.dimensions || "",
      editions: item.editions || "",
      alt: item.alt || item.title || "",
      categories: categoriesOf(item),
      source_file: item.source_file || "",
      image: item.image || "",
      web: item.web || "",
      original: item.original || "",
      preview: item.preview || item.image || "",
      order: Number(item.order) || 0,
      carousel:
        item.carousel === true || item.carousel === 1 || item.carousel === "1",
    }))
    .sort(compareByFrontOrder);
}

function foldText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Soft orthography: gh→g, doubled letters (Brueghel ↔ Bruegel). */
function softFold(value) {
  return foldText(value)
    .replace(/gh/g, "g")
    .replace(/(.)\1+/g, "$1");
}

function searchHaystack(work) {
  return foldText(
    [
      work.title,
      work.artist,
      work.support,
      work.dimensions,
      work.note,
      work.signed_dated,
      work.editions,
      work.alt,
      work.id,
      work.source_file,
      categoriesOf(work).join(" "),
    ].join(" ")
  );
}

/** Exact fold + soft fold + one-step ue↔eu (Breugel). */
function tokenVariants(token) {
  const folded = foldText(token);
  const soft = softFold(folded);
  const out = new Set([folded, soft]);
  if (soft.includes("ue")) out.add(soft.replace("ue", "eu"));
  if (soft.includes("eu")) out.add(soft.replace("eu", "ue"));
  return out;
}

function tokenMatchesHay(hay, softHay, token) {
  if (!token) return true;
  if (hay.includes(token)) return true;
  for (const variant of tokenVariants(token)) {
    if (variant.length < 3) continue;
    if (softHay.includes(variant) || hay.includes(variant)) return true;
  }
  return false;
}

function worksMatching(query) {
  const tokens = foldText(query).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return works.filter((work) => {
    const hay = searchHaystack(work);
    const softHay = softFold(hay);
    return tokens.every((token) => tokenMatchesHay(hay, softHay, token));
  });
}

function readSearchRoute(hash = location.hash) {
  const raw = String(hash || "").replace(/^#/, "");
  const active =
    raw === "recherche" ||
    raw.startsWith("recherche?") ||
    raw.startsWith("recherche&");
  if (!active) return { active: false, query: "" };
  const mark = raw.includes("?") ? "?" : raw.includes("&") ? "&" : "";
  if (!mark) return { active: true, query: "" };
  const params = new URLSearchParams(raw.slice(raw.indexOf(mark) + 1));
  return { active: true, query: (params.get("q") || "").trim() };
}

/** Leave search view (empty clear / bare #recherche) → full catalog. */
const SEARCH_EXIT_HASH = "#collection";

function searchHashFor(query) {
  const q = String(query || "").trim();
  return q ? `#recherche?q=${encodeURIComponent(q)}` : SEARCH_EXIT_HASH;
}

function mountSiteSearch(inSearchMode) {
  refreshSearchDom();
  if (!siteSearch) return;
  const home = document.getElementById("collection-search-slot");
  const searchSlot = document.getElementById("recherche-search-slot");
  const target = inSearchMode && searchSlot ? searchSlot : home;
  if (target && siteSearch.parentElement !== target) {
    const focused = document.activeElement === siteSearchInput;
    const caret = focused && siteSearchInput
      ? siteSearchInput.selectionStart
      : null;
    target.appendChild(siteSearch);
    if (focused && siteSearchInput) {
      siteSearchInput.focus({ preventScroll: true });
      if (caret != null) {
        try {
          siteSearchInput.setSelectionRange(caret, caret);
        } catch (_) {}
      }
    }
  }
}

function setSearchMode(on) {
  searchMode = Boolean(on);
  document.body.classList.toggle("view-recherche", searchMode);
  if (!searchPage) return;
  if (searchMode) searchPage.removeAttribute("hidden");
  else searchPage.setAttribute("hidden", "");
  mountSiteSearch(searchMode);
}

function leaveSearchView({ replaceHash = false, scroll = false } = {}) {
  searchQuery = "";
  syncSearchInput("", { force: true });
  if (searchGrid) searchGrid.replaceChildren();
  searchCards = [];
  if (searchStatus) {
    searchStatus.hidden = true;
    searchStatus.textContent = "";
    searchStatus.classList.remove("is-empty");
  }
  if (searchLede) {
    searchLede.textContent = "Parcourir les œuvres exposées par titre, artiste ou technique.";
  }
  if (searchMode) {
    setSearchMode(false);
    closeSearchLightbox();
  }
  if (replaceHash) {
    const next = SEARCH_EXIT_HASH;
    if ((location.hash || "") !== next) {
      history.replaceState(null, "", `${location.pathname}${location.search}${next}`);
    }
  }
  if (scroll) {
    const target = document.getElementById("collection");
    if (target) {
      target.scrollIntoView({ behavior: prefersReduce() ? "auto" : "smooth", block: "start" });
    }
  }
}

function closeSearchLightbox() {
  if (dialog.open && lightboxSource === "search") dialog.close();
}

function refreshSearchDom() {
  siteSearch = document.getElementById("site-search");
  siteSearchInput = document.getElementById("site-search-input");
  searchPage = document.getElementById("recherche");
  searchStatus = document.getElementById("search-status");
  searchLede = document.getElementById("search-lede");
  searchGrid = document.getElementById("search-grid");
  if (siteSearch && !siteSearch.parentElement?.classList.contains("site-search-slot")) {
    const home = document.getElementById("collection-search-slot");
    if (home && !home.contains(siteSearch)) home.appendChild(siteSearch);
  }
}

function syncSearchInput(query, { force = false } = {}) {
  if (!siteSearchInput) refreshSearchDom();
  if (!siteSearchInput) return;
  const focused = document.activeElement === siteSearchInput;
  if (force || !focused || !siteSearchInput.value) siteSearchInput.value = query;
}

function renderSearchResults(query) {
  if (!searchGrid || !searchStatus) return;
  searchQuery = String(query || "").trim();
  syncSearchInput(searchQuery);

  if (searchLede) {
    searchLede.textContent = searchQuery
      ? `Résultats pour « ${searchQuery} ».`
      : "Parcourir les œuvres exposées par titre, artiste ou technique.";
  }

  searchGrid.replaceChildren();
  searchCards = [];

  if (!searchQuery) {
    searchStatus.hidden = false;
    searchStatus.classList.add("is-empty");
    searchStatus.textContent = "Saisissez un titre, un artiste ou une technique.";
    closeSearchLightbox();
    return;
  }

  const matches = worksMatching(searchQuery);
  if (!matches.length) {
    searchStatus.hidden = false;
    searchStatus.classList.add("is-empty");
    searchStatus.textContent = `Aucune œuvre ne correspond à « ${searchQuery} ».`;
    closeSearchLightbox();
    return;
  }

  searchStatus.classList.remove("is-empty");
  searchStatus.hidden = false;
  searchStatus.textContent =
    matches.length === 1
      ? "1 œuvre trouvée."
      : `${matches.length} œuvres trouvées.`;

  searchCards = matches.map((work) => makeCard(work, { source: "search" }));
  searchCards.forEach((card, index) => {
    searchGrid.append(card);
    card.style.setProperty("--reveal-delay", `${(index % 3) * 90}ms`);
    observeCard(card);
  });

  if (dialog.open && lightboxSource === "search") {
    const visible = cardsForSource("search");
    if (openButton && !visible.includes(openButton.closest(".art-card"))) {
      dialog.close();
    } else if (openButton) {
      fillDialogFromDataset(openButton.dataset, {
        imageAlt: openButton.querySelector("img")?.alt || "",
        positionLabel: positionLabelForButton(openButton, "search"),
        navEnabled: visible.length > 1,
      });
    }
  }
}

function applySearchRoute({ scroll } = {}) {
  const route = readSearchRoute();
  /* Active search only with a non-empty query — empty #recherche is not a results page. */
  if (route.active && route.query) {
    const entering = !searchMode;
    setSearchMode(true);
    renderSearchResults(route.query);
    if (entering || scroll === true) {
      window.scrollTo({ top: 0, behavior: prefersReduce() ? "auto" : "smooth" });
    }
    return true;
  }
  if (route.active && !route.query) {
    leaveSearchView({ replaceHash: true, scroll: scroll === true });
    return false;
  }
  if (searchMode || searchQuery) {
    leaveSearchView({ scroll: scroll === true });
  }
  return false;
}

function navigateSearch(query, { replace = false, scroll = false } = {}) {
  const next = searchHashFor(query);
  if ((location.hash || "") === next) {
    applySearchRoute({ scroll });
    return;
  }
  if (replace) {
    history.replaceState(null, "", `${location.pathname}${location.search}${next}`);
    applySearchRoute({ scroll });
    return;
  }
  location.hash = next;
}

let searchLiveTimer = 0;
const SEARCH_LIVE_MS = 200;

function scheduleLiveSearch() {
  window.clearTimeout(searchLiveTimer);
  searchLiveTimer = window.setTimeout(() => {
    navigateSearch(siteSearchInput?.value || "", { replace: true });
  }, SEARCH_LIVE_MS);
}

function bindSiteSearch() {
  refreshSearchDom();
  if (siteSearch && !siteSearch.dataset.searchBound) {
    siteSearch.dataset.searchBound = "1";
    siteSearch.addEventListener("submit", (event) => {
      event.preventDefault();
      window.clearTimeout(searchLiveTimer);
      refreshSearchDom();
      navigateSearch(siteSearchInput?.value || "", { scroll: true });
    });
  }
  if (siteSearchInput && !siteSearchInput.dataset.searchBound) {
    siteSearchInput.dataset.searchBound = "1";
    siteSearchInput.addEventListener("input", scheduleLiveSearch);
    siteSearchInput.addEventListener("search", () => {
      window.clearTimeout(searchLiveTimer);
      refreshSearchDom();
      navigateSearch(siteSearchInput?.value || "", { replace: true });
    });
  }
}

/** Keep cover crop centered whenever a slide overflows the hero frame. */
function centerHeroCrop(img) {
  if (!img) return;
  img.style.objectFit = "cover";
  img.style.objectPosition = "center center";
}

function buildHeroSlide(work, index, startIndex = 0) {
  const isStart = index === startIndex;
  const figure = document.createElement("figure");
  figure.className = "hero-slide" + (isStart ? " is-active" : "");
  figure.dataset.title = work.title || "";
  figure.dataset.artist = work.artist || "";
  figure.dataset.id = work.id || "";
  if (!isStart) figure.setAttribute("aria-hidden", "true");
  const assets = workAssetPaths(work);
  const img = document.createElement("img");
  // Full-bleed hero needs web (~1800px), not preview vignettes (~720px).
  img.className = "art-hero";
  img.src = assets.display || assets.preview;
  img.alt = work.alt || work.title || "";
  img.decoding = "async";
  centerHeroCrop(img);
  if (isStart) img.fetchPriority = "high";
  else img.loading = "lazy";
  figure.append(img);
  return figure;
}

function renderHeroDots() {
  if (!heroDots) return;
  heroDots.replaceChildren();
  if (slides.length < 2) return;
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-dot" + (index === heroIndex ? " is-active" : "");
    dot.setAttribute("aria-label", `Aller à l’œuvre ${index + 1}`);
    dot.addEventListener("click", () => showHero(index));
    heroDots.append(dot);
  });
}

/**
 * Hero dynamique : œuvres exposed + carousel=1.
 * Si aucune coche → fallback sur la première œuvre de la collection (pas de cadre vide).
 */
function syncHeroFromWorks(list) {
  if (!heroViewport) return;
  // list déjà triée (normalizePayload) ; carousel conserve l’ordre relatif.
  const chosen = (list || []).filter(
    (work) =>
      work &&
      work.carousel &&
      (work.web || work.preview || work.image)
  );

  // Sans coche carousel : première œuvre de la collection (hors carousel).
  const collectionPool = (list || []).filter((work) => work && !work.carousel);
  const fallback =
    !chosen.length && collectionPool.length
      ? [collectionPool[0]]
      : !chosen.length && list && list.length
        ? [list[0]]
        : [];
  const source = chosen.length ? chosen : fallback;

  // Ordre CMS conservé ; départ aléatoire pour ne pas toujours afficher la même première.
  const startIndex =
    source.length > 1 ? Math.floor(Math.random() * source.length) : 0;

  stopHeroAutoplay();
  heroViewport.replaceChildren();
  heroWorks = source.slice();
  source.forEach((work, index) => {
    heroViewport.append(buildHeroSlide(work, index, startIndex));
  });
  slides = [...heroViewport.querySelectorAll(".hero-slide")];
  heroViewport.classList.toggle("is-static", slides.length < 2);
  heroPrevBtn.hidden = slides.length < 2;
  heroNextBtn.hidden = slides.length < 2;
  heroReady = false;
  showHero(startIndex);
}

let heroReady = false;
let captionTimer = 0;
const heroMeta = document.querySelector(".hero-meta");
const HERO_AUTOPLAY_MS = 10000;
let heroAutoplayTimer = 0;
let heroAutoplayPaused = false;

function stopHeroAutoplay() {
  window.clearTimeout(heroAutoplayTimer);
  heroAutoplayTimer = 0;
}

function scheduleHeroAutoplay() {
  stopHeroAutoplay();
  if (
    heroAutoplayPaused ||
    prefersReduce() ||
    slides.length < 2 ||
    document.hidden
  ) {
    return;
  }
  heroAutoplayTimer = window.setTimeout(() => {
    showHero(heroIndex + 1);
  }, HERO_AUTOPLAY_MS);
}

function showHero(index) {
  if (!slides.length) {
    stopHeroAutoplay();
    heroTitle.textContent = "";
    heroArtist.textContent = "";
    heroCurrent.textContent = "00";
    heroTotal.textContent = "00";
    heroLive.textContent = "Aucune œuvre en carousel.";
    renderHeroDots();
    return;
  }
  heroIndex = wrap(index, slides.length);
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === heroIndex;
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-hidden", active ? "false" : "true");
    centerHeroCrop(slide.querySelector("img"));
  });
  const slide = slides[heroIndex];
  const applyText = () => {
    heroTitle.textContent = slide.dataset.title;
    heroArtist.textContent = slide.dataset.artist;
  };
  heroCurrent.textContent = pad(heroIndex + 1);
  heroTotal.textContent = pad(slides.length);
  heroLive.textContent = `Œuvre ${heroIndex + 1} sur ${slides.length}. ${slide.dataset.title}. ${slide.dataset.artist}.`;
  renderHeroDots();
  scheduleHeroAutoplay();
  if (!heroReady || prefersReduce()) {
    window.clearTimeout(captionTimer);
    applyText();
    heroReady = true;
    heroMeta.classList.remove("is-swap");
    return;
  }
  heroMeta.classList.add("is-swap");
  window.clearTimeout(captionTimer);
  captionTimer = window.setTimeout(() => {
    applyText();
    heroMeta.classList.remove("is-swap");
  }, 180);
}

heroPrevBtn.addEventListener("click", () => showHero(heroIndex - 1));
heroNextBtn.addEventListener("click", () => showHero(heroIndex + 1));
heroStage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    showHero(heroIndex + 1);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showHero(heroIndex - 1);
  }
});

/**
 * Full-bleed hero fills the viewport — the pointer almost always sits over
 * `.hero-stage`, so pause-on-hover permanently killed autoplay. Pause only
 * while keyboard focus is on carousel controls (prev / next / dots).
 */
function heroControlsFocused() {
  const el = document.activeElement;
  return !!(el && heroStage.contains(el) && el.matches("button"));
}

function pauseHeroAutoplay() {
  heroAutoplayPaused = true;
  stopHeroAutoplay();
}

function resumeHeroAutoplayIfIdle() {
  if (heroControlsFocused()) {
    heroAutoplayPaused = true;
    return;
  }
  heroAutoplayPaused = false;
  scheduleHeroAutoplay();
}

heroStage.addEventListener("focusin", (event) => {
  if (event.target && event.target.matches && event.target.matches("button")) {
    pauseHeroAutoplay();
  }
});
heroStage.addEventListener("focusout", (event) => {
  if (heroStage.contains(event.relatedTarget)) return;
  resumeHeroAutoplayIfIdle();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopHeroAutoplay();
  else resumeHeroAutoplayIfIdle();
});

let swipe = null;
let swipeMoved = false;
heroViewport.addEventListener("pointerdown", (event) => {
  if ((event.pointerType === "mouse" && event.button !== 0) || event.target.closest("button")) return;
  swipe = { x: event.clientX, y: event.clientY, id: event.pointerId };
  swipeMoved = false;
  try {
    heroViewport.setPointerCapture(event.pointerId);
  } catch (error) {
    /* capture optionnelle (pointeurs synthétiques) */
  }
});
heroViewport.addEventListener("pointermove", (event) => {
  if (!swipe || swipe.id !== event.pointerId) return;
  if (Math.abs(event.clientX - swipe.x) > 12 || Math.abs(event.clientY - swipe.y) > 12) {
    swipeMoved = true;
  }
});
heroViewport.addEventListener("dragstart", (event) => event.preventDefault());
heroViewport.addEventListener("pointerup", (event) => {
  if (!swipe || swipe.id !== event.pointerId) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  const wasSwipe = Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy);
  swipe = null;
  if (wasSwipe) {
    showHero(heroIndex + (dx < 0 ? 1 : -1));
    return;
  }
  if (!swipeMoved) openHeroLightbox();
});
heroViewport.addEventListener("pointercancel", () => {
  swipe = null;
  swipeMoved = false;
});

function openHeroLightbox() {
  const work = heroWorks[heroIndex];
  if (!work) return;
  lightboxSource = "hero";
  opener = null;
  openButton = null;
  const assets = workAssetPaths(work);
  fillDialogFromDataset({
    image: assets.display || assets.preview,
    original: assets.original,
    title: work.title || "",
    artist: work.artist || "",
    support: work.support || "",
    dimensions: work.dimensions || "",
    note: work.note || "",
  }, {
    imageAlt: work.alt || work.title || "",
    positionLabel: slides.length > 1 ? `${heroIndex + 1} / ${slides.length}` : "",
    navEnabled: slides.length > 1,
  });
  dialog.showModal();
  dialog.querySelector(".lightbox-close").focus();
}

showHero(0);

let detailToken = 0;

function setZoomStatus(text) {
  if (!dialogZoomStatus) return;
  dialogZoomStatus.textContent = text || "";
  dialogZoomStatus.hidden = !text;
}

function clearLoupeChromeIdle() {
  if (loupeChromeTimer) {
    clearTimeout(loupeChromeTimer);
    loupeChromeTimer = null;
  }
}

function loupeChromeNodes() {
  return [dialogLoupe, dialogZoomGauge].filter(Boolean);
}

/** Affiche le chrome loupe, puis le masque après 3 s sans action. */
function pokeLoupeChrome() {
  const nodes = loupeChromeNodes();
  if (!nodes.length) return;
  clearLoupeChromeIdle();
  nodes.forEach((node) => node.classList.remove("is-idle-hidden"));
  const anyVisible = nodes.some((node) => !node.hidden);
  if (!anyVisible) return;
  loupeChromeTimer = setTimeout(() => {
    loupeChromeTimer = null;
    if (!dialog.open) return;
    loupeChromeNodes().forEach((node) => {
      if (!node.hidden) node.classList.add("is-idle-hidden");
    });
  }, LOUPE_CHROME_IDLE_MS);
}

/** maxZoom = min(natural/display) ; < 1 → pas de zoom utile (reste à 100 %, jauge off). */
function computeNativeZoomMax() {
  const nw = dialogImage.naturalWidth;
  const nh = dialogImage.naturalHeight;
  const baseW = lightboxDefaultFit.w || dialogImage.clientWidth;
  const baseH = lightboxDefaultFit.h || dialogImage.clientHeight;
  if (!(nw > 0 && nh > 0 && baseW > 0 && baseH > 0)) return 1;
  const z = Math.min(nw / baseW, nh / baseH);
  if (!Number.isFinite(z) || z <= 0) return 1;
  return z;
}

function loupeZoomMaxPercent() {
  return Math.max(100, Math.floor(loupeZoomMax * 100 + 1e-9));
}

function applyLoupeZoomMax(rawMax) {
  loupeZoomMax = rawMax > 1 ? rawMax : 1;
  if (zoomLevel > loupeZoomMax) zoomLevel = loupeZoomMax;
  if (!dialogZoomRange) return;
  const maxPct = loupeZoomMaxPercent();
  dialogZoomRange.max = String(maxPct);
  dialogZoomRange.setAttribute("aria-valuemax", String(maxPct));
  dialogZoomRange.disabled = loupeZoomMax <= 1;
}

function syncZoomGauge(percent = Math.round(zoomLevel * 100)) {
  if (!dialogZoomGauge || !dialogZoomRange) return;
  const inLoupe = lightboxZoomed || lightboxZoomLoading;
  dialogZoomGauge.hidden = !inLoupe;
  const maxPct = loupeZoomMaxPercent();
  const pct = Math.min(
    maxPct,
    Math.max(Math.round(LOUPE_ZOOM_MIN * 100), Math.round(percent))
  );
  dialogZoomRange.value = String(pct);
  dialogZoomRange.setAttribute("aria-valuenow", String(pct));
  dialogZoomRange.setAttribute("aria-valuetext", `${pct} %`);
  if (dialogZoomGaugeValue) dialogZoomGaugeValue.textContent = `${pct} %`;
}

function applyZoomTransform() {
  dialogImage.style.transform = lightboxZoomed
    ? `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`
    : "";
}

/** Plafond affichage = résolution native (jamais d’upscale au-delà de natural*). */
function applyNativeSizeCap() {
  const nw = dialogImage.naturalWidth;
  const nh = dialogImage.naturalHeight;
  if (!(nw > 0 && nh > 0)) return;
  dialogImage.style.width = "";
  dialogImage.style.height = "";
  dialogImage.style.maxWidth = `min(100%, ${nw}px)`;
  dialogImage.style.maxHeight = `min(100%, ${nh}px)`;
}

function clearNativeSizeCap() {
  dialogImage.style.width = "";
  dialogImage.style.height = "";
  dialogImage.style.maxWidth = "";
  dialogImage.style.maxHeight = "";
}

/** Limite le pan pour garder l’image utile dans la zone photo. */
function clampZoomPan() {
  const photo = dialogPhoto.getBoundingClientRect();
  const fittedW = dialogImage.clientWidth;
  const fittedH = dialogImage.clientHeight;
  if (!(fittedW > 0 && fittedH > 0 && photo.width > 0 && photo.height > 0)) {
    zoomPan = { x: 0, y: 0 };
    return;
  }
  const visW = fittedW * zoomScale;
  const visH = fittedH * zoomScale;
  const maxX = Math.max(0, (visW - photo.width) / 2);
  const maxY = Math.max(0, (visH - photo.height) / 2);
  zoomPan.x = Math.max(-maxX, Math.min(maxX, zoomPan.x));
  zoomPan.y = Math.max(-maxY, Math.min(maxY, zoomPan.y));
}

function resetZoomChrome() {
  lightboxZoomed = false;
  lightboxZoomLoading = false;
  lightboxZoomToken += 1;
  lightboxDefaultFit = { w: 0, h: 0 };
  zoomPan = { x: 0, y: 0 };
  zoomScale = 1;
  zoomLevel = LOUPE_ZOOM_MIN;
  loupeZoomMax = 1;
  zoomDrag = null;
  zoomMoved = false;
  dialog.classList.remove("is-loupe");
  dialogPhoto.classList.remove("is-zoomed", "is-loading-zoom", "is-panning");
  dialogImage.classList.remove("is-zoomed");
  dialogImage.style.transform = "";
  clearNativeSizeCap();
  applyLoupeZoomMax(1);
  if (dialogLoupe) {
    dialogLoupe.setAttribute("aria-pressed", "false");
    dialogLoupe.setAttribute("aria-label", "Loupe — charger l’original");
    const label = dialogLoupe.querySelector(".lightbox-loupe-label");
    if (label) label.textContent = "Loupe";
  }
  syncZoomGauge(100);
  setZoomStatus("");
  pokeLoupeChrome();
}

function exitZoom({ restoreWeb = true } = {}) {
  const wasZoomed = lightboxZoomed || lightboxZoomLoading;
  resetZoomChrome();
  if (restoreWeb && wasZoomed && lightboxDisplaySrc) {
    if (dialogImage.getAttribute("src") !== lightboxDisplaySrc) {
      dialogImage.src = lightboxDisplaySrc;
    }
    const reapply = () => applyNativeSizeCap();
    if (dialogImage.complete && dialogImage.naturalWidth > 0) reapply();
    else dialogImage.addEventListener("load", reapply, { once: true });
  } else if (dialogImage.naturalWidth > 0) {
    applyNativeSizeCap();
  }
}

function syncLoupeAvailability() {
  if (!dialogLoupe) return;
  const canZoom = Boolean(lightboxOriginalSrc);
  dialogLoupe.hidden = !canZoom;
  dialogPhoto.classList.toggle("has-loupe", canZoom);
  if (!lightboxZoomed && !lightboxZoomLoading) syncZoomGauge(100);
  if (canZoom) pokeLoupeChrome();
  else {
    clearLoupeChromeIdle();
    loupeChromeNodes().forEach((node) => node.classList.remove("is-idle-hidden"));
  }
}

function preloadOriginal(url) {
  return new Promise((resolve, reject) => {
    const probe = new Image();
    probe.decoding = "async";
    probe.onload = () => resolve(probe);
    probe.onerror = () => reject(new Error("original"));
    probe.src = url;
  });
}

function captureLightboxDefaultFit() {
  const w = dialogImage.clientWidth;
  const h = dialogImage.clientHeight;
  if (w > 0 && h > 0) lightboxDefaultFit = { w, h };
}

/**
 * Loupe = zoomLevel × fit lightbox (100 % → loupeZoomMax), fichier original,
 * sans jamais dépasser naturalWidth/Height (pas d’upscale).
 * loupeZoomMax = min(naturalWidth/displayWidth, naturalHeight/displayHeight).
 */
function fitZoomScale({ resetPan = false } = {}) {
  applyNativeSizeCap();
  const nw = dialogImage.naturalWidth;
  const nh = dialogImage.naturalHeight;
  const fittedW = dialogImage.clientWidth;
  const fittedH = dialogImage.clientHeight;
  const baseW = lightboxDefaultFit.w || fittedW;
  const baseH = lightboxDefaultFit.h || fittedH;
  if (!(nw > 0 && nh > 0 && fittedW > 0 && fittedH > 0 && baseW > 0 && baseH > 0)) {
    zoomScale = 1;
    if (resetPan) zoomPan = { x: 0, y: 0 };
    applyZoomTransform();
    return;
  }
  const level = Math.min(loupeZoomMax, Math.max(LOUPE_ZOOM_MIN, zoomLevel));
  const targetW = Math.min(baseW * level, nw);
  const targetH = Math.min(baseH * level, nh);
  // Scale CSS depuis le contain loupe actuel → taille visuelle cible.
  const scale = Math.min(targetW / fittedW, targetH / fittedH, nw / fittedW, nh / fittedH);
  zoomScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  if (resetPan) zoomPan = { x: 0, y: 0 };
  clampZoomPan();
  applyZoomTransform();
}

function setZoomLevelFromPercent(percent, { resetPan = false } = {}) {
  const pct = Number(percent);
  zoomLevel = Number.isFinite(pct)
    ? Math.min(loupeZoomMax, Math.max(LOUPE_ZOOM_MIN, pct / 100))
    : LOUPE_ZOOM_MIN;
  syncZoomGauge(Math.round(zoomLevel * 100));
  if (lightboxZoomed) fitZoomScale({ resetPan });
}

async function enterZoom() {
  if (!lightboxOriginalSrc || lightboxZoomed || lightboxZoomLoading) return;
  const token = ++lightboxZoomToken;
  lightboxZoomLoading = true;
  zoomLevel = LOUPE_ZOOM_MIN;
  captureLightboxDefaultFit();
  dialog.classList.add("is-loupe");
  dialogPhoto.classList.add("is-loading-zoom");
  setZoomStatus("Chargement de l’original…");
  if (dialogLoupe) {
    dialogLoupe.setAttribute("aria-pressed", "true");
    dialogLoupe.setAttribute("aria-label", "Quitter la loupe");
    const label = dialogLoupe.querySelector(".lightbox-loupe-label");
    if (label) label.textContent = "Quitter";
  }
  syncZoomGauge(100);
  pokeLoupeChrome();
  try {
    await preloadOriginal(lightboxOriginalSrc);
    if (token !== lightboxZoomToken) return;
    dialogImage.src = lightboxOriginalSrc;
    const reveal = () => {
      if (token !== lightboxZoomToken) return;
      lightboxZoomLoading = false;
      lightboxZoomed = true;
      dialogPhoto.classList.remove("is-loading-zoom");
      dialogPhoto.classList.add("is-zoomed");
      dialogImage.classList.add("is-zoomed");
      // Après masquage de la fiche : laisser le layout s’étendre, puis plafond natif.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (token !== lightboxZoomToken) return;
          applyLoupeZoomMax(computeNativeZoomMax());
          zoomLevel = LOUPE_ZOOM_MIN;
          syncZoomGauge(100);
          // Défaut 100 % = fit lightbox ; jauge jusqu’au coeff. natif (sans pixelisation).
          fitZoomScale({ resetPan: true });
        });
      });
      // Pas de résolution fichier / dpi en mode loupe.
      setZoomStatus("");
      pokeLoupeChrome();
    };
    if (dialogImage.complete && dialogImage.naturalWidth > 0) reveal();
    else {
      dialogImage.addEventListener("load", reveal, { once: true });
      dialogImage.addEventListener(
        "error",
        () => {
          if (token !== lightboxZoomToken) return;
          resetZoomChrome();
          if (lightboxDisplaySrc) dialogImage.src = lightboxDisplaySrc;
          const reapply = () => applyNativeSizeCap();
          if (dialogImage.complete && dialogImage.naturalWidth > 0) reapply();
          else dialogImage.addEventListener("load", reapply, { once: true });
          setZoomStatus("");
        },
        { once: true }
      );
    }
  } catch {
    if (token !== lightboxZoomToken) return;
    resetZoomChrome();
    if (lightboxDisplaySrc) dialogImage.src = lightboxDisplaySrc;
    const reapply = () => applyNativeSizeCap();
    if (dialogImage.complete && dialogImage.naturalWidth > 0) reapply();
    else dialogImage.addEventListener("load", reapply, { once: true });
    setZoomStatus("");
  }
}

function toggleZoom() {
  if (lightboxZoomed || lightboxZoomLoading) exitZoom();
  else enterZoom();
}

function fadeDetailIn() {
  const token = ++detailToken;
  dialogImage.classList.remove("is-entering");
  const onReady = () => {
    if (token !== detailToken) return;
    if (!lightboxZoomed) applyNativeSizeCap();
    if (prefersReduce()) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (token !== detailToken) return;
        dialogImage.classList.remove("is-entering");
      });
    });
  };
  if (!prefersReduce()) dialogImage.classList.add("is-entering");
  if (dialogImage.complete && dialogImage.naturalWidth > 0) onReady();
  else {
    dialogImage.addEventListener("load", onReady, { once: true });
    dialogImage.addEventListener("error", () => {
      if (token !== detailToken) return;
      dialogImage.classList.remove("is-entering");
    }, { once: true });
  }
}

function fillDialogFromDataset(data, { imageAlt = "", positionLabel = "", navEnabled = false } = {}) {
  exitZoom({ restoreWeb: false });
  // Callers (cards / hero) already resolve via workAssetPaths; re-normalize defensively.
  lightboxDisplaySrc = assetPath(data.image || data.preview || "");
  const rawOriginal = assetPath(data.original || "");
  lightboxOriginalSrc =
    rawOriginal && rawOriginal !== lightboxDisplaySrc ? rawOriginal : "";
  clearNativeSizeCap();
  dialogImage.src = lightboxDisplaySrc;
  dialogImage.alt = imageAlt;
  syncLoupeAvailability();
  dialogArtist.textContent = data.artist || "";
  dialogTitle.textContent = data.title || "";

  const support = data.support || "";
  dialogSupport.textContent = support;
  dialogSupportBlock.hidden = !support;

  const dimensions = data.dimensions || "";
  dialogDimensions.textContent = dimensions;
  dialogDimensionsBlock.hidden = !dimensions;

  const note = data.note || "";
  dialogNote.textContent = note;
  dialogNoteBlock.hidden = !note;

  const subject = data.title
    ? `Demande d’information — ${data.title}`
    : "Demande d’information — œuvre Galerie Vittet";
  dialogCta.href = `mailto:${CONTACT_MAIL}?subject=${encodeURIComponent(subject)}`;
  dialogCta.textContent = "Demander cette œuvre →";

  dialogPos.textContent = positionLabel;
  dialogPrev.disabled = !navEnabled;
  dialogNext.disabled = !navEnabled;
  fadeDetailIn();
}

function stepDialog(direction) {
  if (lightboxZoomed || lightboxZoomLoading) exitZoom();
  if (lightboxSource === "hero") {
    if (slides.length < 2) return;
    showHero(heroIndex + direction);
    openHeroLightbox();
    return;
  }
  const visible = cardsForSource(lightboxSource === "search" ? "search" : "grid");
  const buttons = visible.map((card) => card.querySelector(".art-open"));
  const index = buttons.indexOf(openButton);
  if (index < 0 || buttons.length < 2) return;
  const next = buttons[wrap(index + direction, buttons.length)];
  openButton = next;
  fillDialogFromDataset(next.dataset, {
    imageAlt: next.querySelector("img")?.alt || "",
    positionLabel: positionLabelForButton(next, lightboxSource),
    navEnabled: buttons.length > 1,
  });
}

dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
dialogPrev.addEventListener("click", () => stepDialog(-1));
dialogNext.addEventListener("click", () => stepDialog(1));
if (dialogLoupe) {
  dialogLoupe.addEventListener("click", (event) => {
    event.stopPropagation();
    pokeLoupeChrome();
    toggleZoom();
  });
}

function onLoupeChromeActivity() {
  if (!dialog.open) return;
  const loupeReady = dialogLoupe && !dialogLoupe.hidden;
  const gaugeReady = dialogZoomGauge && !dialogZoomGauge.hidden;
  if (!loupeReady && !gaugeReady) return;
  pokeLoupeChrome();
}

function isLoupeChromeTarget(target) {
  return Boolean(target?.closest?.("button, .lightbox-zoom-gauge"));
}

/* pointermove covers mouse + pen; keep click/touch/key for discrete wake. */
dialog.addEventListener("pointermove", onLoupeChromeActivity);
dialog.addEventListener("click", onLoupeChromeActivity);
dialog.addEventListener("touchstart", onLoupeChromeActivity, { passive: true });
dialog.addEventListener("keydown", onLoupeChromeActivity);

if (dialogZoomGauge) {
  const stopGaugeBubble = (event) => {
    event.stopPropagation();
    pokeLoupeChrome();
  };
  dialogZoomGauge.addEventListener("pointerdown", stopGaugeBubble);
  dialogZoomGauge.addEventListener("click", stopGaugeBubble);
  dialogZoomGauge.addEventListener("touchstart", stopGaugeBubble, { passive: true });
}
if (dialogZoomRange) {
  dialogZoomRange.addEventListener("input", (event) => {
    setZoomLevelFromPercent(event.target.value);
    pokeLoupeChrome();
  });
  dialogZoomRange.addEventListener("change", (event) => {
    setZoomLevelFromPercent(event.target.value);
    pokeLoupeChrome();
  });
}

dialogPhoto.addEventListener("pointerdown", (event) => {
  if (!lightboxZoomed) return;
  if (isLoupeChromeTarget(event.target)) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  // Clic = quitter ; glisser = pan si loupe dépasse la zone.
  zoomDrag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    panX: zoomPan.x,
    panY: zoomPan.y,
  };
  zoomMoved = false;
  try {
    dialogPhoto.setPointerCapture(event.pointerId);
  } catch {
    /* ignore */
  }
});
dialogPhoto.addEventListener("pointermove", (event) => {
  if (!zoomDrag || zoomDrag.id !== event.pointerId) return;
  const dx = event.clientX - zoomDrag.x;
  const dy = event.clientY - zoomDrag.y;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
    zoomMoved = true;
    dialogPhoto.classList.add("is-panning");
    zoomPan.x = zoomDrag.panX + dx;
    zoomPan.y = zoomDrag.panY + dy;
    clampZoomPan();
    applyZoomTransform();
  }
});
function endZoomDrag(event) {
  if (!zoomDrag || (event && zoomDrag.id !== event.pointerId)) return;
  const wasMoved = zoomMoved;
  zoomDrag = null;
  zoomMoved = false;
  dialogPhoto.classList.remove("is-panning");
  return wasMoved;
}
dialogPhoto.addEventListener("pointerup", (event) => {
  const wasMoved = endZoomDrag(event);
  if (wasMoved === false && lightboxZoomed && !isLoupeChromeTarget(event.target)) {
    exitZoom();
  }
});
dialogPhoto.addEventListener("pointercancel", (event) => {
  endZoomDrag(event);
});
dialogPhoto.addEventListener("click", (event) => {
  if (isLoupeChromeTarget(event.target)) return;
  if (lightboxZoomed || lightboxZoomLoading) return;
  if (!lightboxOriginalSrc) return;
  enterZoom();
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  exitZoom({ restoreWeb: false });
  lightboxDisplaySrc = "";
  lightboxOriginalSrc = "";
  dialogImage.removeAttribute("src");
  dialogImage.alt = "";
  dialogImage.classList.remove("is-entering");
  clearLoupeChromeIdle();
  loupeChromeNodes().forEach((node) => node.classList.remove("is-idle-hidden"));
  syncLoupeAvailability();
  lightboxSource = "grid";
  if (opener) opener.focus();
});
dialog.addEventListener("cancel", (event) => {
  if (lightboxZoomed || lightboxZoomLoading) {
    event.preventDefault();
    exitZoom();
  }
});

function dialogFocusables() {
  return [
    ...dialog.querySelectorAll(
      'button:not([hidden]):not(:disabled), input.lightbox-zoom-range:not([disabled])'
    ),
  ].filter((el) => {
    if (el.closest("[hidden]")) return false;
    return true;
  });
}

dialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && (lightboxZoomed || lightboxZoomLoading)) {
    event.preventDefault();
    event.stopPropagation();
    exitZoom();
    return;
  }
  const onZoomRange = event.target === dialogZoomRange;
  if (event.key === "ArrowLeft" && !onZoomRange) {
    event.preventDefault();
    stepDialog(-1);
  }
  if (event.key === "ArrowRight" && !onZoomRange) {
    event.preventDefault();
    stepDialog(1);
  }
  if (event.key !== "Tab") return;
  const items = dialogFocusables();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first.focus();
  }
});

bindSiteSearch();

window.addEventListener("hashchange", () => {
  applySearchRoute();
});

function enableReveal() {
  const nodes = [
    document.querySelector(".collection > .section-heading"),
    document.querySelector(".search-page > .section-heading"),
    document.querySelector(".collection-end"),
    document.querySelector(".about"),
  ].filter(Boolean);
  nodes.forEach((node) => {
    node.setAttribute("data-reveal", "");
    node.style.setProperty("--reveal-delay", "0ms");
  });
  if (prefersReduce() || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  try {
    cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        cardObserver.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });
    document.documentElement.classList.add("motion");
    nodes.forEach((node) => cardObserver.observe(node));
  } catch (error) {
    document.documentElement.classList.remove("motion");
    nodes.forEach((node) => node.classList.add("is-in"));
    cardObserver = null;
  }
}

enableReveal();

loadWorks()
  .then((list) => {
    works = list;
    syncHeroFromWorks(works);
    applySection("peinture");
    applySearchRoute();
  })
  .catch(() => {
    works = [];
    syncHeroFromWorks([]);
    grid.classList.remove("is-loading");
    grid.removeAttribute("aria-busy");
    grid.replaceChildren();
    collectionStatus.hidden = false;
    collectionStatus.textContent = "La collection est momentanément indisponible.";
    refreshCounts();
    pagination.hidden = true;
    applySearchRoute();
  });

/* ?q=… → #recherche?q=… */
(function adoptQueryParam() {
  try {
    const params = new URLSearchParams(location.search || "");
    const q = (params.get("q") || "").trim();
    if (!q && !params.has("q")) return;
    if (readSearchRoute().active) return;
    const url = new URL(location.href);
    url.searchParams.delete("q");
    const clean = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");
    history.replaceState(null, "", `${clean}${searchHashFor(q)}`);
  } catch (error) {
    /* ignore */
  }
})();

applySearchRoute();
