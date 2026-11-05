import {
  ASSET_RE,
  EXPOSEE_ID_RE,
  ID_RE,
  LIBRARY_ID_RE,
} from "./limits.js";

/** Colonnes métadonnées Artlogic (labels FR atelier : artiste, titre, note,
 * signé et date, support, dimensions, éditions) + tags peinture/miniature/aquarelle. */
const SELECT_COLS =
  "id, artist, title, note, signed_dated, support, dimensions, editions, source_file, alt, categories, image, web, preview, created_at, updated_at, exposed, carousel, sort_order";

const META_COLUMNS = [
  ["signed_dated", "TEXT NOT NULL DEFAULT ''"],
  ["support", "TEXT NOT NULL DEFAULT ''"],
  ["dimensions", "TEXT NOT NULL DEFAULT ''"],
  ["editions", "TEXT NOT NULL DEFAULT ''"],
  ["source_file", "TEXT NOT NULL DEFAULT ''"],
  /** Dérivé web (affichage front) — original reste dans `image`. */
  ["web", "TEXT NOT NULL DEFAULT ''"],
];

/** Horodatage SQLite `datetime('now')` → `YYYY-MM-DD HH:MM:SS` (UTC). */
export function stampNow() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

/** Légende publique / PDF : support · dimensions · note (champs séparés). */
export function workCaption(work) {
  return [work.support, work.dimensions, work.note].filter(Boolean).join(" · ");
}

export function rowToWork(row) {
  let categories = [];
  try {
    categories = JSON.parse(row.categories);
  } catch {
    categories = [];
  }
  if (!Array.isArray(categories)) categories = [];
  const exposed = Number(row.exposed) === 1;
  const carousel = Number(row.carousel) === 1;
  const isExposee = EXPOSEE_ID_RE.test(row.id || "");
  return {
    id: row.id,
    artist: row.artist,
    title: row.title,
    note: row.note || "",
    signed_dated: row.signed_dated || "",
    support: row.support || "",
    dimensions: row.dimensions || "",
    editions: row.editions || "",
    source_file: row.source_file || "",
    alt: row.alt || "",
    categories,
    image: row.image,
    web: row.web || "",
    preview: row.preview,
    created_at: row.created_at || "",
    updated_at: row.updated_at || row.created_at || "",
    exposed,
    carousel,
    order: Number(row.sort_order) || (isExposee ? 0 : 1000),
    source: isExposee ? "exposee" : "ajout",
  };
}

/** Chemin d’affichage public : dérivé web si présent, sinon original (`image`). */
export function displayImagePath(work) {
  if (work && typeof work.web === "string" && work.web) return work.web;
  return (work && work.image) || "";
}

/** Chemin original KV / site (`image` D1) — loupe front ; jamais remappé. */
export function originalImagePath(work) {
  return (work && typeof work.image === "string" && work.image) || "";
}

export async function ensureSchema(db) {
  // Colonnes déjà migrées en remote ; CREATE/ALTER idempotent si possible.
  try {
    await db.prepare("ALTER TABLE oeuvres ADD COLUMN exposed INTEGER NOT NULL DEFAULT 0").run();
  } catch {
    /* already present */
  }
  try {
    await db
      .prepare("ALTER TABLE oeuvres ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 1000")
      .run();
  } catch {
    /* already present */
  }
  try {
    await db
      .prepare("ALTER TABLE oeuvres ADD COLUMN carousel INTEGER NOT NULL DEFAULT 0")
      .run();
  } catch {
    /* already present */
  }
  for (const [name, ddl] of META_COLUMNS) {
    try {
      await db.prepare(`ALTER TABLE oeuvres ADD COLUMN ${name} ${ddl}`).run();
    } catch {
      /* already present */
    }
  }
  // updated_at : vide pour les lignes existantes, puis backfill = created_at
  // (éviter DEFAULT datetime('now') à l’ALTER qui écraserait toutes les dates).
  try {
    await db
      .prepare("ALTER TABLE oeuvres ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''")
      .run();
  } catch {
    /* already present */
  }
  try {
    await db
      .prepare(
        "UPDATE oeuvres SET updated_at = created_at WHERE updated_at IS NULL OR updated_at = ''"
      )
      .run();
  } catch {
    /* ignore */
  }
}

/** Schéma D1 uniquement — pas de re-seed. Les œuvres viennent de l’atelier. */
export async function ensureLibrary(db) {
  await ensureSchema(db);
}

export async function listWorks(db) {
  await ensureSchema(db);
  const result = await db
    .prepare(
      `SELECT ${SELECT_COLS} FROM oeuvres ORDER BY sort_order ASC, created_at ASC, id ASC`
    )
    .all();
  return (result.results || []).map(rowToWork);
}

export async function getWork(db, id) {
  if (!LIBRARY_ID_RE.test(id)) return null;
  await ensureSchema(db);
  const row = await db
    .prepare(`SELECT ${SELECT_COLS} FROM oeuvres WHERE id = ?`)
    .bind(id)
    .first();
  return row ? rowToWork(row) : null;
}

/** Append : MAX(sort_order) + 10. */
export async function nextSortOrder(db) {
  await ensureSchema(db);
  const row = await db.prepare("SELECT MAX(sort_order) AS m FROM oeuvres").first();
  const max = Number(row && row.m);
  return (Number.isFinite(max) ? max : 0) + 10;
}

/** Bulk `sort_order` + bump `updated_at`. */
export async function updateWorkOrders(db, orders) {
  if (!Array.isArray(orders) || !orders.length) throw new Error("orders");
  if (orders.length > 500) throw new Error("orders");
  await ensureSchema(db);
  const stamp = stampNow();
  const stmts = [];
  for (const item of orders) {
    if (!item || typeof item !== "object") throw new Error("id");
    const id = String(item.id || "");
    if (!LIBRARY_ID_RE.test(id)) throw new Error("id");
    const order = Number(item.order);
    if (!Number.isFinite(order) || order < 0 || order > 1_000_000_000) {
      throw new Error("order");
    }
    stmts.push(
      db
        .prepare(
          "UPDATE oeuvres SET sort_order = ?, updated_at = ? WHERE id = ?"
        )
        .bind(Math.floor(order), stamp, id)
    );
  }
  await db.batch(stmts);
  return { count: stmts.length, updated_at: stamp };
}

export async function insertWork(db, work) {
  if (!ID_RE.test(work.id)) throw new Error("id");
  if (!ASSET_RE.test(work.image) || !ASSET_RE.test(work.preview)) throw new Error("path");
  if (work.web && !ASSET_RE.test(work.web)) throw new Error("path");
  await ensureSchema(db);
  const exposed = work.exposed ? 1 : 0;
  const carousel = work.carousel ? 1 : 0;
  const sortOrder = Number.isFinite(work.order)
    ? Number(work.order)
    : await nextSortOrder(db);
  const stamp = work.created_at || stampNow();
  await db
    .prepare(
      `INSERT INTO oeuvres (
        id, artist, title, note, signed_dated, support, dimensions, editions, source_file,
        alt, categories, image, web, preview,
        detail_ctype, preview_ctype, exposed, carousel, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      work.id,
      work.artist,
      work.title,
      work.note || "",
      work.signed_dated || "",
      work.support || "",
      work.dimensions || "",
      work.editions || "",
      work.source_file || "",
      work.alt,
      JSON.stringify(work.categories),
      work.image,
      work.web || "",
      work.preview,
      work.detail_ctype,
      work.preview_ctype,
      exposed,
      carousel,
      sortOrder,
      stamp,
      work.updated_at || stamp
    )
    .run();
}

/**
 * Enregistre / remplace le dérivé web (chemin D1) sans toucher à l’original.
 */
export async function updateWorkWeb(db, id, { web }) {
  if (!ID_RE.test(id)) throw new Error("id");
  if (!ASSET_RE.test(web)) throw new Error("path");
  await ensureSchema(db);
  const current = await getWork(db, id);
  if (!current) return null;
  await db
    .prepare(`UPDATE oeuvres SET web = ?, updated_at = ? WHERE id = ?`)
    .bind(web, stampNow(), id)
    .run();
  return getWork(db, id);
}

/**
 * Met à jour les légendes (et éventuellement exposed / carousel).
 * Ne touche jamais aux chemins image / id.
 */
export async function updateWorkMeta(db, id, patch) {
  if (!LIBRARY_ID_RE.test(id)) throw new Error("id");
  await ensureSchema(db);
  const current = await getWork(db, id);
  if (!current) return null;

  const artist =
    patch.artist !== undefined ? String(patch.artist) : current.artist;
  const title = patch.title !== undefined ? String(patch.title) : current.title;
  const note = patch.note !== undefined ? String(patch.note) : current.note;
  const signed_dated =
    patch.signed_dated !== undefined
      ? String(patch.signed_dated)
      : current.signed_dated;
  const support =
    patch.support !== undefined ? String(patch.support) : current.support;
  const dimensions =
    patch.dimensions !== undefined
      ? String(patch.dimensions)
      : current.dimensions;
  const editions =
    patch.editions !== undefined ? String(patch.editions) : current.editions;
  const alt = patch.alt !== undefined ? String(patch.alt) : current.alt;
  const categories =
    patch.categories !== undefined ? patch.categories : current.categories;
  const exposed =
    patch.exposed !== undefined ? (patch.exposed ? 1 : 0) : current.exposed ? 1 : 0;
  const carousel =
    patch.carousel !== undefined
      ? patch.carousel
        ? 1
        : 0
      : current.carousel
        ? 1
        : 0;
  let sortOrder = current.order;
  if (patch.order !== undefined) {
    const next = Number(patch.order);
    if (!Number.isFinite(next) || next < 0 || next > 1_000_000_000) {
      throw new Error("order");
    }
    sortOrder = Math.floor(next);
  }

  // Titre requis ; artiste vide possible côté insert rapide (PATCH le refuse).
  if (!title) throw new Error("required");
  if (!Array.isArray(categories) || !categories.length) throw new Error("categories");

  await db
    .prepare(
      `UPDATE oeuvres
       SET artist = ?, title = ?, note = ?, signed_dated = ?, support = ?,
           dimensions = ?, editions = ?, alt = ?, categories = ?, exposed = ?,
           carousel = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      artist,
      title,
      note,
      signed_dated,
      support,
      dimensions,
      editions,
      alt,
      JSON.stringify(categories),
      exposed,
      carousel,
      sortOrder,
      stampNow(),
      id
    )
    .run();

  return getWork(db, id);
}
export async function deleteWork(db, id) {
  if (!LIBRARY_ID_RE.test(id)) throw new Error("id");
  await db.prepare("DELETE FROM oeuvres WHERE id = ?").bind(id).run();
}

export async function takenIds(db) {
  const result = await db.prepare("SELECT id FROM oeuvres").all();
  return new Set((result.results || []).map((row) => row.id));
}
