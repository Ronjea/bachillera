/* =========================================================
   Subestaciones Eléctricas de Sevilla — App logic
   ========================================================= */
(function () {
  'use strict';

  // ---------- Constants ----------
  const TYPOLOGY_META = {
    alta: {
      label: 'Alta tensión',
      sub: 'Transporte · 220–400 kV',
      color: '#ef4444',
      capacityNote: '5.150 MVA de transformación agregada en la provincia (400/220 kV).',
      urbanismNote: 'Permitida en suelo urbano como uso dotacional de "transportes e infraestructuras básicas" (Art. 6.6.28 PGOU Sevilla), pero exige parcela con calificación específica, edificio protegido y, en suelo urbano consolidado, tendido subterráneo salvo justificación técnica de improcedencia.',
    },
    media: {
      label: 'Media tensión',
      sub: 'Distribución AT · 132 kV',
      color: '#f59e0b',
      capacityNote: '4.310 MVA de transformación agregada en distribución de alta tensión.',
      urbanismNote: 'También admitida en suelo urbano dentro del mismo uso dotacional de infraestructuras. En suelo urbano no consolidado y urbanizable, el planeamiento exige que las líneas de media tensión de nuevos desarrollos se ejecuten de forma subterránea (Art. 6.6.28.6 PGOU Sevilla).',
    },
    baja: {
      label: 'Baja tensión',
      sub: 'Distribución · ≤ 66 kV',
      color: '#22d3ee',
      capacityNote: '4.873 MVA de transformación agregada AT/MT en distribución local.',
      urbanismNote: 'Los centros de transformación de baja tensión son el uso más flexible: se admiten en suelo urbano y urbanizable, pero no en la vía pública; solo en edificaciones, casetas técnicas o zonas ajardinadas previstas por el planeamiento.',
    },
  };

  // Bounding boxes for view presets [west, south, east, north]
  const BBOX_METRO = [-6.15, 37.18, -5.6, 37.62];
  const BBOX_PROVINCE = [-6.55, 36.9, -4.68, 38.2];

  const METRO_MUNICIPIOS = new Set([
    'Sevilla', 'Alcalá de Guadaíra', 'Dos Hermanas', 'Camas', 'Tomares',
    'Mairena del Aljarafe', 'Palomares del Río', 'Bormujos', 'Salteras',
    'Sanlúcar la Mayor', 'La Rinconada', 'Valencina de la Concepción',
  ]);

  // ---------- State ----------
  const state = {
    all: [],
    activeTypologies: new Set(['alta', 'media', 'baja']),
    activeMunicipio: '',
    userLocation: null, // {lat, lon}
    map: null,
    theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark', // default dark for this concept
  };

  // ---------- Helpers ----------
  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function fmtKm(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(2)} km`;
  }

  function toGeoJSON(list) {
    return {
      type: 'FeatureCollection',
      features: list.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
        properties: s,
      })),
    };
  }

  function currentFilteredList() {
    return state.all.filter((s) => {
      if (!state.activeTypologies.has(s.tipologia)) return false;
      if (state.activeMunicipio && s.municipio !== state.activeMunicipio) return false;
      return true;
    });
  }

  function buildMunicipioClusters(list) {
    const map = new Map();
    list.forEach((s) => {
      if (!map.has(s.municipio)) map.set(s.municipio, { lat: 0, lon: 0, count: 0, municipio: s.municipio });
      const c = map.get(s.municipio);
      c.lat += s.lat; c.lon += s.lon; c.count += 1;
    });
    const features = [];
    map.forEach((c) => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lon / c.count, c.lat / c.count] },
        properties: { municipio: c.municipio, count: c.count },
      });
    });
    return { type: 'FeatureCollection', features };
  }

  // ---------- Theme ----------
  function initTheme() {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    const btn = document.getElementById('themeToggle');
    let mode = 'dark';
    btn.addEventListener('click', () => {
      mode = mode === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', mode);
      btn.setAttribute('aria-label', mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      switchMapStyle(mode);
    });
  }

  // ---------- Sidebar (mobile) ----------
  function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const toggle = document.getElementById('sidebarToggle');
    const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

    toggle.addEventListener('click', () => {
      if (isMobile()) {
        sidebar.classList.toggle('mobile-open');
        backdrop.classList.toggle('show', sidebar.classList.contains('mobile-open'));
      } else {
        sidebar.classList.toggle('collapsed');
        setTimeout(() => state.map && state.map.resize(), 180);
      }
    });
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('show');
    });

    // Scroll-fade hint: hide bottom gradient once the panel is scrolled to its end
    const scrollEl = document.getElementById('sidebarScroll');
    const updateScrollHint = () => {
      const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 4;
      sidebar.classList.toggle('scrolled-to-bottom', atBottom);
    };
    scrollEl.addEventListener('scroll', updateScrollHint);
    window.addEventListener('resize', updateScrollHint);
    updateScrollHint();
    window.__updateSidebarScrollHint = updateScrollHint;
  }

  // ---------- Stats ----------
  function renderStats() {
    const grid = document.getElementById('statGrid');
    const total = state.all.length;
    const counts = { alta: 0, media: 0, baja: 0 };
    state.all.forEach((s) => counts[s.tipologia]++);

    grid.innerHTML = `
      <div class="stat-card" data-testid="stat-total">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Subestaciones</div>
      </div>
      <div class="stat-card" data-testid="stat-municipios">
        <div class="stat-value">${new Set(state.all.map(s=>s.municipio)).size}</div>
        <div class="stat-label">Municipios</div>
      </div>
      ${Object.entries(TYPOLOGY_META).map(([key, meta]) => `
        <div class="stat-card dot" style="--dot-color:${meta.color}" data-testid="stat-${key}">
          <div class="stat-value" style="color:${meta.color}">${counts[key]}</div>
          <div class="stat-label">${meta.label}</div>
        </div>
      `).join('')}
    `;
    // paint dots
    grid.querySelectorAll('.stat-card.dot').forEach(el => {
      el.style.setProperty('--dot-c', el.style.getPropertyValue('--dot-color'));
    });
    const style = document.createElement('style');
    style.textContent = `.stat-card.dot::before{ background: var(--dot-color); }`;
    document.head.appendChild(style);
  }

  // ---------- Filters UI ----------
  function renderTypologyFilters() {
    const container = document.getElementById('typologyFilters');
    const counts = { alta: 0, media: 0, baja: 0 };
    state.all.forEach((s) => counts[s.tipologia]++);

    container.innerHTML = Object.entries(TYPOLOGY_META).map(([key, meta]) => `
      <button type="button" class="filter-chip" data-key="${key}" data-testid="chip-filter-${key}">
        <span class="dot" style="background:${meta.color}"></span>
        <span class="fc-label">${meta.label} <span style="color:var(--color-text-faint)">· ${meta.sub}</span></span>
        <span class="fc-count">${counts[key]}</span>
      </button>
    `).join('');

    container.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.key;
        if (state.activeTypologies.has(key)) {
          if (state.activeTypologies.size === 1) return; // keep at least one active
          state.activeTypologies.delete(key);
          chip.classList.add('inactive');
        } else {
          state.activeTypologies.add(key);
          chip.classList.remove('inactive');
        }
        applyFilters();
      });
    });
  }

  function renderMunicipioSelect() {
    const select = document.getElementById('municipioFilter');
    const municipios = Array.from(new Set(state.all.map((s) => s.municipio))).sort();
    municipios.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `${m} (${state.all.filter(s => s.municipio === m).length})`;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      state.activeMunicipio = select.value;
      applyFilters();
    });
  }

  // ---------- Map Legend ----------
  function renderMapLegend() {
    const legend = document.getElementById('mapLegend');
    legend.innerHTML = `
      <div class="legend-title">Tipología de tensión</div>
      ${Object.entries(TYPOLOGY_META).map(([key, meta]) => `
        <div class="legend-row"><span class="dot" style="background:${meta.color}"></span>${meta.label}</div>
      `).join('')}
      <div class="legend-row" style="margin-top:6px;"><span class="dot" style="background:var(--color-primary);opacity:.6"></span>Densidad (mapa de calor)</div>
    `;
  }

  // ---------- Map ----------
  const MAP_STYLES = {
    dark: 'https://tiles.openfreemap.org/styles/dark',
    light: 'https://tiles.openfreemap.org/styles/positron',
  };

  function initMap() {
    const map = new maplibregl.Map({
      container: 'map',
      style: MAP_STYLES.dark,
      // note: no trailing /style.json — OpenFreeMap serves the style JSON directly at this path
      bounds: BBOX_PROVINCE,
      fitBoundsOptions: { padding: 40 },
      attributionControl: true,
    });
    state.map = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

    map.on('load', () => {
      addDataLayers(map);
      registerMapInteractions(map);
    });
  }

  // (Re)adds our custom sources & layers on top of the current basemap style.
  // Called on initial load AND after every setStyle() theme switch, since
  // swapping the base style JSON wipes any sources/layers not defined in it.
  function addDataLayers(map) {
    const filtered = currentFilteredList();

    map.addSource('substations', { type: 'geojson', data: toGeoJSON(filtered) });
    map.addSource('clusters', { type: 'geojson', data: buildMunicipioClusters(filtered) });
    map.addSource('route', { type: 'geojson', data: state.routeData || { type: 'FeatureCollection', features: [] } });
    map.addSource('user-point', { type: 'geojson', data: state.userPointData || { type: 'FeatureCollection', features: [] } });

    const markersVisible = document.getElementById('layerMarkers').checked;
    const heatmapVisible = document.getElementById('layerHeatmap').checked;
    const clustersVisible = document.getElementById('layerClusters').checked;

    // Heatmap layer (density)
    map.addLayer({
      id: 'heat-layer',
      type: 'heatmap',
      source: 'substations',
      maxzoom: 13,
      layout: { visibility: heatmapVisible ? 'visible' : 'none' },
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'tension_max_kV'], 66, 0.4, 220, 1, 400, 1.3],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 1, 13, 2.5],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 14, 13, 34],
        'heatmap-opacity': 0.85,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, 'rgba(34,211,238,0.45)',
          0.4, 'rgba(251,191,36,0.55)',
          0.7, 'rgba(249,115,22,0.75)',
          1, 'rgba(239,68,68,0.9)'
        ],
      },
    });

    // Cluster circles (per municipio)
    map.addLayer({
      id: 'cluster-circles',
      type: 'circle',
      source: 'clusters',
      layout: { visibility: clustersVisible ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 10, 5, 20, 15, 34],
        'circle-color': '#fbbf24',
        'circle-opacity': 0.22,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fbbf24',
        'circle-stroke-opacity': 0.8,
      },
    });
    map.addLayer({
      id: 'cluster-labels',
      type: 'symbol',
      source: 'clusters',
      layout: {
        visibility: clustersVisible ? 'visible' : 'none',
        'text-field': ['get', 'count'],
        'text-size': 12,
        'text-font': ['Noto Sans Bold'],
      },
      paint: { 'text-color': '#fbbf24', 'text-halo-color': '#0a0e13', 'text-halo-width': 1.2 },
    });

    // Marker circles
    map.addLayer({
      id: 'substation-circles',
      type: 'circle',
      source: 'substations',
      layout: { visibility: markersVisible ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, ['match', ['get', 'tipologia'], 'alta', 6, 'media', 5, 4], 14, ['match', ['get', 'tipologia'], 'alta', 11, 'media', 9, 7]],
        'circle-color': ['match', ['get', 'tipologia'], 'alta', '#ef4444', 'media', '#f59e0b', 'baja', '#22d3ee', '#999'],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#0a0e13',
        'circle-opacity': 0.92,
      },
    });

    // Route line to nearest substation
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#fbbf24', 'line-width': 2.5, 'line-dasharray': [2, 2] },
    });

    // User location point
    map.addLayer({
      id: 'user-point-layer',
      type: 'circle',
      source: 'user-point',
      paint: {
        'circle-radius': 8,
        'circle-color': '#22d3ee',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#0a0e13',
      },
    });
  }

  let mapInteractionsRegistered = false;
  function registerMapInteractions(map) {
    if (mapInteractionsRegistered) return;
    mapInteractionsRegistered = true;

    map.on('click', 'substation-circles', (e) => {
      const f = e.features[0];
      showPopup(map, f.geometry.coordinates.slice(), f.properties);
    });
    map.on('mouseenter', 'substation-circles', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'substation-circles', () => map.getCanvas().style.cursor = '');

    map.on('click', 'cluster-circles', (e) => {
      const f = e.features[0];
      const municipio = f.properties.municipio;
      state.activeMunicipio = municipio;
      document.getElementById('municipioFilter').value = municipio;
      applyFilters();
      map.flyTo({ center: f.geometry.coordinates, zoom: 12, duration: 700 });
    });
    map.on('mouseenter', 'cluster-circles', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'cluster-circles', () => map.getCanvas().style.cursor = '');
  }

  function switchMapStyle(mode) {
    if (!state.map) return;
    const map = state.map;
    map.once('idle', () => addDataLayers(map));
    map.setStyle(MAP_STYLES[mode] || MAP_STYLES.dark);
  }

  function showPopup(map, coords, props) {
    const meta = TYPOLOGY_META[props.tipologia];
    let nivelesRaw = props.niveles_tension_kV;
    if (typeof nivelesRaw === 'string') {
      try { nivelesRaw = JSON.parse(nivelesRaw); } catch (e) { /* leave as string */ }
    }
    const niveles = Array.isArray(nivelesRaw)
      ? nivelesRaw.map((v) => String(v).trim()).filter(Boolean)
      : String(nivelesRaw || '').replace(/[\[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean);
    const html = `
      <div class="popup-title">${props.nombre}</div>
      <div class="popup-muni">${props.municipio}, provincia de Sevilla</div>
      <span class="popup-badge" style="background:${meta.color}22; color:${meta.color}">${meta.label}</span>
      <div class="popup-row"><span>Tensión máxima</span><span>${props.tension_max_kV} kV</span></div>
      <div class="popup-row"><span>Niveles disponibles</span><span>${niveles.join(' / ')} kV</span></div>
      <div class="popup-row"><span>Tipología</span><span>${meta.sub}</span></div>
      <div class="popup-row" style="border-top:1px solid var(--color-divider); flex-direction:column; align-items:flex-start; gap:4px;">
        <span style="color:var(--color-text-muted)">Capacidad de transformación</span>
        <span style="font-family:var(--font-body); text-align:left; font-weight:400; color:var(--color-text-muted); font-size:0.68rem;">${meta.capacityNote}</span>
      </div>
      <div class="popup-row" style="border-top:1px solid var(--color-divider); flex-direction:column; align-items:flex-start; gap:4px;">
        <span style="color:var(--color-text-muted)">¿Permitida en suelo urbano?</span>
        <span style="font-family:var(--font-body); text-align:left; font-weight:400; color:var(--color-text-muted); font-size:0.68rem;">${meta.urbanismNote}</span>
      </div>
    `;
    new maplibregl.Popup({ closeButton: true, maxWidth: '300px' })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  }

  // ---------- Apply filters to map + UI ----------
  function applyFilters() {
    const filtered = currentFilteredList();
    const source = state.map.getSource('substations');
    if (source) source.setData(toGeoJSON(filtered));
    const clusterSource = state.map.getSource('clusters');
    if (clusterSource) clusterSource.setData(buildMunicipioClusters(filtered));

    // update chip inactive state visuals + counts stay static (full dataset counts)
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      const key = chip.dataset.key;
      chip.classList.toggle('inactive', !state.activeTypologies.has(key));
    });
  }

  // ---------- Layer toggles ----------
  function initLayerToggles() {
    const markers = document.getElementById('layerMarkers');
    const heatmap = document.getElementById('layerHeatmap');
    const clusters = document.getElementById('layerClusters');

    function setVis(id, visible) {
      if (!state.map.getLayer(id)) return;
      state.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    }

    markers.addEventListener('change', () => setVis('substation-circles', markers.checked));
    heatmap.addEventListener('change', () => setVis('heat-layer', heatmap.checked));
    clusters.addEventListener('change', () => {
      setVis('cluster-circles', clusters.checked);
      setVis('cluster-labels', clusters.checked);
      if (clusters.checked) { markers.checked = false; setVis('substation-circles', false); }
      else { markers.checked = true; setVis('substation-circles', true); }
    });
  }

  // ---------- View presets ----------
  function initViewPresets() {
    const metroBtn = document.getElementById('viewMetro');
    const provinceBtn = document.getElementById('viewPeriphery');
    metroBtn.addEventListener('click', () => {
      state.map.fitBounds(BBOX_METRO, { padding: 40, duration: 800 });
      metroBtn.classList.add('active'); provinceBtn.classList.remove('active');
    });
    provinceBtn.addEventListener('click', () => {
      state.map.fitBounds(BBOX_PROVINCE, { padding: 30, duration: 800 });
      provinceBtn.classList.add('active'); metroBtn.classList.remove('active');
    });
    provinceBtn.classList.add('active');
  }

  // ---------- Proximity tool ----------
  async function geocode(query) {
    const trimmed = query.trim();
    const isPostal = /^\d{5}$/.test(trimmed);
    const q = isPostal ? `${trimmed} Sevilla, España` : `${trimmed}, Sevilla, España`;
    // Photon (komoot) — OSM-based geocoder with permissive CORS, biased toward Sevilla city center.
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lat=37.389&lon=-5.9845&location_bias_scale=0.3`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('network');
    const data = await res.json();
    if (!data || !data.features || !data.features.length) throw new Error('not_found');
    const f = data.features[0];
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties || {};
    const label = [p.name, p.street, p.city, p.state].filter(Boolean).join(', ');
    return { lat, lon, label };
  }

  function nearestSubstations(lat, lon, n = 5) {
    return state.all
      .map((s) => ({ s, dist: haversineKm(lat, lon, s.lat, s.lon) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, n);
  }

  function renderProximityResults(userPoint, ranked) {
    const results = document.getElementById('proximityResults');
    results.innerHTML = ranked.map(({ s, dist }, i) => {
      const meta = TYPOLOGY_META[s.tipologia];
      return `
        <div class="result-card rank-${i}" data-lat="${s.lat}" data-lon="${s.lon}" data-testid="card-result-${i}">
          <div class="result-card-top">
            <span class="result-card-name"><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${meta.color};margin-right:6px;"></span>${s.nombre}</span>
            <span class="result-card-dist">${fmtKm(dist)}</span>
          </div>
          <div class="result-card-meta">${s.municipio} · ${meta.label} · ${s.tension_max_kV} kV</div>
        </div>
      `;
    }).join('');

    results.querySelectorAll('.result-card').forEach((card) => {
      card.addEventListener('click', () => {
        const lat = parseFloat(card.dataset.lat), lon = parseFloat(card.dataset.lon);
        state.map.flyTo({ center: [lon, lat], zoom: 13, duration: 800 });
      });
    });

    // draw route line + user point + fit bounds
    const nearest = ranked[0].s;
    state.routeData = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[userPoint.lon, userPoint.lat], [nearest.lon, nearest.lat]] },
        properties: {},
      }],
    };
    state.userPointData = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [userPoint.lon, userPoint.lat] }, properties: {} }],
    };
    state.map.getSource('route').setData(state.routeData);
    state.map.getSource('user-point').setData(state.userPointData);

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([userPoint.lon, userPoint.lat]);
    ranked.forEach(({ s }) => bounds.extend([s.lon, s.lat]));
    state.map.fitBounds(bounds, { padding: 80, duration: 900, maxZoom: 14 });
  }

  function initProximityTool() {
    const form = document.getElementById('proximityForm');
    const input = document.getElementById('proximityInput');
    const status = document.getElementById('proximityStatus');
    const useLocationBtn = document.getElementById('useMyLocation');
    const submitBtn = document.getElementById('proximitySubmit');

    async function runSearch(userPoint, sourceLabel) {
      state.userLocation = userPoint;
      const ranked = nearestSubstations(userPoint.lat, userPoint.lon, 5);
      renderProximityResults(userPoint, ranked);
      status.className = 'proximity-status success';
      status.textContent = `${sourceLabel} · subestación más cercana: ${ranked[0].s.nombre} (${fmtKm(ranked[0].dist)})`;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      status.className = 'proximity-status';
      status.textContent = 'Buscando ubicación…';
      submitBtn.disabled = true;
      try {
        const geo = await geocode(q);
        await runSearch(geo, 'Ubicación encontrada');
      } catch (err) {
        status.className = 'proximity-status error';
        status.textContent = 'No se pudo encontrar esa ubicación. Prueba con un código postal (ej. 41013) o una dirección más específica.';
      } finally {
        submitBtn.disabled = false;
      }
    });

    useLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        status.className = 'proximity-status error';
        status.textContent = 'La geolocalización no está disponible en este navegador.';
        return;
      }
      status.className = 'proximity-status';
      status.textContent = 'Obteniendo tu ubicación…';
      navigator.geolocation.getCurrentPosition(
        (pos) => runSearch({ lat: pos.coords.latitude, lon: pos.coords.longitude }, 'Ubicación GPS'),
        () => {
          status.className = 'proximity-status error';
          status.textContent = 'No se pudo obtener tu ubicación. Comprueba los permisos del navegador.';
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // ---------- Init ----------
  async function init() {
    initTheme();
    initSidebarToggle();

    const res = await fetch('data/substations.json');
    state.all = await res.json();

    renderStats();
    renderTypologyFilters();
    renderMunicipioSelect();
    renderMapLegend();
    initMap();
    initLayerToggles();
    initViewPresets();
    initProximityTool();

    if (window.lucide) lucide.createIcons();
    if (typeof window.__updateSidebarScrollHint === 'function') window.__updateSidebarScrollHint();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
