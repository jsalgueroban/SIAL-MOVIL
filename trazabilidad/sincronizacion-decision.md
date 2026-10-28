# Sincronización móvil — decisión de propuesta

Fecha: 2026-10-28. Plataforma: móvil. Modo: evolución de propuesta. HU: pendiente de identificar. Fuente: imagen proporcionada y vista existente de trazabilidad.

## Decisión

El resumen prioriza operaciones por revisar, conectividad y acciones; siguen excepciones, evidencias y acceso a confirmados e historial. Operaciones y archivos se cuentan por separado. La propuesta reutiliza shell, botones y tokens del core móvil; las tarjetas y composición de sincronización son locales a la vista, no API de librería. El ejemplo de firma usa corregir y no reintentar. Una dependencia bloqueada tiene una acción propia. No se ofrece eliminación hasta definir su alcance y recuperación.

## Requisitos funcionales y técnicos por definir

- Determinar conectividad del servicio independientemente de la red, incluida la caducidad del resultado y tratamiento de sesión expirada.
- Definir cola persistente, estados, conteos mutuamente comprensibles, orden, dependencias, reintentos, idempotencia y confirmación explícita del servidor. Precisar operaciones parciales y recuperación tras cierre o interrupción.
- Distinguir errores corregibles por el usuario, transitorios y bloqueos; asociar cada caso a causa comprensible, acción, navegación y permisos. Definir política de eliminación y consecuencias antes de ofrecerla.
- Definir recarga de datos, fecha de última precarga exitosa, concurrencia y preservación de cambios y evidencias locales; resolver conflictos y recuperación ante fallos.
- Asociar cada evidencia a su operación y definir estados, progreso real, reintentos, disponibilidad y confirmación independiente o conjunta.
- Proveer consulta paginada de confirmados e historial, filtros, fechas, errores y datos mínimos para soporte; acordar retención y permisos.
- Verificar estados offline, servidor no disponible, carga, vacío, sincronización, error, bloqueo, éxito, accesibilidad, tema oscuro, escalado de texto y reducción de movimiento en la aplicación nativa.

## Frontera

Esta vista muestra datos de ejemplo aislados. Ninguna acción envía, recarga, elimina ni confirma datos; el indicador de red del navegador no verifica acceso al servidor. No define DTO, API, persistencia, SLA ni reglas aprobadas. La integración, validación funcional y HU quedan pendientes; las rutas a corrección, detalle, evidencias e historial necesitan contrato real. No se modifica ni publica la librería móvil.

## Ajuste solicitado

Se recupera el concepto orbital como composición local con conteo de ejemplo y previsualización animada activada por el botón; no representa transferencia real. Se reutilizan los adaptadores compartidos `sial-card`, `sial-status`, `sial-pill`, `sial-sync-item` y `sial-evidence-gallery`/`sial-evidence-card`, correspondientes conceptualmente a SyncItem y EvidenceGallery nativos. Las miniaturas son recortes visuales de la referencia aportada y no evidencias operativas. La integración nativa y su API instalada siguen pendientes de contrastar.

## Ajuste de legibilidad e interacciones — 2026-10-28

Se agruparon las acciones de cada incidencia, se incrementaron textos y contadores y se mantuvieron tokens de tema. Se añadieron paneles de la biblioteca compartida para detalle, dependencia, firma, lista y detalle de evidencia, confirmados, historial y recarga. Los dos últimos y la corrección muestran límites de integración; no modifican registros ni afirman datos no disponibles. Las imágenes son ilustrativas.

Comprobación en navegador local: temas claro y oscuro, detalle de incidencia, dependencia, confirmados, historial, lista y detalle de evidencia y corrección de firma. JavaScript validado con node --check. Esta revisión visual no sustituye prueba en dispositivo, medición formal de contraste, integración nativa ni QA funcional de una HU.

## Corrección de composición — 2026-10-28

Se eliminó el override local `display: block` que anulaba la fila flex del adaptador `sial-status`/`sial-alert-card` y colocaba el icono sobre el texto. Se conserva el contrato de InlineStatus card de la librería nativa: icono y texto en fila, con el texto adaptable. No se modificó la librería ni se afirma integración nativa.

## Demostración interactiva

La vista inicializa 93 confirmadas, dos listas, una con error y una bloqueada en memoria aislada. Sincronizar anima y confirma progresivamente solo las listas; no resuelve error ni bloqueo. La recarga simula una fecha conservando los estados. El historial registra eventos de la sesión y reiniciar restablece el ejemplo. Offline impide iniciar y detiene el envío restante. No usa la cola real ni llama al servidor; no persiste entre recargas.
