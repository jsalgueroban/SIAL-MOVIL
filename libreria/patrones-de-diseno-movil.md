# Mapa de patrones de diseño — SIAL Móvil

Fecha de auditoría: 2026-08-21.  
Alcance: todas las vistas HTML de la propuesta móvil, sin incluir artefactos de `output/`.

## Decisión de arquitectura visual

La librería es la única fuente para tokens, controles, feedback, capas, navegación y composiciones que se repiten entre procesos. Un módulo local conserva solamente la representación o regla que depende de un dominio concreto. El uso de una clase local no constituye una nueva regla de diseño.

| Estado | Significado | Acción para una vista nueva |
| --- | --- | --- |
| **Canon** | Componente o API ya compartida | Consumirlo desde `shared/` y documentarlo en `libreria/index.html`. |
| **Composición promovida** | Patrón repetible extraído de las vistas maduras | Usar la clase compartida y adaptar solo el contenido. |
| **Candidato visual** | Componente, estilo o composición nueva creada para resolver una necesidad no cubierta | Puede nacer localmente; documentar y someter a revisión antes de reutilizarlo o promoverlo. |
| **Dominio** | Estructura inseparable de una HU o proceso | Reutilizar dentro de su módulo; no copiarla a otro dominio sin revisión. |
| **Base / migración** | Vista anterior válida, pero sin los refinamientos actuales | Mantener estable; adoptar el canon cuando se toque esa vista por alcance real. |

## Brecha entre generaciones

| Generación | Características | Ejemplos | Regla resultante |
| --- | --- | --- | --- |
| Base | Shell, header, card, formulario, feedback y navegación funcionales; contexto y avance menos explícitos. | Finca inicial, Puerto/ZE inicial, consultas iniciales. | No copiar CSS local ni añadir una variante aislada. |
| Madura | Contexto de operación, jerarquía de tarea, estados semánticos, captura guiada, progreso, evidencia o cierre verificable. | Evidencias, consulta por finca, HU344, HU342, HU347, materiales. | Usar como referencia visual para todo flujo nuevo equivalente. |

## Mapa completo de vistas

| Familia | Vistas | Patrón dominante | Estado de adopción |
| --- | --- | --- | --- |
| Acceso | `index.html`; `login/login-01-institucional.html`; `login/login-04-contexto-operativo.html`; `login/login-05-minimal-operativo.html` | Identidad, autenticación, recuperación e intro de marca | Canon: `sial-mobile-login.*`, `playLogoIntro`, OTP y capas accesibles. |
| Contexto y inicio | `app/seleccion-empresa.html`; `app/seleccion-finca.html`; `app/home.html` | Selección de contexto, drawer, tarjetas de acceso y prioridades | Canon para contexto/drawer; home es referencia de prioridad operacional. |
| Operación en finca | `finca/recepcion-finca.html`; `inspeccion-externa.html`; `inspeccion-interna.html`; `sesion-responsabilidad.html`; `despacho-ze.html`; `cierre-contenedor.html` | Formularios de evento, evidencia y confirmación | Base/migración: conservar flujo; adoptar ticket, stepper o resumen de cierre solo al modificar la HU. |
| Consulta en finca | `finca/consulta-pallets.html`; `consulta-vehiculos.html`; `consulta-contenedores.html` | Búsqueda, filtros, detalle y relación entre entidades | Canon: query compartida, selector táctil de hora y consulta de solo lectura. |
| Pallets | `pallets/armar-pallet.html`; `cargar-pallets.html`; `consulta-pallets.html`; `reetiquetar-pallet.html`; `rearmar-pallet.html` | Escaneo primero, referencias/cantidades, resumen y confirmación | HU591 aporta componentes de dominio; HU344 es referencia madura de conciliación y capacidad. |
| ZE/Puerto base | `puerto-ze/index.html`; `recepcion-ze.html`; `recepcion-ze-retorno.html`; `recepcion-puerto.html`; `inspeccion-interna.html`; `inspeccion-externa.html`; `despacho-finca.html`; `despacho-puerto.html`; `entrega-puerto.html`; `hu1431-despacho-contenedor-finca.html` | Eventos físicos, inspección, despacho y entrega | Base/migración: usar core; no duplicar componentes de la secuencia ZE en cada evento. |
| ZE/Puerto secuencial | `puerto-ze/hu342-descarga-pallets.html`; `pallets/rearmar-pallet.html`; `puerto-ze/hu347-cargue-consolidado.html` | Contexto de operación, paso 1–3, selección, conciliación, evidencia y cierre | Referencia madura. Comparte ticket, stepper, fila seleccionable, medidor y resumen de envío. |
| Trazabilidad | `trazabilidad/consultar-operacion.html`; `consultar-contenedor.html`; `evidencias.html`; `sincronizacion.html` | Consulta de historial, expediente de evidencia y estados offline | Canon: detalle solo lectura, cámara, bottom sheet, sync y feedback. `evidencias` es referencia madura de expediente. |
| Materiales | `materiales/index.html`; `ordenes-asignadas.html`; `detalle-orden.html`; `pedido-sugerido.html`; `pedido-adicional.html`; `inventario-finca.html`; `pallets.html`; `registrar-entrega.html`; `pod.html` | Jornada, orden, inventario, entrega, evidencia y firma | Referencia madura de flujo logístico; usa la API integrada de firma, evidencias y sincronización. |
| Utilidad | `demo-camara.html`; `libreria/index.html` | Cámara y catálogo de componentes/estados | Canon: no es una vista de negocio; valida componentes compartidos. |

## Superficie canónica de librería

| Patrón | Clase o API | Uso correcto | Evidencia de uso |
| --- | --- | --- | --- |
| Shell, tema, header y drawer | `.sial-page`, `.sial-page-header`, `ensureGlobalDrawer`, `setTheme` | Estructura de toda vista interna | Todas las familias operativas. |
| Acción y formulario | `.sial-btn-*`, `.sial-field`, `.sial-input`, `.sial-status` | Una acción primaria por contexto; error junto a su origen | Formularios de finca, pallets, ZE y materiales. |
| Captura | `openBarcodeScanner`, `openPhotoCapture`, `mountSignaturePad` | Escaneo primero; cámara/firma en capa accesible | HU591, evidencias, POD y materiales. |
| Selección contextual | `openMobilePicker`, `mountTabs`, `mountSegmentedControls` | Modo o selección dentro de la misma tarea | Consultas, referencias y catálogo. |
| Feedback y capas | `showToast`, `showBanner`, `setInlineStatus`, `openDialog` | Toast no reemplaza errores inline; modal para decisión, sheet para contexto | Transversal. |
| Offline | `setSyncState`, `.sial-sync-*` | Pendiente, sincronizando, sincronizado y error son estados distintos | Sincronización y cierre de operaciones. |
| Operación identificada | `.sial-operation-ticket` | Identificador, ubicación/contexto y estado; sin KPI duplicados | HU342 y HU347. |
| Secuencia corta | `.sial-flow-stepper` | Dos a cinco pasos realmente dependientes; no usar como decoración | HU342 → HU344 → HU347. |
| Registro elegible | `.sial-selectable-row` + `aria-pressed` | Selección visible y accesible antes de confirmar | Cargue HU347; futuros selectores equivalentes. |
| Capacidad | `.sial-capacity-meter` | Muestra el valor calculado y su estado; el límite pertenece al dominio | HU344 y HU347. |
| Cierre maduro de captura | `.sial-confirmation-card` + `form="<form-id>"` | Card hermana fuera del formulario, texto breve y único CTA primario full-width | HU758 y HU759; contrato de la familia de captura calibrada. |
| Resumen de cierre de dominio | `.sial-submit-summary` | Resume condición de cierre junto a la acción cuando el dominio requiere un resumen adicional | HU347 y flujos secuenciales; no sustituye automáticamente la card de confirmación. |

## Patrones que permanecen en el dominio

| Patrón | Propietario | Razón |
| --- | --- | --- |
| Mapa de contenedor y estiba | `puerto-ze/hu342-hu347.css` | Distribución física, cantidad de posiciones y orientación del contenedor. |
| Clasificación de pallets | `puerto-ze/hu342-*` | Estados, evidencias y consecuencia operativa de HU342. |
| Linaje y composición de referencias | `pallets/hu344.*` | Conciliación uno-a-uno/muchos-a-uno y máximo de negocio. |
| Armado y reetiquetado de HU591 | `pallets/hu591.css` | Reglas y detalle propio de la creación/etiquetado. |
| Expediente visual de evidencia | `trazabilidad/evidencias.*` | Mantiene entidad, evento y metadatos de trazabilidad; reutiliza las capas de core. |
| Orden y POD de materiales | `materiales/sial-mobile-materiales.*` | Secuencia logística y campos del módulo; reutiliza firma, evidencia y feedback. |

## Regla de evolución y migración

1. Antes de escribir CSS, buscar primero en `shared/sial-mobile-core.css`, luego en esta matriz y finalmente en la librería visual.
2. Si el canon no resuelve la necesidad, se permite crear un componente, estilo o composición como **candidato visual**. Se registra su intención, vista de origen, estados, contraste, interacción y por qué no aplica un componente actual. No queda prohibido por ser nuevo.
3. Una vista nueva de operación evalúa ticket contextual, paso actual, selección o captura, estado calculado y cierre. No todos aplican; se usan solo cuando representan información real.
4. Antes de reutilizar un candidato fuera de su vista o promoverlo, Diseño/Producto y revisión técnica verifican consistencia de marca/tokens, valor transversal, claro/oscuro, responsive, accesibilidad, movimiento y estados reales. Tres usos equivalentes obligan a abrir esta revisión; no son un requisito para aprobar una buena propuesta desde su primer uso.
5. Si se aprueba, la promoción incluye CSS/API compartida, demo en `libreria/index.html`, actualización de `DESIGN.md`, esta matriz y al menos una vista consumidora. Desde entonces integra las bases visuales y debe preferirse sobre nuevas variantes equivalentes.
6. Si no se aprueba, el candidato se ajusta, permanece aislado o se retira según la decisión de revisión; nunca se convierte en precedente accidental.
7. No se hace una migración masiva de vistas base. Cada HU conserva su alcance y adopta el canon cuando se cambie por un requerimiento aprobado.
8. Antes de cerrar, validar claro/oscuro, 340/390/430/480 px, foco, lector de pantalla, teclado, movimiento reducido y los estados de vacío/error/offline que apliquen.

## Promoción HU758 · catálogo visual

La calibración de HU758 deja como candidatos promovidos al catálogo los componentes documentados en `libreria/componentes-hu758.md`: ticket operativo plano, encabezado de sección con icono, tarjeta de confirmación separada, control de selección acoplado y selector semanal de fecha/hora. La sección `#hu758-componentes` de la librería muestra su composición y estados base. Hasta confirmar tres usos equivalentes, las vistas nuevas deben consumir el catálogo como referencia y no copiar los estilos locales directamente.

En composición operativa móvil, `puerto-ze/inspeccion-interna.html?selectContainer=1` sirve como referencia verificada para el selector contextual, la ficha de entidad elegida, las filas compactas de datos y los encabezados con icono funcional. `pallets/cargue-camion-finca.html` adopta selección, ficha y secciones para el cargue; `poma/consulta-generacion.html` adopta encabezados, lista de resultados y filas de detalle. Son adopciones de familia, no copia de la secuencia de inspección ni regla para autenticación: `login/ingreso-pat.html` conserva la anatomía del login institucional. El alias de propuesta `sial-mobile-section-heading/icon` reúne el encabezado visual existente sin declarar un componente nuevo del paquete React Native.

## Contrato de CTA final · familia de captura HU758/HU759

En la familia de captura calibrada en HU758/HU759, la acción final se compone como una card blanca hermana al formulario, con texto de verificación y un único botón primario de ancho completo. El botón usa `form="<form-id>"` cuando vive fuera del formulario. No se agrega una card interna adicional, un segundo CTA primario, un círculo decorativo ni una sección visual de Trazabilidad debajo. Este contrato no se extrapola automáticamente a otras familias; la vista debe adoptar el patrón explícitamente y documentar cualquier variante.

## Adopción explícita · HU303 Salida ZE

`puerto-ze/despacho-finca.html` adopta esta composición por pertenecer a la misma familia de captura operativa: ticket reducido a operación/contenedor, encabezados con icono, controles especializados para zona y fecha/hora, evidencias de salida y card hermana de confirmación. La vista conserva el contrato `zeDispatch` y no introduce sellos, firmas, fincas ni trazabilidad visual que no estén presentes en la fuente actual. El catálogo de evidencias es propio de `zeDispatch` y admite seis puntos.

## Adopción explícita · Salida de Finca

`finca/despacho-ze.html` adopta la misma composición calibrada para la salida operativa desde finca: ticket reducido a operación/contenedor, encabezados con icono, selector de zona acoplado, selector semanal de fecha/hora, observaciones, novedad, seis evidencias y card hermana de confirmación. Conserva el contrato `farmDispatch`, su precondición `containerClosed` y la navegación posterior a recepción de retorno en ZE. La referencia visual no incluye un identificador HU; queda pendiente de confirmación de producto y no se inventa uno.
