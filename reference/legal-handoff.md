# Legal handoff — Worker D (líneas eléctricas: normativa aérea/subterránea)

Fecha de esta verificación: 10 de agosto de 2026. Herramientas usadas: WebFetch + WebSearch (sin navegador interactivo). Alcance: solo los 3 archivos listados en el encargo; no se ha tocado nada más del proyecto.

## 1. Tabla de URLs verificadas

| # | URL | Estado | Notas |
|---|---|---|---|
| 1 | `https://www.boe.es/buscar/act.php?id=BOE-A-2013-13645` (Ley 24/2013) | **OK fetch** | Confirmado: Ley 24/2013, de 26 de diciembre, del Sector Eléctrico. BOE núm. 310, de 27/12/2013; entrada en vigor 28/12/2013. Consolidado vigente. Índice visible: art. 4 (planificación), art. 5 "Coordinación con planes urbanísticos", Título IX arts. 61-80 (autorizaciones, expropiación y servidumbres). |
| 2 | `https://www.boe.es/buscar/act.php?id=BOE-A-2008-5269` (RD 223/2008) | **OK fetch** | Página carga y el índice de navegación lista ITC-LAT 01 a 09 (confirmado dos veces), pero el resumen automático truncó los títulos completos de 06-09 en esa vista. Título verbatim resuelto vía `diario_boe/txt.php` (ver §2). RD 223/2008, de 15 de febrero; BOE núm. 68, de 19/03/2008; entrada en vigor 19/09/2008. |
| 3 | `https://www.boe.es/buscar/act.php?id=BOE-A-2000-24019` (RD 1955/2000) | **OK fetch (parcial)** | Página carga; el índice confirma que existe **art. 112** con ancla `#a112`, bajo Título VII, Capítulo I. El resumen automático no llegó a mostrar el texto íntegro del articulado (se truncó en el art. 58). Contenido de fondo del art. 112 corroborado por fuentes secundarias — ver §3. |
| 4 | `https://web.urbanismosevilla.org/planeamientopgou/pdfs/06_TR_NORMAS_URBANISTICAS/06_TR_NORMAS/06_TR_NORMAS.PDF` (PGOU, art. 6.6.28) | **Bloqueado-para-bots** | Dos intentos de fetch, ambos con error `unable to verify the first certificate` (fallo TLS, no HTTP). Coincide con la advertencia ya documentada en el propio proyecto (`documentos.html`, pie de página): el dominio `web.urbanismosevilla.org` rechaza el acceso automatizado pero funciona en navegador. **No se ha podido reverificar el contenido del art. 6.6.28 en esta sesión.** El texto usado (apartados 5, 6 y 11: soterramiento obligatorio en desarrollos nuevos; en suelo urbano consolidado, subterráneo salvo justificación técnica; subestaciones en edificio protegido o parcela específica, nunca en vía pública; licencia urbanística) se ha heredado **tal cual** de `reference/legacy/index.html` (líneas 125-131), que ya está en este mismo repositorio de una sesión anterior. El ensamblador debería confirmarlo manualmente en el navegador si quiere una verificación de primera mano en esta ronda. |
| 5a | `https://iusevillaciudad.org/preguntas-sobre-las-torres-de-alta-tension-de-san-jeronimo-y-la-bachillera-comision-de-control-febrero-2022/` | **OK fetch** | Carga con normalidad. Pregunta de Adelante Sevilla (IU), 7/2/2022. Confirma: 3 líneas de alta tensión por «El Manchón» (norte del barrio), 2 líneas de media tensión centrales con apoyos en calle Tilo, y cita el convenio de 2017 Ayuntamiento–Red Eléctrica–Endesa (55 M€, Distrito Este) como precedente de soterramiento. Reutilizado tal cual en `panel.overhead`. |
| 5b | `http://iusevillaciudad.org/pregunta-al-alcalde-sobre-la-la-eliminacion-de-las-torres-de-alta-tension-en-san-jeronimo-y-la-bachillera/` | **OK fetch** | Carga con normalidad. Pregunta de Adelante Sevilla al alcalde, 27/4/2022. Confirma el planteamiento de sustituir la subestación Empalme por una nueva junto a la carretera de La Rinconada. Reutilizado tal cual en `panel.bachilleraCase`. |
| 6 | `https://www.openstreetmap.org/copyright` | **OK fetch** | Confirma licencia **ODbL** (Open Data Commons Open Database License). La página no prescribe una cadena de atribución literal única; remite a las "attribution guidelines" del OSMF y solo exige (a) créditar a OpenStreetMap y (b) dejar claro que los datos están bajo ODbL. He usado la fórmula habitual «© colaboradores de OpenStreetMap» — es la convención estándar del ecosistema OSM, no una cita textual de esa página. |
| 7 | `http://www.ideandalucia.es/services/DERA_g10_infra_energetica/wfs` | **OK fetch** (con parámetros WFS) | La URL desnuda del encargo devuelve 400 (falta `?service=WFS&request=GetCapabilities`); con esos parámetros responde el GetCapabilities WFS 2.0.0 del Instituto de Estadística y Cartografía de Andalucía. Capa confirmada: **`DERA_g10_infra_energetica:g10_14_LineaElectrica`**, resumen "Contiene información acerca de la localización de las líneas eléctricas existentes en Andalucía". No tiene campo aéreo/subterráneo en su título/abstract (consistente con el encargo). Licencia **CC BY 4.0** confirmada en la web oficial de la Junta de Andalucía (Ley 9/2023, Anexo V.4.a), no en la propia respuesta WFS. |
| 8 | Modificación Puntual nº 67 (documento oficial) | **No localizado** | Ver §4. |
| 9 | `https://www.manueljesusflorencio.com/2026/07/urbanismo-modificara-el-pgou-para-blindar-la-subestacion-electrica-estrategica-empalme-en-san-jeronimo/` | **OK fetch** | Artículo del 23/7/2026. Usado explícitamente como fuente secundaria de prensa en `panel.bachilleraCase`, tal como pide el encargo. |
| 10 | `https://bopsevilla.dipusevilla.es/publica/buscador-anuncios/` | **OK fetch (sin resultados útiles)** | Es un formulario de búsqueda que requiere envío interactivo (JS); el fetch solo devuelve la estructura del formulario, sin listado de anuncios. No permite confirmar ni descartar una publicación sobre la MP 67 por esta vía. |

## 2. Resolución de la numeración ITC-LAT (RD 223/2008)

El encargo advertía que informes previos se contradicen entre 06/07 y que se creía que "08 = subterráneas". **Esa creencia previa es incorrecta.** La numeración correcta, confirmada con cita textual del propio BOE (`https://www.boe.es/diario_boe/txt.php?id=BOE-A-2008-5269`, índice del documento):

```
ITC-LAT 01 - TERMINOLOGÍA
ITC-LAT 02 - NORMAS Y ESPECIFICACIONES TÉCNICAS
ITC-LAT 03 - INSTALADORES AUTORIZADOS Y EMPRESAS INSTALADORAS AUTORIZADAS PARA LÍNEAS DE ALTA TENSIÓN
ITC-LAT 04 - DOCUMENTACIÓN Y PUESTA EN SERVICIO DE LAS LÍNEAS DE ALTA TENSIÓN
ITC-LAT 05 - VERIFICACIÓN E INSPECCIONES
ITC-LAT 06 - LÍNEAS SUBTERRÁNEAS CON CABLES AISLADOS
ITC-LAT 07 - LÍNEAS AÉREAS CON CONDUCTORES DESNUDOS
ITC-LAT 08 - LÍNEAS AÉREAS CON CABLES UNIPOLARES AISLADOS REUNIDOS EN HAZ O CON CONDUCTORES RECUBIERTOS
ITC-LAT 09 - ANTEPROYECTOS Y PROYECTOS
```

Es decir:
- **Subterráneas → ITC-LAT 06** (no la 08, como se creía).
- **Aéreas con conductores desnudos → ITC-LAT 07**.
- **Aéreas con cables aislados → ITC-LAT 08**.

Esta lectura del índice de `diario_boe/txt.php` (texto original de 2008) se cruzó con tres fuentes independientes adicionales, todas coincidentes:
- Web oficial del Ministerio de Industria y Turismo (`industria.gob.es/.../lineas-alta-tension`), que confirma verbatim ITC-LAT 02-05 y 09, y referencia la guía técnica "ITC-LAT 07 — Líneas aéreas con conductores desnudos".
- `fidas.org` (asociación técnica), listado completo ITC-LAT 01-09 idéntico al del BOE.
- PDF de una guía docente (`roble.pntic.mec.es`) titulado literalmente "ITC-LAT 06. Líneas subterráneas con cables aislados".

Además, el texto **consolidado** (`act.php?id=BOE-A-2008-5269`) se comprobó dos veces y su índice de navegación sigue listando ITC-LAT 01 a 09 sin indicios de renumeración, por lo que la numeración de 2008 sigue vigente hoy. En los JSON solo se citan ITC-LAT 06, 07 y 08 (las tres confirmadas y relevantes para aéreas/subterráneas); la 09 no se usa en los textos.

## 3. RD 1955/2000, artículo 112

**Existe** y trata de coordinación entre instalaciones eléctricas y planeamiento. Confirmación en capas:

1. BOE (`act.php?id=BOE-A-2000-24019`, texto consolidado): el índice de navegación muestra el ancla `#a112` bajo **Título VII, Capítulo I**. Esto es un hecho de la propia página de BOE, no una fuente secundaria.
2. Iberley (página dedicada al artículo, título de la página): **"Artículo 112. Coordinación con planes urbanísticos"**.
3. Contenido (vía búsqueda, citando noticias.juridicas.com e Iberley, dos bases jurídicas independientes que reproducen el BOE): la planificación de las instalaciones de transporte y distribución, cuando se ubiquen en **suelo no urbanizable**, debe recogerse en el instrumento de **planeamiento territorial** correspondiente; cuando se ubiquen en suelo urbano o urbanizable, debe recogerse en el instrumento de **planeamiento urbanístico**, calificando el suelo y reservando superficie tanto para nuevas instalaciones como para proteger las existentes. Para los casos no previstos o de urgencia/interés excepcional, remite al art. 244 del TR de la Ley del Suelo de 1992 (RDLeg 1/1992) o norma autonómica equivalente.

**Matiz importante:** no conseguí que WebFetch cargara directamente `noticias.juridicas.com` ni `iberley.es` (error TLS `unable to verify the first certificate` en ambos, en esta sesión) — el contenido del punto 3 procede de los resúmenes de WebSearch sobre esas páginas, no de una lectura directa mía del HTML. La cabecera exacta del artículo ("Coordinación con planes urbanísticos") sí viene de un fetch directo a la página de índice de Iberley. Confianza: alta en que el artículo trata de esto; no tengo el texto BOE verbatim palabra por palabra. Usé el ancla `#a112` en los enlaces del JSON, tal como pedía el encargo.

## 4. Búsqueda de la Modificación Puntual nº 67

**No se localizó un documento oficial fetchable** en esta sesión:

- `urbanismosevilla.org/.../consultas-previas-planeamiento` (índice) y `.../consultas-previas` (página base): **3 intentos, los 3 con error TLS `unable to verify the first certificate`** — no bloqueo HTTP explícito, pero inaccesible igualmente con las herramientas de esta sesión.
- `bopsevilla.dipusevilla.es/publica/buscador-anuncios/`: formulario de búsqueda JS, no devuelve resultados sin interacción.
- BOJA: localicé por WebSearch un anuncio real y verificable de una modificación puntual *distinta* (MP **53**, PERI-PM-201 Cros-San Jerónimo, aprobación provisional 13/2/2025) — no es la nº 67, pero confirma que la zona San Jerónimo tiene tramitación urbanística activa y frecuente, consistente con el contexto.

**Aviso sobre una posible alucinación de búsqueda:** varias llamadas a WebSearch devolvieron, en su síntesis final, la frase "Modificación Puntual 67 del Texto Refundido del Plan General de Ordenación Urbanística del sector ARI-DMN-04 'ESTACION TRANSFORMADORA'". Esa frase **no aparece en ninguno de los títulos/enlaces en bruto** que las mismas búsquedas devolvieron — solo en el texto interpretativo generado por la herramienta. Una de esas búsquedas sí devolvió un enlace en bruto genuino y verificable a la ficha PGOU vigente de `ARI-DMN-04` (`0607_TR_ARI-DMN-04.PDF`, la misma ficha que ya cita `documentos.html` sección 04 como «Subestación Empalme»), y esa ficha reporta 158 viviendas totales / 140 protegidas — cifras que **coinciden exactamente** con las que da el reportaje de prensa de Manuel Jesús Florencio sobre lo que la MP 67 sustituiría. Es decir: el vínculo "MP 67 ↔ ARI-DMN-04 ↔ Empalme" es plausible y las cifras se corroboran de forma cruzada, pero la existencia de un documento oficial de "consulta previa" con ese título exacto **no la he verificado yo mismo con un fetch**; recomiendo que quien ensamble el sitio no dé ese título por bueno sin comprobarlo a mano en el navegador.

**Por lo tanto**, en `panel.bachilleraCase` se usa el reportaje de prensa (`manueljesusflorencio.com`, 23/7/2026) como fuente, **marcado explícitamente como fuente secundaria de prensa** dentro del propio texto (es y en), y se indica que no se ha localizado el documento oficial. No se ha citado el código de sector "ARI-DMN-04" en los JSON por el motivo anterior (solo se dice "el entorno de la subestación «Empalme»").

## 5. Otras notas para el ensamblador

- **PGOU art. 6.6.28** (apartados 5/6/11): el contenido usado en `panel.overhead`, `panel.underground`, `home.legalParagraph` y el propio art. 6.6.28 en general **no se ha vuelto a verificar por fetch esta sesión** (bloqueo TLS, ver tabla §1 fila 4). Coincide palabra por palabra en sustancia con `reference/legacy/index.html` (líneas 125-131), que ya formaba parte de este repositorio antes de mi turno. Si alguien quiere una verificación de primera mano, hay que abrir el PDF en un navegador normal (funciona bien ahí, según la propia advertencia del proyecto en `documentos.html`).
- **Las dos URLs de iusevillaciudad.org** se han reutilizado literalmente (mismo texto de enlace, mismo `http`/`https` que ya tenían) desde `documentos.html` sección 05, y además se verificaron con fetch en esta sesión (ambas cargan y su contenido es coherente con lo ya descrito en `documentos.html`).
- **OSM / ODbL**: no existe una única "cadena de atribución oficial" citable textualmente; usé la fórmula estándar del ecosistema («© colaboradores de OpenStreetMap» / «© OpenStreetMap contributors»), enlazando siempre a la página de copyright. Si el ensamblador prefiere una fórmula distinta, es una decisión de estilo, no un hecho que verificar.
- **DERA/IDEAndalucía**: la URL WFS del encargo, tal cual, devuelve HTTP 400 porque le faltan los parámetros de query (`?service=WFS&request=GetCapabilities`). Funciona igual como enlace de referencia/atribución en el texto (no como endpoint que haya que invocar), así que la dejé como en el encargo original en los JSON.
- **Ley 24/2013 / RD 223/2008 / RD 1955/2000**: los tres son del BOE, confirmados accesibles y vigentes (consolidados). No se ha citado ningún número de artículo de la Ley 24/2013 en los textos finales más allá de mencionar de forma genérica "planificación, autorización, expropiación y servidumbre de paso" (arts. 4-5 y Título IX vistos en el índice), para no sobre-precisar sin verificación artículo por artículo.
- Ningún archivo fuera de los tres permitidos ha sido modificado.

## 6. Resumen de los 3 archivos entregados

- `reference/legal-locales-es.json` — namespace `legal` en español, estructura `panel` / `popup` / `home` / `methodology` exactamente como se pidió. JSON validado (parseable, claves exactas).
- `reference/legal-locales-en.json` — misma estructura, traducción informativa fiel (mismos matices, mismos enlaces, mismo hedging donde el español lo lleva).
- `reference/legal-handoff.md` — este documento.
