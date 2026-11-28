(() => {
  const { officialBars, presets, areaCoords, alcoholCatalog = [], popularAlcoholSearches = [] } = window.SG_BARS_DATA;
  const STORAGE_KEY = 'sg50_airbnb_pwa_v1';
  const MAP_THEME_STORAGE = 'sg50_map_theme';

  // Register Service Worker for offline iPhone PWA installability
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  // Airbnb-style monochrome outline category rail
  const CATEGORIES = [
    { id: 'all', label: 'All bars', icon: '<path d="M5 4h14l-7 8.5L5 4zm7 8.5V20m-4 0h8" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'top50', label: '50 Best', icon: '<path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.4 6.7 19.1l1-5.8-4.2-4.1 5.9-.9L12 3z" stroke-linejoin="round"/>' },
    { id: 'toprated', label: '4.6★+ Top', icon: '<path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 16.9l.9-5.4-3.9-3.8 5.4-.8L12 2z" stroke-linejoin="round"/><path d="M5 21h14" stroke-linecap="round"/>' },
    { id: 'wine', label: 'Wine & Bubbles', icon: '<path d="M8 22h8M12 15v7M7 3h10l-1 6.5a4 4 0 01-4 4 4 4 0 01-4-4L7 3z" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'whisky', label: 'Whisky', icon: '<path d="M5 6h14l-1.4 13a1.5 1.5 0 01-1.5 1.3H7.9a1.5 1.5 0 01-1.5-1.3L5 6z" stroke-linejoin="round"/><path d="M6.2 13h11.6M9.5 16h5" stroke-linecap="round"/>' },
    { id: 'sake', label: 'Sake & Japan', icon: '<path d="M9 3h6l-1 3.5c2 1.2 3 3.5 3 6.5v6a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 017 19v-6c0-3 1-5.3 3-6.5L9 3z" stroke-linejoin="round"/><path d="M8 13h8" stroke-linecap="round"/>' },
    { id: 'speakeasy', label: 'Speakeasy', icon: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8m-3 3l2 2m-4-1l2 2" stroke-linecap="round"/>' },
    { id: 'hotel', label: 'Hotel bars', icon: '<path d="M4 20h16M6 20V5a1 1 0 011-1h10a1 1 0 011 1v15M10 8h1m2 0h1m-4 4h1m2 0h1m-3 8v-4h2v4" stroke-linecap="round"/>' },
    { id: 'ginza', label: 'Ginza', icon: '<path d="M6 5h12l-1.5 14a1 1 0 01-1 .9H8.5a1 1 0 01-1-.9L6 5z"/><circle cx="12" cy="13" r="2.8"/>' },
    { id: 'listening', label: 'Listening', icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 6.5a5.5 5.5 0 015.5 5.5" stroke-linecap="round"/>' },
    { id: 'rooftop', label: 'Rooftop', icon: '<path d="M3 20h18M5 20v-7h4v7m2 0V9h4v11m2 0v-5h3v5M16 5a2.5 2.5 0 01-3.4 2.3A2.5 2.5 0 0016 5z" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'heritage', label: 'Heritage', icon: '<path d="M3 10l9-6 9 6M5 10v10h14V10M9 20v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'sustainable', label: 'Sustainable', icon: '<path d="M19 5C11 5 6 10 6 19c9 0 13-5 13-14zM6 19l6-6" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'world', label: "World's Best", icon: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a13 13 0 010 18M12 3a13 13 0 000 18"/>' }
  ];

  // Broad category triggers (matches entire canonical alcohol bucket) vs specific sub-styles
  const BROAD_ALCOHOL_TRIGGERS = {
    champagne: ['champagne', 'champagne & sparkling', 'bubbly', 'bubbles', 'sparkling', 'sparkling wine'],
    whisky: ['whisky', 'whiskey', 'whiskies', 'whiskeys', 'whisky & bourbon', 'whisky, scotch & bourbon', 'dram', 'drams'],
    wine: ['wine', 'wines', 'vino', 'wine & natural wine'],
    gin: ['gin', 'gins', 'gin & martinis'],
    tequila: ['tequila', 'agave', 'tequila & mezcal', 'tequila, mezcal & agave'],
    rum: ['rum', 'rums', 'rhum', 'aged rum & tiki'],
    sake: ['sake', 'nihonshu', 'sake & shochu', 'sake, shochu & umeshu', 'rice spirit', 'rice spirits'],
    amaro: ['amaro', 'amari', 'spritz', 'aperitivo', 'amaro & spritz', 'amaro, vermouth & spritz', 'vermouth'],
    cognac: ['cognac', 'brandy', 'cognac & sherry', 'cognac, brandy & sherry'],
    vodka: ['vodka', 'vodka & espresso martinis'],
    beer: ['beer', 'beers', 'craft beer', 'craft beer & draft', 'draft', 'draught'],
    mocktails: ['mocktail', 'mocktails', 'zero-proof', 'zero proof', 'zero-proof & mocktails', 'non-alcoholic', 'non alcoholic', 'alcohol-free', 'alcohol free']
  };

  // Synonym expansions for specific drink queries (e.g. "plum wine" -> matches "umeshu")
  const SUBSTYLE_SYNONYMS = {
    'plum wine': ['umeshu', 'plum wine'],
    'umeshu': ['umeshu', 'plum wine'],
    'scotch': ['scotch', 'islay', 'speyside', 'single malt'],
    'single malt': ['single malt', 'scotch', 'samaroli'],
    'japanese whisky': ['japanese whisky', 'japanese whiskies', 'yamazaki', 'hakushu', 'hibiki', 'toki', 'kakubin', 'japanese malt'],
    'grower champagne': ['grower', 'blanc de blancs'],
    'natural wine': ['natural wine', 'natural wines', 'low-intervention', 'skin-contact', 'pét-nat', 'pet-nat', 'biodynamic'],
    'pet-nat': ['pét-nat', 'pet-nat'],
    'prosecco': ['prosecco', 'franciacorta'],
    'bourbon': ['bourbon', 'rye', 'american'],
    'old fashioned': ['old fashioned', 'bourbon', 'rye'],
    'g&t': ['g&t', 'gin & tonic', 'gin and tonic'],
    'espresso martini': ['espresso martini', 'kopi-o'],
    'negroni': ['negroni', 'campari', 'aperitivo'],
    'margarita': ['margarita', 'agave', 'tequila'],
    'craft beer': ['craft beer', 'ipa', 'draft', 'lager', 'guinness', 'ale', 'stout'],
    'sherry': ['sherry', 'amontillado', 'oloroso', 'fino']
  };

  const state = {
    records: {},
    customBars: [],
    crawl: ['jigger-and-pony', 'bop', 'side-door', 'cat-bite-club'],
    tab: 'explore', // explore | wishlists | crawl | passport
    mapOpen: false,
    mapTheme: 'default', // default | night
    mapLayers: { showCrawl: false, onlyWishlist: false, onlyVisited: false },
    selectedMapId: null,
    detailId: null,
    filters: { search: '', cat: 'all', area: 'all', status: 'all', sort: 'rank', alcohol: '' },
    alcoholDraft: '',
    leaflet: {
      map: null,
      tileLayer: null,
      markers: [],
      routeLine: null,
      userMarker: null,
      userCircle: null,
      geoWatchId: null,
      userPos: null
    }
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.records) state.records = p.records;
        if (Array.isArray(p.customBars)) state.customBars = p.customBars;
        if (Array.isArray(p.crawl)) state.crawl = p.crawl;
      }
      const savedTheme = localStorage.getItem(MAP_THEME_STORAGE);
      if (savedTheme === 'night' || savedTheme === 'default') state.mapTheme = savedTheme;
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        records: state.records,
        customBars: state.customBars,
        crawl: state.crawl
      }));
    } catch (e) {}
  }

  function getAllBars() { return [...officialBars, ...state.customBars]; }
  function getRecord(id) { return state.records[id] || { visited: false, wishlist: false, rating: 0, notes: '', drink: '', visitDate: '' }; }
  function updateRecord(id, patch) { state.records[id] = { ...getRecord(id), ...patch }; saveState(); renderAll(); }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const LEGACY_AI_PHOTOS = new Set(['art_deco', 'botanical', 'ginza', 'grand_hotel', 'heritage', 'hifi', 'korean', 'modern_classic', 'modern_shophouse', 'rooftop', 'speakeasy', 'spice']);
  function photoSrc(bar) {
    const p = bar.photo && !LEGACY_AI_PHOTOS.has(bar.photo) ? bar.photo : 'jigger-and-pony';
    return `./assets/photos/${p}.jpg`;
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(window._toastT);
    window._toastT = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  // ==================== ALCOHOL SEARCH ENGINE ====================
  function getCatalogItem(id) {
    return alcoholCatalog.find(c => c.id === id) || null;
  }

  function normalizeText(str) {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function resolveAlcoholQuery(rawQuery) {
    if (rawQuery && typeof rawQuery === 'object' && rawQuery.norm) return rawQuery;
    const clean = String(rawQuery || '').trim();
    const norm = normalizeText(clean);
    if (!norm) return null;

    // 1. Check if it's a broad canonical category trigger (e.g. "champagne", "whisky", "sake")
    for (const [catId, triggers] of Object.entries(BROAD_ALCOHOL_TRIGGERS)) {
      if (triggers.includes(norm) || catId === norm) {
        const cat = getCatalogItem(catId);
        return {
          raw: clean,
          norm,
          mode: 'broad',
          catId,
          displayLabel: cat ? cat.label : clean,
          emoji: cat ? cat.emoji : '🍸'
        };
      }
    }

    // 2. Check if it maps to a category alias as a specific sub-style (e.g. "grower champagne", "umeshu", "mezcal")
    let matchedCat = null;
    for (const cat of alcoholCatalog) {
      if (cat.aliases.some(a => normalizeText(a) === norm || norm.includes(normalizeText(a)))) {
        matchedCat = cat;
        break;
      }
    }

    const titleCase = clean.replace(/\b\w/g, ch => ch.toUpperCase());
    return {
      raw: clean,
      norm,
      mode: 'substyle',
      catId: matchedCat ? matchedCat.id : null,
      displayLabel: titleCase,
      emoji: matchedCat ? matchedCat.emoji : '🍸'
    };
  }

  function textMatchesSubstyle(haystack, normQuery) {
    const h = normalizeText(haystack);
    if (!h) return false;
    if (h.includes(normQuery)) return true;
    const syns = SUBSTYLE_SYNONYMS[normQuery];
    if (syns && syns.some(s => h.includes(normalizeText(s)))) return true;
    const tokens = normQuery.split(/\s+/).filter(t => t.length >= 2);
    if (tokens.length > 1 && tokens.every(t => h.includes(t))) return true;
    return false;
  }

  function matchBarAlcohol(bar, rawQuery) {
    const parsed = typeof rawQuery === 'object' && rawQuery ? rawQuery : resolveAlcoholQuery(rawQuery);
    if (!parsed) return null;
    const alc = bar.alcohol || { specialties: {}, serves: {} };
    const specs = alc.specialties || {};
    const serves = alc.serves || {};

    if (parsed.mode === 'broad') {
      const catId = parsed.catId;
      if (specs[catId]) {
        const note = specs[catId];
        const exactMention = normalizeText(note).includes(parsed.norm) || parsed.norm !== 'champagne';
        return { tier: 'specialty', catId, note, exactMention, emoji: parsed.emoji };
      }
      if (serves[catId]) {
        const note = serves[catId];
        const exactMention = normalizeText(note).includes(parsed.norm) || parsed.norm !== 'champagne';
        return { tier: 'serves', catId, note, exactMention, emoji: parsed.emoji };
      }
      return null;
    }

    // Sub-style / specific craving match
    for (const [k, note] of Object.entries(specs)) {
      if (textMatchesSubstyle(`${k} ${note}`, parsed.norm)) {
        const cat = getCatalogItem(k);
        return { tier: 'specialty', catId: k, note, exactMention: true, emoji: (cat && cat.emoji) || parsed.emoji };
      }
    }
    for (const [k, note] of Object.entries(serves)) {
      if (textMatchesSubstyle(`${k} ${note}`, parsed.norm)) {
        const cat = getCatalogItem(k);
        return { tier: 'serves', catId: k, note, exactMention: true, emoji: (cat && cat.emoji) || parsed.emoji };
      }
    }
    // Check signature / summary / style for niche drink names (e.g. "Kaya Toast", "Sazerac", "Vesper", "Bellini")
    if (textMatchesSubstyle(`${bar.signature} ${bar.summary} ${bar.style}`, parsed.norm)) {
      return { tier: 'serves', catId: parsed.catId, note: bar.signature || bar.style, exactMention: true, emoji: parsed.emoji };
    }
    return null;
  }

  function alcoholRelevanceScore(bar, match, parsedAlc) {
    const identity = normalizeText(`${bar.name} ${bar.style} ${bar.ribbon || ''}`);
    const qWords = parsedAlc.norm.split(/\s+/).filter(w => w.length >= 3);
    const idMatchesQuery = identity.includes(parsedAlc.norm) || (qWords.length > 0 && qWords.every(w => identity.includes(w)));
    const idMatchesCat = parsedAlc.catId ? (
      (parsedAlc.catId === 'champagne' && /champagne|spritz|wine|bubbles/.test(identity)) ||
      (parsedAlc.catId === 'whisky' && /whisky|whiskey|single cask|malt|spirits/.test(identity)) ||
      (parsedAlc.catId === 'wine' && /wine|champagne/.test(identity)) ||
      (parsedAlc.catId === 'gin' && /gin|martini/.test(identity)) ||
      (parsedAlc.catId === 'sake' && /sake|shochu|umeshu|rice spirit|japanese/.test(identity)) ||
      (parsedAlc.catId === 'tequila' && /agave|tequila|mezcal/.test(identity)) ||
      (parsedAlc.catId === 'rum' && /rum|punch/.test(identity)) ||
      (parsedAlc.catId === 'amaro' && /spritz|italian|amaro/.test(identity)) ||
      (parsedAlc.catId === 'beer' && /beer/.test(identity)) ||
      (parsedAlc.catId === 'cognac' && /rare spirits|ginza/.test(identity))
    ) : false;
    const isDedicated = idMatchesQuery ? 2 : (idMatchesCat ? 1 : 0);
    const exactBonus = match.exactMention ? 1 : 0;
    const ratingScore = (bar.googleRating || 4.5) * 10 + (bar.asiaRank ? 1.5 : 0) + (bar.worldRank ? 1.5 : 0);
    return isDedicated * 1000 + exactBonus * 200 + ratingScore;
  }

  function countAlcoholMatches(bars, rawQuery) {
    const parsed = resolveAlcoholQuery(rawQuery);
    if (!parsed) return { specialty: [], serves: [], total: 0, parsed: null };
    const specialty = [];
    const serves = [];
    bars.forEach(b => {
      const m = matchBarAlcohol(b, parsed);
      if (m) {
        if (m.tier === 'specialty') specialty.push({ bar: b, match: m });
        else serves.push({ bar: b, match: m });
      }
    });
    const cmp = (a, b) => alcoholRelevanceScore(b.bar, b.match, parsed) - alcoholRelevanceScore(a.bar, a.match, parsed) || (b.bar.reviewCount || 0) - (a.bar.reviewCount || 0);
    specialty.sort(cmp);
    serves.sort(cmp);
    return { specialty, serves, total: specialty.length + serves.length, parsed };
  }

  // Google Maps Universal URLs (open natively in iPhone Google Maps app!)
  function gmapsPlaceUrl(b) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name}, ${b.address}`)}`; }
  function gmapsDirUrl(b) { return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${b.name}, ${b.address}`)}&travelmode=walking`; }
  function gmapsCrawlUrl(bars) {
    if (!bars.length) return 'https://www.google.com/maps/search/?api=1&query=cocktail+bars+Singapore';
    if (bars.length === 1) return gmapsPlaceUrl(bars[0]);
    const o = encodeURIComponent(`${bars[0].name}, ${bars[0].address}`);
    const d = encodeURIComponent(`${bars[bars.length - 1].name}, ${bars[bars.length - 1].address}`);
    const w = bars.slice(1, -1).map(b => encodeURIComponent(`${b.name}, ${b.address}`)).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=walking${w ? `&waypoints=${w}` : ''}`;
  }

  function distKm(a, b) {
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function formatWalk(km) {
    const w = km * 1.25;
    const m = Math.max(2, Math.round((w / 4.8) * 60));
    return `${w < 1 ? `${Math.round(w * 1000)}m` : `${w.toFixed(1)} km`} · ${m} min walk`;
  }

  function sortBarsList(list) {
    return list.sort((a, b) => {
      if (state.filters.sort === 'name') return a.name.localeCompare(b.name);
      if (state.filters.sort === 'rating') {
        const ra = getRecord(a.id).rating || a.googleRating || 4.5;
        const rb = getRecord(b.id).rating || b.googleRating || 4.5;
        return rb - ra || (b.reviewCount || 0) - (a.reviewCount || 0) || a.name.localeCompare(b.name);
      }
      // Curated Rank: World's 50 Best -> Asia's 50 Best -> 50 Discovery (by rating) -> Central Area 4.6★+ (by rating & reviews)
      const tierScore = x => {
        if (x.worldRank) return x.worldRank;
        if (x.asiaRank) return 100 + x.asiaRank;
        if (x.source === 'the50' || x.the50Url) return 300;
        return 500;
      };
      const ta = tierScore(a), tb = tierScore(b);
      if (ta !== tb) return ta - tb;
      const ga = a.googleRating || 4.5, gb = b.googleRating || 4.5;
      if (gb !== ga) return gb - ga;
      return (b.reviewCount || 0) - (a.reviewCount || 0) || a.name.localeCompare(b.name);
    });
  }

  function barAlcoholText(bar) {
    const alc = bar.alcohol || {};
    return [
      ...Object.keys(alc.specialties || {}),
      ...Object.values(alc.specialties || {}),
      ...Object.keys(alc.serves || {}),
      ...Object.values(alc.serves || {})
    ].join(' ');
  }

  function getFilteredBars(opts = {}) {
    const ignoreAlcohol = !!opts.ignoreAlcohol;
    const q = state.filters.search.trim().toLowerCase();
    const parsedAlc = !ignoreAlcohol ? resolveAlcoholQuery(state.filters.alcohol) : null;

    const list = getAllBars().filter(b => {
      const r = getRecord(b.id);
      if (state.filters.cat !== 'all' && !(b.cats || []).includes(state.filters.cat)) return false;
      if (state.filters.area !== 'all' && b.area !== state.filters.area) return false;
      if (state.filters.status === 'visited' && !r.visited) return false;
      if (state.filters.status === 'unvisited' && r.visited) return false;
      if (state.filters.status === 'wishlist' && !r.wishlist) return false;
      if (parsedAlc && !matchBarAlcohol(b, parsedAlc)) return false;
      if (q && !`${b.name} ${b.area} ${b.landmark} ${b.address} ${b.style} ${b.signature} ${b.summary} ${barAlcoholText(b)} ${r.drink} ${r.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });

    return sortBarsList(list);
  }

  // ==================== AIRBNB CARD TEMPLATE ====================
  function listingCardHtml(bar, alcoholMatch) {
    const r = getRecord(bar.id);
    const ratingVal = r.rating ? `${r.rating}.0` : (bar.googleRating ? bar.googleRating.toFixed(1) : '4.6');
    const pourHtml = alcoholMatch
      ? `<div class="card-pour-note ${alcoholMatch.tier === 'specialty' ? 'specialty' : ''}">
          <span class="card-pour-badge">${alcoholMatch.tier === 'specialty' ? '★ Specialty' : alcoholMatch.emoji}</span>${esc(alcoholMatch.note)}
        </div>`
      : '';

    return `
      <article class="listing-card" data-open="${bar.id}">
        <div class="card-photo-box">
          <img class="card-photo" src="${photoSrc(bar)}" alt="${esc(bar.name)}" loading="lazy" />
          ${bar.ribbon ? `<span class="card-ribbon">${esc(bar.ribbon)}</span>` : ''}
          <button class="card-heart" data-heart="${bar.id}" aria-label="${r.wishlist ? 'Remove from wishlists' : 'Save to wishlists'}">
            <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;overflow:visible;">
              <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"
                fill="${r.wishlist ? '#FF385C' : 'rgba(0,0,0,0.48)'}" stroke="#ffffff" stroke-width="2.2"/>
            </svg>
          </button>
          ${r.visited ? `<span class="card-visited-pill">✓ Visited</span>` : ''}
        </div>

        <div class="card-meta">
          <div class="card-row-1">
            <div class="card-title">${esc(bar.name)}</div>
            <div class="card-rating ${r.rating ? 'personal' : ''}">★ ${ratingVal}</div>
          </div>
          <div class="card-sub">${esc(bar.area)} · ${esc(bar.style)}</div>
          <div class="card-sub">${esc(bar.landmark)} · ${esc(bar.shortHours)}</div>
          <div class="card-price-row"><strong>${esc(bar.avgDrink || bar.price)}</strong> avg drink</div>
          ${pourHtml}
        </div>
      </article>
    `;
  }

  // ==================== RENDERING ====================
  function renderCategoryRail() {
    document.getElementById('catRail').innerHTML = CATEGORIES.map(c => `
      <button class="cat-item ${state.filters.cat === c.id ? 'active' : ''}" data-cat="${c.id}" role="tab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${c.icon}</svg>
        <span>${c.label}</span>
      </button>
    `).join('');
  }

  function renderHeaderState() {
    const filtered = getFilteredBars();
    const visitedCount = getAllBars().filter(b => getRecord(b.id).visited).length;
    document.getElementById('deskCrawlCount').textContent = state.crawl.length;
    document.getElementById('deskVisitedCount').textContent = visitedCount;
    document.getElementById('mobCrawlBadge').textContent = state.crawl.length;
    document.getElementById('mobCrawlBadge').classList.toggle('hidden', state.crawl.length === 0);

    // Search pill text
    const areaTxt = state.filters.area === 'all' ? 'Central SG' : state.filters.area;
    const catObj = CATEGORIES.find(c => c.id === state.filters.cat) || CATEGORIES[0];
    document.getElementById('dsArea').textContent = state.filters.area === 'all' ? 'Anywhere in SG' : state.filters.area;
    document.getElementById('dsCat').textContent = catObj.label;
    document.getElementById('dsQuery').textContent = state.filters.search ? state.filters.search : `${filtered.length} bar${filtered.length === 1 ? '' : 's'}`;

    document.getElementById('mspTitle').textContent = state.filters.search ? state.filters.search : 'Where to drink?';
    document.getElementById('mspSub').textContent = `${areaTxt} · ${filtered.length} bar${filtered.length === 1 ? '' : 's'}`;

    // Alcohol Search Top-Bar Triggers (Desktop + Mobile)
    const parsedAlc = resolveAlcoholQuery(state.filters.alcohol);
    const btnDeskAlc = document.getElementById('btnDesktopAlcohol');
    const btnMobAlc = document.getElementById('btnMobileAlcohol');
    const deskAlcClear = document.getElementById('desktopAlcoholClear');
    if (parsedAlc) {
      btnDeskAlc.classList.add('active');
      document.getElementById('desktopAlcoholLabel').textContent = `${parsedAlc.emoji} ${parsedAlc.displayLabel}`;
      deskAlcClear.classList.remove('hidden');
      btnMobAlc.classList.add('active');
      document.getElementById('mobileAlcoholLabel').textContent = `${parsedAlc.emoji} ${parsedAlc.displayLabel}`;
    } else {
      btnDeskAlc.classList.remove('active');
      document.getElementById('desktopAlcoholLabel').textContent = 'Alcohol search';
      deskAlcClear.classList.add('hidden');
      btnMobAlc.classList.remove('active');
      document.getElementById('mobileAlcoholLabel').textContent = 'Alcohol';
    }

    const activeF = (state.filters.area !== 'all' ? 1 : 0) + (state.filters.status !== 'all' ? 1 : 0) + (state.filters.sort !== 'rank' ? 1 : 0) + (state.filters.search ? 1 : 0);
    const mBadge = document.getElementById('mobileFilterBadge');
    mBadge.textContent = activeF;
    mBadge.classList.toggle('hidden', activeF === 0);
    document.getElementById('desktopFilterText').textContent = activeF ? `Filters (${activeF})` : 'Filters';

    // Tab visibility
    document.querySelectorAll('.tabbar-btn, .nav-ghost[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === state.tab);
    });

    const isExplore = state.tab === 'explore';
    document.getElementById('catRailWrap').classList.toggle('hidden', !isExplore);
    document.getElementById('mobileSearchWrap').classList.toggle('hidden', !isExplore);
    document.getElementById('tabExplore').classList.toggle('hidden', !isExplore || state.mapOpen);
    document.getElementById('mapScreen').classList.toggle('hidden', !isExplore || !state.mapOpen);
    document.getElementById('btnToggleMap').classList.toggle('hidden', !isExplore);
    document.getElementById('tabWishlists').classList.toggle('hidden', state.tab !== 'wishlists');
    document.getElementById('tabCrawl').classList.toggle('hidden', state.tab !== 'crawl');
    document.getElementById('tabPassport').classList.toggle('hidden', state.tab !== 'passport');

    // Floating button label
    document.getElementById('toggleMapLabel').textContent = state.mapOpen ? 'Show list' : 'Show map';
    document.getElementById('toggleMapIcon').innerHTML = state.mapOpen
      ? '<path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/>'
      : '<path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" stroke-linecap="round" stroke-linejoin="round"/>';
    renderMapLayerPills();
    syncHeaderHeight();
  }

  function syncHeaderHeight() {
    const header = document.getElementById('siteHeader');
    if (!header) return;
    const h = Math.ceil(header.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty('--header-h', `${h}px`);
  }

  function renderExploreGrid() {
    const list = getFilteredBars();
    const el = document.getElementById('exploreGrid');
    const banner = document.getElementById('alcoholBanner');
    const parsedAlc = resolveAlcoholQuery(state.filters.alcohol);

    if (!parsedAlc) {
      banner.classList.add('hidden');
      banner.innerHTML = '';
      if (!list.length) {
        el.innerHTML = `<div style="grid-column:1/-1;padding:64px 20px;text-align:center;">
          <div style="font-size:18px;font-weight:700;">No exact matches</div>
          <div style="font-size:14px;color:var(--ink-secondary);margin-top:6px;">Try changing your district or clearing filters.</div>
          <button id="emptyResetBtn" class="btn-outline" style="margin-top:16px;">Remove all filters</button>
        </div>`;
        document.getElementById('emptyResetBtn').onclick = resetFilters;
        return;
      }
      el.innerHTML = list.map(b => listingCardHtml(b)).join('');
      return;
    }

    // Grouped Alcohol Search mode: "Specializes in" first -> "Also serves" second
    const specItems = [];
    const servesItems = [];
    list.forEach(b => {
      const m = matchBarAlcohol(b, parsedAlc);
      if (!m) return;
      if (m.tier === 'specialty') specItems.push({ bar: b, match: m });
      else servesItems.push({ bar: b, match: m });
    });

    if (state.filters.sort === 'rank') {
      specItems.sort((a, b) => alcoholRelevanceScore(b.bar, b.match, parsedAlc) - alcoholRelevanceScore(a.bar, a.match, parsedAlc) || (b.bar.reviewCount || 0) - (a.bar.reviewCount || 0));
      servesItems.sort((a, b) => alcoholRelevanceScore(b.bar, b.match, parsedAlc) - alcoholRelevanceScore(a.bar, a.match, parsedAlc) || (b.bar.reviewCount || 0) - (a.bar.reviewCount || 0));
    }

    const total = specItems.length + servesItems.length;
    const breakdownParts = [];
    if (specItems.length) breakdownParts.push(`${specItems.length} specialize`);
    if (servesItems.length) breakdownParts.push(`${servesItems.length} also serve`);
    const subText = total
      ? `${total} bar${total === 1 ? '' : 's'} serving ${parsedAlc.displayLabel} (${breakdownParts.join(' · ')})`
      : `No bars match "${parsedAlc.displayLabel}" with your current district/category filters`;

    banner.classList.remove('hidden');
    banner.innerHTML = `
      <div class="alcohol-banner-left">
        <div class="alcohol-banner-emoji">${parsedAlc.emoji}</div>
        <div style="min-width:0;">
          <div class="alcohol-banner-title">Alcohol Search: ${esc(parsedAlc.displayLabel)}</div>
          <div class="alcohol-banner-sub">${esc(subText)}</div>
        </div>
      </div>
      <div class="alcohol-banner-actions">
        <button id="btnBannerSwitchAlcohol" class="mini-cta">Switch drink</button>
        <button id="btnBannerClearAlcohol" class="mini-cta primary">Clear ✕</button>
      </div>
    `;
    document.getElementById('btnBannerSwitchAlcohol').onclick = openAlcoholSheet;
    document.getElementById('btnBannerClearAlcohol').onclick = clearAlcoholSearch;

    if (!total) {
      el.innerHTML = `<div style="grid-column:1/-1;padding:56px 20px;text-align:center;">
        <div style="font-size:18px;font-weight:700;">No bars found for "${esc(parsedAlc.displayLabel)}"</div>
        <div style="font-size:14px;color:var(--ink-secondary);margin-top:6px;">Try switching drinks, searching a broader spirit, or clearing district/category filters.</div>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap;">
          <button id="emptySwitchAlcBtn" class="btn-rausch" style="padding:10px 18px;font-size:14px;">Switch drink</button>
          <button id="emptyResetBtn" class="btn-outline" style="padding:10px 18px;font-size:14px;">Reset all filters</button>
        </div>
      </div>`;
      document.getElementById('emptySwitchAlcBtn').onclick = openAlcoholSheet;
      document.getElementById('emptyResetBtn').onclick = resetFilters;
      return;
    }

    let html = '';
    if (specItems.length) {
      html += `
        <div class="alcohol-group-header specialty">
          <div class="alcohol-group-title">
            <span class="alcohol-group-star">★</span>
            <span>Specializes in ${esc(parsedAlc.displayLabel)}</span>
          </div>
          <span class="alcohol-group-count">${specItems.length} bar${specItems.length === 1 ? '' : 's'}</span>
        </div>
      `;
      html += specItems.map(({ bar, match }) => listingCardHtml(bar, match)).join('');
    }
    if (servesItems.length) {
      html += `
        <div class="alcohol-group-header secondary">
          <div class="alcohol-group-title">
            <span>Also serves ${esc(parsedAlc.displayLabel)}</span>
          </div>
          <span class="alcohol-group-count">${servesItems.length} bar${servesItems.length === 1 ? '' : 's'}</span>
        </div>
      `;
      html += servesItems.map(({ bar, match }) => listingCardHtml(bar, match)).join('');
    }
    el.innerHTML = html;
  }

  function renderWishlists() {
    const saved = getAllBars().filter(b => getRecord(b.id).wishlist);
    document.getElementById('wishlistSub').textContent = saved.length
      ? `${saved.length} saved bar${saved.length === 1 ? '' : 's'} for your Singapore itinerary`
      : 'Tap the heart on any bar to save it for your next night out.';
    const el = document.getElementById('wishlistGrid');
    el.innerHTML = saved.length
      ? saved.map(b => listingCardHtml(b)).join('')
      : `<div style="grid-column:1/-1;padding:60px 16px;text-align:center;color:var(--ink-secondary);font-size:15px;">Your wishlist is empty.</div>`;
  }

  function renderPassport() {
    const all = getAllBars();
    const visited = all.filter(b => getRecord(b.id).visited);
    const pct = all.length ? Math.round((visited.length / all.length) * 100) : 0;
    document.getElementById('passportHeadline').textContent = `${visited.length} of ${all.length} bars visited (${pct}%)`;
    document.getElementById('passportBarFill').style.width = `${pct}%`;

    const el = document.getElementById('passportGrid');
    el.innerHTML = visited.length
      ? visited.map(b => listingCardHtml(b)).join('')
      : `<div style="grid-column:1/-1;padding:48px 16px;text-align:center;color:var(--ink-secondary);font-size:15px;">Open any bar and tap <strong>Check in</strong> to stamp your Singapore bar passport.</div>`;
  }

  function renderCrawl() {
    const all = getAllBars();
    const stops = state.crawl.map(id => all.find(b => b.id === id)).filter(Boolean);
    document.getElementById('btnOpenCrawlGmaps').href = gmapsCrawlUrl(stops);

    let km = 0;
    for (let i = 1; i < stops.length; i++) km += distKm(stops[i - 1], stops[i]);
    const mins = stops.length > 1 ? Math.round(((km * 1.25) / 4.8) * 60) : 0;
    document.getElementById('crawlSub').textContent = stops.length
      ? `${stops.length} stop${stops.length === 1 ? '' : 's'} · ${(km * 1.25).toFixed(1)} km · ~${mins} min total walking`
      : 'Add stops below or pick a curated Singapore bar crawl.';

    const listEl = document.getElementById('crawlList');
    if (!stops.length) {
      listEl.innerHTML = `<div style="padding:36px;text-align:center;border:1px dashed var(--border-strong);border-radius:16px;color:var(--ink-secondary);font-size:14px;">No stops planned yet.</div>`;
    } else {
      listEl.innerHTML = stops.map((bar, idx) => `
        ${idx > 0 ? `<div class="walk-step"><span class="walk-bar"></span><span>${formatWalk(distKm(stops[idx - 1], bar))}</span></div>` : ''}
        <div class="crawl-stop-card">
          <span class="crawl-num">${idx + 1}</span>
          <img class="crawl-thumb" src="${photoSrc(bar)}" alt="${esc(bar.name)}" data-open="${bar.id}" style="cursor:pointer;" />
          <div style="flex:1;min-width:0;cursor:pointer;" data-open="${bar.id}">
            <div class="card-title">${esc(bar.name)}</div>
            <div class="card-sub">${esc(bar.area)} · ${esc(bar.landmark)}</div>
            <div class="card-sub" style="font-size:12.5px;">${esc(bar.shortHours)}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button data-mv="${idx}:-1" ${idx === 0 ? 'disabled' : ''} class="filter-circle-btn" style="width:32px;height:32px;opacity:${idx === 0 ? 0.3 : 1};">↑</button>
            <button data-mv="${idx}:1" ${idx === stops.length - 1 ? 'disabled' : ''} class="filter-circle-btn" style="width:32px;height:32px;opacity:${idx === stops.length - 1 ? 0.3 : 1};">↓</button>
            <button data-del="${bar.id}" class="filter-circle-btn" style="width:32px;height:32px;">✕</button>
          </div>
        </div>
      `).join('');
    }

    const q = (document.getElementById('crawlSearch').value || '').trim().toLowerCase();
    const avail = all.filter(b => !state.crawl.includes(b.id) && (!q || `${b.name} ${b.area} ${b.style} ${barAlcoholText(b)}`.toLowerCase().includes(q))).slice(0, 12);
    document.getElementById('crawlAddList').innerHTML = avail.map(b => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:14px;">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          <img src="${photoSrc(b)}" alt="" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;" />
          <div style="min-width:0;">
            <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(b.name)}</div>
            <div style="font-size:12.5px;color:var(--ink-secondary);">${esc(b.area)} ${b.asiaRank ? `· Asia #${b.asiaRank}` : (b.googleRating ? `· ${b.googleRating.toFixed(1)}★` : '')}</div>
          </div>
        </div>
        <button data-add="${b.id}" class="mini-cta">+ Add</button>
      </div>
    `).join('');
  }

  // ==================== ALCOHOL SEARCH MODAL SHEET ====================
  function openAlcoholSheet() {
    state.alcoholDraft = state.filters.alcohol || '';
    const input = document.getElementById('alcoholSearchInput');
    input.value = state.alcoholDraft;
    renderAlcoholSheet();
    document.getElementById('alcoholSheetBackdrop').classList.remove('hidden');
  }

  function closeAlcoholSheet() {
    document.getElementById('alcoholSheetBackdrop').classList.add('hidden');
  }

  function applyAlcoholSearch(queryStr, opts = {}) {
    const clean = String(queryStr || '').trim();
    state.filters.alcohol = clean;
    state.alcoholDraft = clean;
    if (state.tab !== 'explore') state.tab = 'explore';
    closeAlcoholSheet();
    renderAll();

    const parsed = resolveAlcoholQuery(clean);
    if (parsed) {
      const matched = getFilteredBars();
      if (state.mapOpen && matched.length) {
        setTimeout(() => fitMapToBars(matched), 80);
      }
      if (!opts.silent) {
        showToast(`${parsed.emoji} ${matched.length} bar${matched.length === 1 ? '' : 's'} serving ${parsed.displayLabel}`);
      }
    } else if (!opts.silent) {
      showToast('Showing all bars');
    }
  }

  function clearAlcoholSearch() {
    state.filters.alcohol = '';
    state.alcoholDraft = '';
    closeAlcoholSheet();
    renderAll();
    showToast('Alcohol search cleared');
  }

  function renderAlcoholSheet() {
    const baseBars = getFilteredBars({ ignoreAlcohol: true });
    const draft = (state.alcoholDraft || '').trim();
    const parsedDraft = resolveAlcoholQuery(draft);

    const hdrClear = document.getElementById('btnAlcoholHeaderClear');
    hdrClear.classList.remove('hidden');
    hdrClear.style.visibility = (!state.filters.alcohol && !draft) ? 'hidden' : 'visible';
    hdrClear.disabled = !state.filters.alcohol && !draft;
    document.getElementById('btnAlcoholInputClear').classList.toggle('hidden', !draft);

    // Live instant preview box when user types a drink
    const previewEl = document.getElementById('alcoholLivePreview');
    const applyBtn = document.getElementById('btnApplyAlcoholSheet');
    if (parsedDraft) {
      const res = countAlcoholMatches(baseBars, parsedDraft);
      previewEl.classList.remove('hidden');
      const topSpecPills = res.specialty.slice(0, 4).map(({ bar }) => `<span class="alcohol-live-bar-pill">★ ${esc(bar.name)}</span>`).join('');
      const summaryLeft = `${parsedDraft.emoji} "${esc(parsedDraft.displayLabel)}"`;
      const summaryRight = res.total
        ? `${res.specialty.length} specialize · ${res.serves.length} also serve`
        : 'No matches';
      previewEl.innerHTML = `
        <div class="alcohol-live-summary">
          <span>${summaryLeft}</span>
          <span style="font-size:12.5px;font-weight:600;color:var(--ink-secondary);">${summaryRight}</span>
        </div>
        ${topSpecPills ? `<div class="alcohol-live-tags">${topSpecPills}${res.specialty.length > 4 ? `<span class="alcohol-live-bar-pill">+${res.specialty.length - 4} more</span>` : ''}</div>` : ''}
      `;
      applyBtn.textContent = res.total
        ? `Show ${res.total} bar${res.total === 1 ? '' : 's'}`
        : `Search "${parsedDraft.displayLabel}"`;
    } else {
      previewEl.classList.add('hidden');
      previewEl.innerHTML = '';
      applyBtn.textContent = `Show all ${baseBars.length} bars`;
    }

    // One-tap spirit & drink chip grid with live counts
    const activeCatId = parsedDraft && parsedDraft.mode === 'broad' ? parsedDraft.catId : null;
    document.getElementById('alcoholChipGrid').innerHTML = alcoholCatalog.map(item => {
      const counts = countAlcoholMatches(baseBars, item.id);
      const isAct = activeCatId === item.id;
      const metaText = counts.specialty.length
        ? `${counts.specialty.length} specialist · ${counts.total} total`
        : `${counts.total} bar${counts.total === 1 ? '' : 's'}`;
      return `
        <button type="button" class="alcohol-chip ${isAct ? 'active' : ''}" data-alc-pick="${esc(item.label)}">
          <span class="alcohol-chip-emoji">${item.emoji}</span>
          <div style="min-width:0;">
            <div class="alcohol-chip-name">${esc(item.label)}</div>
            <div class="alcohol-chip-meta">${metaText}</div>
          </div>
        </button>
      `;
    }).join('');

    // Popular cravings pills
    const normDraft = normalizeText(draft);
    document.getElementById('alcoholPopularPills').innerHTML = popularAlcoholSearches.map(term => {
      const isAct = normDraft === normalizeText(term);
      return `<button type="button" class="pill-opt ${isAct ? 'active' : ''}" data-alc-pick="${esc(term)}">${esc(term)}</button>`;
    }).join('');
  }

  // ==================== AIRBNB FULL-SCREEN LISTING DETAIL SHEET ====================
  function openDetail(id) {
    const bar = getAllBars().find(b => b.id === id);
    if (!bar) return;
    state.detailId = id;
    renderDetailSheet();
    document.getElementById('detailBackdrop').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    state.detailId = null;
    document.getElementById('detailBackdrop').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function renderDetailPourHtml(bar) {
    const alc = bar.alcohol;
    if (!alc) return '';
    const specEntries = Object.entries(alc.specialties || {});
    const serveEntries = Object.entries(alc.serves || {});
    if (!specEntries.length && !serveEntries.length) return '';

    const specHtml = specEntries.map(([catId, note]) => {
      const item = getCatalogItem(catId) || { emoji: '🍸', label: catId };
      return `
        <button type="button" class="detail-pour-spec-card" data-detail-alc="${esc(item.label)}">
          <span class="detail-pour-spec-emoji">${item.emoji}</span>
          <div style="min-width:0;flex:1;">
            <div class="detail-pour-spec-title">★ Specializes in ${esc(item.label)}</div>
            <div class="detail-pour-spec-note">${esc(note)}</div>
          </div>
        </button>
      `;
    }).join('');

    const serveHtml = serveEntries.map(([catId, note]) => {
      const item = getCatalogItem(catId) || { emoji: '🍸', label: catId };
      return `<button type="button" class="detail-pour-pill" data-detail-alc="${esc(item.label)}" title="${esc(note)}">${item.emoji} ${esc(item.label)}</button>`;
    }).join('');

    return `
      <div class="detail-divider"></div>
      <div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:10px;">
          <div style="font-size:18px;font-weight:700;">What they pour</div>
          <span style="font-size:12px;color:var(--ink-secondary);">Tap any drink to search</span>
        </div>
        ${specHtml ? `<div class="detail-pour-spec-list">${specHtml}</div>` : ''}
        ${serveHtml ? `<div style="font-size:12.5px;font-weight:600;color:var(--ink-secondary);margin-top:12px;">Also serves</div><div class="detail-pour-serves-row">${serveHtml}</div>` : ''}
      </div>
    `;
  }

  function renderDetailSheet() {
    const bar = getAllBars().find(b => b.id === state.detailId);
    if (!bar) return;
    const r = getRecord(bar.id);
    const inCrawl = state.crawl.includes(bar.id);
    const isThe50 = bar.source === 'the50' || !!bar.the50Url;

    let laurelLeft, laurelLeftSub, laurelMid, laurelMidSub;
    if (isThe50) {
      laurelLeft = bar.asiaRank ? `#${bar.asiaRank}` : '50';
      laurelLeftSub = bar.asiaRank ? "Asia's Best" : 'Discovery';
      laurelMid = bar.worldRank ? `#${bar.worldRank}` : (bar.googleRating ? `${bar.googleRating.toFixed(1)} ★` : '4.6 ★');
      laurelMidSub = bar.worldRank ? "World's Best" : 'Google Rating';
    } else {
      laurelLeft = bar.googleRating ? `${bar.googleRating.toFixed(1)} ★` : '4.7 ★';
      laurelLeftSub = 'Google Maps';
      laurelMid = bar.reviewCount ? bar.reviewCount.toLocaleString() : 'Top Rated';
      laurelMidSub = bar.reviewCount ? 'Reviews' : 'Central SG';
    }
    const laurelRight = r.rating ? `${r.rating}.0 ★` : (r.visited ? '✓' : '—');
    const laurelRightSub = r.rating ? 'Your Rating' : (r.visited ? 'Visited' : 'Not rated');

    const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`${bar.name}, ${bar.address}`)}&z=16&output=embed`;

    document.getElementById('detailScroll').innerHTML = `
      <div class="detail-hero-wrap">
        <img class="detail-hero" src="${photoSrc(bar)}" alt="${esc(bar.name)}" />
        <div class="hero-top-actions">
          <button id="detBack" class="hero-circle" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12.5 5l-5 5 5 5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div style="display:flex;gap:10px;">
            <button id="detShare" class="hero-circle" aria-label="Share">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v13" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button id="detHeart" class="hero-circle" aria-label="Save">
              <svg width="19" height="19" viewBox="0 0 32 32"><path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" fill="${r.wishlist ? '#FF385C' : 'none'}" stroke="${r.wishlist ? '#FF385C' : '#222'}" stroke-width="2.4"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="detail-content">
        <div>
          <h1 class="detail-h1">${esc(bar.name)}</h1>
          <p class="detail-subtitle">${esc(bar.style)} in ${esc(bar.area)}, Singapore · ${esc(bar.landmark)}</p>
        </div>

        <!-- Airbnb Guest Favourite Laurel Box -->
        <div class="laurel-box">
          <div>
            <div class="laurel-big">${laurelLeft}</div>
            <div class="laurel-label">${laurelLeftSub}</div>
          </div>
          <div class="laurel-div"></div>
          <div>
            <div class="laurel-big">${laurelMid}</div>
            <div class="laurel-label">${laurelMidSub}</div>
          </div>
          <div class="laurel-div"></div>
          <div>
            <div class="laurel-big">${laurelRight}</div>
            <div class="laurel-label">${laurelRightSub}</div>
          </div>
        </div>

        <!-- Clean Airbnb Highlights -->
        <div class="feature-list">
          <div class="feature-row">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 4h14l-7 8.5L5 4zm7 8.5V20m-4 0h8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div>
              <div class="feature-title">Signature pour</div>
              <div class="feature-desc">${esc(bar.signature)}</div>
            </div>
          </div>
          <div class="feature-row">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>
            <div>
              <div class="feature-title">Opening hours</div>
              <div class="feature-desc">${esc(bar.hours)}</div>
            </div>
          </div>
          ${bar.the50Url ? `
          <div class="feature-row">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.4 6.7 19.1l1-5.8-4.2-4.1 5.9-.9L12 3z" stroke-linejoin="round"/></svg>
            <div>
              <div class="feature-title">Recognised by the50.com (2026)</div>
              <div class="feature-desc"><a href="${bar.the50Url}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;font-weight:600;color:var(--ink);">Read official listing on the50.com ↗</a></div>
            </div>
          </div>` : `
          <div class="feature-row">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 16.9l.9-5.4-3.9-3.8 5.4-.8L12 2z" stroke-linejoin="round"/></svg>
            <div>
              <div class="feature-title">Central Area 4.6★+ Google Maps Pick</div>
              <div class="feature-desc">Rated ${bar.googleRating ? bar.googleRating.toFixed(1) : '4.6'}★ on Google Maps${bar.reviewCount ? ` (${bar.reviewCount.toLocaleString()} reviews)` : ''}</div>
            </div>
          </div>`}
        </div>

        ${renderDetailPourHtml(bar)}

        <div class="detail-divider"></div>

        <div>
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;">About this bar</div>
          <p style="margin:0;font-size:15px;line-height:1.6;color:var(--ink);">${esc(bar.summary)}</p>
        </div>

        <div class="detail-divider"></div>

        <!-- Where you'll be — Google Maps section -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="font-size:18px;font-weight:700;">Where you'll be</div>
            <div style="font-size:14px;color:var(--ink-secondary);margin-top:3px;">${esc(bar.address)}</div>
          </div>
          <div class="detail-map-embed">
            <iframe src="${embedMapUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Maps for ${esc(bar.name)}"></iframe>
          </div>
          <div class="btn-row">
            <a href="${gmapsPlaceUrl(bar)}" target="_blank" rel="noopener noreferrer" class="btn-outline" style="flex:1;">Open in Google Maps ↗</a>
            <a href="${gmapsDirUrl(bar)}" target="_blank" rel="noopener noreferrer" class="btn-outline" style="flex:1;">Walking Directions ↗</a>
          </div>
          <button id="detCrawlToggle" class="btn-outline" style="width:100%;">
            ${inCrawl ? '✓ Added to Bar Crawl (Tap to remove)' : '+ Add to Bar Crawl Route'}
          </button>
        </div>

        <div class="detail-divider"></div>

        <!-- Personal Passport Log -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:18px;font-weight:700;">Your tasting log</div>
            <input id="detDate" type="date" value="${esc(r.visitDate || '')}" class="clean-input" style="width:auto;padding:7px 10px;font-size:13px;" />
          </div>
          <div id="detStars" class="star-row">
            ${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" class="star-tap ${n <= (r.rating || 0) ? 'active' : ''}">★</button>`).join('')}
          </div>
          <input id="detDrink" class="clean-input" value="${esc(r.drink || '')}" placeholder="Favourite drink you tried..." />
          <textarea id="detNotes" class="clean-textarea" rows="3" placeholder="Tasting notes, seat recommendations, or memories...">${esc(r.notes || '')}</textarea>
        </div>
      </div>
    `;

    document.getElementById('detailStickyBar').innerHTML = `
      <div>
        <div style="font-size:16px;font-weight:700;">${esc(bar.avgDrink || bar.price)} <span style="font-size:13.5px;font-weight:400;color:var(--ink-secondary);">avg drink</span></div>
        <div style="font-size:12.5px;color:var(--ink-secondary);">${r.visited ? `Visited${r.visitDate ? ` on ${esc(r.visitDate)}` : ''}` : 'Not visited yet'}</div>
      </div>
      <button id="detCheckIn" class="btn-rausch ${r.visited ? 'done' : ''}">
        ${r.visited ? '✓ Checked in' : 'Check in'}
      </button>
    `;

    document.getElementById('detBack').onclick = closeDetail;
    document.getElementById('detHeart').onclick = () => { updateRecord(bar.id, { wishlist: !r.wishlist }); showToast(!r.wishlist ? 'Saved to Wishlists' : 'Removed from Wishlists'); };
    document.getElementById('detShare').onclick = () => {
      const shareData = { title: bar.name, text: `${bar.name} (${bar.area}) — ${bar.signature}`, url: gmapsPlaceUrl(bar) };
      if (navigator.share) navigator.share(shareData).catch(() => {});
      else navigator.clipboard?.writeText(`${bar.name} — ${gmapsPlaceUrl(bar)}`).then(() => showToast('Copied Google Maps link'));
    };
    document.getElementById('detCheckIn').onclick = () => {
      const next = !r.visited;
      updateRecord(bar.id, { visited: next, visitDate: next && !r.visitDate ? new Date().toISOString().slice(0, 10) : r.visitDate });
      showToast(next ? `Checked in at ${bar.name}` : 'Removed check-in');
    };
    document.getElementById('detCrawlToggle').onclick = () => toggleCrawl(bar.id);
    document.getElementById('detStars').querySelectorAll('[data-star]').forEach(btn => {
      btn.onclick = () => {
        const val = Number(btn.dataset.star);
        updateRecord(bar.id, { rating: r.rating === val ? 0 : val, visited: true, visitDate: r.visitDate || new Date().toISOString().slice(0, 10) });
      };
    });
    document.getElementById('detDate').onchange = e => updateRecord(bar.id, { visitDate: e.target.value, visited: true });
    document.getElementById('detDrink').onchange = e => updateRecord(bar.id, { drink: e.target.value });
    document.getElementById('detNotes').onchange = e => updateRecord(bar.id, { notes: e.target.value });

    // Tappable "What they pour" drink pills launch Alcohol Search immediately!
    document.getElementById('detailScroll').querySelectorAll('[data-detail-alc]').forEach(btn => {
      btn.onclick = () => {
        const drink = btn.dataset.detailAlc;
        closeDetail();
        applyAlcoholSearch(drink);
      };
    });
  }

  // ==================== REAL MAP (ONEMAP SINGAPORE SLA — FREE, ZERO API KEY) ====================
  const ONEMAP_TILES = {
    default: 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png',
    night: 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png'
  };
  const ONEMAP_ATTR = '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" alt="OneMap" style="height:13px;width:13px;vertical-align:text-bottom;margin-right:3px;" /><a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a> &copy; contributors | <a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">SLA</a>';
  const SG_BOUNDS = [[1.144, 103.535], [1.494, 104.502]];

  function updateMapThemeUI() {
    const isNight = state.mapTheme === 'night';
    document.getElementById('mapScreen').classList.toggle('map-night', isNight);
    const icon = document.getElementById('mapThemeIcon');
    const btn = document.getElementById('btnMapTheme');
    if (icon) {
      icon.innerHTML = isNight
        ? '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
        : '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    }
    if (btn) btn.title = isNight ? 'Switch to Default light map' : 'Switch to Night dark map';
  }

  function applyMapTheme(theme, silent) {
    state.mapTheme = theme === 'night' ? 'night' : 'default';
    try { localStorage.setItem(MAP_THEME_STORAGE, state.mapTheme); } catch (e) {}
    updateMapThemeUI();
    if (state.leaflet.map && window.L) {
      if (state.leaflet.tileLayer) state.leaflet.tileLayer.remove();
      state.leaflet.tileLayer = L.tileLayer(ONEMAP_TILES[state.mapTheme], {
        detectRetina: true,
        minZoom: 11,
        maxZoom: 19,
        attribution: ONEMAP_ATTR
      }).addTo(state.leaflet.map);
    }
    if (!silent) showToast(state.mapTheme === 'night' ? 'OneMap Night mode' : 'OneMap Default mode');
  }

  function ensureLeafletMap() {
    if (state.leaflet.map || !window.L) return;
    const map = L.map('leafletMap', {
      zoomControl: false,
      attributionControl: false,
      minZoom: 11,
      maxZoom: 19,
      maxBounds: SG_BOUNDS,
      maxBoundsViscosity: 0.7
    }).setView([1.2885, 103.8465], 14);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.on('click', () => { state.selectedMapId = null; renderMapPreview(); syncMapMarkers(); });
    state.leaflet.map = map;
    applyMapTheme(state.mapTheme, true);
  }

  function renderMapLayerPills() {
    const all = getAllBars();
    const crawlCount = state.crawl.filter(id => all.some(b => b.id === id)).length;
    const wishCount = all.filter(b => getRecord(b.id).wishlist).length;
    const visCount = all.filter(b => getRecord(b.id).visited).length;

    const btnCrawl = document.getElementById('btnMapCrawl');
    const btnWish = document.getElementById('btnMapWishlist');
    const btnVis = document.getElementById('btnMapVisited');
    if (!btnCrawl || !btnWish || !btnVis) return;

    // Active alcohol filter pill right inside map overlay strip
    const alcPill = document.getElementById('mapAlcoholPill');
    const parsedAlc = resolveAlcoholQuery(state.filters.alcohol);
    if (alcPill) {
      if (parsedAlc) {
        const cnt = getFilteredBars().length;
        alcPill.classList.remove('hidden');
        document.getElementById('btnMapAlcoholSwitch').textContent = `${parsedAlc.emoji} ${parsedAlc.displayLabel} · ${cnt}`;
      } else {
        alcPill.classList.add('hidden');
      }
    }

    document.getElementById('mapCrawlLabel').textContent = crawlCount ? `Crawl route · ${crawlCount}` : 'Crawl route';
    document.getElementById('mapWishlistLabel').textContent = wishCount ? `Wishlist · ${wishCount}` : 'Wishlist';
    document.getElementById('mapVisitedLabel').textContent = visCount ? `Visited · ${visCount}` : 'Visited';

    btnCrawl.classList.toggle('active', state.mapLayers.showCrawl && crawlCount > 0);
    btnCrawl.setAttribute('aria-pressed', String(state.mapLayers.showCrawl && crawlCount > 0));
    btnWish.classList.toggle('active', state.mapLayers.onlyWishlist);
    btnWish.setAttribute('aria-pressed', String(state.mapLayers.onlyWishlist));
    btnVis.classList.toggle('active', state.mapLayers.onlyVisited);
    btnVis.setAttribute('aria-pressed', String(state.mapLayers.onlyVisited));
  }

  function fitMapToBars(bars) {
    if (!state.leaflet.map || !bars.length) return;
    if (bars.length === 1) {
      state.leaflet.map.flyTo([bars[0].lat, bars[0].lng], 16, { duration: 0.65 });
      return;
    }
    const bounds = L.latLngBounds(bars.map(b => [b.lat, b.lng]));
    state.leaflet.map.fitBounds(bounds, { padding: [72, 72], maxZoom: 16, animate: true });
  }

  function syncMapMarkers() {
    ensureLeafletMap();
    const map = state.leaflet.map;
    if (!map) return;

    state.leaflet.markers.forEach(m => m.remove());
    state.leaflet.markers = [];
    if (state.leaflet.routeLine) { state.leaflet.routeLine.remove(); state.leaflet.routeLine = null; }

    const all = getAllBars();
    const crawlBars = state.crawl.map(id => all.find(b => b.id === id)).filter(Boolean);
    const parsedAlc = resolveAlcoholQuery(state.filters.alcohol);

    // Draw bar crawl route polyline only when Crawl route toggle is ON
    if (state.mapLayers.showCrawl && crawlBars.length >= 2) {
      state.leaflet.routeLine = L.polyline(crawlBars.map(b => [b.lat, b.lng]), {
        color: '#FF385C', weight: 3.5, dashArray: '6 6', opacity: 0.88
      }).addTo(map);
    }

    // Choose which bars appear on map based on Wishlist / Visited / Alcohol / Filters
    let visibleBars;
    if (state.mapLayers.onlyWishlist) {
      visibleBars = all.filter(b => getRecord(b.id).wishlist && (!parsedAlc || matchBarAlcohol(b, parsedAlc)));
    } else if (state.mapLayers.onlyVisited) {
      visibleBars = all.filter(b => getRecord(b.id).visited && (!parsedAlc || matchBarAlcohol(b, parsedAlc)));
    } else {
      visibleBars = getFilteredBars();
    }

    // Ensure crawl stops stay visible whenever Crawl route toggle is ON
    if (state.mapLayers.showCrawl && crawlBars.length) {
      const seen = new Set(visibleBars.map(b => b.id));
      crawlBars.forEach(b => { if (!seen.has(b.id)) { visibleBars.push(b); seen.add(b.id); } });
    }

    visibleBars.forEach(bar => {
      const r = getRecord(bar.id);
      const cIdx = state.crawl.indexOf(bar.id);
      const isCrawlStop = state.mapLayers.showCrawl && cIdx >= 0;
      const isVisited = !!r.visited;
      const isWishlist = !!r.wishlist;
      const isSel = bar.id === state.selectedMapId;
      const alcMatch = parsedAlc ? matchBarAlcohol(bar, parsedAlc) : null;
      const isAlcSpec = !!(alcMatch && alcMatch.tier === 'specialty');

      const ratingNum = bar.googleRating ? bar.googleRating.toFixed(1) : null;
      const label = isCrawlStop
        ? `${cIdx + 1} · ${bar.name.split(' ')[0]}`
        : (bar.asiaRank ? `#${bar.asiaRank}` : (ratingNum ? (isAlcSpec && !isVisited ? ratingNum : `${ratingNum}★`) : (bar.avgDrink || bar.price)));

      const icons = `${isVisited ? '<span class="m-check">✓</span>' : ''}${isWishlist ? '<span class="m-heart">♥</span>' : ''}${isAlcSpec && !isVisited ? '<span class="m-star">★</span>' : ''}`;
      const cls = `airbnb-marker ${isSel ? 'active' : ''} ${isVisited ? 'visited' : ''} ${isWishlist ? 'wishlist' : ''} ${isCrawlStop && !isSel ? 'crawl' : ''} ${isAlcSpec ? 'alcohol-spec' : ''}`;
      const zIdx = isSel ? 1000 : (isCrawlStop ? 700 : (isAlcSpec ? 650 : (isVisited ? 550 : (isWishlist ? 500 : (bar.asiaRank ? 300 : 100)))));

      const icon = L.divIcon({
        className: 'leaflet-div-icon',
        html: `<div class="${cls}">${icons}<span>${esc(label)}</span></div>`,
        iconSize: [0, 0]
      });
      const marker = L.marker([bar.lat, bar.lng], { icon, zIndexOffset: zIdx }).addTo(map);
      marker.on('click', e => {
        L.DomEvent.stopPropagation(e);
        state.selectedMapId = bar.id;
        renderMapPreview();
        syncMapMarkers();
      });
      state.leaflet.markers.push(marker);
    });
  }

  function renderMapPreview() {
    const el = document.getElementById('mapPreviewCard');
    const bar = getAllBars().find(b => b.id === state.selectedMapId);
    if (!bar || !state.mapOpen) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const r = getRecord(bar.id);
    const cIdx = state.crawl.indexOf(bar.id);
    const parsedAlc = resolveAlcoholQuery(state.filters.alcohol);
    const alcMatch = parsedAlc ? matchBarAlcohol(bar, parsedAlc) : null;

    const badges = [
      alcMatch ? `<span class="mpc-badge ${alcMatch.tier === 'specialty' ? 'alc-spec' : 'alc-serves'}">${alcMatch.tier === 'specialty' ? `★ Specializes in ${esc(parsedAlc.displayLabel)}` : `${parsedAlc.emoji} Serves ${esc(parsedAlc.displayLabel)}`}</span>` : '',
      r.visited ? '<span class="mpc-badge visited">✓ Visited</span>' : '',
      r.wishlist ? '<span class="mpc-badge wishlist">♥ Wishlisted</span>' : '',
      state.mapLayers.showCrawl && cIdx >= 0 ? `<span class="mpc-badge crawl">Stop #${cIdx + 1}</span>` : ''
    ].filter(Boolean).join('');

    const pourLine = alcMatch
      ? `<div class="mpc-pour ${alcMatch.tier === 'specialty' ? '' : 'serves'}">${esc(alcMatch.note)}</div>`
      : '';

    el.innerHTML = `
      <img class="mpc-img" src="${photoSrc(bar)}" alt="${esc(bar.name)}" />
      <div class="mpc-body">
        <div>
          <div class="card-row-1">
            <div class="card-title">${esc(bar.name)}</div>
            <div class="card-rating">★ ${r.rating ? `${r.rating}.0` : (bar.googleRating ? bar.googleRating.toFixed(1) : '4.6')}</div>
          </div>
          <div class="card-sub">${esc(bar.ribbon || bar.style)} · ${esc(bar.area)}</div>
          <div class="card-sub" style="font-size:12.5px;">${esc(bar.shortHours)}</div>
          ${badges ? `<div class="mpc-badges">${badges}</div>` : ''}
          ${pourLine}
        </div>
        <div class="mpc-actions">
          <a href="${gmapsPlaceUrl(bar)}" target="_blank" rel="noopener noreferrer" class="mini-cta primary" onclick="event.stopPropagation()">Google Maps ↗</a>
          <a href="${gmapsDirUrl(bar)}" target="_blank" rel="noopener noreferrer" class="mini-cta" onclick="event.stopPropagation()">Walk ↗</a>
        </div>
      </div>
    `;
    el.onclick = () => openDetail(bar.id);
  }

  // Live GPS "Locate Me" Blue Dot
  function isInSingapore(lat, lng) {
    return lat >= 1.144 && lat <= 1.494 && lng >= 103.535 && lng <= 104.502;
  }

  function renderUserLocation(lat, lng, accuracy, shouldFly) {
    ensureLeafletMap();
    const map = state.leaflet.map;
    if (!map) return;
    state.leaflet.userPos = { lat, lng, accuracy };

    if (state.leaflet.userCircle) {
      state.leaflet.userCircle.setLatLng([lat, lng]).setRadius(Math.min(accuracy || 30, 150));
    } else {
      state.leaflet.userCircle = L.circle([lat, lng], {
        radius: Math.min(accuracy || 30, 150),
        color: '#2563eb',
        weight: 1,
        opacity: 0.45,
        fillColor: '#3b82f6',
        fillOpacity: 0.14,
        interactive: false
      }).addTo(map);
    }

    if (state.leaflet.userMarker) {
      state.leaflet.userMarker.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        className: 'leaflet-div-icon',
        html: '<div class="user-loc-wrap"><span class="user-loc-pulse"></span><span class="user-loc-dot"></span></div>',
        iconSize: [0, 0]
      });
      state.leaflet.userMarker = L.marker([lat, lng], { icon, zIndexOffset: 1500, interactive: false }).addTo(map);
    }

    if (shouldFly) {
      if (isInSingapore(lat, lng)) {
        map.flyTo([lat, lng], 16, { duration: 0.7 });
        let nearest = null, bestKm = Infinity;
        getAllBars().forEach(b => {
          const d = distKm({ lat, lng }, b);
          if (d < bestKm) { bestKm = d; nearest = b; }
        });
        showToast(nearest ? `Nearest: ${nearest.name} (${formatWalk(bestKm)})` : 'Showing your location');
      } else {
        showToast("You're outside Singapore — showing Central SG");
        focusMapDistrict('all');
      }
    }
  }

  function locateUser() {
    if (!('geolocation' in navigator)) {
      showToast('Location is not supported on this browser');
      return;
    }
    const btn = document.getElementById('btnLocateMe');
    if (state.leaflet.userPos && state.leaflet.geoWatchId !== null) {
      const { lat, lng, accuracy } = state.leaflet.userPos;
      renderUserLocation(lat, lng, accuracy, true);
      return;
    }

    btn.classList.add('locating');
    navigator.geolocation.getCurrentPosition(
      pos => {
        btn.classList.remove('locating');
        btn.classList.add('active');
        renderUserLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, true);
        if (state.leaflet.geoWatchId === null) {
          state.leaflet.geoWatchId = navigator.geolocation.watchPosition(
            p => renderUserLocation(p.coords.latitude, p.coords.longitude, p.coords.accuracy, false),
            () => {},
            { enableHighAccuracy: true, maximumAge: 10000 }
          );
        }
      },
      err => {
        btn.classList.remove('locating');
        btn.classList.remove('active');
        if (err && err.code === 1) showToast('Enable Location Services in Safari to see yourself on the map');
        else showToast('Could not get your GPS location — try again');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  }

  function focusMapDistrict(key) {
    const views = {
      all: [1.2885, 103.8465, 14],
      tp: [1.2782, 103.8432, 16],
      amoy: [1.2838, 103.8472, 16],
      bay: [1.2920, 103.8568, 15],
      orchard: [1.3075, 103.8300, 15]
    };
    const [lat, lng, z] = views[key] || views.all;
    if (state.leaflet.map) state.leaflet.map.flyTo([lat, lng], z, { duration: 0.65 });
  }

  // ==================== FILTER & CRAWL HELPERS ====================
  function toggleCrawl(id) {
    const i = state.crawl.indexOf(id);
    if (i >= 0) { state.crawl.splice(i, 1); showToast('Removed from bar crawl'); }
    else { if (state.crawl.length >= 10) { showToast('Google Maps supports up to 10 stops'); return; } state.crawl.push(id); showToast('Added to bar crawl'); }
    saveState(); renderAll();
  }

  function optimizeCrawl() {
    const bars = state.crawl.map(id => getAllBars().find(b => b.id === id)).filter(Boolean);
    if (bars.length <= 2) return;
    const route = [bars[0]], rem = bars.slice(1);
    while (rem.length) {
      const last = route[route.length - 1]; let bi = 0, bd = Infinity;
      rem.forEach((b, i) => { const d = distKm(last, b); if (d < bd) { bd = d; bi = i; } });
      route.push(rem.splice(bi, 1)[0]);
    }
    state.crawl = route.map(b => b.id); saveState(); renderAll(); showToast('Optimized walking order');
  }

  function resetFilters() {
    state.filters = { search: '', cat: 'all', area: 'all', status: 'all', sort: 'rank', alcohol: '' };
    state.alcoholDraft = '';
    renderAll();
  }

  function renderFilterSheet() {
    document.getElementById('sheetSearchInput').value = state.filters.search;
    const areas = ['all', ...new Set(getAllBars().map(b => b.area))];
    document.getElementById('sheetAreaPills').innerHTML = areas.map(a => `
      <button data-area="${esc(a)}" class="pill-opt ${state.filters.area === a ? 'active' : ''}">${a === 'all' ? 'Any district' : esc(a)}</button>
    `).join('');
    document.querySelectorAll('#sheetStatusPills .pill-opt').forEach(b => b.classList.toggle('active', b.dataset.status === state.filters.status));
    document.querySelectorAll('#sheetSortPills .pill-opt').forEach(b => b.classList.toggle('active', b.dataset.sort === state.filters.sort));
    document.getElementById('btnApplyFilters').textContent = `Show ${getFilteredBars().length} bars`;
  }

  // Exports
  function dl(name, content, mime) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function xmlEsc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function exportKML() {
    const bars = getAllBars();
    const groups = {
      '2026 World & Asia 50 Best Ranked': bars.filter(b => b.worldRank || b.asiaRank),
      'The 50 Discovery Singapore': bars.filter(b => (b.source === 'the50' || b.the50Url) && !b.worldRank && !b.asiaRank),
      'Central Area 4.6★+ Top Rated': bars.filter(b => b.source === 'google_top'),
      'Visited Bars': bars.filter(b => getRecord(b.id).visited),
      'Wishlists': bars.filter(b => getRecord(b.id).wishlist && !getRecord(b.id).visited)
    };
    const folders = Object.entries(groups).map(([name, items]) => `<Folder><name>${xmlEsc(name)}</name>${items.map(b => {
      const r = getRecord(b.id);
      const specKeys = Object.keys((b.alcohol && b.alcohol.specialties) || {}).join(', ');
      const desc = [b.ribbon || (b.googleRating ? `${b.googleRating.toFixed(1)}★ Google Maps` : 'Singapore Bar'), `${b.area} · ${b.style}`, b.address, b.hours, specKeys ? `Specializes in: ${specKeys}` : '', r.visited ? `Visited (${r.visitDate || 'Yes'})` : '', r.rating ? `My Rating: ${'★'.repeat(r.rating)}` : '', r.drink ? `Tried: ${r.drink}` : '', r.notes].filter(Boolean).join('\n');
      return `<Placemark><name>${xmlEsc(b.name)}</name><description>${xmlEsc(desc)}</description><Point><coordinates>${b.lng},${b.lat},0</coordinates></Point></Placemark>`;
    }).join('')}</Folder>`).join('');
    dl('singapore-bars-guide.kml', `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>SG 50 — Singapore Cocktail &amp; Bar Guide (${bars.length} Bars)</name>${folders}</Document></kml>`, 'application/vnd.google-earth.kml+xml');
    showToast('Downloaded KML for Google My Maps');
  }

  function exportCSV() {
    const cols = ['Name', 'Source', 'Google Rating', 'World 2026', 'Asia 2026', 'District', 'Address', 'Style', 'Avg Drink', 'Alcohol Specialties', 'Visited', 'Wishlist', 'Rating', 'Drink', 'Notes', 'Google Maps'];
    const rows = getAllBars().map(b => {
      const r = getRecord(b.id);
      const specs = Object.keys((b.alcohol && b.alcohol.specialties) || {}).join('; ');
      return [b.name, b.source === 'google_top' ? 'Google 4.6★+' : 'the50.com', b.googleRating || '', b.worldRank || '', b.asiaRank || '', b.area, b.address, b.style, b.avgDrink || b.price, specs, r.visited ? 'Yes' : 'No', r.wishlist ? 'Yes' : 'No', r.rating || '', r.drink || '', r.notes || '', gmapsPlaceUrl(b)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    dl('singapore-bars-guide.csv', [cols.join(','), ...rows].join('\n'), 'text/csv');
    showToast('Downloaded CSV');
  }

  function renderAll() {
    renderCategoryRail();
    renderHeaderState();
    renderExploreGrid();
    renderWishlists();
    renderCrawl();
    renderPassport();
    if (state.detailId) renderDetailSheet();
    if (state.mapOpen) {
      setTimeout(() => {
        if (state.leaflet.map) state.leaflet.map.invalidateSize();
        syncMapMarkers();
        renderMapPreview();
      }, 40);
    }
  }

  // ==================== EVENT WIRING ====================
  window.addEventListener('scroll', () => {
    document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 4);
  }, { passive: true });

  window.addEventListener('resize', () => {
    syncHeaderHeight();
    if (state.mapOpen && state.leaflet.map) state.leaflet.map.invalidateSize();
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      syncHeaderHeight();
      if (state.mapOpen && state.leaflet.map) state.leaflet.map.invalidateSize();
    }, 150);
  });

  document.getElementById('brandHome').onclick = () => { state.tab = 'explore'; state.mapOpen = false; resetFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  document.querySelectorAll('.tabbar-btn, .nav-ghost[data-tab]').forEach(btn => {
    btn.onclick = () => {
      state.tab = btn.dataset.tab;
      if (state.tab !== 'explore') state.mapOpen = false;
      renderAll();
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
  });

  document.getElementById('catRail').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.filters.cat = b.dataset.cat;
    renderAll();
  });

  // Alcohol Search triggers & sheet wiring
  document.getElementById('btnDesktopAlcohol').onclick = e => {
    if (e.target.closest('#desktopAlcoholClear')) {
      e.stopPropagation();
      clearAlcoholSearch();
      return;
    }
    openAlcoholSheet();
  };
  document.getElementById('btnMobileAlcohol').onclick = openAlcoholSheet;
  document.getElementById('closeAlcoholSheet').onclick = closeAlcoholSheet;
  document.getElementById('alcoholSheetBackdrop').onclick = e => { if (e.target.id === 'alcoholSheetBackdrop') closeAlcoholSheet(); };
  document.getElementById('btnAlcoholHeaderClear').onclick = clearAlcoholSearch;
  document.getElementById('btnClearAlcoholSheet').onclick = clearAlcoholSearch;
  document.getElementById('btnAlcoholInputClear').onclick = () => {
    state.alcoholDraft = '';
    document.getElementById('alcoholSearchInput').value = '';
    renderAlcoholSheet();
    document.getElementById('alcoholSearchInput').focus();
  };
  document.getElementById('alcoholSearchInput').oninput = e => {
    state.alcoholDraft = e.target.value;
    renderAlcoholSheet();
  };
  document.getElementById('alcoholSearchInput').onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyAlcoholSearch(state.alcoholDraft);
    }
  };
  document.getElementById('btnApplyAlcoholSheet').onclick = () => applyAlcoholSearch(state.alcoholDraft);

  ['alcoholChipGrid', 'alcoholPopularPills'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      const btn = e.target.closest('[data-alc-pick]');
      if (!btn) return;
      applyAlcoholSearch(btn.dataset.alcPick);
    });
  });

  document.getElementById('btnMapAlcoholSwitch').onclick = openAlcoholSheet;
  document.getElementById('btnMapAlcoholClear').onclick = clearAlcoholSearch;

  document.getElementById('btnToggleMap').onclick = () => {
    state.mapOpen = !state.mapOpen;
    renderHeaderState();
    if (state.mapOpen) {
      setTimeout(() => {
        syncHeaderHeight();
        ensureLeafletMap();
        if (state.leaflet.map) state.leaflet.map.invalidateSize();
        syncMapMarkers();
        renderMapPreview();
      }, 50);
    }
  };

  document.querySelectorAll('.district-pill').forEach(b => b.onclick = () => focusMapDistrict(b.dataset.focus));
  document.getElementById('btnMapTheme').onclick = () => applyMapTheme(state.mapTheme === 'night' ? 'default' : 'night');
  document.getElementById('btnLocateMe').onclick = locateUser;

  document.getElementById('btnMapCrawl').onclick = () => {
    const all = getAllBars();
    const crawlBars = state.crawl.map(id => all.find(b => b.id === id)).filter(Boolean);
    if (!state.mapLayers.showCrawl && !crawlBars.length) {
      showToast('Add stops in the Crawl tab to show your route');
      return;
    }
    state.mapLayers.showCrawl = !state.mapLayers.showCrawl;
    renderMapLayerPills();
    syncMapMarkers();
    renderMapPreview();
    if (state.mapLayers.showCrawl) {
      fitMapToBars(crawlBars);
      showToast(`Showing bar crawl (${crawlBars.length} stop${crawlBars.length === 1 ? '' : 's'})`);
    } else {
      showToast('Bar crawl route hidden');
    }
  };

  document.getElementById('btnMapWishlist').onclick = () => {
    const parsedAlc = resolveAlcoholQuery(state.filters.alcohol);
    const wishBars = getAllBars().filter(b => getRecord(b.id).wishlist && (!parsedAlc || matchBarAlcohol(b, parsedAlc)));
    if (!state.mapLayers.onlyWishlist && !wishBars.length) {
      showToast(parsedAlc ? `No wishlisted bars serving ${parsedAlc.displayLabel}` : 'Tap ♥ on any bar to save it to Wishlists');
      return;
    }
    state.mapLayers.onlyWishlist = !state.mapLayers.onlyWishlist;
    if (state.mapLayers.onlyWishlist) state.mapLayers.onlyVisited = false;
    renderMapLayerPills();
    syncMapMarkers();
    renderMapPreview();
    if (state.mapLayers.onlyWishlist) {
      fitMapToBars(wishBars);
      showToast(`Showing ${wishBars.length} wishlisted bar${wishBars.length === 1 ? '' : 's'}`);
    } else {
      showToast('Showing all matching bars');
    }
  };

  document.getElementById('btnMapVisited').onclick = () => {
    const parsedAlc = resolveAlcoholQuery(state.filters.alcohol);
    const visBars = getAllBars().filter(b => getRecord(b.id).visited && (!parsedAlc || matchBarAlcohol(b, parsedAlc)));
    if (!state.mapLayers.onlyVisited && !visBars.length) {
      showToast(parsedAlc ? `No visited bars serving ${parsedAlc.displayLabel}` : 'Check in at any bar to highlight it on the map');
      return;
    }
    state.mapLayers.onlyVisited = !state.mapLayers.onlyVisited;
    if (state.mapLayers.onlyVisited) state.mapLayers.onlyWishlist = false;
    renderMapLayerPills();
    syncMapMarkers();
    renderMapPreview();
    if (state.mapLayers.onlyVisited) {
      fitMapToBars(visBars);
      showToast(`Showing ${visBars.length} visited bar${visBars.length === 1 ? '' : 's'}`);
    } else {
      showToast('Showing all matching bars');
    }
  };

  // Delegated card click & heart toggle on all grids
  ['exploreGrid', 'wishlistGrid', 'passportGrid'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      const heart = e.target.closest('[data-heart]');
      if (heart) {
        e.stopPropagation();
        const bid = heart.dataset.heart;
        const next = !getRecord(bid).wishlist;
        updateRecord(bid, { wishlist: next });
        showToast(next ? 'Saved to Wishlists' : 'Removed from Wishlists');
        return;
      }
      const card = e.target.closest('[data-open]');
      if (card) openDetail(card.dataset.open);
    });
  });

  document.getElementById('detailBackdrop').addEventListener('click', e => { if (e.target.id === 'detailBackdrop') closeDetail(); });

  // Filter Sheet
  const openFilterSheet = () => { renderFilterSheet(); document.getElementById('filterSheetBackdrop').classList.remove('hidden'); };
  document.getElementById('mobileSearchPill').onclick = openFilterSheet;
  document.getElementById('desktopSearchPill').onclick = openFilterSheet;
  document.getElementById('btnMobileFilters').onclick = openFilterSheet;
  document.getElementById('btnDesktopFilters').onclick = openFilterSheet;
  document.getElementById('closeFilterSheet').onclick = () => document.getElementById('filterSheetBackdrop').classList.add('hidden');
  document.getElementById('filterSheetBackdrop').onclick = e => { if (e.target.id === 'filterSheetBackdrop') document.getElementById('filterSheetBackdrop').classList.add('hidden'); };

  document.getElementById('sheetSearchInput').oninput = e => { state.filters.search = e.target.value; renderFilterSheet(); renderAll(); };
  document.getElementById('sheetAreaPills').addEventListener('click', e => { const b = e.target.closest('[data-area]'); if (b) { state.filters.area = b.dataset.area; renderFilterSheet(); renderAll(); } });
  document.getElementById('sheetStatusPills').addEventListener('click', e => { const b = e.target.closest('[data-status]'); if (b) { state.filters.status = b.dataset.status; renderFilterSheet(); renderAll(); } });
  document.getElementById('sheetSortPills').addEventListener('click', e => { const b = e.target.closest('[data-sort]'); if (b) { state.filters.sort = b.dataset.sort; renderFilterSheet(); renderAll(); } });
  document.getElementById('btnClearFilters').onclick = () => { resetFilters(); renderFilterSheet(); };
  document.getElementById('btnApplyFilters').onclick = () => document.getElementById('filterSheetBackdrop').classList.add('hidden');

  // Crawl Events
  document.getElementById('btnOptimizeCrawl').onclick = optimizeCrawl;
  document.getElementById('btnClearCrawl').onclick = () => { state.crawl = []; saveState(); renderAll(); };
  document.getElementById('crawlSearch').oninput = renderCrawl;
  document.querySelectorAll('.preset-card').forEach(b => b.onclick = () => {
    const preset = presets[b.dataset.preset];
    if (!preset) return;
    state.crawl = [...preset.stops];
    saveState(); renderAll(); showToast(`Loaded ${preset.title}`);
  });
  document.getElementById('btnShareCrawl').onclick = () => {
    const stops = state.crawl.map(id => getAllBars().find(b => b.id === id)).filter(Boolean);
    if (!stops.length) return;
    const text = `Singapore Bar Crawl\n` + stops.map((b, i) => `${i + 1}. ${b.name} (${b.area})`).join('\n') + `\n\nGoogle Maps Walking Route:\n${gmapsCrawlUrl(stops)}`;
    if (navigator.share) navigator.share({ title: 'Singapore Bar Crawl', text }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => showToast('Copied itinerary + Google Maps link'));
  };
  document.getElementById('crawlList').addEventListener('click', e => {
    const del = e.target.closest('[data-del]'); if (del) { toggleCrawl(del.dataset.del); return; }
    const mv = e.target.closest('[data-mv]');
    if (mv) { const [i, d] = mv.dataset.mv.split(':').map(Number); if (i + d >= 0 && i + d < state.crawl.length) { [state.crawl[i], state.crawl[i + d]] = [state.crawl[i + d], state.crawl[i]]; saveState(); renderAll(); } return; }
    const op = e.target.closest('[data-open]'); if (op) openDetail(op.dataset.open);
  });
  document.getElementById('crawlAddList').addEventListener('click', e => { const add = e.target.closest('[data-add]'); if (add) toggleCrawl(add.dataset.add); });

  // Settings & iPhone Install Sheet
  const openSettings = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    document.getElementById('pwaStatusText').textContent = isStandalone ? 'Installed on Home Screen ✓ (Offline ready)' : 'Works offline with native full-screen UI';
    document.getElementById('setExportKml').textContent = `Export All ${getAllBars().length} Bars to Google My Maps (.kml)`;
    document.getElementById('settingsBackdrop').classList.remove('hidden');
  };
  document.getElementById('btnDesktopSettings').onclick = openSettings;
  document.getElementById('btnPassportMenu').onclick = openSettings;
  document.getElementById('closeSettingsSheet').onclick = () => document.getElementById('settingsBackdrop').classList.add('hidden');
  document.getElementById('settingsBackdrop').onclick = e => { if (e.target.id === 'settingsBackdrop') document.getElementById('settingsBackdrop').classList.add('hidden'); };

  document.getElementById('setExportKml').onclick = exportKML;
  document.getElementById('setDownloadCsv').onclick = exportCSV;
  document.getElementById('setDownloadJson').onclick = () => { dl('sg50-passport-backup.json', JSON.stringify({ records: state.records, customBars: state.customBars, crawl: state.crawl }, null, 2), 'application/json'); showToast('Downloaded JSON backup'); };
  document.getElementById('setRestoreJson').onclick = () => {
    try {
      const p = JSON.parse(document.getElementById('restoreJsonArea').value);
      if (p.records) state.records = p.records;
      if (Array.isArray(p.customBars)) state.customBars = p.customBars;
      if (Array.isArray(p.crawl)) state.crawl = p.crawl;
      saveState(); document.getElementById('settingsBackdrop').classList.add('hidden'); renderAll(); showToast('Passport restored');
    } catch { showToast('Invalid JSON format'); }
  };

  // Add Custom Bar
  document.getElementById('setAddCustomBar').onclick = () => { document.getElementById('settingsBackdrop').classList.add('hidden'); document.getElementById('customBackdrop').classList.remove('hidden'); };
  document.getElementById('closeCustomSheet').onclick = () => document.getElementById('customBackdrop').classList.add('hidden');
  document.getElementById('customBackdrop').onclick = e => { if (e.target.id === 'customBackdrop') document.getElementById('customBackdrop').classList.add('hidden'); };
  document.getElementById('customBarForm').onsubmit = e => {
    e.preventDefault();
    const area = document.getElementById('cbArea').value;
    const base = areaCoords[area] || [1.286, 103.848];
    const sig = document.getElementById('cbSignature').value.trim() || 'House signature cocktail';
    const bar = {
      id: 'custom-' + Date.now(), name: document.getElementById('cbName').value.trim(),
      source: 'custom',
      worldRank: null, asiaRank: null, ribbon: 'Custom', area, landmark: area,
      address: document.getElementById('cbAddress').value.trim(),
      lat: base[0] + (Math.random() - 0.5) * 0.002, lng: base[1] + (Math.random() - 0.5) * 0.002,
      style: document.getElementById('cbStyle').value.trim() || 'Cocktail Bar', cats: ['speakeasy'],
      photo: 'jigger-and-pony', googleRating: 4.8, price: '$$$', avgDrink: 'S$26',
      hours: 'Check Google Maps', shortHours: 'Open evenings',
      signature: sig,
      summary: 'Custom Singapore bar added to your personal passport.',
      alcohol: { specialties: { gin: sig }, serves: { whisky: 'House spirits & classics' } }
    };
    state.customBars.push(bar); saveState(); document.getElementById('customBackdrop').classList.add('hidden'); e.target.reset();
    renderAll(); openDetail(bar.id); showToast(`Added ${bar.name}`);
  };

  // Expose lightweight test hooks only if needed in headless checks, without polluting global API
  loadState();
  updateMapThemeUI();
  renderAll();
})();
