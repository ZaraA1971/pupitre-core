const form = document.getElementById("work-form");
const imageInput = document.getElementById("image");
const imageFolderInput = document.getElementById("image-folder");
const pickImageButton = document.getElementById("pick-image");
const pickMenu = document.getElementById("pick-menu");
const fileName = document.getElementById("file-name");
const defaultExposed = document.getElementById("default-exposed");
const defaultCarousel = document.getElementById("default-carousel");
const previewButton = document.getElementById("preview-button");
const publishButton = document.getElementById("publish-button");
const hint = document.getElementById("form-hint");
const status = document.getElementById("form-status");
const panel = document.getElementById("preview-panel");
const sizes = document.getElementById("preview-sizes");
const previewBatch = document.getElementById("preview-batch");
const uploadQueue = document.getElementById("upload-queue");
const addedList = document.getElementById("added-list");
const catalogToolbar = document.getElementById("catalog-toolbar");
const catalogFilterCategory = document.getElementById("catalog-filter-category");
const catalogFilterArtist = document.getElementById("catalog-filter-artist");
const catalogFilterPeriod = document.getElementById("catalog-filter-period");
const catalogFilterExposed = document.getElementById("catalog-filter-exposed");
const catalogFilterSearch = document.getElementById("catalog-filter-search");
const catalogSort = document.getElementById("catalog-sort");
const catalogSelectAll = document.getElementById("catalog-select-all");
const catalogPdf = document.getElementById("catalog-pdf");
const catalogExport = document.getElementById("catalog-export");
const catalogCount = document.getElementById("catalog-count");
const catalogStatus = document.getElementById("catalog-status");
const catalogPagers = [...document.querySelectorAll("[data-catalog-pager]")];

const MAX_BYTES = 12_000_000;
/** Source avant réencodage : on accepte plus gros (scans print), puis on vérifie le blob encodé. */
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
/** Dérivé d’affichage web : grand côté max (px), qualité canvas ~0.82. */
const WEB_MAX_EDGE = 1800;
const WEB_JPEG_QUALITY = 0.82;
const PREVIEW_MAX_EDGE = 720;
/**
 * Cadre crop = hero desktop verrouillé 16:9 (même --hero-ar côté front).
 * Front : contain pour afficher 100 % de ce cadre (pas de re-zoom CSS).
 */
const CAROUSEL_AR = 16 / 9;
const CAROUSEL_AR_LOG_THRESHOLD = 0.22;
const CAROUSEL_MAX_EDGE = 1920;
const CAROUSEL_JPEG_QUALITY = 0.86;
const LIBRARY_PAGE_SIZE = 25;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ID_PATTERN = /^ajout-[a-z0-9-]{1,80}$/;
const EXPOSEE_ID_PATTERN = /^exposee-[a-z0-9-]{1,80}$/;
const LIBRARY_ID_PATTERN = /^(ajout|exposee)-[a-z0-9-]{1,80}$/;
const PERIOD_NONE = "__none__";
/** Tri bibliothèque — défaut = plus récente téléchargée ou modifiée. */
const SORT_RECENT = "recent";
const SORT_OLDEST = "oldest";
const SORT_ORDER = "order";
const SORT_ARTIST = "artist";
const SORT_TITLE = "title";
const SORT_VALUES = new Set([
  SORT_RECENT,
  SORT_OLDEST,
  SORT_ORDER,
  SORT_ARTIST,
  SORT_TITLE,
]);
const SORT_STORAGE_KEY = "atelier-catalog-sort";
const SORT_DEFAULT = SORT_RECENT;
/** Siècles déjà présents dans les notes — pas de dates inventées. */
const PERIOD_PATTERN = /(XVI{0,3}|XIV|XV|XVII{0,2}|XVIII|XIX|XX)[ᵉe]?\s*siècle/i;
const CATEGORY_LABELS = {
  peinture: "peinture",
  miniature: "miniature",
  aquarelle: "aquarelle",
};
const CATEGORY_KEYS = ["peinture", "miniature", "aquarelle"];

/** Labels FR des champs Artlogic (artiste, titre, note, …) — plafonds longs. */
const META_FIELDS = [
  { key: "artist", label: "artiste", max: 400, multiline: true, rows: 2 },
  { key: "title", label: "titre", max: 500, multiline: true, rows: 2 },
  { key: "note", label: "note", max: 4000, multiline: true, rows: 4 },
  { key: "signed_dated", label: "signé et date", max: 400, multiline: true, rows: 2 },
  { key: "support", label: "support", max: 800, multiline: true, rows: 2 },
  { key: "dimensions", label: "taille", max: 400 },
  { key: "editions", label: "éditions", max: 800, multiline: true, rows: 2 },
];
const META_ALT_MAX = 500;

function metaMax(key) {
  const field = META_FIELDS.find((item) => item.key === key);
  return field ? field.max : 400;
}

/* —— Taille normée (source FR/cm) + aperçu inch (cm → in seulement) —— */
let dimsEditorSeq = 0;

function parseDimsNumber(raw) {
  const n = parseFloat(
    String(raw || "")
      .replace(/\s+/g, "")
      .replace(",", ".")
  );
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

/** Affichage FR : virgule, sans .0 superflu. */
function formatFrCm(n) {
  if (!Number.isFinite(n) || !(n > 0)) return "";
  const rounded = Math.round(n * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace(".", ",");
}

function formatInchesFromCm(cm) {
  if (!Number.isFinite(cm) || !(cm > 0)) return "";
  const inches = Math.round((cm / 2.54) * 10) / 10;
  return Number.isInteger(inches) ? String(inches) : inches.toFixed(1);
}

function formatPairCm(h, w) {
  const fh = formatFrCm(h);
  const fw = formatFrCm(w);
  if (!fh || !fw) return "";
  return `${fh} x ${fw} cm`;
}

/**
 * Parse free-text / legacy dimensions into structured parts.
 * Canon : « H x L cm », « H x L cm avec cadre : H x L cm », « Diamètre : D cm ».
 */
function parseDimensionsParts(raw) {
  const empty = {
    mode: "pair",
    h: NaN,
    w: NaN,
    frameH: NaN,
    frameW: NaN,
    diam: NaN,
    warn: "",
  };
  const text = String(raw || "")
    .replace(/\u00a0/g, " ")
    .trim();
  if (!text) return empty;
  if (/\bpx\b/i.test(text)) return { ...empty, warn: "px" };

  const unit = "(?:cm|centim[eè]tres?)\\b";
  const pairRe = `([\\d\\s.,]+)\\s*[x×X]\\s*([\\d\\s.,]+)\\s*${unit}`;

  const diam = text.match(
    new RegExp(`(?:diam[eè]tre|ø|diameter)\\s*:?\\s*([\\d\\s.,]+)\\s*${unit}`, "i")
  );
  if (diam) {
    return { ...empty, mode: "diam", diam: parseDimsNumber(diam[1]) };
  }

  const framed = text.match(
    new RegExp(
      `${pairRe}\\s*(?:avec\\s+cadre|with\\s+frame|cadre)\\s*:?\\s*${pairRe}`,
      "i"
    )
  );
  if (framed) {
    return {
      ...empty,
      mode: "pair",
      h: parseDimsNumber(framed[1]),
      w: parseDimsNumber(framed[2]),
      frameH: parseDimsNumber(framed[3]),
      frameW: parseDimsNumber(framed[4]),
    };
  }

  const frameOnly = text.match(
    new RegExp(`(?:avec\\s+cadre|with\\s+frame|cadre)\\s*:?\\s*${pairRe}`, "i")
  );
  const pair = text.match(new RegExp(pairRe, "i"));
  if (pair && frameOnly && frameOnly.index > (pair.index || 0)) {
    return {
      ...empty,
      mode: "pair",
      h: parseDimsNumber(pair[1]),
      w: parseDimsNumber(pair[2]),
      frameH: parseDimsNumber(frameOnly[1]),
      frameW: parseDimsNumber(frameOnly[2]),
    };
  }
  if (frameOnly && !pair) {
    return {
      ...empty,
      mode: "pair",
      h: parseDimsNumber(frameOnly[1]),
      w: parseDimsNumber(frameOnly[2]),
      frameH: parseDimsNumber(frameOnly[1]),
      frameW: parseDimsNumber(frameOnly[2]),
    };
  }
  if (pair) {
    return {
      ...empty,
      mode: "pair",
      h: parseDimsNumber(pair[1]),
      w: parseDimsNumber(pair[2]),
    };
  }

  const single = text.match(new RegExp(`([\\d\\s.,]+)\\s*${unit}`, "i"));
  if (single) {
    const d = parseDimsNumber(single[1]);
    return { ...empty, mode: "diam", diam: d };
  }
  return { ...empty, warn: "format" };
}

function formatDimensionsParts(parts) {
  if (!parts) return "";
  if (parts.mode === "diam") {
    const d = formatFrCm(parts.diam);
    return d ? `Diamètre : ${d} cm` : "";
  }
  const pair = formatPairCm(parts.h, parts.w);
  if (!pair) return "";
  const frame = formatPairCm(parts.frameH, parts.frameW);
  if (frame) return `${pair} avec cadre : ${frame}`;
  return pair;
}

/** Norme une chaîne libre vers le canon Atelier (inchangée si vide / px). */
function normalizeDimensionsText(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  if (/\bpx\b/i.test(text)) return text;
  const parts = parseDimensionsParts(text);
  const out = formatDimensionsParts(parts);
  return out || text;
}

function inchPairLabel(h, w) {
  const ih = formatInchesFromCm(h);
  const iw = formatInchesFromCm(w);
  if (!ih || !iw) return "";
  return `≈ ${ih} × ${iw} in`;
}

/**
 * Éditeur taille : H×L cm (option cadre) ou diamètre + aperçu inch (cm → in).
 * Écrit la chaîne canon dans un input caché (data-edit / data-field = dimensions).
 */
function mountDimensionsEditor({
  value = "",
  nameAttr = "data-edit",
  onChange = null,
  className = "edit-field",
} = {}) {
  const uid = `dims-${++dimsEditorSeq}`;
  const wrap = document.createElement("div");
  wrap.className = `${className} dims-editor`;
  wrap.dataset.dimsEditor = "1";

  const title = document.createElement("span");
  title.className = "dims-editor-label";
  title.textContent = "taille";
  wrap.append(title);

  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.setAttribute(nameAttr, "dimensions");
  hidden.maxLength = metaMax("dimensions");
  wrap.append(hidden);

  const modeRow = document.createElement("div");
  modeRow.className = "dims-mode";
  const modePair = document.createElement("label");
  const modePairInput = document.createElement("input");
  modePairInput.type = "radio";
  modePairInput.name = `${uid}-mode`;
  modePairInput.value = "pair";
  modePair.append(modePairInput, document.createTextNode(" H × L"));
  const modeDiam = document.createElement("label");
  const modeDiamInput = document.createElement("input");
  modeDiamInput.type = "radio";
  modeDiamInput.name = `${uid}-mode`;
  modeDiamInput.value = "diam";
  modeDiam.append(modeDiamInput, document.createTextNode(" Diamètre"));
  modeRow.append(modePair, modeDiam);
  wrap.append(modeRow);

  const pairBox = document.createElement("div");
  pairBox.className = "dims-pair";
  const pairRow = document.createElement("div");
  pairRow.className = "dims-row";
  const inputH = document.createElement("input");
  inputH.type = "text";
  inputH.inputMode = "decimal";
  inputH.dataset.dims = "h";
  inputH.setAttribute("aria-label", "Hauteur cm");
  inputH.placeholder = "H";
  const times = document.createElement("span");
  times.className = "dims-times";
  times.textContent = "×";
  const inputW = document.createElement("input");
  inputW.type = "text";
  inputW.inputMode = "decimal";
  inputW.dataset.dims = "w";
  inputW.setAttribute("aria-label", "Largeur cm");
  inputW.placeholder = "L";
  const unitCm = document.createElement("span");
  unitCm.className = "dims-unit";
  unitCm.textContent = "cm";
  const inchPair = document.createElement("span");
  inchPair.className = "dims-inch";
  inchPair.dataset.dimsInch = "pair";
  pairRow.append(inputH, times, inputW, unitCm, inchPair);
  pairBox.append(pairRow);

  const frameToggle = document.createElement("label");
  frameToggle.className = "dims-frame-toggle";
  const frameCheck = document.createElement("input");
  frameCheck.type = "checkbox";
  frameCheck.dataset.dimsFrame = "1";
  frameToggle.append(frameCheck, document.createTextNode(" avec cadre"));
  pairBox.append(frameToggle);

  const frameRow = document.createElement("div");
  frameRow.className = "dims-row";
  frameRow.hidden = true;
  const inputFH = document.createElement("input");
  inputFH.type = "text";
  inputFH.inputMode = "decimal";
  inputFH.dataset.dims = "frameH";
  inputFH.setAttribute("aria-label", "Hauteur avec cadre cm");
  inputFH.placeholder = "H";
  const timesF = document.createElement("span");
  timesF.className = "dims-times";
  timesF.textContent = "×";
  const inputFW = document.createElement("input");
  inputFW.type = "text";
  inputFW.inputMode = "decimal";
  inputFW.dataset.dims = "frameW";
  inputFW.setAttribute("aria-label", "Largeur avec cadre cm");
  inputFW.placeholder = "L";
  const unitF = document.createElement("span");
  unitF.className = "dims-unit";
  unitF.textContent = "cm";
  const inchFrame = document.createElement("span");
  inchFrame.className = "dims-inch";
  inchFrame.dataset.dimsInch = "frame";
  frameRow.append(inputFH, timesF, inputFW, unitF, inchFrame);
  pairBox.append(frameRow);
  wrap.append(pairBox);

  const diamBox = document.createElement("div");
  diamBox.className = "dims-diam";
  diamBox.hidden = true;
  const diamRow = document.createElement("div");
  diamRow.className = "dims-row";
  const inputDiam = document.createElement("input");
  inputDiam.type = "text";
  inputDiam.inputMode = "decimal";
  inputDiam.dataset.dims = "diam";
  inputDiam.setAttribute("aria-label", "Diamètre cm");
  inputDiam.placeholder = "Ø";
  const unitD = document.createElement("span");
  unitD.className = "dims-unit";
  unitD.textContent = "cm";
  const inchDiam = document.createElement("span");
  inchDiam.className = "dims-inch";
  inchDiam.dataset.dimsInch = "diam";
  diamRow.append(inputDiam, unitD, inchDiam);
  diamBox.append(diamRow);
  wrap.append(diamBox);

  const preview = document.createElement("p");
  preview.className = "dims-preview";
  preview.dataset.dimsPreview = "1";
  wrap.append(preview);

  const warn = document.createElement("p");
  warn.className = "dims-warn";
  warn.hidden = true;
  wrap.append(warn);

  const setInputCm = (el, n) => {
    el.value = Number.isFinite(n) && n > 0 ? formatFrCm(n) : "";
  };

  const readParts = () => {
    const mode = modeDiamInput.checked ? "diam" : "pair";
    if (mode === "diam") {
      return {
        mode: "diam",
        h: NaN,
        w: NaN,
        frameH: NaN,
        frameW: NaN,
        diam: parseDimsNumber(inputDiam.value),
        warn: "",
      };
    }
    return {
      mode: "pair",
      h: parseDimsNumber(inputH.value),
      w: parseDimsNumber(inputW.value),
      frameH: frameCheck.checked ? parseDimsNumber(inputFH.value) : NaN,
      frameW: frameCheck.checked ? parseDimsNumber(inputFW.value) : NaN,
      diam: NaN,
      warn: "",
    };
  };

  const sync = ({ emit = true } = {}) => {
    const parts = readParts();
    const canon = formatDimensionsParts(parts).slice(0, metaMax("dimensions"));
    hidden.value = canon;
    preview.textContent = canon ? `Enregistré : ${canon}` : "Enregistré : (vide)";
    if (parts.mode === "diam") {
      const id = formatInchesFromCm(parts.diam);
      inchDiam.textContent = id ? `≈ ${id} in` : "";
      inchPair.textContent = "";
      inchFrame.textContent = "";
    } else {
      inchPair.textContent = inchPairLabel(parts.h, parts.w);
      inchFrame.textContent = frameCheck.checked
        ? inchPairLabel(parts.frameH, parts.frameW)
        : "";
      inchDiam.textContent = "";
    }
    pairBox.hidden = parts.mode === "diam";
    diamBox.hidden = parts.mode !== "diam";
    frameRow.hidden = parts.mode !== "pair" || !frameCheck.checked;
    if (emit && typeof onChange === "function") onChange(canon);
  };

  const loadFromValue = (raw) => {
    const parts = parseDimensionsParts(raw);
    if (parts.warn === "px") {
      warn.hidden = false;
      warn.textContent =
        "Valeur en pixels (ignorée pour l’échelle). Saisir la taille réelle en cm.";
      hidden.value = String(raw || "").trim();
      preview.textContent = `Brut : ${hidden.value}`;
    } else if (parts.warn === "format" && String(raw || "").trim()) {
      warn.hidden = false;
      warn.textContent = "Format non reconnu — saisir H × L ou diamètre en cm.";
    } else {
      warn.hidden = true;
      warn.textContent = "";
    }
    if (parts.mode === "diam" && Number.isFinite(parts.diam)) {
      modeDiamInput.checked = true;
      setInputCm(inputDiam, parts.diam);
    } else {
      modePairInput.checked = true;
      setInputCm(inputH, parts.h);
      setInputCm(inputW, parts.w);
      const hasFrame =
        Number.isFinite(parts.frameH) && Number.isFinite(parts.frameW);
      frameCheck.checked = hasFrame;
      setInputCm(inputFH, parts.frameH);
      setInputCm(inputFW, parts.frameW);
    }
    sync({ emit: false });
  };

  modePairInput.addEventListener("change", () => sync());
  modeDiamInput.addEventListener("change", () => sync());
  frameCheck.addEventListener("change", () => sync());
  [inputH, inputW, inputFH, inputFW, inputDiam].forEach((el) => {
    el.addEventListener("input", () => sync());
  });

  loadFromValue(value);
  return wrap;
}

function workCaption(work) {
  return [work.support, work.dimensions, work.note].filter(Boolean).join(" · ");
}

function emptyMeta() {
  return {
    artist: "",
    title: "",
    note: "",
    signed_dated: "",
    support: "",
    dimensions: "",
    editions: "",
    alt: "",
  };
}

let previewReady = false;
/** @type {Array<{file: File, artist: string, title: string, note: string, signed_dated: string, support: string, dimensions: string, editions: string, alt: string, categories: string[], detailBlob: Blob|null, webBlob: Blob|null, previewBlob: Blob|null, detailMeta: {keptOriginal: boolean}|null, webMeta: object|null, previewMeta: object|null, objectUrl: string}>} */
let pendingItems = [];
/** Empêche une sélection concurrente pendant la lecture EXIF. */
let pickBusy = false;
/** @type {Array<object>} */
let libraryWorks = [];
/** @type {Set<string>} */
let selectedIds = new Set();
/** Page courante bibliothèque (1-indexée), après filtres. */
let libraryPage = 1;
/** Tri courant (persisté localStorage). */
let librarySort = SORT_DEFAULT;
/** PATCH ordre vitrine en vol. */
let reorderBusy = false;
/** Des changements locaux attendent le flush réseau. */
let reorderDirty = false;
/** Timer debounce flush ordre. */
let reorderTimer = 0;
/** Snapshot id → order après dernier save réussi / load. */
let savedFrontOrders = new Map();
/** Id en cours de drag (mode ordre front). */
let dragWorkId = null;
const REORDER_DEBOUNCE_MS = 280;

function readStoredSort() {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (raw && SORT_VALUES.has(raw)) return raw;
  } catch {
    /* private mode */
  }
  return SORT_DEFAULT;
}

function syncSortButtons() {
  if (!catalogSort) return;
  catalogSort.querySelectorAll(".sort-btn[data-sort]").forEach((btn) => {
    const active = btn.dataset.sort === librarySort;
    btn.classList.toggle("is-pressed", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function persistSort(value) {
  librarySort = SORT_VALUES.has(value) ? value : SORT_DEFAULT;
  try {
    localStorage.setItem(SORT_STORAGE_KEY, librarySort);
  } catch {
    /* private mode */
  }
  syncSortButtons();
}

function initCatalogSort() {
  librarySort = readStoredSort();
  syncSortButtons();
}

/** max(updated_at, created_at) — activité récente pour le tri défaut. */
function activityAt(work) {
  const updated = (work && work.updated_at) || "";
  const created = (work && work.created_at) || "";
  return updated > created ? updated : created;
}

initCatalogSort();

function isImageFile(file) {
  if (!file) return false;
  if (IMAGE_TYPES.has(file.type)) return true;
  return /\.(jpe?g|png|webp)$/i.test(file.name || "");
}

function formatBytes(n) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

function setPickMenuOpen(open) {
  if (!pickMenu || !pickImageButton) return;
  pickMenu.hidden = !open;
  pickImageButton.setAttribute("aria-expanded", open ? "true" : "false");
}

function pickExifString(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(Array.isArray(value) ? value.join(", ") : value).trim();
    if (text) return text;
  }
  return "";
}

async function readFileExif(file) {
  const empty = {
    artist: "",
    title: "",
    note: "",
    signed_dated: "",
    support: "",
    dimensions: "",
    editions: "",
  };
  if (!file || typeof window.exifr?.parse !== "function") return empty;
  try {
    const raw = await window.exifr.parse(file, {
      tiff: true,
      ifd0: true,
      exif: true,
      gps: false,
      interop: false,
      iptc: true,
      xmp: true,
      icc: false,
      jfif: false,
      ihdr: false,
      mergeOutput: true,
      translateKeys: true,
      reviveValues: true,
    });
    if (!raw || typeof raw !== "object") return empty;
    const artist = pickExifString(
      raw.Artist,
      raw.artist,
      raw.Creator,
      raw.creator,
      raw.Byline,
      raw.byline,
      raw.Credit,
      raw.Copyright,
    );
    const titlePrimary = pickExifString(
      raw.ObjectName,
      raw.Headline,
      raw.title,
      raw.Title,
      raw["dc:title"],
    );
    const description = pickExifString(
      raw.Caption,
      raw.CaptionAbstract,
      raw.Description,
      raw.description,
      raw["dc:description"],
      raw.ImageDescription,
    );
    // Titre dédié si présent ; sinon description / ImageDescription.
    const title = titlePrimary || description;
    // Note = description seulement si distincte du titre déjà choisi.
    const note =
      description && description !== title ? description : "";
    const signedRaw = pickExifString(
      raw.DateTimeOriginal,
      raw.CreateDate,
      raw.DateCreated,
      raw.DateTimeDigitized,
    );
    let signed_dated = signedRaw;
    // exifr reviveValues peut renvoyer un Date — formater lisiblement.
    if (signedRaw && /^\w{3} \w{3}/.test(signedRaw) && signedRaw.includes("GMT")) {
      try {
        const d = new Date(signedRaw);
        if (!Number.isNaN(d.getTime())) {
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, "0");
          const day = String(d.getUTCDate()).padStart(2, "0");
          signed_dated = `${y}-${m}-${day}`;
        }
      } catch {
        /* keep raw */
      }
    } else if (/^\d{4}:\d{2}:\d{2}/.test(signedRaw)) {
      signed_dated = signedRaw.replace(/^(\d{4}):(\d{2}):(\d{2}).*$/, "$1-$2-$3");
    }
    // Support artistique (IPTC/XMP) avant infos appareil.
    const support = pickExifString(
      raw.Material,
      raw.medium,
      raw.Medium,
      raw.Source,
      raw.Make,
      raw.Model,
      raw.Software,
    );
    const dimText = pickExifString(
      raw.Dimensions,
      raw.dimensions,
      raw["exif:ImageDescription"],
    );
    const w = raw.ImageWidth || raw.ExifImageWidth || raw.PixelXDimension;
    const h = raw.ImageHeight || raw.ExifImageHeight || raw.PixelYDimension;
    const dimensions =
      dimText || (w && h ? `${w} × ${h} px` : "");
    const editions = pickExifString(
      raw.Instructions,
      raw.SpecialInstructions,
      raw.editions,
    );
    return {
      artist: artist.slice(0, metaMax("artist")),
      title: title.slice(0, metaMax("title")),
      note: note.slice(0, metaMax("note")),
      signed_dated: String(signed_dated).slice(0, metaMax("signed_dated")),
      support: support.slice(0, metaMax("support")),
      dimensions: dimensions.slice(0, metaMax("dimensions")),
      editions: editions.slice(0, metaMax("editions")),
    };
  } catch (error) {
    return empty;
  }
}

function defaultCategories() {
  return [...form.querySelectorAll("input[name=category]:checked")].map((input) => input.value);
}

function prefersReduce() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (error) {
    return false;
  }
}

function encodeType() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    if (canvas.toDataURL("image/webp").startsWith("data:image/webp")) return "image/webp";
  } catch (error) {}
  return "image/jpeg";
}

function needsCarouselCrop(nw, nh) {
  if (!(nw > 0 && nh > 0)) return true;
  return Math.abs(Math.log(nw / nh / CAROUSEL_AR)) >= CAROUSEL_AR_LOG_THRESHOLD;
}

function sourcePathForCrop(work) {
  return (work && (work.web || work.image || work.preview)) || "";
}

function loadImageNaturalSize(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight, image });
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}

function cropLabel(work) {
  return work && work.carousel_image ? "Recadré" : "Recadrer pour le carousel";
}

function loadBitmap(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}

function encodeFrom(image, maxWidth, maxHeight, type, quality = WEB_JPEG_QUALITY) {
  return new Promise((resolve, reject) => {
    const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("format"));
        return;
      }
      resolve({ blob, width: canvas.width, height: canvas.height });
    }, type, quality);
  });
}

function extensionFor(blob) {
  if (blob.type === "image/png") return "png";
  if (blob.type === "image/jpeg") return "jpg";
  return "webp";
}

function titleFromFileName(name) {
  return String(name || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, metaMax("title")) || "Sans titre";
}

function clearPending() {
  pendingItems.forEach((item) => {
    if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
  });
  pendingItems = [];
  previewReady = false;
  publishButton.disabled = true;
  panel.hidden = true;
  previewBatch.replaceChildren();
  uploadQueue.hidden = true;
  uploadQueue.replaceChildren();
  if (imageInput) imageInput.value = "";
  if (imageFolderInput) imageFolderInput.value = "";
}

function markStale() {
  previewReady = false;
  publishButton.disabled = true;
  hint.textContent = "Regardez l’aperçu avant d’enregistrer.";
  pendingItems.forEach((item) => {
    item.detailBlob = null;
    item.webBlob = null;
    item.previewBlob = null;
    item.detailMeta = null;
    item.webMeta = null;
    item.previewMeta = null;
  });
}

function syncQueueFromDom() {
  [...uploadQueue.querySelectorAll(".upload-item")].forEach((row, index) => {
    const item = pendingItems[index];
    if (!item) return;
    META_FIELDS.forEach(({ key }) => {
      const input = row.querySelector(`[data-field="${key}"]`);
      if (!input) return;
      const raw = input.value.trim();
      item[key] = key === "dimensions" ? normalizeDimensionsText(raw) : raw;
    });
    const altInput = row.querySelector("[data-field=alt]");
    if (altInput) item.alt = altInput.value.trim();
    item.categories = [...row.querySelectorAll("input[data-cat]:checked")].map((el) => el.value);
  });
}

function renderUploadQueue() {
  uploadQueue.replaceChildren();
  if (!pendingItems.length) {
    uploadQueue.hidden = true;
    return;
  }
  uploadQueue.hidden = false;
  pendingItems.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "upload-item";
    row.dataset.index = String(index);

    const thumb = document.createElement("img");
    thumb.src = item.objectUrl;
    thumb.alt = "";
    thumb.className = "upload-thumb";

    const fields = document.createElement("div");
    fields.className = "upload-fields";

    const makeLabel = (text, field, value, max, multiline = false, rows = 4) => {
      const label = document.createElement("label");
      label.textContent = text;
      const input = multiline
        ? document.createElement("textarea")
        : document.createElement("input");
      if (!multiline) input.type = "text";
      else {
        input.rows = rows;
        input.spellcheck = true;
      }
      input.dataset.field = field;
      input.maxLength = max;
      input.value = value;
      input.addEventListener("input", markStale);
      label.append(input);
      return label;
    };

    META_FIELDS.forEach(({ key, label, max, multiline, rows }) => {
      if (key === "dimensions") {
        fields.append(
          mountDimensionsEditor({
            value: item[key] || "",
            nameAttr: "data-field",
            className: "upload-dims",
            onChange: () => markStale(),
          })
        );
        return;
      }
      fields.append(
        makeLabel(label, key, item[key] || "", max, !!multiline, rows || 4)
      );
    });
    fields.append(
      makeLabel("texte alternatif", "alt", item.alt, META_ALT_MAX, true, 2)
    );

    const cats = document.createElement("fieldset");
    cats.className = "upload-cats";
    const legend = document.createElement("legend");
    legend.textContent = "à cocher";
    cats.append(legend);
    CATEGORY_KEYS.forEach((key) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.cat = "1";
      input.value = key;
      input.checked = item.categories.includes(key);
      input.addEventListener("change", markStale);
      label.append(input, document.createTextNode(` ${CATEGORY_LABELS[key]}`));
      cats.append(label);
    });
    fields.append(cats);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "upload-remove";
    remove.textContent = "Retirer";
    remove.addEventListener("click", () => {
      if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
      pendingItems.splice(index, 1);
      markStale();
      renderUploadQueue();
      fileName.textContent = pendingItems.length
        ? `${pendingItems.length} image${pendingItems.length > 1 ? "s" : ""}`
        : "Aucun fichier choisi";
      if (!pendingItems.length) {
        if (imageInput) imageInput.value = "";
        if (imageFolderInput) imageFolderInput.value = "";
        panel.hidden = true;
      }
    });

    row.append(thumb, fields, remove);
    uploadQueue.append(row);
  });
}

function selectionSummary(files) {
  if (!files.length) return "Aucun fichier image (JPEG / PNG / WebP).";
  const total = files.reduce((sum, f) => sum + (f.size || 0), 0);
  return `${files.length} image${files.length > 1 ? "s" : ""} · ${formatBytes(total)}`;
}

async function setPendingFromFiles(fileList) {
  if (pickBusy) return;
  pickBusy = true;
  // Copier avant clearPending() : FileList est live et se vide si l’input est reset.
  const files = [...(fileList || [])].filter(isImageFile);
  clearPending();
  const defaults = defaultCategories();
  fileName.textContent = selectionSummary(files);
  if (!files.length) {
    status.textContent = "Aucun fichier image (JPEG / PNG / WebP) dans la sélection.";
    pickBusy = false;
    return;
  }

  status.textContent = `Lecture EXIF / IPTC… 0 / ${files.length}`;
  let filled = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    status.textContent = `Lecture EXIF / IPTC… ${i + 1} / ${files.length}`;
    const exif = await readFileExif(file);
    const title = exif.title || titleFromFileName(file.name);
    const hasMeta = Boolean(
      exif.artist ||
        exif.title ||
        exif.note ||
        exif.signed_dated ||
        exif.support ||
        exif.dimensions ||
        exif.editions
    );
    if (hasMeta) filled += 1;
    pendingItems.push({
      file,
      ...emptyMeta(),
      artist: exif.artist || "",
      title,
      note: exif.note || "",
      signed_dated: exif.signed_dated || "",
      support: exif.support || "",
      dimensions: normalizeDimensionsText(exif.dimensions || ""),
      editions: exif.editions || "",
      alt: title,
      categories: defaults.length ? defaults.slice() : ["peinture"],
      detailBlob: null,
      webBlob: null,
      previewBlob: null,
      detailMeta: null,
      webMeta: null,
      previewMeta: null,
      objectUrl: URL.createObjectURL(file),
    });
  }
  renderUploadQueue();
  markStale();
  status.textContent = filled
    ? `${files.length} image${files.length > 1 ? "s" : ""} — EXIF / IPTC lus pour ${filled}. Corrigez si besoin, puis aperçu.`
    : `${files.length} image${files.length > 1 ? "s" : ""} — pas de métadonnées EXIF / IPTC ; titre depuis le nom de fichier.`;
  pickBusy = false;
}

function renderBatchPreview() {
  previewBatch.replaceChildren();
  const lines = [];
  pendingItems.forEach((item) => {
    if (!item.webMeta || !item.previewMeta) return;
    const block = document.createElement("div");
    block.className = "preview-one";

    const article = document.createElement("article");
    article.className = "art-card";
    const frame = document.createElement("div");
    frame.className = "art-open";
    const thumb = document.createElement("img");
    thumb.className = "art-preview";
    thumb.src = URL.createObjectURL(item.previewBlob);
    thumb.alt = item.alt || item.title;
    frame.append(thumb);
    const meta = document.createElement("div");
    meta.className = "art-meta";
    const artistLine = document.createElement("span");
    artistLine.className = "art-artist";
    artistLine.textContent = item.artist;
    const heading = document.createElement("h3");
    heading.textContent = item.title || "Sans titre";
    meta.append(artistLine, heading);
    const caption = workCaption(item);
    if (caption) {
      const line = document.createElement("p");
      line.textContent = caption;
      meta.append(line);
    }
    article.append(frame, meta);
    block.append(article);
    previewBatch.append(block);

    const webInfo = item.webMeta
      ? `web ${item.webMeta.width}×${item.webMeta.height}`
      : "web —";
    lines.push(
      `${item.title}: vignette ${item.previewMeta.width}×${item.previewMeta.height}, ${webInfo}`
    );
  });
  sizes.textContent = lines.join(" · ");
  panel.hidden = false;
}

async function buildPreview() {
  status.textContent = "";
  syncQueueFromDom();
  if (!pendingItems.length) {
    status.textContent = "Choisissez une ou plusieurs images.";
    imageInput.focus();
    return;
  }
  for (const item of pendingItems) {
    if (item.file.size > MAX_SOURCE_BYTES) {
      status.textContent = `« ${item.file.name} » est trop lourde (max ${formatBytes(MAX_SOURCE_BYTES)}).`;
      return;
    }
    if (!item.artist || !item.title) {
      status.textContent = "Chaque image doit avoir un artiste et un titre.";
      return;
    }
    if (!item.categories.length) {
      status.textContent = "Cochez au moins peinture, miniature ou aquarelle.";
      return;
    }
  }

  previewButton.disabled = true;
  try {
    const type = encodeType();
    for (const item of pendingItems) {
      const loaded = await loadBitmap(item.file);
      try {
        const webPart = await encodeFrom(
          loaded.image,
          WEB_MAX_EDGE,
          WEB_MAX_EDGE,
          type,
          WEB_JPEG_QUALITY
        );
        const previewPart = await encodeFrom(
          loaded.image,
          PREVIEW_MAX_EDGE,
          Number.POSITIVE_INFINITY,
          type,
          WEB_JPEG_QUALITY
        );
        const canKeepOriginal =
          item.file.size <= MAX_BYTES &&
          /^(image\/jpeg|image\/png|image\/webp)$/i.test(item.file.type || "");
        if (canKeepOriginal) {
          item.detailBlob = item.file;
          item.detailMeta = { keptOriginal: true };
        } else {
          /* Oversized source: original KV slot stores the same encode as web. */
          item.detailBlob = webPart.blob;
          item.detailMeta = { keptOriginal: false };
        }
        item.webBlob = webPart.blob;
        item.previewBlob = previewPart.blob;
        item.webMeta = { width: webPart.width, height: webPart.height };
        item.previewMeta = { width: previewPart.width, height: previewPart.height };
      } finally {
        URL.revokeObjectURL(loaded.url);
      }
    }
    renderBatchPreview();
    previewReady = true;
    publishButton.disabled = false;
    hint.textContent = pendingItems.length > 1
      ? `${pendingItems.length} aperçus à jour (original + web + vignette). Vous pouvez enregistrer.`
      : "L’aperçu est à jour (original + web + vignette). Vous pouvez enregistrer.";
    panel.scrollIntoView({ behavior: prefersReduce() ? "auto" : "smooth", block: "nearest" });
  } catch (error) {
    previewReady = false;
    publishButton.disabled = true;
    status.textContent = "Ces images ne peuvent pas être préparées.";
  } finally {
    previewButton.disabled = false;
  }
}

async function publish() {
  syncQueueFromDom();
  if (!previewReady || !pendingItems.length) return;
  if (pendingItems.some((item) => !item.detailBlob || !item.webBlob || !item.previewBlob)) {
    status.textContent = "Regardez l’aperçu avant d’enregistrer.";
    return;
  }
  publishButton.disabled = true;
  status.textContent = "";
  const exposed = defaultExposed && defaultExposed.checked;
  const carousel = defaultCarousel && defaultCarousel.checked;
  let ok = 0;
  try {
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      status.textContent = `Enregistrement ${i + 1} / ${pendingItems.length}…`;
      const body = new FormData();
      body.set("artist", item.artist);
      body.set("title", item.title);
      body.set("note", item.note || "");
      body.set("signed_dated", item.signed_dated || "");
      body.set("support", item.support || "");
      body.set("dimensions", normalizeDimensionsText(item.dimensions || ""));
      body.set("editions", item.editions || "");
      body.set("alt", item.alt || item.title);
      body.set("categories", item.categories.join(" "));
      body.set("source_file", item.file && item.file.name ? item.file.name : "");
      if (exposed) body.set("exposed", "1");
      if (carousel) body.set("carousel", "1");
      const detailName =
        item.detailMeta && item.detailMeta.keptOriginal && item.file && item.file.name
          ? item.file.name
          : `detail.${extensionFor(item.detailBlob)}`;
      body.set("detail", item.detailBlob, detailName);
      body.set("web", item.webBlob, `web.${extensionFor(item.webBlob)}`);
      body.set("preview", item.previewBlob, `preview.${extensionFor(item.previewBlob)}`);
      const response = await fetch("api/oeuvres", {
        method: "POST",
        body,
        credentials: "same-origin",
        headers: { "X-Atelier": "1" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        status.textContent = payload.error || `Échec sur « ${item.title} ».`;
        publishButton.disabled = false;
        await loadLibrary();
        return;
      }
      ok += 1;
    }
    clearPending();
    fileName.textContent = "Aucun fichier choisi";
    document.querySelector('input[value="peinture"]').checked = true;
    form.querySelectorAll('input[name=category]').forEach((el) => {
      if (el.value !== "peinture") el.checked = false;
    });
    if (defaultExposed) defaultExposed.checked = false;
    if (defaultCarousel) defaultCarousel.checked = false;
    hint.textContent = "Regardez l’aperçu avant d’enregistrer.";
    status.textContent = ok > 1 ? `${ok} œuvres enregistrées.` : "L’œuvre est enregistrée.";
    await loadLibrary();
  } catch (error) {
    status.textContent = "Enregistrement impossible.";
    publishButton.disabled = false;
  }
}

function isAjout(work) {
  return work.source === "ajout" || ID_PATTERN.test(work.id || "");
}

function isExposee(work) {
  return work.source === "exposee" || EXPOSEE_ID_PATTERN.test(work.id || "");
}

/** Siècle déjà écrit dans les métadonnées, sinon chaîne vide (jamais inventé). */
function periodFromNote(work) {
  const blob = [work.note, work.support, work.signed_dated, work.title]
    .filter((part) => typeof part === "string" && part)
    .join(" ");
  const match = blob.match(PERIOD_PATTERN);
  return match ? match[0].replace(/e\s*siècle/i, "ᵉ siècle") : "";
}

/** URL média : ajouts via KV auth ; exposées via proxy atelier/media (même Basic Auth). */
function mediaUrl(path, rev = "") {
  if (typeof path !== "string" || !path) return "";
  let url = path.startsWith("images/ajouts/")
    ? `../${path}`
    : path.startsWith("images/")
      ? `media/${path}`
      : `../${path}`;
  const stamp = String(rev || "").trim().replace(/\s+/g, "");
  if (stamp) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}v=${encodeURIComponent(stamp)}`;
  }
  return url;
}

function carouselMediaUrl(work) {
  if (!work || !work.carousel_image) return "";
  return mediaUrl(work.carousel_image, work.updated_at || "");
}

function isFrontOrderMode() {
  return librarySort === SORT_ORDER;
}

/** Ordre vitrine = listWorks / GET /api/oeuvres. */
function compareFrontOrder(a, b) {
  const oa = Number(a.order) || 0;
  const ob = Number(b.order) || 0;
  if (oa !== ob) return oa - ob;
  const da = a.created_at || "";
  const db = b.created_at || "";
  if (da !== db) return da < db ? -1 : 1;
  return String(a.id || "").localeCompare(String(b.id || ""));
}

function snapshotFrontOrders(works = libraryWorks) {
  savedFrontOrders = new Map(
    works.map((work) => [work.id, Number(work.order) || 0])
  );
}

function orderedWorks(list) {
  const collator = new Intl.Collator("fr", { sensitivity: "base" });
  const mode = SORT_VALUES.has(librarySort) ? librarySort : SORT_DEFAULT;
  return list.slice().sort((a, b) => {
    if (mode === SORT_RECENT || mode === SORT_OLDEST) {
      const da = activityAt(a);
      const db = activityAt(b);
      if (da !== db) {
        if (mode === SORT_RECENT) return da < db ? 1 : -1;
        return da < db ? -1 : 1;
      }
      return collator.compare(a.title || "", b.title || "");
    }
    if (mode === SORT_ARTIST) {
      const byArtist = collator.compare(a.artist || "", b.artist || "");
      if (byArtist) return byArtist;
      return collator.compare(a.title || "", b.title || "");
    }
    if (mode === SORT_TITLE) {
      return collator.compare(a.title || "", b.title || "");
    }
    return compareFrontOrder(a, b);
  });
}

/**
 * Réordonne le sous-ensemble filtré dans la liste globale, densifie
 * localement (10, 20, …), puis planifie un PATCH delta debouncé.
 */
function applyFilteredFrontOrder(filteredIds) {
  if (!Array.isArray(filteredIds) || !filteredIds.length) return false;
  const filteredSet = new Set(filteredIds);
  if (filteredSet.size !== filteredIds.length) return false;

  const byId = new Map(libraryWorks.map((w) => [w.id, w]));
  for (const id of filteredIds) {
    if (!byId.has(id)) return false;
  }

  const full = libraryWorks.slice().sort(compareFrontOrder);
  let fi = 0;
  const merged = full.map((work) => {
    if (!filteredSet.has(work.id)) return work;
    const nextId = filteredIds[fi++];
    return byId.get(nextId) || work;
  });
  if (fi !== filteredIds.length) return false;

  let changed = 0;
  merged.forEach((work, index) => {
    const order = (index + 1) * 10;
    const local = byId.get(work.id);
    if (!local) return;
    if (Number(local.order) !== order) {
      local.order = order;
      changed += 1;
    }
  });
  libraryWorks = merged.map((work) => byId.get(work.id) || work);
  renderLibrary();
  if (!changed) {
    if (catalogStatus) {
      catalogStatus.textContent = "Ordre d’affichage front enregistré.";
    }
    return true;
  }
  reorderDirty = true;
  if (catalogStatus) catalogStatus.textContent = "Enregistrement de l’ordre vitrine…";
  scheduleFrontOrderFlush();
  return true;
}

function frontOrderDelta() {
  const orders = [];
  libraryWorks.forEach((work) => {
    const order = Number(work.order) || 0;
    if (savedFrontOrders.get(work.id) !== order) {
      orders.push({ id: work.id, order });
    }
  });
  return orders;
}

function scheduleFrontOrderFlush() {
  if (reorderTimer) clearTimeout(reorderTimer);
  reorderTimer = setTimeout(() => {
    reorderTimer = 0;
    void flushFrontOrderSave();
  }, REORDER_DEBOUNCE_MS);
}

async function flushFrontOrderSave() {
  if (reorderBusy) {
    scheduleFrontOrderFlush();
    return;
  }
  if (!reorderDirty) return;
  reorderDirty = false;
  const orders = frontOrderDelta();
  if (!orders.length) {
    if (catalogStatus) {
      catalogStatus.textContent = "Ordre d’affichage front enregistré.";
    }
    return;
  }

  reorderBusy = true;
  try {
    const response = await fetch("api/oeuvres", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Atelier": "1",
      },
      body: JSON.stringify({ orders }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (catalogStatus) {
        catalogStatus.textContent = payload.error || "Échec de l’ordre vitrine.";
      }
      reorderDirty = true;
      await loadLibrary({ preserveStatus: true });
      return;
    }
    const stamp = payload.updated_at || "";
    const byId = new Map(libraryWorks.map((w) => [w.id, w]));
    orders.forEach(({ id, order }) => {
      savedFrontOrders.set(id, order);
      const work = byId.get(id);
      if (work && stamp) work.updated_at = stamp;
    });
    if (catalogStatus) {
      catalogStatus.textContent = "Ordre d’affichage front enregistré.";
    }
  } catch (error) {
    if (catalogStatus) catalogStatus.textContent = "Échec réseau (ordre vitrine).";
    reorderDirty = true;
    await loadLibrary({ preserveStatus: true });
  } finally {
    reorderBusy = false;
    if (reorderDirty) scheduleFrontOrderFlush();
  }
}

function moveWorkInFrontOrder(workId, delta) {
  if (!isFrontOrderMode()) return;
  const visible = filteredWorks();
  const index = visible.findIndex((work) => work.id === workId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= visible.length) return;
  const next = visible.map((work) => work.id);
  const [id] = next.splice(index, 1);
  next.splice(target, 0, id);
  if (!applyFilteredFrontOrder(next)) return;
  const pages = libraryPageCount(next.length);
  const wantPage = Math.floor(target / LIBRARY_PAGE_SIZE) + 1;
  if (wantPage !== libraryPage && wantPage >= 1 && wantPage <= pages) {
    libraryPage = wantPage;
    renderLibrary();
  }
}

function dropWorkInFrontOrder(dragId, targetId) {
  if (!isFrontOrderMode() || !dragId || !targetId || dragId === targetId) {
    return;
  }
  const visible = filteredWorks();
  const from = visible.findIndex((work) => work.id === dragId);
  const to = visible.findIndex((work) => work.id === targetId);
  if (from < 0 || to < 0) return;
  const next = visible.map((work) => work.id);
  const [id] = next.splice(from, 1);
  next.splice(to, 0, id);
  applyFilteredFrontOrder(next);
}

function needsReview(work) {
  const artist = String(work.artist || "").trim();
  return !artist || artist === "À vérifier" || artist === "À identifier";
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function workSearchHaystack(work) {
  const cats = Array.isArray(work.categories) ? work.categories.join(" ") : "";
  return normalizeSearchText(
    [
      work.id,
      work.artist,
      work.title,
      work.note,
      work.support,
      work.dimensions,
      work.signed_dated,
      work.editions,
      work.alt,
      cats,
    ].join(" ")
  );
}

function workMatchesSearch(work, query) {
  const q = normalizeSearchText(query);
  if (!q) return true;
  const hay = workSearchHaystack(work);
  return q.split(/\s+/).filter(Boolean).every((token) => hay.includes(token));
}

function workMatchesFilters(work) {
  const cat = catalogFilterCategory ? catalogFilterCategory.value : "";
  if (cat === "a-verifier") {
    if (!needsReview(work)) return false;
  } else if (cat) {
    const cats = Array.isArray(work.categories) ? work.categories : [];
    if (!cats.includes(cat)) return false;
  }
  const artist = catalogFilterArtist ? catalogFilterArtist.value : "";
  if (artist && (work.artist || "") !== artist) return false;
  const period = catalogFilterPeriod ? catalogFilterPeriod.value : "";
  if (period) {
    const found = periodFromNote(work);
    if (period === PERIOD_NONE) {
      if (found) return false;
    } else if (found !== period) {
      return false;
    }
  }
  const exp = catalogFilterExposed ? catalogFilterExposed.value : "";
  if (exp === "1" && !work.exposed) return false;
  if (exp === "0" && work.exposed) return false;
  if (exp === "carousel" && !work.carousel) return false;
  if (catalogFilterSearch && !workMatchesSearch(work, catalogFilterSearch.value)) return false;
  return true;
}

/** Œuvres visibles uniquement — le reste est masqué, pas réordonné. */
function filteredWorks() {
  return orderedWorks(libraryWorks.filter(workMatchesFilters));
}

function libraryPageCount(total) {
  return Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE) || 1);
}

function clampLibraryPage(total) {
  const pages = libraryPageCount(total);
  if (libraryPage > pages) libraryPage = pages;
  if (libraryPage < 1) libraryPage = 1;
  return pages;
}

/** Slice paginée après filtres + tri (25 / page). */
function pagedWorks() {
  const visible = filteredWorks();
  clampLibraryPage(visible.length);
  const start = (libraryPage - 1) * LIBRARY_PAGE_SIZE;
  return {
    visible,
    pageWorks: visible.slice(start, start + LIBRARY_PAGE_SIZE),
    pages: libraryPageCount(visible.length),
    start,
  };
}

function syncFilterOptions() {
  const collator = new Intl.Collator("fr", { sensitivity: "base" });
  if (catalogFilterArtist) {
    const prev = catalogFilterArtist.value;
    const artists = [...new Set(libraryWorks.map((w) => w.artist || "").filter(Boolean))].sort(collator.compare);
    catalogFilterArtist.replaceChildren();
    const all = document.createElement("option");
    all.value = "";
    all.textContent = "Tous";
    catalogFilterArtist.append(all);
    artists.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      catalogFilterArtist.append(opt);
    });
    catalogFilterArtist.value = artists.includes(prev) ? prev : "";
  }
  if (catalogFilterPeriod) {
    const prev = catalogFilterPeriod.value;
    const periods = [...new Set(libraryWorks.map(periodFromNote).filter(Boolean))].sort(collator.compare);
    const hasNone = libraryWorks.some((w) => !periodFromNote(w));
    catalogFilterPeriod.replaceChildren();
    const all = document.createElement("option");
    all.value = "";
    all.textContent = "Toutes";
    catalogFilterPeriod.append(all);
    periods.forEach((label) => {
      const opt = document.createElement("option");
      opt.value = label;
      opt.textContent = label;
      catalogFilterPeriod.append(opt);
    });
    if (hasNone) {
      const none = document.createElement("option");
      none.value = PERIOD_NONE;
      none.textContent = "Sans période indiquée";
      catalogFilterPeriod.append(none);
    }
    const allowed = new Set(["", PERIOD_NONE, ...periods]);
    catalogFilterPeriod.value = allowed.has(prev) ? prev : "";
  }
}

/** Retire de la sélection les œuvres hors filtre (PDF cohérent). */
function pruneHiddenSelection() {
  const visible = new Set(filteredWorks().map((w) => w.id));
  selectedIds = new Set([...selectedIds].filter((id) => visible.has(id)));
}

function updateCatalogChrome() {
  const { visible, pageWorks, pages, start } = pagedWorks();
  const visibleCount = visible.length;
  const selectedVisible = visible.filter((w) => selectedIds.has(w.id)).length;
  if (catalogToolbar) catalogToolbar.hidden = false;
  catalogPdf.disabled = selectedVisible === 0;
  const total = libraryWorks.length;
  const exposees = libraryWorks.filter((w) => w.exposed).length;
  const carousels = libraryWorks.filter((w) => w.carousel).length;
  const ajouts = libraryWorks.filter(isAjout).length;
  const filteredAway = total - visibleCount;
  const from = visibleCount ? start + 1 : 0;
  const to = start + pageWorks.length;
  const pageBit =
    visibleCount > LIBRARY_PAGE_SIZE
      ? ` · page ${libraryPage}/${pages} (${from}–${to})`
      : "";
  if (!total) {
    catalogCount.textContent = "";
  } else if (filteredAway > 0) {
    catalogCount.textContent =
      `${selectedVisible} sélectionnée${selectedVisible > 1 ? "s" : ""} · ${visibleCount} visible${visibleCount > 1 ? "s" : ""} sur ${total}` +
      ` (${filteredAway} masquée${filteredAway > 1 ? "s" : ""})${pageBit}`;
  } else {
    catalogCount.textContent =
      `${selectedVisible} sélectionnée${selectedVisible > 1 ? "s" : ""} sur ${total}` +
      ` (${exposees} exposée${exposees > 1 ? "s" : ""}${carousels ? `, ${carousels} carousel` : ""}${ajouts ? `, ${ajouts} ajout${ajouts > 1 ? "s" : ""}` : ""})${pageBit}`;
  }
  catalogSelectAll.checked = visibleCount > 0 && selectedVisible === visibleCount;
  catalogSelectAll.indeterminate = selectedVisible > 0 && selectedVisible < visibleCount;
  const showPager = visibleCount > LIBRARY_PAGE_SIZE;
  catalogPagers.forEach((pager) => {
    pager.hidden = !showPager;
    const current = pager.querySelector("[data-page-current]");
    const total = pager.querySelector("[data-page-total]");
    const prev = pager.querySelector("[data-page-prev]");
    const next = pager.querySelector("[data-page-next]");
    if (current) current.textContent = String(libraryPage);
    if (total) total.textContent = String(pages);
    if (prev) prev.disabled = libraryPage <= 1;
    if (next) next.disabled = libraryPage >= pages;
  });
}

function readEditorFields(itemEl) {
  const fields = {};
  META_FIELDS.forEach(({ key }) => {
    const input = itemEl.querySelector(`[data-edit="${key}"]`);
    fields[key] = input ? input.value.trim() : "";
  });
  fields.dimensions = normalizeDimensionsText(fields.dimensions || "");
  const altInput = itemEl.querySelector("[data-edit=alt]");
  fields.alt = altInput ? altInput.value.trim() : "";
  fields.categories = [...itemEl.querySelectorAll("input[data-edit-cat]:checked")].map((el) => el.value);
  fields.exposed = itemEl.querySelector("[data-edit=exposed]").checked;
  const carouselInput = itemEl.querySelector("[data-edit=carousel]");
  fields.carousel = carouselInput ? carouselInput.checked : false;
  return fields;
}

/* —— Recadrage carousel (dérivé hero only) —— */
const cropDialog = document.getElementById("carousel-crop-dialog");
const cropFrame = document.getElementById("carousel-crop-frame");
const cropImage = document.getElementById("carousel-crop-image");
const cropZoom = document.getElementById("carousel-crop-zoom");
const cropStatus = document.getElementById("carousel-crop-status");
const cropLead = document.getElementById("carousel-crop-lead");
const cropConfirmBtn = document.getElementById("carousel-crop-confirm");
const cropCancelBtn = document.getElementById("carousel-crop-cancel");

let cropSession = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setCropBusy(busy) {
  if (cropConfirmBtn) cropConfirmBtn.disabled = !!busy;
  // Annuler reste toujours cliquable pour débloquer le dialog.
  if (cropCancelBtn) cropCancelBtn.disabled = false;
}

function resetCropSession() {
  if (cropSession?.abort) {
    try {
      cropSession.abort.abort();
    } catch {
      /* ignore */
    }
  }
  if (cropSession?.objectUrl) URL.revokeObjectURL(cropSession.objectUrl);
  cropSession = null;
  if (cropImage) {
    cropImage.removeAttribute("src");
    cropImage.style.transform = "";
    cropImage.style.width = "";
    cropImage.style.height = "";
  }
  cropFrame?.classList.remove("is-dragging");
  if (cropStatus) cropStatus.textContent = "";
  if (cropZoom) cropZoom.value = "100";
  setCropBusy(false);
}

function applyCropTransform() {
  if (!cropSession || !cropImage) return;
  const { baseW, baseH, panX, panY, zoom } = cropSession;
  cropImage.style.width = `${baseW * zoom}px`;
  cropImage.style.height = `${baseH * zoom}px`;
  cropImage.style.transform = `translate(-50%, -50%) translate(${panX}px, ${panY}px)`;
}

function clampCropPan() {
  if (!cropSession || !cropFrame) return;
  const fw = cropFrame.clientWidth;
  const fh = cropFrame.clientHeight;
  const iw = cropSession.baseW * cropSession.zoom;
  const ih = cropSession.baseH * cropSession.zoom;
  const maxX = Math.max(0, (iw - fw) / 2);
  const maxY = Math.max(0, (ih - fh) / 2);
  cropSession.panX = clamp(cropSession.panX, -maxX, maxX);
  cropSession.panY = clamp(cropSession.panY, -maxY, maxY);
}

function syncCropBaseSize() {
  if (!cropSession || !cropFrame) return;
  if (cropFrame) cropFrame.style.aspectRatio = `${CAROUSEL_AR}`;
  const cover = Math.max(
    cropFrame.clientWidth / cropSession.nw,
    cropFrame.clientHeight / cropSession.nh
  );
  cropSession.baseW = cropSession.nw * cover;
  cropSession.baseH = cropSession.nh * cover;
  clampCropPan();
  applyCropTransform();
}

function bindCropInteractions() {
  if (!cropFrame || cropFrame.dataset.cropBound === "1") return;
  cropFrame.dataset.cropBound = "1";

  cropFrame.addEventListener("pointerdown", (event) => {
    if (!cropSession || event.button !== 0) return;
    cropSession.dragging = true;
    cropSession.dragX = event.clientX;
    cropSession.dragY = event.clientY;
    cropFrame.classList.add("is-dragging");
    try {
      cropFrame.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  });

  cropFrame.addEventListener("pointermove", (event) => {
    if (!cropSession?.dragging) return;
    cropSession.panX += event.clientX - cropSession.dragX;
    cropSession.panY += event.clientY - cropSession.dragY;
    cropSession.dragX = event.clientX;
    cropSession.dragY = event.clientY;
    clampCropPan();
    applyCropTransform();
  });

  const endDrag = (event) => {
    if (!cropSession) return;
    cropSession.dragging = false;
    cropFrame.classList.remove("is-dragging");
    try {
      cropFrame.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };
  cropFrame.addEventListener("pointerup", endDrag);
  cropFrame.addEventListener("pointercancel", endDrag);

  cropZoom?.addEventListener("input", () => {
    if (!cropSession) return;
    cropSession.zoom = Number(cropZoom.value) / 100 || 1;
    clampCropPan();
    applyCropTransform();
  });

  window.addEventListener("resize", () => {
    if (cropSession && cropDialog?.open) syncCropBaseSize();
  });
}

function setCropLead(work) {
  if (!cropLead) return;
  cropLead.textContent = `« ${work.title || work.id} » — cadre 16:9 (comme le carousel). Le hero affiche ce cadre en entier.`;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error("timeout"));
    }, 45000);
    const finish = (err, blob) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      if (err || !blob) reject(err || new Error("format"));
      else resolve(blob);
    };
    try {
      canvas.toBlob((blob) => finish(null, blob), type, quality);
    } catch (error) {
      finish(error || new Error("format"));
    }
  });
}

function encodeCarouselCropBlob() {
  if (!cropSession || !cropFrame) return Promise.reject(new Error("crop"));
  const fw = cropFrame.clientWidth;
  const fh = cropFrame.clientHeight;
  const { nw, nh, baseW, baseH, panX, panY, zoom, image } = cropSession;
  const dispW = baseW * zoom;
  const dispH = baseH * zoom;
  if (!(fw > 0 && fh > 0 && nw > 0 && nh > 0 && dispW > 0 && dispH > 0 && image)) {
    return Promise.reject(new Error("frame"));
  }

  const imgLeft = fw / 2 + panX - dispW / 2;
  const imgTop = fh / 2 + panY - dispH / 2;
  let sx = ((0 - imgLeft) / dispW) * nw;
  let sy = ((0 - imgTop) / dispH) * nh;
  let sw = (fw / dispW) * nw;
  let sh = (fh / dispH) * nh;
  sx = clamp(sx, 0, Math.max(0, nw - 1));
  sy = clamp(sy, 0, Math.max(0, nh - 1));
  sw = clamp(sw, 1, nw - sx);
  sh = clamp(sh, 1, nh - sy);

  const scale = Math.min(1, CAROUSEL_MAX_EDGE / Math.max(sw, sh));
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("format"));
  ctx.fillStyle = "#0f0b08";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outW, outH);

  return canvasToBlob(canvas, encodeType(), CAROUSEL_JPEG_QUALITY).catch(() =>
    canvasToBlob(canvas, "image/jpeg", CAROUSEL_JPEG_QUALITY)
  );
}

function applyCarouselWorkUpdate(work, payload) {
  const raw = payload.work || payload || {};
  const updated =
    normalizeWork(raw) ||
    {
      ...work,
      carousel_image: raw.carousel_image || work.carousel_image,
      updated_at: raw.updated_at || work.updated_at || "",
    };
  const idx = libraryWorks.findIndex((w) => w.id === work.id);
  if (idx >= 0) libraryWorks[idx] = { ...libraryWorks[idx], ...updated };
  Object.assign(work, updated);
  return updated;
}

/** Ouvre le recadreur. true si un crop a été enregistré. */
function openCarouselCropper(work) {
  return new Promise(async (resolve) => {
    if (!cropDialog || !cropImage || !cropFrame) {
      resolve(false);
      return;
    }
    const path = sourcePathForCrop(work);
    if (!path) {
      resolve(false);
      return;
    }

    resetCropSession();
    bindCropInteractions();
    setCropBusy(false);
    if (cropStatus) cropStatus.textContent = "Chargement de l’image…";
    setCropLead(work);

    let settled = false;
    let saving = false;
    const abort = new AbortController();

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      saving = false;
      if (cropConfirmBtn) cropConfirmBtn.onclick = null;
      if (cropCancelBtn) cropCancelBtn.onclick = null;
      try {
        cropDialog.close();
      } catch {
        /* ignore */
      }
      resetCropSession();
      resolve(ok);
    };

    const cancel = () => {
      try {
        abort.abort();
      } catch {
        /* ignore */
      }
      finish(false);
    };

    try {
      const response = await fetch(mediaUrl(path), {
        credentials: "same-origin",
        cache: "no-store",
        signal: abort.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const objectUrl = URL.createObjectURL(await response.blob());
      const loaded = await loadImageNaturalSize(objectUrl);
      cropSession = {
        objectUrl,
        image: loaded.image,
        nw: loaded.width,
        nh: loaded.height,
        baseW: loaded.width,
        baseH: loaded.height,
        panX: 0,
        panY: 0,
        zoom: 1,
        dragging: false,
        dragX: 0,
        dragY: 0,
        abort,
      };
      cropImage.src = objectUrl;
      cropImage.alt = work.alt || work.title || "";
      if (cropZoom) cropZoom.value = "100";
      if (cropStatus) cropStatus.textContent = "";
      setCropBusy(false);
      if (typeof cropDialog.showModal === "function") cropDialog.showModal();
      else cropDialog.setAttribute("open", "");
      requestAnimationFrame(() => syncCropBaseSize());
    } catch {
      if (cropStatus) cropStatus.textContent = "Impossible de charger l’image.";
      finish(false);
      return;
    }

    const onClose = () => {
      cropDialog.removeEventListener("close", onClose);
      if (!settled) cancel();
    };
    cropDialog.addEventListener("close", onClose);

    if (cropCancelBtn) {
      cropCancelBtn.onclick = (event) => {
        event.preventDefault();
        cancel();
      };
    }

    if (cropConfirmBtn) {
      cropConfirmBtn.onclick = async (event) => {
        event.preventDefault();
        if (settled || saving) return;
        saving = true;
        if (cropStatus) cropStatus.textContent = "Encodage et envoi…";
        setCropBusy(true);
        try {
          const blob = await encodeCarouselCropBlob();
          if (!blob || blob.size > MAX_BYTES) throw new Error("encode");
          if (settled) return;
          const body = new FormData();
          body.set("carousel", blob, `carousel.${extensionFor(blob)}`);
          const put = await fetch(
            `api/oeuvres/${encodeURIComponent(work.id)}/carousel`,
            {
              method: "POST",
              body,
              credentials: "same-origin",
              headers: { "X-Atelier": "1" },
              signal: abort.signal,
            }
          );
          const payload = await put.json().catch(() => ({}));
          if (!put.ok) throw new Error(payload.error || `HTTP ${put.status}`);
          applyCarouselWorkUpdate(work, payload);
          finish(true);
        } catch (error) {
          if (settled) return;
          saving = false;
          if (error?.name === "AbortError" || abort.signal.aborted) {
            finish(false);
            return;
          }
          const msg = error?.message || "";
          if (cropStatus) {
            cropStatus.textContent =
              msg && !["encode", "timeout", "format", "frame", "crop"].includes(msg)
                ? msg
                : "Enregistrement du recadrage impossible. Réessayez.";
          }
          setCropBusy(false);
        }
      };
    }
  });
}

/** Avant save : crop requis si carousel coché, ratio hors cadre, pas encore de dérivé. */
async function ensureCarouselCropReady(work, itemEl, statusEl) {
  const fields = readEditorFields(itemEl);
  if (!fields.carousel) return true;
  const current = libraryWorks.find((w) => w.id === work.id) || work;
  if (current.carousel_image) return true;

  const path = sourcePathForCrop(current);
  if (!path) {
    if (statusEl) statusEl.textContent = "Image source indisponible pour le recadrage.";
    return false;
  }

  try {
    const loaded = await loadImageNaturalSize(mediaUrl(path));
    if (!needsCarouselCrop(loaded.width, loaded.height)) return true;
  } catch {
    if (statusEl) statusEl.textContent = "Impossible de lire l’image source.";
    return false;
  }

  if (statusEl) {
    statusEl.textContent = "Recadrage carousel requis (proportions trop éloignées du cadre hero)…";
  }
  const ok = await openCarouselCropper(current);
  if (!ok && statusEl) {
    statusEl.textContent = "Recadrage carousel annulé — enregistrement interrompu.";
  }
  return ok;
}

async function saveWorkMeta(work, itemEl, statusEl) {
  const fields = readEditorFields(itemEl);
  if (!fields.artist || !fields.title) {
    statusEl.textContent = "Artiste et titre nécessaires.";
    return;
  }
  if (!fields.categories.length) {
    statusEl.textContent = "Cochez peinture, miniature ou aquarelle.";
    return;
  }
  const cropOk = await ensureCarouselCropReady(work, itemEl, statusEl);
  if (!cropOk) return;

  statusEl.textContent = "Enregistrement…";
  try {
    const response = await fetch(`api/oeuvres/${encodeURIComponent(work.id)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Atelier": "1",
      },
      body: JSON.stringify(fields),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      statusEl.textContent = payload.error || "Échec.";
      return;
    }
    const idx = libraryWorks.findIndex((w) => w.id === work.id);
    const merged = normalizeWork(payload) || { ...libraryWorks[idx], ...fields };
    // Conserver le crop éventuellement créé juste avant le PATCH.
    if (idx >= 0) {
      if (!merged.carousel_image && libraryWorks[idx].carousel_image) {
        merged.carousel_image = libraryWorks[idx].carousel_image;
      }
      libraryWorks[idx] = merged;
    }
    statusEl.textContent = "Enregistré.";
    renderLibrary();
  } catch (error) {
    statusEl.textContent = "Échec réseau.";
  }
}

async function deleteLibraryWork(work, button, statusEl) {
  if (!LIBRARY_ID_PATTERN.test(work.id || "")) {
    if (statusEl) statusEl.textContent = "Suppression impossible.";
    if (catalogStatus) catalogStatus.textContent = "Suppression impossible.";
    return;
  }
  const label = work.title || work.id;
  const ok = window.confirm(
    `Supprimer définitivement « ${label} » ?\n\nLes métadonnées (D1) et l’image (KV, si présente) seront retirées. Cette action est irréversible.`
  );
  if (!ok) return;

  if (button) button.disabled = true;
  if (statusEl) statusEl.textContent = "Suppression…";
  if (catalogStatus) catalogStatus.textContent = "Suppression…";

  try {
    const response = await fetch(`api/oeuvres/${encodeURIComponent(work.id)}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "X-Atelier": "1" },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = payload.error || "Suppression impossible.";
      if (statusEl) statusEl.textContent = err;
      if (catalogStatus) catalogStatus.textContent = err;
      if (button) button.disabled = false;
      return;
    }
    selectedIds.delete(work.id);
    await loadLibrary({ preserveStatus: true });
    if (catalogStatus) {
      catalogStatus.textContent = `« ${label} » supprimée.`;
    }
  } catch (error) {
    if (statusEl) statusEl.textContent = "Échec réseau.";
    if (catalogStatus) catalogStatus.textContent = "Échec réseau lors de la suppression.";
    if (button) button.disabled = false;
  }
}

function workItem(work) {
  const item = document.createElement("li");
  item.className = "library-item";
  item.dataset.id = work.id;
  item.dataset.source = isExposee(work) ? "exposee" : "ajout";
  const frontMode = isFrontOrderMode();
  if (frontMode) {
    item.classList.add("is-reorderable");
    item.addEventListener("dragover", (event) => {
      if (!dragWorkId || dragWorkId === work.id) return;
      event.preventDefault();
      try {
        event.dataTransfer.dropEffect = "move";
      } catch {
        /* ignore */
      }
      item.classList.add("is-drop-target");
    });
    item.addEventListener("dragleave", () => {
      item.classList.remove("is-drop-target");
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("is-drop-target");
      const fromId =
        dragWorkId ||
        (event.dataTransfer && event.dataTransfer.getData("text/plain")) ||
        "";
      dropWorkInFrontOrder(fromId, work.id);
    });
  }

  const pick = document.createElement("label");
  pick.className = "added-pick";
  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = selectedIds.has(work.id);
  check.setAttribute("aria-label", `Sélectionner ${work.title}`);
  check.addEventListener("change", () => {
    if (check.checked) selectedIds.add(work.id);
    else selectedIds.delete(work.id);
    updateCatalogChrome();
  });
  pick.append(check);

  let orderControls = null;
  if (frontMode) {
    orderControls = document.createElement("div");
    orderControls.className = "order-controls";
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "order-handle";
    handle.title = "Glisser pour réordonner la vitrine";
    handle.textContent = "⋮⋮";
    handle.setAttribute("aria-label", `Déplacer « ${work.title || work.id} »`);
    handle.draggable = true;
    handle.addEventListener("dragstart", (event) => {
      dragWorkId = work.id;
      item.classList.add("is-dragging");
      try {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", work.id);
      } catch {
        /* ignore */
      }
    });
    handle.addEventListener("dragend", () => {
      dragWorkId = null;
      item.classList.remove("is-dragging");
      addedList.querySelectorAll(".is-drop-target").forEach((el) => {
        el.classList.remove("is-drop-target");
      });
    });
    const orderBadge = document.createElement("span");
    orderBadge.className = "order-badge";
    orderBadge.textContent = String(Number(work.order) || 0);
    orderBadge.title = "sort_order (ordre d’affichage front)";
    const up = document.createElement("button");
    up.type = "button";
    up.className = "order-move";
    up.textContent = "↑";
    up.setAttribute("aria-label", `Monter « ${work.title || work.id} » dans l’ordre front`);
    up.addEventListener("click", (event) => {
      event.preventDefault();
      moveWorkInFrontOrder(work.id, -1);
    });
    const down = document.createElement("button");
    down.type = "button";
    down.className = "order-move";
    down.textContent = "↓";
    down.setAttribute("aria-label", `Descendre « ${work.title || work.id} » dans l’ordre front`);
    down.addEventListener("click", (event) => {
      event.preventDefault();
      moveWorkInFrontOrder(work.id, 1);
    });
    orderControls.append(handle, orderBadge, up, down);
  }

  const image = document.createElement("img");
  image.src = mediaUrl(work.preview);
  image.alt = "";
  image.className = "library-thumb";
  image.draggable = false;

  const editor = document.createElement("div");
  editor.className = "library-editor";

  const titleRow = document.createElement("div");
  titleRow.className = "added-title-row";
  const badge = document.createElement("span");
  badge.className = work.exposed ? "source-badge source-exposee" : "source-badge source-ajout";
  badge.textContent = work.exposed ? "Exposée" : "Non exposée";
  const kind = document.createElement("span");
  kind.className = "source-kind";
  kind.textContent = isExposee(work) ? "D1 · assets site" : "D1 · KV";
  titleRow.append(badge, kind);
  if (work.web) {
    const webBadge = document.createElement("span");
    webBadge.className = "source-kind";
    webBadge.textContent = "web ✓";
    titleRow.append(webBadge);
  } else if (isAjout(work)) {
    const webBadge = document.createElement("span");
    webBadge.className = "source-kind";
    webBadge.textContent = "web manquant";
    titleRow.append(webBadge);
  }
  editor.append(titleRow);

  const makeEdit = (labelText, field, value, max, multiline = false, rows = 4) => {
    const label = document.createElement("label");
    label.className = "edit-field";
    label.textContent = labelText;
    const input = multiline
      ? document.createElement("textarea")
      : document.createElement("input");
    if (!multiline) input.type = "text";
    else {
      input.rows = rows;
      input.spellcheck = true;
    }
    input.dataset.edit = field;
    input.maxLength = max;
    input.value = value || "";
    label.append(input);
    return label;
  };

  META_FIELDS.forEach(({ key, label, max, multiline, rows }) => {
    if (key === "dimensions") {
      editor.append(
        mountDimensionsEditor({
          value: work[key] || "",
          nameAttr: "data-edit",
          className: "edit-field",
        })
      );
      return;
    }
    editor.append(
      makeEdit(label, key, work[key] || "", max, !!multiline, rows || 4)
    );
  });
  editor.append(
    makeEdit("texte alternatif", "alt", work.alt, META_ALT_MAX, true, 2)
  );

  const cats = document.createElement("fieldset");
  cats.className = "edit-cats";
  const legend = document.createElement("legend");
  legend.textContent = "à cocher";
  cats.append(legend);
  const currentCats = Array.isArray(work.categories) ? work.categories : [];
  CATEGORY_KEYS.forEach((key) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.editCat = "1";
    input.value = key;
    input.checked = currentCats.includes(key);
    label.append(input, document.createTextNode(` ${CATEGORY_LABELS[key]}`));
    cats.append(label);
  });
  editor.append(cats);

  const flags = document.createElement("div");
  flags.className = "edit-flags";
  const exposeLabel = document.createElement("label");
  exposeLabel.className = "edit-exposed";
  const exposeInput = document.createElement("input");
  exposeInput.type = "checkbox";
  exposeInput.dataset.edit = "exposed";
  exposeInput.checked = !!work.exposed;
  exposeLabel.append(exposeInput, document.createTextNode(" Exposée"));
  const carouselLabel = document.createElement("label");
  carouselLabel.className = "edit-carousel";
  const carouselInput = document.createElement("input");
  carouselInput.type = "checkbox";
  carouselInput.dataset.edit = "carousel";
  carouselInput.checked = !!work.carousel;
  carouselLabel.append(carouselInput, document.createTextNode(" Carousel"));
  flags.append(exposeLabel, carouselLabel);
  editor.append(flags);

  const cropTools = document.createElement("div");
  cropTools.className = "edit-carousel-tools";
  cropTools.hidden = !work.carousel;
  const cropThumbLink = document.createElement("a");
  cropThumbLink.className = "carousel-crop-thumb-link";
  cropThumbLink.target = "_blank";
  cropThumbLink.rel = "noopener";
  cropThumbLink.hidden = !work.carousel_image;
  cropThumbLink.setAttribute(
    "aria-label",
    `Voir le recadrage carousel de « ${work.title || work.id} »`
  );
  const cropThumb = document.createElement("img");
  cropThumb.className = "carousel-crop-thumb";
  cropThumb.alt = "";
  cropThumb.loading = "lazy";
  cropThumb.decoding = "async";
  if (work.carousel_image) {
    const cropUrl = carouselMediaUrl(work);
    cropThumbLink.href = cropUrl;
    cropThumb.src = cropUrl;
  }
  cropThumbLink.append(cropThumb);
  const cropNeeded = document.createElement("span");
  cropNeeded.className = "carousel-crop-needed";
  cropNeeded.hidden = true;
  cropNeeded.textContent = "Recadrage carousel recommandé";
  const cropBtn = document.createElement("button");
  cropBtn.type = "button";
  cropBtn.className = "button button-quiet";
  cropBtn.textContent = cropLabel(work);
  cropTools.append(cropThumbLink, cropBtn, cropNeeded);
  editor.append(cropTools);

  const syncCropThumb = () => {
    const url = carouselMediaUrl(work);
    if (!url) {
      cropThumbLink.hidden = true;
      cropThumb.removeAttribute("src");
      cropThumbLink.removeAttribute("href");
      return;
    }
    cropThumbLink.hidden = false;
    cropThumbLink.href = url;
    cropThumb.src = url;
  };

  const refreshCropChrome = async () => {
    const on = !!carouselInput.checked;
    cropTools.hidden = !on;
    cropBtn.textContent = cropLabel(work);
    syncCropThumb();
    if (!on || work.carousel_image) {
      cropNeeded.hidden = true;
      return;
    }
    const path = sourcePathForCrop(work);
    if (!path) {
      cropNeeded.hidden = false;
      return;
    }
    try {
      const loaded = await loadImageNaturalSize(mediaUrl(path));
      cropNeeded.hidden = !needsCarouselCrop(loaded.width, loaded.height);
    } catch {
      cropNeeded.hidden = false;
    }
  };

  const maybePromptCrop = async () => {
    if (!carouselInput.checked || work.carousel_image) return;
    const path = sourcePathForCrop(work);
    if (!path) return;
    try {
      const loaded = await loadImageNaturalSize(mediaUrl(path));
      if (!needsCarouselCrop(loaded.width, loaded.height)) return;
    } catch {
      return;
    }
    if (await openCarouselCropper(work)) renderLibrary();
  };

  carouselInput.addEventListener("change", async () => {
    await refreshCropChrome();
    await maybePromptCrop();
  });

  cropBtn.addEventListener("click", async () => {
    if (await openCarouselCropper(work)) renderLibrary();
  });

  refreshCropChrome();

  const actions = document.createElement("div");
  actions.className = "library-actions";
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Enregistrer";
  const saveStatus = document.createElement("span");
  saveStatus.className = "edit-status";
  save.addEventListener("click", () => saveWorkMeta(work, item, saveStatus));
  actions.append(save, saveStatus);

  if (isAjout(work) && work.image) {
    const originalLink = document.createElement("a");
    originalLink.className = "button-quiet";
    originalLink.href = mediaUrl(work.image);
    originalLink.target = "_blank";
    originalLink.rel = "noopener";
    originalLink.textContent = "Original";
    originalLink.setAttribute(
      "aria-label",
      `Télécharger l’original de « ${work.title || work.id} »`
    );
    actions.append(originalLink);
  }
  if (isAjout(work) && work.web) {
    const webLink = document.createElement("a");
    webLink.className = "button-quiet";
    webLink.href = mediaUrl(work.web);
    webLink.target = "_blank";
    webLink.rel = "noopener";
    webLink.textContent = "Web";
    actions.append(webLink);
  }
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "button-danger";
  remove.textContent = "Supprimer";
  remove.setAttribute(
    "aria-label",
    `Supprimer « ${work.title || work.id} » de la bibliothèque`
  );
  remove.addEventListener("click", () => deleteLibraryWork(work, remove, saveStatus));
  actions.append(remove);
  editor.append(actions);

  if (orderControls) item.append(orderControls, pick, image, editor);
  else item.append(pick, image, editor);
  return item;
}

function renderLibrary({ resetPage = false } = {}) {
  if (resetPage) libraryPage = 1;
  addedList.replaceChildren();
  addedList.classList.toggle("is-front-order", isFrontOrderMode());
  if (!libraryWorks.length) {
    const item = document.createElement("li");
    item.className = "added-empty";
    item.textContent = "Bibliothèque indisponible.";
    addedList.append(item);
    updateCatalogChrome();
    return;
  }
  syncFilterOptions();
  pruneHiddenSelection();
  const { visible, pageWorks } = pagedWorks();
  if (!visible.length) {
    const item = document.createElement("li");
    item.className = "added-empty";
    item.textContent = "Aucune œuvre pour ces filtres.";
    addedList.append(item);
    updateCatalogChrome();
    return;
  }
  pageWorks.forEach((work) => addedList.append(workItem(work)));
  updateCatalogChrome();
}

function normalizeWork(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id : "";
  const preview = typeof raw.preview === "string" ? raw.preview : "";
  const image = typeof raw.image === "string" ? raw.image : preview;
  const web = typeof raw.web === "string" ? raw.web : "";
  const carousel_image =
    typeof raw.carousel_image === "string" ? raw.carousel_image : "";
  if (!id || !preview || !LIBRARY_ID_PATTERN.test(id)) return null;

  const isEx = EXPOSEE_ID_PATTERN.test(id);
  const isAd = ID_PATTERN.test(id);
  if (!isEx && !isAd) return null;
  if (isAd && !preview.startsWith("images/ajouts/preview/")) return null;
  if (isEx && (preview.includes("/ajouts/") || !preview.startsWith("images/"))) return null;
  if (isAd && web && !web.startsWith("images/ajouts/web/")) return null;
  if (
    carousel_image &&
    !carousel_image.startsWith("images/ajouts/carousel/")
  ) {
    return null;
  }

  return {
    ...raw,
    id,
    image,
    web,
    preview,
    carousel_image,
    source: isEx ? "exposee" : "ajout",
    order: Number(raw.order) || (isEx ? 0 : 1000),
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    artist: raw.artist || "",
    title: raw.title || "",
    note: raw.note || "",
    signed_dated: raw.signed_dated || "",
    support: raw.support || "",
    dimensions: raw.dimensions || "",
    editions: raw.editions || "",
    alt: raw.alt || "",
    created_at: raw.created_at || "",
    updated_at: raw.updated_at || raw.created_at || "",
    exposed: raw.exposed === true || raw.exposed === 1,
    carousel: raw.carousel === true || raw.carousel === 1,
  };
}

/**
 * Backfill navigateur : pour chaque ajout sans `web`, charge l’original,
 * réencode (max WEB_MAX_EDGE), POST /api/oeuvres/:id/web.
 */
async function backfillWebDerivatives() {
  const missing = libraryWorks.filter((w) => isAjout(w) && !w.web && w.image);
  if (!missing.length) {
    if (catalogStatus) catalogStatus.textContent = "Toutes les œuvres ont déjà un dérivé web.";
    return;
  }
  const okConfirm = window.confirm(
    `Générer ${missing.length} version${missing.length > 1 ? "s" : ""} web manquante${missing.length > 1 ? "s" : ""} ?\n\nLes originaux KV sont conservés. Cela peut prendre plusieurs minutes.`
  );
  if (!okConfirm) return;

  const btn = document.getElementById("catalog-backfill-web");
  if (btn) btn.disabled = true;
  let ok = 0;
  let fail = 0;
  const type = encodeType();

  for (let i = 0; i < missing.length; i++) {
    const work = missing[i];
    if (catalogStatus) {
      catalogStatus.textContent = `Web ${i + 1}/${missing.length} — ${work.title || work.id}…`;
    }
    try {
      const url = mediaUrl(work.image);
      const response = await fetch(url, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], "original", { type: blob.type || "image/jpeg" });
      const loaded = await loadBitmap(file);
      let webBlob;
      try {
        const webPart = await encodeFrom(
          loaded.image,
          WEB_MAX_EDGE,
          WEB_MAX_EDGE,
          type,
          WEB_JPEG_QUALITY
        );
        webBlob = webPart.blob;
      } finally {
        URL.revokeObjectURL(loaded.url);
      }
      if (!webBlob || webBlob.size > MAX_BYTES) throw new Error("encode");
      const body = new FormData();
      body.set("web", webBlob, `web.${extensionFor(webBlob)}`);
      const put = await fetch(`api/oeuvres/${encodeURIComponent(work.id)}/web`, {
        method: "POST",
        body,
        credentials: "same-origin",
        headers: { "X-Atelier": "1" },
      });
      const payload = await put.json().catch(() => ({}));
      if (!put.ok) throw new Error(payload.error || `HTTP ${put.status}`);
      ok += 1;
    } catch (error) {
      fail += 1;
    }
  }

  await loadLibrary({ preserveStatus: true });
  if (catalogStatus) {
    catalogStatus.textContent =
      fail === 0
        ? `${ok} dérivé${ok > 1 ? "s" : ""} web créé${ok > 1 ? "s" : ""}.`
        : `${ok} OK · ${fail} erreur${fail > 1 ? "s" : ""}.`;
  }
  if (btn) btn.disabled = false;
}

async function loadLibrary({ preserveStatus = false } = {}) {
  if (!preserveStatus && catalogStatus) catalogStatus.textContent = "";
  try {
    const response = await fetch("api/oeuvres", {
      headers: { "X-Atelier": "1" },
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = await response.json();
    const works = Array.isArray(payload)
      ? payload.map(normalizeWork).filter(Boolean)
      : [];
    libraryWorks = works;
    snapshotFrontOrders(libraryWorks);
    reorderDirty = false;
    const valid = new Set(libraryWorks.map((w) => w.id));
    selectedIds = new Set([...selectedIds].filter((id) => valid.has(id)));
    if (selectedIds.size === 0) {
      libraryWorks.filter((w) => w.exposed).forEach((w) => selectedIds.add(w.id));
    }
    renderLibrary();
  } catch (error) {
    libraryWorks = [];
    snapshotFrontOrders([]);
    reorderDirty = false;
    renderLibrary();
  }
}

function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}

async function imageToJpegDataUrl(path, maxEdge) {
  const response = await fetch(mediaUrl(path), {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("fetch");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImageUrl(objectUrl);
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.82),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function wrapText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function exportFilenameFromHeader(header, fallback) {
  if (!header) return fallback;
  const utf = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf && utf[1]) {
    try {
      return decodeURIComponent(utf[1].trim());
    } catch {
      /* keep looking */
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain && plain[1] ? plain[1].trim() : fallback;
}

async function exportDatabase() {
  if (!catalogExport) return;
  if (catalogStatus) catalogStatus.textContent = "";
  catalogExport.disabled = true;
  if (catalogStatus) catalogStatus.textContent = "Export de la base…";
  const fallbackName = `galerie-vittet-oeuvres-${new Date().toISOString().slice(0, 10)}.json`;
  try {
    const response = await fetch("api/export/oeuvres", {
      headers: { "X-Atelier": "1" },
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) {
      if (catalogStatus) {
        catalogStatus.textContent =
          response.status === 401
            ? "Authentification requise pour exporter."
            : "Export impossible.";
      }
      return;
    }
    const blob = await response.blob();
    const filename = exportFilenameFromHeader(
      response.headers.get("Content-Disposition"),
      fallbackName
    );
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    const countHeader = response.headers.get("X-Export-Count");
    const count = countHeader ? Number(countHeader) : NaN;
    if (catalogStatus) {
      catalogStatus.textContent = Number.isFinite(count)
        ? `Base exportée (${count} œuvre${count > 1 ? "s" : ""}) — ${filename}.`
        : `Base exportée — ${filename}.`;
    }
  } catch {
    if (catalogStatus) catalogStatus.textContent = "Export impossible.";
  } finally {
    catalogExport.disabled = false;
  }
}

async function generateCatalogPdf() {
  catalogStatus.textContent = "";
  pruneHiddenSelection();
  const selected = filteredWorks().filter((work) => selectedIds.has(work.id));
  if (!selected.length) {
    catalogStatus.textContent = "Sélectionnez au moins une œuvre visible.";
    updateCatalogChrome();
    return;
  }
  const jspdfNs = window.jspdf;
  if (!jspdfNs || typeof jspdfNs.jsPDF !== "function") {
    catalogStatus.textContent = "Bibliothèque PDF indisponible.";
    return;
  }

  catalogPdf.disabled = true;
  catalogStatus.textContent = `Préparation du PDF (${selected.length})…`;

  try {
    const { jsPDF } = jspdfNs;
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;

    // Page de titre — identité galerie (contenu public du site uniquement)
    const cx = pageW / 2;
    let titleY = 48;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text("GALERIE DE PEINTURES ANCIENNES", cx, titleY, { align: "center" });

    titleY += 16;
    doc.setFontSize(26);
    doc.setTextColor(28);
    doc.text("VITTET", cx, titleY, { align: "center" });

    titleY += 7;
    doc.setFontSize(9);
    doc.setTextColor(95);
    doc.text("MAÎTRES ANCIENS", cx, titleY, { align: "center" });

    titleY += 10;
    doc.setDrawColor(150);
    doc.setLineWidth(0.25);
    doc.line(cx - 26, titleY, cx + 26, titleY);

    titleY += 14;
    doc.setFontSize(13);
    doc.setTextColor(35);
    doc.text("Catalogue d'images", cx, titleY, { align: "center" });

    titleY += 8;
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text("Paris · Depuis 1988", cx, titleY, { align: "center" });

    titleY += 18;
    doc.setFontSize(10);
    doc.setTextColor(70);
    // Texte inspiré du site public (meta + à propos) — faits déjà publics uniquement.
    // Helvetica/WinAnsi : accents Latin-1 OK ; "oe" pour œ ; "e" pour exposant.
    const presentation =
      "Depuis 1988, au coeur de Saint-Germain-des-Prés, la Galerie Vittet " +
      "présente des peintures anciennes choisies avec exigence : écoles du Nord " +
      "des XVIe et XVIIe siècles, paysagistes français du XVIIIe siècle et art de la miniature.";
    const introLines = doc.splitTextToSize(presentation, Math.min(contentW, 140));
    doc.text(introLines, cx, titleY, { align: "center", lineHeightFactor: 1.35 });
    titleY += introLines.length * 5.8 + 16;

    doc.setFontSize(10);
    doc.setTextColor(35);
    doc.text("21 quai Voltaire · 75007 Paris", cx, titleY, { align: "center" });

    titleY += 8;
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("01 42 60 11 39  ·  06 19 47 14 31", cx, titleY, { align: "center" });

    titleY += 18;
    doc.setFontSize(9);
    doc.setTextColor(110);
    const stamp = new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(
      `${selected.length} oeuvre${selected.length > 1 ? "s" : ""} · ${stamp}`,
      cx,
      titleY,
      { align: "center" }
    );
    doc.setTextColor(0);

    for (let i = 0; i < selected.length; i++) {
      const work = selected[i];
      catalogStatus.textContent = `Page ${i + 1} / ${selected.length}…`;
      doc.addPage();

      const imagePath =
        typeof work.web === "string" && work.web.startsWith("images/")
          ? work.web
          : typeof work.image === "string" && work.image.startsWith("images/")
            ? work.image
            : work.preview;
      const jpeg = await imageToJpegDataUrl(imagePath, 1400);
      const maxImgH = pageH - margin * 2 - 42;
      const ratio = Math.min(contentW / jpeg.width, maxImgH / jpeg.height);
      const drawW = jpeg.width * ratio;
      const drawH = jpeg.height * ratio;
      const imgX = margin + (contentW - drawW) / 2;
      const imgY = margin;
      doc.addImage(jpeg.dataUrl, "JPEG", imgX, imgY, drawW, drawH, undefined, "FAST");

      let textY = imgY + drawH + 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      textY = wrapText(doc, work.artist || "", margin, textY, contentW, 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      textY = wrapText(doc, work.title || "", margin, textY + 2, contentW, 6);
      const caption = workCaption(work);
      const extras = [work.signed_dated, work.editions].filter(Boolean).join(" · ");
      const line = [caption, extras].filter(Boolean).join(" · ");
      if (line) {
        doc.setFontSize(10);
        doc.setTextColor(70);
        wrapText(doc, line, margin, textY + 3, contentW, 5);
        doc.setTextColor(0);
      }
    }

    const fileStamp = new Date().toISOString().slice(0, 10);
    doc.save(`catalogue-galerie-vittet-${fileStamp}.pdf`);
    catalogStatus.textContent = `Catalogue PDF généré (${selected.length} œuvre${selected.length > 1 ? "s" : ""}).`;
  } catch (error) {
    catalogStatus.textContent = "Génération du PDF impossible.";
  } finally {
    updateCatalogChrome();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  buildPreview();
});
publishButton.addEventListener("click", publish);
[catalogFilterCategory, catalogFilterArtist, catalogFilterPeriod, catalogFilterExposed].forEach((el) => {
  if (el) el.addEventListener("change", () => renderLibrary({ resetPage: true }));
});
if (catalogFilterSearch) {
  let searchTimer = 0;
  const runSearch = () => {
    searchTimer = 0;
    renderLibrary({ resetPage: true });
  };
  catalogFilterSearch.addEventListener("input", () => {
    if (searchTimer) window.clearTimeout(searchTimer);
    /* Instant feel; tiny debounce avoids thrashing on fast typing. */
    searchTimer = window.setTimeout(runSearch, 80);
  });
  catalogFilterSearch.addEventListener("search", () => {
    if (searchTimer) window.clearTimeout(searchTimer);
    runSearch();
  });
}
if (catalogSort) {
  catalogSort.addEventListener("click", (event) => {
    const btn = event.target.closest(".sort-btn[data-sort]");
    if (!btn || !catalogSort.contains(btn)) return;
    const next = btn.dataset.sort;
    if (!SORT_VALUES.has(next) || next === librarySort) return;
    persistSort(next);
    renderLibrary({ resetPage: true });
  });
}
catalogSelectAll.addEventListener("change", () => {
  const visible = filteredWorks();
  if (catalogSelectAll.checked) {
    visible.forEach((work) => selectedIds.add(work.id));
  } else {
    visible.forEach((work) => selectedIds.delete(work.id));
  }
  renderLibrary();
});
function scrollCatalogToTop() {
  const topPager = document.querySelector(".catalog-pagination--top");
  const target = topPager || catalogToolbar;
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

catalogPagers.forEach((pager) => {
  const prev = pager.querySelector("[data-page-prev]");
  const next = pager.querySelector("[data-page-next]");
  if (prev) {
    prev.addEventListener("click", () => {
      if (libraryPage <= 1) return;
      libraryPage -= 1;
      renderLibrary();
      scrollCatalogToTop();
    });
  }
  if (next) {
    next.addEventListener("click", () => {
      const pages = libraryPageCount(filteredWorks().length);
      if (libraryPage >= pages) return;
      libraryPage += 1;
      renderLibrary();
      scrollCatalogToTop();
    });
  }
});
catalogPdf.addEventListener("click", generateCatalogPdf);
if (catalogExport) catalogExport.addEventListener("click", exportDatabase);
const catalogBackfillWeb = document.getElementById("catalog-backfill-web");
if (catalogBackfillWeb) {
  catalogBackfillWeb.addEventListener("click", () => backfillWebDerivatives());
}
form.querySelectorAll("input[name=category]").forEach((input) => {
  input.addEventListener("change", () => {
    const defaults = defaultCategories();
    pendingItems.forEach((item) => {
      if (!item.detailBlob) item.categories = defaults.length ? defaults.slice() : item.categories;
    });
    if (!previewReady) renderUploadQueue();
  });
});
if (pickImageButton) {
  pickImageButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (pickBusy) return;
    setPickMenuOpen(pickMenu ? pickMenu.hidden : true);
  });
}
if (pickMenu) {
  pickMenu.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-pick]");
    if (!btn || !pickMenu.contains(btn)) return;
    const mode = btn.getAttribute("data-pick");
    setPickMenuOpen(false);
    if (mode === "folder" && imageFolderInput) imageFolderInput.click();
    else if (imageInput) imageInput.click();
  });
}
document.addEventListener("click", (event) => {
  if (!pickMenu || pickMenu.hidden) return;
  const root = pickImageButton && pickImageButton.closest(".pick-unified");
  if (root && root.contains(event.target)) return;
  setPickMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setPickMenuOpen(false);
});

imageInput.addEventListener("change", () => {
  if (pickBusy) return;
  if (imageFolderInput) imageFolderInput.value = "";
  if (imageInput.files && imageInput.files.length) {
    setPendingFromFiles(imageInput.files);
  } else {
    clearPending();
    fileName.textContent = "Aucun fichier choisi";
    status.textContent = "";
  }
});

if (imageFolderInput) {
  imageFolderInput.addEventListener("change", () => {
    if (pickBusy) return;
    if (imageInput) imageInput.value = "";
    if (imageFolderInput.files && imageFolderInput.files.length) {
      setPendingFromFiles(imageFolderInput.files);
    } else {
      clearPending();
      fileName.textContent = "Aucun fichier choisi";
      status.textContent = "";
    }
  });
}

loadLibrary();
