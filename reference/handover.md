# Handover — Mapa Interactivo de Subestaciones Eléctricas de Sevilla

**Fecha:** 10 de agosto de 2026
**Proyecto:** `sevilla-subestaciones`
**Enlace en producción:** [Subestaciones Eléctricas de Sevilla](https://www.perplexity.ai/computer/a/subestaciones-electricas-de-se-nQUX4t_qQSmmjn4.KH5FIg)

---

## 1. Encargo original

Crear un mapa interactivo de las subestaciones eléctricas de Sevilla usando datos de la Agencia Andaluza de la Energía (AAE), con:

- Marcadores por tipología (alta, media y baja tensión), capacidad y municipio.
- Herramienta de proximidad: introducir código postal/dirección y calcular la distancia a la subestación más cercana.
- Capas visuales para identificar zonas de mayor densidad de infraestructura (área metropolitana vs. periferia).

Petición posterior (ya resuelta): añadir información sobre si la alta y media tensión están permitidas en suelo urbano (normativa urbanística).

---

## 2. Estado actual: completado y desplegado

El sitio está en línea como vista previa (`deploy_website`, no publicado aún como `pplx.app` permanente — eso requiere que el usuario lo pida explícitamente).

**Funcionalidades implementadas:**

- Mapa interactivo (MapLibre GL + tiles de OpenFreeMap, estilos claro/oscuro).
- 109 subestaciones geolocalizadas con ficha emergente (nombre, municipio, tipología, tensión máxima, niveles disponibles, capacidad de transformación agregada, **y ahora nota de compatibilidad urbanística**).
- Filtros por tipología y por municipio (44 municipios).
- Capas conmutables: marcadores, mapa de densidad (heatmap), agrupación por municipio (clusters).
- Presets de vista: "Área metropolitana" y "Provincia completa".
- Herramienta de proximidad: introducir CP o dirección (geocodificación vía Photon/komoot.io) o usar geolocalización del navegador, calcula distancia a la subestación más cercana y traza la ruta.
- Modo claro/oscuro completo, con persistencia de capas y datos de ruta al cambiar de estilo.
- Diseño responsive: sidebar colapsable en móvil (drawer), ajustes de tipografía para pantallas pequeñas.
- Panel "¿Se permiten en suelo urbano?" con explicación normativa y ejemplo real (subestación Empalme, San Jerónimo).

---

## 3. Fuentes de datos y normativa (todas citadas dentro de la app)

**Datos geográficos de subestaciones:**
- [Portal de cartografía energética AAE](https://www.agenciaandaluzadelaenergia.es/es/informacion-energetica/cartografia-energetica-de-andalucia/mapa-de-infraestructuras-energeticas-de-andalucia-miea) (Mapa de Infraestructuras Energéticas de Andalucía).
- [Informe provincial AAE (PDF)](https://www.agenciaandaluzadelaenergia.es/sites/default/files/Documentos/Infraestructuras/Informe_Prov_SE_MIEA.pdf) — capacidades agregadas por categoría.
- Servicio WFS de [IDEAndalucía](http://www.ideandalucia.es/services/DERA_g10_infra_energetica/wfs) (capa DERA G10, actualización 2025) — 109 nodos (la prensa regional citaba 95 a cierre de 2024).

**Normativa urbanística (nueva sección):**
- [PGOU de Sevilla, Art. 6.6.28 — Uso de transportes e infraestructuras básicas](https://web.urbanismosevilla.org/planeamientopgou/pdfs/06_TR_NORMAS_URBANISTICAS/06_TR_NORMAS/06_TR_NORMAS.PDF)
- [Real Decreto 1955/2000](https://www.boe.es/buscar/doc.php?id=BOE-A-2000-24019) (financiación de subestaciones por promotores en suelo urbanizable).
- Caso real: [reportaje sobre la subestación "Empalme"](https://www.manueljesusflorencio.com/2026/07/urbanismo-modificara-el-pgou-para-blindar-la-subestacion-electrica-estrategica-empalme-en-san-jeronimo/), San Jerónimo (julio 2026).

**Conclusión normativa (resumen):** tanto alta como media tensión están permitidas en suelo urbano por clasificarse como uso dotacional de infraestructuras (interés general), pero con condiciones más estrictas en suelo urbano consolidado: tendido subterráneo salvo justificación técnica, ubicación en edificio protegido o parcela específicamente calificada (nunca en vía pública), y licencia urbanística municipal.

---

## 4. Estructura del proyecto (`/home/user/workspace/sevilla-subestaciones/`)

| Archivo | Contenido clave |
|---|---|
| `index.html` | Estructura de la página: topbar, sidebar con paneles (stats, proximidad, capas, filtros, **normativa urbanística**, metodología/fuentes), mapa principal. |
| `app.js` (~630 líneas) | `TYPOLOGY_META` (label/sub/color/capacityNote/**urbanismNote** por tipología), `initMap()`, `addDataLayers()`, `registerMapInteractions()`, `switchMapStyle()`, `showPopup()` (con la nueva fila de urbanismo), `geocode()` (Photon), lógica de filtros, presets y scroll-hint del sidebar. |
| `style.css` | Variables de tema claro/oscuro, paleta por tipología (alta=`#ef4444` rojo, media=`#f59e0b` ámbar, baja=`#22d3ee` cian), estilos de popup de MapLibre, breakpoints móviles (860px y 400px). |
| `data/substations.json` | 109 registros con esquema `{id, nombre, municipio, provincia, lat, lon, tension_max_kV, niveles_tension_kV[], tipologia, tipologia_label}`. |

Repositorio git local con historial de commits (control de versiones activo).

---

## 5. Decisiones técnicas y "gotchas" importantes (para evitar redescubrirlos)

- **Geocodificación:** usar siempre **Photon** (`photon.komoot.io`), nunca Nominatim (`nominatim.openstreetmap.org`) — este último devuelve 429 (rate-limited) desde el entorno sandbox.
- **Cambio de estilo de mapa (claro/oscuro):** el evento `style.load` de MapLibre **no** se dispara de forma fiable tras `map.setStyle()` en este entorno con OpenFreeMap. Usar `map.once('idle', callback)` en su lugar.
- **Persistencia de datos al cambiar de tema:** la ruta calculada y el punto del usuario se guardan en `state.routeData` / `state.userPointData` para no perderse al cambiar de estilo.
- **Propiedades GeoJSON tipo array:** MapLibre las serializa como strings JSON al leerlas de las features — hay que hacer `JSON.parse` defensivo (ya implementado en `showPopup()`).
- **Checkboxes de capas:** son switches visualmente ocultos; para pruebas automatizadas hay que fijar `.checked` vía JS y disparar el evento `change` manualmente, no usar `.click()`.
- **El validador automático de `deploy_website`** dio 3 falsos positivos seguidos señalando el sidebar como "cortado" cuando en realidad es correctamente desplazable (verificado manualmente con Playwright). Se añadió un degradado de scroll-fade como affordance UX; si reaparece el falso positivo, es aceptable usar `should_validate: false` tras verificación manual.
- **Nunca usar `publish_website`** sin que el usuario lo pida explícitamente — solo `deploy_website` para vistas previas.

---

## 6. Historial de sesiones (cronológico, resumen)

1. Investigación de datos reales de subestaciones desde la AAE / IDEAndalucía.
2. Procesamiento del dataset a JSON estructurado (109 registros).
3. Construcción de la webapp completa (mapa, popups, filtros, capas, proximidad).
4. Depuración de varios bugs: pérdida de datos de ruta al cambiar de tema, evento `style.load` poco fiable, overflow del título en móvil (`.brand-text` necesitaba `min-width: 0`).
5. QA exhaustivo con Playwright: escritorio, móvil (375px), modo claro/oscuro, interacciones (filtros, geolocalización, popups).
6. Primer despliegue exitoso y entrega al usuario.
7. **Nueva petición del usuario:** añadir información sobre si alta/media tensión están permitidas en suelo urbano.
8. Investigación de normativa (PGOU Sevilla, RD 1955/2000, casos reales).
9. Implementación: nuevo panel lateral "¿Se permiten en suelo urbano?" + nueva fila en cada ficha emergente con nota específica por tipología.
10. QA de la nueva funcionalidad en escritorio, móvil y ambos temas — sin errores de consola ni desbordamientos de texto.
11. Commit y redespliegue exitoso (mismo enlace, actualizado).

---

## 7. Próximos pasos posibles (pendientes de decisión del usuario)

El usuario aún no ha elegido qué hacer con el sitio. Opciones disponibles:

- **Seguir iterando** sobre la vista previa actual.
- **Publicar** con un enlace permanente `pplx.app` (requiere petición explícita).
- **Desplegar vía Vercel** (conector disponible).
- **Compartir la vista previa actual** desde el propio `/computer/a` app, con opción de "Allow remix" para que otros puedan copiar y modificar la app.

---

## 8. Notas de continuidad para retomar el trabajo

- El servidor de pruebas local (`serve . -l 3000`) y las herramientas Playwright ya se usaron en esta sesión — reiniciar si es necesario.
- El repositorio git en `/home/user/workspace/sevilla-subestaciones/` conserva todo el historial de commits.
- Cualquier cambio futuro debe seguir el ciclo: editar → QA con Playwright (desktop + móvil + ambos temas) → commit → `deploy_website` con el mismo `project_path`.
