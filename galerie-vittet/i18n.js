/**
 * Static UI i18n (FR / UK). Artwork content stays as stored (titles, artists…).
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
      hours: "Mar–sam 14h30–19h · sur rendez-vous",
      featured: "À la une",
      heroStageAria: "Œuvres à la une",
      heroPrev: "Œuvre précédente",
      heroNext: "Œuvre suivante",
      heroDots: "Œuvres du carrousel",
      contactAria: "Coordonnées de la galerie",
      homeAria: "Galerie Vittet, accueil",
      topAria: "Galerie Vittet, retour en haut",
      catalog: "Catalogue",
      search: "Recherche",
      searchLede: "Parcourir les œuvres exposées par titre, artiste ou technique.",
      chosenWorks: "Œuvres choisies",
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
      since1988: "Depuis 1988",
      theGallery: "La galerie",
      aboutAria: "La galerie",
      aboutP1:
        "Depuis 1988, Claude Vittet partage son regard sur les écoles du Nord des XVIᵉ et XVIIᵉ siècles, les paysagistes français du XVIIIᵉ siècle et l’art de la miniature.",
      aboutP2:
        "Membre de la Chambre nationale des experts spécialisés, il accompagne collectionneurs et amateurs dans la découverte de chaque œuvre.",
      facadeAlt: "Façade de la Galerie Claude Vittet, 21 quai Voltaire",
      galeristesAlt: "Les galeristes devant une œuvre, Galerie Vittet",
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
      hours: "Tue–Sat 2:30–7pm · by appointment",
      featured: "Featured",
      heroStageAria: "Featured works",
      heroPrev: "Previous work",
      heroNext: "Next work",
      heroDots: "Carousel works",
      contactAria: "Gallery contact details",
      homeAria: "Galerie Vittet, home",
      topAria: "Galerie Vittet, back to top",
      catalog: "Catalogue",
      search: "Search",
      searchLede: "Browse exhibited works by title, artist or medium.",
      chosenWorks: "Selected works",
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
      since1988: "Since 1988",
      theGallery: "The gallery",
      aboutAria: "The gallery",
      aboutP1:
        "Since 1988, Claude Vittet has shared his eye for the Northern schools of the 16th and 17th centuries, French landscape painters of the 18th century, and the art of miniature.",
      aboutP2:
        "A member of the National Chamber of Experts Specialized in Works of Art and Collectibles, he accompanies collectors and enthusiasts in the discovery of each work.",
      facadeAlt: "Façade of Galerie Claude Vittet, 21 quai Voltaire",
      galeristesAlt: "The gallerists in front of a painting, Galerie Vittet",
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

  window.GalerieI18n = {
    t,
    getLang: () => lang,
    setLang,
    applyStatic,
    init,
    sectionLabel(key) {
      return t(`section.${key}`);
    },
  };
})();
