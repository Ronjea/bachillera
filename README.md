# La Bachillera

Sitio informativo del barrio de La Bachillera (Sevilla, Distrito Norte): historia, planeamiento urbanístico (AGI-02 / PERI), archivo de documentos oficiales y mapa interactivo de la infraestructura eléctrica (subestaciones y líneas aéreas/subterráneas).

## Páginas

- `index.html` — portada: historia, planeamiento y problemas actuales del barrio.
- `mapa.html` — mapa interactivo (MapLibre GL): 109 subestaciones de la provincia + líneas eléctricas OSM con distinción aérea/subterránea.
- `documentos.html` — archivo de planeamiento del ámbito AGI-02 con enlaces a fuentes oficiales.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo (Vite)
npm run build      # typecheck + build de producción
npm run preview    # servir dist/
npm run fetch:lines  # regenerar public/data/power-lines.geojson desde Overpass (OSM)
```

Stack: Vite + TypeScript estricto (vanilla), i18next (es/en), MapLibre GL, tiles de OpenFreeMap.

## Datos

- `public/data/substations.json` — subestaciones (Agencia Andaluza de la Energía / IDEAndalucía, capa DERA G10, CC BY 4.0).
- `public/data/power-lines.geojson` — líneas eléctricas (© OpenStreetMap contributors, ODbL); generado con `scripts/fetch-power-lines.mjs`. La fuente oficial DERA no distingue tendido aéreo de subterráneo; OSM sí.
- `reference/legacy/` — versión original heredada (solo referencia, no se sirve).

Convenciones: código e identificadores en inglés; el contenido visible se traduce vía i18n (`src/i18n/locales/`).
