/**
 * Static UI i18n (FR / UK). Titles/artists stay as stored.
 * Support + dimensions: display-time EN localization (inches) when lang=en.
 * Lang: ?lang=uk|en|fr → localStorage → default fr.
 */
(() => {
  const STORAGE_KEY = "galerie-vittet-lang";

  const STRINGS = {
    fr: {
      docTitle: "Galerie Vittet — L’art du regard",
      docDescription:
        "Galerie Vittet — peintures anciennes, œuvres choisies avec exigence à Paris depuis 1988.",
      writeGallery: "Écrire à la galerie",
      hours: "Mar–sam 14h30–19h et sur rendez-vous",
      heroStageAria: "Œuvres à la une",
      heroPrev: "Œuvre précédente",
      heroNext: "Œuvre suivante",
      heroDots: "Œuvres du carrousel",
      contactAria: "Coordonnées de la galerie",
      homeAria: "Galerie Vittet, accueil",
      topAria: "Galerie Vittet, retour en haut",
      navAria: "Sections",
      navCollection: "Collection",
      navGallery: "Galerie",
      catalog: "Catalogue",
      search: "Recherche",
      searchLede: "Parcourir les œuvres exposées par titre, artiste ou technique.",
      theCollection: "La collection",
      filtersAria: "Sections de la collection",
      "section.peinture": "Peintures",
      "section.miniature": "Miniatures",
      "section.nicolle": "Victor-Jean NICOLLE",
      searchLabel: "Rechercher une œuvre",
      searchPlaceholder: "Rechercher…",
      searchSubmit: "Lancer la recherche",
      paginationAria: "Pagination de la collection",
      pagePrev: "Page précédente",
      pageNext: "Page suivante",
      pagesAria: "Pages",
      collectionPick: "Une sélection de la collection",
      theGallery: "La galerie",
      aboutAria: "La galerie",
      aboutP1:
        "Actif depuis 1988, Claude Vittet est spécialiste des écoles du Nord des XVIème et XVIIème siècles, des paysagistes français du XVIIIème siècle, des œuvres de Victor Jean Nicolle, ainsi que de l’art de la miniature.",
      aboutP2:
        "Son goût le conduit à sélectionner des œuvres abordant la peinture d’histoire ainsi que les sujets mythologiques et religieux, lui permettant de proposer des œuvres rares et de répondre aux exigences des collectionneurs et musées.",
      aboutP3:
        "Membre de la CNES (Chambre nationale des experts spécialisés en objets d’art et de collection), il intervient en tant qu’expert auprès des particuliers.",
      facadeAlt: "Façade de la Galerie Claude Vittet, 21 quai Voltaire",
      claudeAlt: "Claude Vittet, Galerie Vittet",
      salleAlt: "Intérieur de la Galerie Vittet, quai Voltaire",
      creditPrefix: "Site réalisé par ",
      loupe: "Loupe",
      loupeAria: "Loupe — charger l’original",
      loupeExit: "Quitter",
      loupeExitAria: "Quitter la loupe",
      zoom: "Zoom",
      close: "Fermer",
      labelTitle: "Titre",
      labelArtist: "Artiste",
      labelSupport: "Technique / support",
      labelDimensions: "Dimensions",
      labelNote: "Note",
      askWork: "Demander cette œuvre →",
      mailSubject: "Demande d’information — {title}",
      mailSubjectFallback: "Demande d’information — œuvre Galerie Vittet",
      enlarge: "Agrandir {title}",
      theWork: "l’œuvre",
      untitled: "Sans titre",
      emptySection: "Aucune œuvre dans « {label} » pour le moment.",
      rangeOf: "{label} · {from}–{to} sur {total}",
      noneInSection: "{label} · aucune œuvre",
      searchResultsFor: "Résultats pour « {query} ».",
      searchPrompt: "Saisissez un titre, un artiste ou une technique.",
      searchNone: "Aucune œuvre ne correspond à « {query} ».",
      searchOne: "1 œuvre trouvée.",
      searchMany: "{n} œuvres trouvées.",
      heroLive: "Œuvre {n} sur {total}. {title}. {artist}.",
      heroEmpty: "Aucune œuvre en carousel.",
      goToWork: "Aller à l’œuvre {n}",
      pageN: "Page {n}",
      collectionUnavailable: "La collection est momentanément indisponible.",
      switchToUk: "English (UK)",
      switchToFr: "Français",
      switchLabelUk: "UK",
      switchLabelFr: "FR",
    },
    en: {
      docTitle: "Galerie Vittet — The art of looking",
      docDescription:
        "Galerie Vittet — Old Master paintings, works chosen with care in Paris since 1988.",
      writeGallery: "Write to the gallery",
      hours: "Tue–Sat 2:30–7pm and by appointment",
      heroStageAria: "Featured works",
      heroPrev: "Previous work",
      heroNext: "Next work",
      heroDots: "Carousel works",
      contactAria: "Gallery contact details",
      homeAria: "Galerie Vittet, home",
      topAria: "Galerie Vittet, back to top",
      navAria: "Sections",
      navCollection: "Collection",
      navGallery: "Gallery",
      catalog: "Catalogue",
      search: "Search",
      searchLede: "Browse exhibited works by title, artist or medium.",
      theCollection: "The collection",
      filtersAria: "Collection sections",
      "section.peinture": "Paintings",
      "section.miniature": "Miniatures",
      "section.nicolle": "Victor-Jean NICOLLE",
      searchLabel: "Search for a work",
      searchPlaceholder: "Search…",
      searchSubmit: "Search",
      paginationAria: "Collection pagination",
      pagePrev: "Previous page",
      pageNext: "Next page",
      pagesAria: "Pages",
      collectionPick: "A selection from the collection",
      theGallery: "The gallery",
      aboutAria: "The gallery",
      aboutP1:
        "Active since 1988, Claude Vittet specialises in the Northern schools of the 16th and 17th centuries, French landscape painters of the 18th century, the works of Victor Jean Nicolle, and the art of miniature.",
      aboutP2:
        "His taste leads him to select works of history painting as well as mythological and religious subjects, enabling him to offer rare works and to meet the requirements of collectors and museums.",
      aboutP3:
        "A member of the CNES (National Chamber of Experts Specialized in Works of Art and Collectibles), he acts as an expert for private individuals.",
      facadeAlt: "Façade of Galerie Claude Vittet, 21 quai Voltaire",
      claudeAlt: "Claude Vittet, Galerie Vittet",
      salleAlt: "Interior of Galerie Vittet, quai Voltaire",
      creditPrefix: "Website by ",
      loupe: "Loupe",
      loupeAria: "Loupe — load the original",
      loupeExit: "Exit",
      loupeExitAria: "Exit loupe",
      zoom: "Zoom",
      close: "Close",
      labelTitle: "Title",
      labelArtist: "Artist",
      labelSupport: "Medium / support",
      labelDimensions: "Dimensions",
      labelNote: "Note",
      askWork: "Enquire about this work →",
      mailSubject: "Enquiry — {title}",
      mailSubjectFallback: "Enquiry — work at Galerie Vittet",
      enlarge: "Enlarge {title}",
      theWork: "the work",
      untitled: "Untitled",
      emptySection: "No works in “{label}” for now.",
      rangeOf: "{label} · {from}–{to} of {total}",
      noneInSection: "{label} · no works",
      searchResultsFor: "Results for “{query}”.",
      searchPrompt: "Enter a title, artist or medium.",
      searchNone: "No works match “{query}”.",
      searchOne: "1 work found.",
      searchMany: "{n} works found.",
      heroLive: "Work {n} of {total}. {title}. {artist}.",
      heroEmpty: "No works in the carousel.",
      goToWork: "Go to work {n}",
      pageN: "Page {n}",
      collectionUnavailable: "The collection is temporarily unavailable.",
      switchToUk: "English (UK)",
      switchToFr: "Français",
      switchLabelUk: "UK",
      switchLabelFr: "FR",
    },
  };

  function normalizeLang(raw) {
    const v = String(raw || "").trim().toLowerCase();
    if (v === "en" || v === "uk" || v === "en-gb" || v === "en_gb") return "en";
    if (v === "fr" || v === "fr-fr") return "fr";
    return "";
  }

  function readLang() {
    try {
      const params = new URLSearchParams(location.search || "");
      const fromQuery = normalizeLang(params.get("lang"));
      if (fromQuery) return fromQuery;
    } catch (_) {
      /* ignore */
    }
    try {
      const stored = normalizeLang(localStorage.getItem(STORAGE_KEY));
      if (stored) return stored;
    } catch (_) {
      /* ignore */
    }
    return "fr";
  }

  let lang = readLang();

  function t(key, vars) {
    const dict = STRINGS[lang] || STRINGS.fr;
    let out = dict[key];
    if (out == null) out = STRINGS.fr[key];
    if (out == null) out = key;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        out = out.split(`{${name}}`).join(String(vars[name]));
      });
    }
    return out;
  }

  function applyAttr(selector, attr, keyAttr) {
    document.querySelectorAll(selector).forEach((el) => {
      const key = el.getAttribute(keyAttr);
      if (!key) return;
      if (attr === "text") el.textContent = t(key);
      else if (attr === "html") el.innerHTML = t(key);
      else el.setAttribute(attr, t(key));
    });
  }

  function syncSwitches() {
    document.querySelectorAll(".lang-switch").forEach((btn) => {
      const toUk = lang === "fr";
      btn.textContent = toUk ? t("switchLabelUk") : t("switchLabelFr");
      btn.setAttribute("aria-label", toUk ? t("switchToUk") : t("switchToFr"));
      btn.setAttribute("aria-pressed", toUk ? "false" : "true");
      btn.dataset.langTarget = toUk ? "en" : "fr";
    });
  }

  function applyStatic() {
    document.documentElement.lang = lang === "en" ? "en-GB" : "fr";
    document.documentElement.dataset.lang = lang;
    document.title = t("docTitle");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("docDescription"));

    applyAttr("[data-i18n]", "text", "data-i18n");
    applyAttr("[data-i18n-html]", "html", "data-i18n-html");
    applyAttr("[data-i18n-placeholder]", "placeholder", "data-i18n-placeholder");
    applyAttr("[data-i18n-aria]", "aria-label", "data-i18n-aria");
    applyAttr("[data-i18n-alt]", "alt", "data-i18n-alt");

    /* Credit: keep the mailto link, translate only the prefix. */
    const credit = document.querySelector(".footer-credit");
    if (credit) {
      const link = credit.querySelector("a");
      credit.replaceChildren(document.createTextNode(t("creditPrefix")));
      if (link) credit.append(link);
    }

    syncSwitches();
  }

  function persist(next) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {
      /* ignore */
    }
    try {
      const url = new URL(location.href);
      if (next === "fr") url.searchParams.delete("lang");
      else url.searchParams.set("lang", "uk");
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (_) {
      /* ignore */
    }
  }

  function setLang(next, { persist: doPersist = true } = {}) {
    const normalized = normalizeLang(next) || "fr";
    if (normalized === lang) {
      applyStatic();
      return lang;
    }
    lang = normalized;
    if (doPersist) persist(lang);
    applyStatic();
    document.dispatchEvent(new CustomEvent("galerie:lang", { detail: { lang } }));
    return lang;
  }

  function bindSwitches() {
    document.querySelectorAll(".lang-switch").forEach((btn) => {
      if (btn.dataset.i18nBound) return;
      btn.dataset.i18nBound = "1";
      btn.addEventListener("click", () => {
        setLang(btn.dataset.langTarget || (lang === "fr" ? "en" : "fr"));
      });
    });
  }

  function init() {
    applyStatic();
    bindSwitches();
  }

  /** Exact FR → EN phrases for stored support strings (longest first). */
  const SUPPORT_PHRASES = [
    [
      "huile sur panneau de chêne une planche non parquetée",
      "Oil on oak panel, single board, not cradled",
    ],
    [
      "gouaches sur velin à réhauts d'or (une paire)",
      "Gouaches on vellum with gold heightening (a pair)",
    ],
    [
      "gouaches sur vélin à réhauts d'or (une paire)",
      "Gouaches on vellum with gold heightening (a pair)",
    ],
    [
      "plume, encore brune, lavis brun et aquarelle",
      "Pen and brown ink, brown wash and watercolour",
    ],
    [
      "plume, encre brune, lavis brun et aquarelle",
      "Pen and brown ink, brown wash and watercolour",
    ],
    [
      "lavis gris et brun, plume et encre noire",
      "Grey and brown wash, pen and black ink",
    ],
    [
      "huiles sur panneaux peint en double face",
      "Oils on panels, painted on both sides",
    ],
    [
      "pierre noire et craie blanche sur papier",
      "Black chalk and white chalk on paper",
    ],
    [
      "plume, encre brune, lavis et aquarelle",
      "Pen and brown ink, wash and watercolour",
    ],
    [
      "pierre noire, aquarelle et gouache",
      "Black chalk, watercolour and gouache",
    ],
    [
      "aquarelle, lavis et encre brune",
      "Watercolour, wash and brown ink",
    ],
    [
      "aquarelle, plume et encre brune",
      "Watercolour, pen and brown ink",
    ],
    [
      "plume, encre brune et aquarelle",
      "Pen and brown ink and watercolour",
    ],
    [
      "plume, aquarelle et lavis brun",
      "Pen, watercolour and brown wash",
    ],
    [
      "aquarelle, plume et lavis brun",
      "Watercolour, pen and brown wash",
    ],
    [
      "plume, lavis brun et aquarelle",
      "Pen, brown wash and watercolour",
    ],
    [
      "aquarelle, encre et lavis brun",
      "Watercolour, ink and brown wash",
    ],
    ["plume, aquarelle et lavis", "Pen, watercolour and wash"],
    ["aquarelle, plume et lavis", "Watercolour, pen and wash"],
    ["plume, lavis et aquarelle", "Pen, wash and watercolour"],
    ["plume, encre et aquarelle", "Pen, ink and watercolour"],
    ["aquarelle et encre brune", "Watercolour and brown ink"],
    ["aquarelle, plume, encre", "Watercolour, pen and ink"],
    ["huile sur cuivre ovale", "Oil on oval copper"],
    ["gouache d'une paire", "Gouache from a pair"],
    ["gouache sur velin", "Gouache on vellum"],
    ["gouache sur vélin", "Gouache on vellum"],
    ["huile sur panneau", "Oil on panel"],
    ["huile sur cuivre", "Oil on copper"],
    ["huile sur toile", "Oil on canvas"],
    ["huile sur métal", "Oil on metal"],
    ["gouache", "Gouache"],
  ];

  /** Token replacements for residual FR words (UK spelling). */
  const SUPPORT_TOKENS = [
    [/huiles?\b/gi, "Oil"],
    [/gouaches?\b/gi, "Gouache"],
    [/aquarelles?\b/gi, "watercolour"],
    [/\bplume\b/gi, "pen"],
    [/\bencre\b/gi, "ink"],
    [/\blavis\b/gi, "wash"],
    [/\btoile\b/gi, "canvas"],
    [/\bpanneaux?\b/gi, "panels"],
    [/\bpanneau\b/gi, "panel"],
    [/\bcuivre\b/gi, "copper"],
    [/\bvélin\b/gi, "vellum"],
    [/\bvelin\b/gi, "vellum"],
    [/\bpapier\b/gi, "paper"],
    [/\bmétal\b/gi, "metal"],
    [/\bmetal\b/gi, "metal"],
    [/\bovale\b/gi, "oval"],
    [/pierre noire/gi, "black chalk"],
    [/craie blanche/gi, "white chalk"],
    [/\bbrune?\b/gi, "brown"],
    [/\bgrise?\b/gi, "grey"],
    [/\bnoire?\b/gi, "black"],
    [/\bsur\b/gi, "on"],
    [/\bet\b/gi, "and"],
    [/d['’]une paire/gi, "from a pair"],
    [/\bpaire\b/gi, "pair"],
    [/réhauts? d['’]or/gi, "gold heightening"],
    [/rehauts? d['’]or/gi, "gold heightening"],
  ];

  function foldSupportKey(value) {
    return String(value || "")
      .normalize("NFC")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function localizeSupport(raw) {
    const text = String(raw || "").trim();
    if (!text || lang !== "en") return text;
    if (/^sony$/i.test(text)) return text;
    const key = foldSupportKey(text);
    for (let i = 0; i < SUPPORT_PHRASES.length; i++) {
      if (foldSupportKey(SUPPORT_PHRASES[i][0]) === key) {
        return SUPPORT_PHRASES[i][1];
      }
    }
    let out = text;
    SUPPORT_TOKENS.forEach(([pattern, repl]) => {
      out = out.replace(pattern, repl);
    });
    out = out.replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
    // Capitalize first letter for display.
    if (out) out = out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  }

  function parseFrNumber(raw) {
    const n = parseFloat(
      String(raw || "")
        .replace(/\s+/g, "")
        .replace(",", ".")
    );
    return Number.isFinite(n) ? n : NaN;
  }

  /** cm → inches, one decimal (drop trailing .0). */
  function formatInches(cm) {
    const inches = Math.round((cm / 2.54) * 10) / 10;
    return Number.isInteger(inches) ? String(inches) : inches.toFixed(1);
  }

  function localizeDimensions(raw) {
    const text = String(raw || "").trim();
    if (!text || lang !== "en") return text;
    if (/\bpx\b/i.test(text)) return text;

    let out = text;
    const unit = "(?:cm|centim[eè]tres?)";
    out = out.replace(
      new RegExp(`Diam[eè]tre\\s*:?\\s*([\\d\\s.,]+)\\s*${unit}\\b`, "gi"),
      (_, num) => {
        const cm = parseFrNumber(num);
        if (!Number.isFinite(cm)) return _;
        return `Diameter: ${formatInches(cm)} in`;
      }
    );
    out = out.replace(
      new RegExp(
        `([\\d\\s.,]+)\\s*[x×X]\\s*([\\d\\s.,]+)\\s*${unit}\\b`,
        "g"
      ),
      (_, a, b) => {
        const w = parseFrNumber(a);
        const h = parseFrNumber(b);
        if (!Number.isFinite(w) || !Number.isFinite(h)) return _;
        return `${formatInches(w)} × ${formatInches(h)} in`;
      }
    );
    out = out.replace(new RegExp(`([\\d\\s.,]+)\\s*${unit}\\b`, "gi"), (_, num) => {
      const cm = parseFrNumber(num);
      if (!Number.isFinite(cm)) return _;
      return `${formatInches(cm)} in`;
    });
    return out;
  }

  function localizeFacts(support, dimensions) {
    return [localizeSupport(support), localizeDimensions(dimensions)]
      .filter(Boolean)
      .join(" · ");
  }

  window.GalerieI18n = {
    t,
    getLang: () => lang,
    setLang,
    applyStatic,
    init,
    localizeSupport,
    localizeDimensions,
    localizeFacts,
    sectionLabel(key) {
      return t(`section.${key}`);
    },
  };
})();
