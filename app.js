(() => {
  const { officialBars, presets, areaCoords } = window.SG_BARS_DATA;
  const STORAGE_KEY = 'sg50_airbnb_pwa_v1';
  const GMAPS_KEY_STORAGE = 'sg50_gmaps_api_key';

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
    { id: 'world', label: "World's Best", icon: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a13 13 0 010 18M12 3a13 13 0 000 18"/>' },
    { id: 'speakeasy', label: 'Speakeasy', icon: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8m-3 3l2 2m-4-1l2 2" stroke-linecap="round"/>' },
    { id: 'hotel', label: 'Hotel bars', icon: '<path d="M4 20h16M6 20V5a1 1 0 011-1h10a1 1 0 011 1v15M10 8h1m2 0h1m-4 4h1m2 0h1m-3 8v-4h2v4" stroke-linecap="round"/>' },
    { id: 'ginza', label: 'Ginza', icon: '<path d="M6 5h12l-1.5 14a1 1 0 01-1 .9H8.5a1 1 0 01-1-.9L6 5z"/><circle cx="12" cy="13" r="2.8"/>' },
    { id: 'listening', label: 'Listening', icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 6.5a5.5 5.5 0 015.5 5.5" stroke-linecap="round"/>' },
    { id: 'heritage', label: 'Heritage', icon: '<path d="M3 10l9-6 9 6M5 10v10h14V10M9 20v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'rooftop', label: 'Rooftop', icon: '<path d="M3 20h18M5 20v-7h4v7m2 0V9h4v11m2 0v-5h3v5M16 5a2.5 2.5 0 01-3.4 2.3A2.5 2.5 0 0016 5z" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'sustainable', label: 'Sustainable', icon: '<path d="M19 5C11 5 6 10 6 19c9 0 13-5 13-14zM6 19l6-6" stroke-linecap="round" stroke-linejoin="round"/>' }
  ];

  const state = {
    records: {},
    customBars: [],
    crawl: ['jigger-and-pony', 'bop', 'side-door', 'cat-bite-club'],
    tab: 'explore', // explore | wishlists | crawl | passport
    mapOpen: false,
    selectedMapId: null,
    detailId: null,
    filters: { search: '', cat: 'all', area: 'all', status: 'all', sort: 'rank' },
    leaflet: { map: null, markers: [], routeLine: null },
    liveGmaps: { active: false, map: null, markers: [], directionsRenderer: null }
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
  function photoSrc(bar) { return `./assets/photos/${bar.photo || 'modern_classic'}.jpg`; }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(window._toastT);
    window._toastT = setTimeout(() => el.classList.add('hidden'), 2400);
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

  function getFilteredBars() {
    const q = state.filters.search.trim().toLowerCase();
    const list = getAllBars().filter(b => {
      const r = getRecord(b.id);
      if (state.filters.cat !== 'all' && !(b.cats || []).includes(state.filters.cat)) return false;
      if (state.filters.area !== 'all' && b.area !== state.filters.area) return false;
      if (state.filters.status === 'visited' && !r.visited) return false;
      if (state.filters.status === 'unvisited' && r.visited) return false;
      if (state.filters.status === 'wishlist' && !r.wishlist) return false;
      if (q && !`${b.name} ${b.area} ${b.landmark} ${b.address} ${b.style} ${b.signature} ${b.summary} ${r.drink} ${r.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });

    list.sort((a, b) => {
      if (state.filters.sort === 'name') return a.name.localeCompare(b.name);
      if (state.filters.sort === 'rating') {
        const ra = getRecord(a.id).rating || a.googleRating || 4.5;
        const rb = getRecord(b.id).rating || b.googleRating || 4.5;
        return rb - ra || a.name.localeCompare(b.name);
      }
      const sc = x => x.worldRank ? x.worldRank : (x.asiaRank ? 100 + x.asiaRank : 500);
      return sc(a) - sc(b) || a.name.localeCompare(b.name);
    });
    return list;
  }

  // ==================== AIRBNB CARD TEMPLATE ====================
  function listingCardHtml(bar) {
    const r = getRecord(bar.id);
    const ratingVal = r.rating ? `${r.rating}.0` : (bar.googleRating ? bar.googleRating.toFixed(1) : '4.6');
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
          <div class="card-price-row"><strong>${esc(bar.avgDrink || bar.price)}</strong> avg cocktail</div>
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
    const areaTxt = state.filters.area === 'all' ? 'Any district' : state.filters.area;
    const catObj = CATEGORIES.find(c => c.id === state.filters.cat) || CATEGORIES[0];
    document.getElementById('dsArea').textContent = state.filters.area === 'all' ? 'Anywhere in SG' : state.filters.area;
    document.getElementById('dsCat').textContent = catObj.label;
    document.getElementById('dsQuery').textContent = state.filters.search ? state.filters.search : `${filtered.length} cocktail bars`;

    document.getElementById('mspTitle').textContent = state.filters.search ? state.filters.search : 'Where to drink?';
    document.getElementById('mspSub').textContent = `${areaTxt} · ${catObj.label} · ${filtered.length} bar${filtered.length === 1 ? '' : 's'}`;

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
  }

  function renderExploreGrid() {
    const list = getFilteredBars();
    const el = document.getElementById('exploreGrid');
    if (!list.length) {
      el.innerHTML = `<div style="grid-column:1/-1;padding:64px 20px;text-align:center;">
        <div style="font-size:18px;font-weight:700;">No exact matches</div>
        <div style="font-size:14px;color:var(--ink-secondary);margin-top:6px;">Try changing your district or clearing filters.</div>
        <button id="emptyResetBtn" class="btn-outline" style="margin-top:16px;">Remove all filters</button>
      </div>`;
      document.getElementById('emptyResetBtn').onclick = resetFilters;
      return;
    }
    el.innerHTML = list.map(listingCardHtml).join('');
  }

  function renderWishlists() {
    const saved = getAllBars().filter(b => getRecord(b.id).wishlist);
    document.getElementById('wishlistSub').textContent = saved.length
      ? `${saved.length} saved bar${saved.length === 1 ? '' : 's'} for your Singapore itinerary`
      : 'Tap the heart on any bar to save it for your next night out.';
    const el = document.getElementById('wishlistGrid');
    el.innerHTML = saved.length
      ? saved.map(listingCardHtml).join('')
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
      ? visited.map(listingCardHtml).join('')
      : `<div style="grid-column:1/-1;padding:48px 16px;text-align:center;color:var(--ink-secondary);font-size:15px;">Open any bar and tap <strong>Check in</strong> to stamp your Singapore cocktail passport.</div>`;
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
    const avail = all.filter(b => !state.crawl.includes(b.id) && (!q || `${b.name} ${b.area} ${b.style}`.toLowerCase().includes(q))).slice(0, 10);
    document.getElementById('crawlAddList').innerHTML = avail.map(b => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:14px;">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          <img src="${photoSrc(b)}" alt="" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;" />
          <div style="min-width:0;">
            <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(b.name)}</div>
            <div style="font-size:12.5px;color:var(--ink-secondary);">${esc(b.area)} ${b.asiaRank ? `· Asia #${b.asiaRank}` : ''}</div>
          </div>
        </div>
        <button data-add="${b.id}" class="mini-cta">+ Add</button>
      </div>
    `).join('');
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

  function renderDetailSheet() {
    const bar = getAllBars().find(b => b.id === state.detailId);
    if (!bar) return;
    const r = getRecord(bar.id);
    const inCrawl = state.crawl.includes(bar.id);

    const laurelLeft = bar.asiaRank ? `#${bar.asiaRank}` : '50';
    const laurelLeftSub = bar.asiaRank ? "Asia's Best" : 'Discovery';
    const laurelMid = bar.worldRank ? `#${bar.worldRank}` : (bar.googleRating ? `${bar.googleRating.toFixed(1)} ★` : '4.6 ★');
    const laurelMidSub = bar.worldRank ? "World's Best" : 'Google Rating';
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
          </div>` : ''}
        </div>

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
        <div style="font-size:16px;font-weight:700;">${esc(bar.avgDrink || bar.price)} <span style="font-size:13.5px;font-weight:400;color:var(--ink-secondary);">avg cocktail</span></div>
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
  }

  // ==================== REAL MAP (LEAFLET VOYAGER + OPTIONAL LIVE GOOGLE MAPS) ====================
  function ensureLeafletMap() {
    if (state.leaflet.map || !window.L) return;
    const map = L.map('leafletMap', { zoomControl: false, attributionControl: false }).setView([1.2885, 103.8465], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.on('click', () => { state.selectedMapId = null; renderMapPreview(); syncMapMarkers(); });
    state.leaflet.map = map;
  }

  function syncMapMarkers() {
    if (state.liveGmaps.active && state.liveGmaps.map) { syncLiveGoogleMap(); return; }
    ensureLeafletMap();
    const map = state.leaflet.map;
    if (!map) return;

    state.leaflet.markers.forEach(m => m.remove());
    state.leaflet.markers = [];
    if (state.leaflet.routeLine) { state.leaflet.routeLine.remove(); state.leaflet.routeLine = null; }

    // Crawl route polyline
    const all = getAllBars();
    const crawlBars = state.crawl.map(id => all.find(b => b.id === id)).filter(Boolean);
    if (crawlBars.length >= 2) {
      state.leaflet.routeLine = L.polyline(crawlBars.map(b => [b.lat, b.lng]), {
        color: '#FF385C', weight: 3.5, dashArray: '6 6', opacity: 0.85
      }).addTo(map);
    }

    getFilteredBars().forEach(bar => {
      const r = getRecord(bar.id);
      const cIdx = state.crawl.indexOf(bar.id);
      const isSel = bar.id === state.selectedMapId;
      const label = cIdx >= 0 ? `${cIdx + 1} · ${bar.name.split(' ')[0]}` : (bar.asiaRank ? `#${bar.asiaRank}` : (bar.avgDrink || bar.price));
      const cls = `airbnb-marker ${isSel ? 'active' : ''} ${r.visited ? 'visited' : ''} ${cIdx >= 0 && !isSel ? 'crawl' : ''}`;
      const icon = L.divIcon({ className: 'leaflet-div-icon', html: `<div class="${cls}">${esc(label)}</div>`, iconSize: [0, 0] });
      const marker = L.marker([bar.lat, bar.lng], { icon, zIndexOffset: isSel ? 1000 : (bar.asiaRank ? 300 : 100) }).addTo(map);
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
    el.innerHTML = `
      <img class="mpc-img" src="${photoSrc(bar)}" alt="${esc(bar.name)}" />
      <div class="mpc-body">
        <div>
          <div class="card-row-1">
            <div class="card-title">${esc(bar.name)}</div>
            <div class="card-rating">★ ${r.rating ? `${r.rating}.0` : (bar.googleRating || 4.6)}</div>
          </div>
          <div class="card-sub">${esc(bar.ribbon || bar.style)} · ${esc(bar.area)}</div>
          <div class="card-sub" style="font-size:12.5px;">${esc(bar.shortHours)}</div>
        </div>
        <div class="mpc-actions">
          <a href="${gmapsPlaceUrl(bar)}" target="_blank" rel="noopener noreferrer" class="mini-cta primary" onclick="event.stopPropagation()">Google Maps ↗</a>
          <a href="${gmapsDirUrl(bar)}" target="_blank" rel="noopener noreferrer" class="mini-cta" onclick="event.stopPropagation()">Walk ↗</a>
        </div>
      </div>
    `;
    el.onclick = () => openDetail(bar.id);
  }

  // Optional Live Google Maps JS API
  function activateLiveGoogleMaps(key) {
    if (!key) return;
    if (window.google && window.google.maps) { initLiveGoogleMap(); return; }
    window._initSgGmaps = initLiveGoogleMap;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=_initSgGmaps`;
    s.async = true; s.onerror = () => showToast('Google Maps API failed — using Voyager Map');
    document.head.appendChild(s);
  }

  function initLiveGoogleMap() {
    document.getElementById('leafletMap').classList.add('hidden');
    document.getElementById('liveGoogleMap').classList.remove('hidden');
    state.liveGmaps.active = true;
    state.liveGmaps.map = new google.maps.Map(document.getElementById('liveGoogleMap'), {
      center: { lat: 1.2885, lng: 103.8465 }, zoom: 14, mapTypeControl: false, streetViewControl: false
    });
    state.liveGmaps.directionsRenderer = new google.maps.DirectionsRenderer({
      map: state.liveGmaps.map, suppressMarkers: true, polylineOptions: { strokeColor: '#FF385C', strokeWeight: 4 }
    });
    syncLiveGoogleMap();
    showToast('Live Google Maps activated');
  }

  function syncLiveGoogleMap() {
    const gmap = state.liveGmaps.map; if (!gmap || !window.google) return;
    state.liveGmaps.markers.forEach(m => m.setMap(null)); state.liveGmaps.markers = [];
    getFilteredBars().forEach(bar => {
      const m = new google.maps.Marker({
        position: { lat: bar.lat, lng: bar.lng }, map: gmap, title: bar.name,
        label: bar.asiaRank ? { text: `#${bar.asiaRank}`, color: '#fff', fontSize: '11px', fontWeight: '700' } : undefined
      });
      m.addListener('click', () => { state.selectedMapId = bar.id; renderMapPreview(); });
      state.liveGmaps.markers.push(m);
    });
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
    if (state.liveGmaps.active && state.liveGmaps.map) { state.liveGmaps.map.panTo({ lat, lng }); state.liveGmaps.map.setZoom(z); }
    else if (state.leaflet.map) { state.leaflet.map.flyTo([lat, lng], z, { duration: 0.65 }); }
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
    state.filters = { search: '', cat: 'all', area: 'all', status: 'all', sort: 'rank' };
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
      'Visited Bars': bars.filter(b => getRecord(b.id).visited),
      'Wishlists': bars.filter(b => getRecord(b.id).wishlist && !getRecord(b.id).visited),
      'The 50 Discovery Singapore': bars.filter(b => !b.worldRank && !b.asiaRank)
    };
    const folders = Object.entries(groups).map(([name, items]) => `<Folder><name>${xmlEsc(name)}</name>${items.map(b => {
      const r = getRecord(b.id);
      const desc = [b.ribbon || '50 Discovery', `${b.area} · ${b.style}`, b.address, b.hours, r.visited ? `Visited (${r.visitDate || 'Yes'})` : '', r.rating ? `My Rating: ${'★'.repeat(r.rating)}` : '', r.drink ? `Tried: ${r.drink}` : '', r.notes].filter(Boolean).join('\n');
      return `<Placemark><name>${xmlEsc(b.name)}</name><description>${xmlEsc(desc)}</description><Point><coordinates>${b.lng},${b.lat},0</coordinates></Point></Placemark>`;
    }).join('')}</Folder>`).join('');
    dl('singapore-50-best-bars.kml', `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>SG 50 — Singapore Cocktail Bars (the50.com 2026)</name>${folders}</Document></kml>`, 'application/vnd.google-earth.kml+xml');
    showToast('Downloaded KML for Google My Maps');
  }

  function exportCSV() {
    const cols = ['Name', 'World 2026', 'Asia 2026', 'District', 'Address', 'Style', 'Avg Cocktail', 'Visited', 'Wishlist', 'Rating', 'Drink', 'Notes', 'Google Maps'];
    const rows = getAllBars().map(b => { const r = getRecord(b.id); return [b.name, b.worldRank || '', b.asiaRank || '', b.area, b.address, b.style, b.avgDrink || b.price, r.visited ? 'Yes' : 'No', r.wishlist ? 'Yes' : 'No', r.rating || '', r.drink || '', r.notes || '', gmapsPlaceUrl(b)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','); });
    dl('singapore-50-best-bars.csv', [cols.join(','), ...rows].join('\n'), 'text/csv');
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

  document.getElementById('btnToggleMap').onclick = () => {
    state.mapOpen = !state.mapOpen;
    renderHeaderState();
    if (state.mapOpen) {
      setTimeout(() => {
        ensureLeafletMap();
        if (state.leaflet.map) state.leaflet.map.invalidateSize();
        syncMapMarkers();
        renderMapPreview();
      }, 50);
    }
  };

  document.querySelectorAll('.district-pill').forEach(b => b.onclick = () => focusMapDistrict(b.dataset.focus));

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
    state.crawl = [...presets[b.dataset.preset].stops];
    saveState(); renderAll(); showToast(`Loaded ${presets[b.dataset.preset].title}`);
  });
  document.getElementById('btnShareCrawl').onclick = () => {
    const stops = state.crawl.map(id => getAllBars().find(b => b.id === id)).filter(Boolean);
    if (!stops.length) return;
    const text = `Singapore Cocktail Bar Crawl (the50.com)\n` + stops.map((b, i) => `${i + 1}. ${b.name} (${b.area})`).join('\n') + `\n\nGoogle Maps Walking Route:\n${gmapsCrawlUrl(stops)}`;
    if (navigator.share) navigator.share({ title: 'Singapore Cocktail Crawl', text }).catch(() => {});
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
    document.getElementById('gmapsKeyInput').value = localStorage.getItem(GMAPS_KEY_STORAGE) || '';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    document.getElementById('pwaStatusText').textContent = isStandalone ? 'Installed on Home Screen ✓ (Offline ready)' : 'Works offline with native full-screen UI';
    document.getElementById('settingsBackdrop').classList.remove('hidden');
  };
  document.getElementById('btnDesktopSettings').onclick = openSettings;
  document.getElementById('btnPassportMenu').onclick = openSettings;
  document.getElementById('btnInstallHelp').onclick = openSettings;
  document.getElementById('btnExportKmlMain').onclick = exportKML;
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
  document.getElementById('btnSaveGmapsKey').onclick = () => {
    const k = document.getElementById('gmapsKeyInput').value.trim();
    if (!k) { localStorage.removeItem(GMAPS_KEY_STORAGE); state.liveGmaps.active = false; document.getElementById('liveGoogleMap').classList.add('hidden'); document.getElementById('leafletMap').classList.remove('hidden'); showToast('Using default Voyager Map'); return; }
    localStorage.setItem(GMAPS_KEY_STORAGE, k);
    activateLiveGoogleMaps(k);
  };

  // Add Custom Bar
  document.getElementById('setAddCustomBar').onclick = () => { document.getElementById('settingsBackdrop').classList.add('hidden'); document.getElementById('customBackdrop').classList.remove('hidden'); };
  document.getElementById('closeCustomSheet').onclick = () => document.getElementById('customBackdrop').classList.add('hidden');
  document.getElementById('customBackdrop').onclick = e => { if (e.target.id === 'customBackdrop') document.getElementById('customBackdrop').classList.add('hidden'); };
  document.getElementById('customBarForm').onsubmit = e => {
    e.preventDefault();
    const area = document.getElementById('cbArea').value;
    const base = areaCoords[area] || [1.286, 103.848];
    const bar = {
      id: 'custom-' + Date.now(), name: document.getElementById('cbName').value.trim(),
      worldRank: null, asiaRank: null, ribbon: 'Custom', area, landmark: area,
      address: document.getElementById('cbAddress').value.trim(),
      lat: base[0] + (Math.random() - 0.5) * 0.002, lng: base[1] + (Math.random() - 0.5) * 0.002,
      style: document.getElementById('cbStyle').value.trim() || 'Cocktail Bar', cats: ['speakeasy'],
      photo: 'modern_classic', googleRating: 4.8, price: '$$$', avgDrink: 'S$26',
      hours: 'Check Google Maps', shortHours: 'Open evenings',
      signature: document.getElementById('cbSignature').value.trim() || 'House signature cocktail',
      summary: 'Custom Singapore cocktail bar added to your personal passport.'
    };
    state.customBars.push(bar); saveState(); document.getElementById('customBackdrop').classList.add('hidden'); e.target.reset();
    renderAll(); openDetail(bar.id); showToast(`Added ${bar.name}`);
  };

  loadState();
  renderAll();
  const savedKey = localStorage.getItem(GMAPS_KEY_STORAGE);
  if (savedKey) activateLiveGoogleMaps(savedKey);
})();
