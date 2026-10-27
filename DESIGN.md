---
name: SIAL Mobile Design System
version: 1.2.0
status: vigente
language: es-CO
lastUpdated: 2026-10-05
owners:
  - Producto SIAL
  - Diseño UI/UX SIAL
platforms:
  - Propuesta móvil HTML/CSS/JavaScript
  - Aplicación móvil React Native/Expo
---

# Sistema de diseño SIAL Móvil

## 1. Propósito

Este documento es el contrato visual, interactivo y de experiencia para SIAL Móvil. Su objetivo es permitir que las nuevas vistas mantengan la identidad aprobada, resuelvan correctamente los estados operativos y puedan traducirse a React Native sin copiar literalmente el HTML o CSS de la propuesta.

La carpeta **SIAL Movil - Propuesta** es una propuesta UI/UX y no es el proyecto productivo de SIAL. Sus vistas sirven como fuente visual y funcional de referencia. La aplicación React Native debe traducir esta intención usando sus componentes, tema y capacidades nativas reales.

Este documento sí define:

- identidad y principios de interfaz;
- tokens visuales y de movimiento;
- anatomía y comportamiento de componentes;
- patrones de navegación, formularios, escaneo, feedback, cámara y sincronización;
- accesibilidad, contenido y criterios de validación;
- correspondencia conceptual entre la propuesta y React Native.

Este documento no define:

- contratos de API, payloads o respuestas;
- reglas de negocio no aprobadas;
- permisos RBAC;
- persistencia, reintentos o idempotencia concretos sin respaldo técnico;
- rutas definitivas del proyecto React Native.

## 2. Fuentes de verdad y resolución de conflictos

No existe una única fuente para todas las dimensiones:

1. La HU, el backend y las decisiones aprobadas gobiernan la funcionalidad.
2. Este `DESIGN.md` gobierna la intención visual y de experiencia móvil.
3. `@banasandev/banasan-ui-mobile`, en la versión instalada, gobierna componentes, props, variantes y tokens nativos.
4. La aplicación React Native/Expo gobierna rutas, navegación, permisos, dispositivo, offline y ciclo de vida.
5. La propuesta gobierna exploración y composición aprobada, no implementación nativa.
6. `shared/sial-mobile-core.css`, `shared/sial-mobile-core.js` y `libreria/` son adapters del prototipo.
7. Las referencias externas solo aportan candidatos y nunca prevalecen sobre SIAL.

Una vista local no crea por sí sola una nueva regla global. Si contradice la librería o este documento, debe revisarse antes de replicarla.

En React Native, el repositorio móvil vivo y sus dependencias instaladas gobiernan la implementación técnica. Este documento gobierna la intención de diseño. Los contratos backend gobiernan reglas e integración.

El inventario y la matriz de adopción viven en [`libreria/patrones-de-diseno-movil.md`](libreria/patrones-de-diseno-movil.md). Es obligatorio consultarlos antes de crear una composición local: distinguen entre componentes compartidos, composiciones de dominio y deuda de migración.

### 2.1 Sincronización con producto y librería

La skill de propuestas genera `.sial-design-map/product-library-alignment.generated.json`
y `.sial-design-map/product-library-drift.generated.md` desde la aplicación móvil, la
librería móvil y esta propuesta. Esos artefactos registran identidad del paquete,
versión, exports, imports, rutas, navegación, procedencia y adopción.

Toda pieza reutilizable se clasifica como `library`, `library-variant`,
`library-composition`, `feature-local`, `proposal-only`, `candidate`, `legacy` o
`non-replicable`. Los adapters HTML declaran `data-sial-component`, `data-sial-source`
y, cuando aplique, `data-sial-variant`; expresan intención y no simulan una API nativa.

Los estados de adopción son `proposal-only`, `library-candidate`,
`published-not-adopted`, `adopted-product-proposal-pending`, `aligned` y `validated`.
Una dependencia al paquete Web, una ruta local inexistente o un componente equivalente
por nombre se registra como drift; no se presenta como adopción de la librería móvil.

### 2.2 Auditoría de madurez visual — 2026-08-21

La propuesta tiene dos generaciones visuales. Las vistas iniciales resuelven la tarea con el shell, cards, campos y feedback base. Las vistas recientes de evidencias, consulta contextual, pallets y ZE añaden contexto operacional, avance por etapas, selección verificable, capacidad y cierre explícito. La segunda generación es la referencia para nuevas vistas, sin obligar a rediseñar una vista existente fuera de su alcance.

| Necesidad transversal | Canon compartido | Referencias maduras | No promover como genérico |
| --- | --- | --- | --- |
| Identificar una operación activa | `.sial-operation-ticket` + pills semánticas | HU342, HU347, evidencia | Datos, etiquetas o reglas propias de la operación |
| Mostrar una secuencia corta | `.sial-flow-stepper` | HU342 → HU344 → HU347 | La máquina de estados ni los guards de la HU |
| Elegir un registro operativo | `.sial-selectable-row` con `aria-pressed` | selección de pallets ZE, pickers HU591 | Filtros, elegibilidad o cantidades del dominio |
| Mostrar capacidad conciliable | `.sial-capacity-meter` + copy de estado | HU344, HU347 | Límite de 48, posiciones o cálculo de estiba |
| Confirmar un cierre | `.sial-submit-summary` + botón primario | HU347 y formularios de pallets | Validaciones, persistencia e idempotencia de negocio |

Los mapas de contenedor/estiba, la clasificación de novedades, la matriz de linaje y la composición de referencias son patrones de dominio: deben reutilizarse dentro de su módulo mientras no existan al menos tres usos con la misma anatomía y estado.

## 3. Principios de diseño

### 3.1 Operación primero

La interfaz debe ayudar a completar una tarea en campo con rapidez y seguridad. La decoración nunca debe competir con la acción principal, el dato capturado o el estado de la operación.

### 3.2 Claridad crítica

Toda pantalla debe responder sin ambigüedad:

- dónde está el usuario;
- qué entidad o contexto está activo;
- qué debe hacer ahora;
- qué información falta;
- qué ocurrió después de una acción;
- si el dato está local, enviándose o confirmado por el servidor.

### 3.3 Escaneo primero, digitación disponible

Cuando el flujo use códigos, SSCC, etiquetas o referencias, el escáner es la acción prioritaria. La digitación manual debe existir cuando sea válida, pero no desplazar el patrón de captura aprobado.

### 3.4 Una acción principal por contexto

Cada sección o capa debe tener una acción primaria reconocible. Las acciones secundarias deben tener menor peso. Una operación independiente, como re-etiquetado, no se introduce como atajo dentro de otra vista salvo aprobación explícita.

### 3.5 Estado honesto

“Guardado”, “sincronizado” y “confirmado” no son sinónimos. La interfaz solo declara una operación sincronizada cuando exista confirmación del servicio correspondiente.

### 3.6 Identidad sin redundancia

El isotipo identifica la aplicación, el acceso y los encabezados principales. No se repite dentro de cada alerta. El feedback usa iconografía semántica relacionada con el mensaje.

### 3.7 Cambios controlados

No se reorganizan secciones, jerarquías, campos o estilos aprobados como efecto lateral de una solicitud puntual. Todo cambio debe conservar el alcance solicitado y reutilizar componentes existentes.

### 3.8 Datos sin duplicación

La misma métrica no debe mostrarse dos veces en una sección si ambas representaciones tienen la misma finalidad. Los KPI se incluyen únicamente cuando permiten comparar o decidir; no cuando el mismo dato ya aparece de forma más clara en un resumen operativo.

## 4. Personalidad visual

SIAL Móvil es operativo, confiable, directo y moderno. La interfaz combina fondos neutros, superficies blancas o azul oscuro, bordes discretos y azul SIAL como color de acción. El amarillo institucional se reserva para identidad y acentos controlados; no debe convertirse en una franja decorativa recurrente.

Las referencias metodológicas se traducen así:

- **Expo:** ergonomía móvil, protagonismo del producto y movimiento fluido.
- **Linear:** jerarquía compacta, estados inequívocos y superficies disciplinadas.
- **Stripe:** claridad en formularios, lectura numérica y confianza transaccional.

Estas referencias no autorizan copiar logos, colores, tipografías propietarias, ilustraciones o composiciones de esas marcas. La identidad SIAL siempre prevalece.

## 5. Fundamentos y tokens

### 5.1 Color de marca

| Rol | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `primary-50` | `#F2F7FC` | `#102B45` | Fondo azul muy suave |
| `primary-100` | `#E6F0F8` | `#12345A` | Selección y acento suave |
| `primary-500` | `#005CA8` | `#1D7FE0` | Acción primaria |
| `primary-600` | `#004A87` | `#176BC0` | Acción presionada o texto destacado |
| `primary-700` | `#003766` | `#12559A` | Énfasis profundo |
| `brand-yellow` | `#FECC00` | `#FECC00` | Identidad institucional, uso escaso |
| `on-primary` | `#FFFFFF` | `#FFFFFF` | Contenido sobre acción primaria |

El azul SIAL es el único color de acción primaria. El amarillo no reemplaza al azul en botones principales y no se utiliza como borde superior ornamental de modales.

### 5.2 Colores semánticos

| Estado | Texto/icono claro | Fondo claro | Texto/icono oscuro | Fondo oscuro |
| --- | --- | --- | --- | --- |
| Éxito | `#2E7D32` | `#EDF7ED` | `#4CAF63` | `#153322` |
| Advertencia | `#6B5300` | `#FFF7CC` | `#FFE082` | `#3B2F10` |
| Error | `#D32F2F` | `#FDECEA` | `#F06262` | `#3B171A` |
| Información | `#0288D1` | `#E3F2FD` | `#4AA8E8` | `#143142` |

Reglas:

- El color refuerza el estado, pero nunca es la única señal.
- Cada estado lleva icono, título y mensaje comprensible.
- El rojo se reserva para error, bloqueo o acción destructiva.
- La advertencia no se presenta como error si el usuario puede continuar.

### 5.3 Superficies y texto

| Rol | Claro | Oscuro |
| --- | --- | --- |
| Fondo de aplicación | `#F5F7FA` | `#0F1724` |
| Superficie | `#FFFFFF` | `#151E2D` |
| Superficie elevada | `#FFFFFF` | `#1B2636` |
| Superficie overlay | `#FFFFFF` | `#223048` |
| Fondo de campo | `#FFFFFF` | `#101928` |
| Borde | `#D9DDE3` | `#2E3B52` |
| Borde sutil | `#E7EAF0` | `#253247` |
| Texto principal | `#1A1F36` | `#F3F6FB` |
| Texto secundario | `#5B6475` | `#C3CBDA` |
| Texto terciario | `#8C94A6` | `#94A0B6` |

La jerarquía se construye primero con superficie, borde y espaciado. Las sombras son suaves y escasas; los paneles operativos no deben parecer tarjetas flotantes sin relación.

### 5.4 Tipografía

La familia oficial es `Poppins`, con fallback `Segoe UI`, `Arial`, `sans-serif`.

| Rol | Tamaño de referencia | Peso | Interlineado | Uso |
| --- | --- | --- | --- | --- |
| Título de pantalla | 20–22 px | 700 | 1.2 | Nombre de la vista |
| Título de sección | 16–18 px | 600–700 | 1.3 | Bloques operativos |
| Subtítulo | 14 px | 500–600 | 1.4 | Contexto o instrucciones |
| Cuerpo | 14 px | 400 | 1.45 | Contenido estándar |
| Etiqueta de campo | 12–13 px | 600 | 1.4 | Labels y metadata |
| Ayuda/caption | 11–12 px | 400–500 | 1.4 | Ayuda y estados secundarios |
| Botón | 14 px | 600 | 1.2 | Acciones |
| Código/SSCC/dato tabular | 14–20 px | 500–700 | 1.3 | Identificadores y cantidades |

Los datos numéricos, horas, SSCC y cantidades deben usar cifras tabulares cuando la plataforma o fuente lo permita. No se usan pesos ultralivianos: la lectura en campo requiere contraste y estabilidad.

### 5.5 Espaciado

La escala normativa usa una base de 4 px:

| Token conceptual | Valor |
| --- | --- |
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |

Usar 16 px como margen horizontal estándar de pantalla. Una separación distinta debe responder a jerarquía, safe area o necesidad táctil, no a preferencia aislada.

### 5.6 Forma, borde y elevación

| Token | Valor | Uso |
| --- | --- | --- |
| `radius-control` | 8 px | Botones, inputs, selects |
| `radius-surface` | 12 px | Cards y paneles estándar |
| `radius-large` | 20 px | Capas o superficies protagonistas |
| `radius-pill` | 999 px | Estados, chips y badges |
| `shadow-soft` | `0 4px 16px rgba(16,24,40,.08)` | Elevación discreta |
| `shadow-overlay` | `0 18px 44px rgba(16,24,40,.18)` | Modal y bottom sheet |

No usar pill para todos los controles. Se reserva para estados y elementos compactos. Los botones principales conservan `radius-control`.

### 5.7 Iconografía

- Tamaño base: 20 px.
- Trazo: 2 px, terminaciones redondeadas.
- Los iconos funcionales deben provenir de una sola familia compatible con React Native.
- Todo botón de solo icono necesita nombre accesible.
- No usar emojis ni caracteres Unicode como iconos de interfaz.
- El icono debe representar la acción o el estado, no decorar el texto.

### 5.8 Marca

- `sial-auth-logo`: acceso y recuperación, con isotipo y nombre.
- `sial-app-isotype`: header, drawer y contexto principal.
- Tamaño de referencia del isotipo de aplicación: 46 px.
- Tamaño de referencia en página: 40 px.
- El isotipo puede usar placa neutra cuando necesita contraste.
- No comprimir el isotipo dentro de chips, alertas o controles pequeños.
- No repetir el logo en toast, banner, validaciones o modales de decisión.

## 6. Layout y navegación

### 6.1 Contenedor móvil

- Ancho máximo visual de la propuesta: 480 px.
- Margen horizontal estándar: 16 px.
- La aplicación real usa el ancho disponible y safe areas nativas.
- El contenido principal es de una columna.
- Dos columnas solo se usan para datos cortos y comparables; deben volver a una columna cuando el texto o accesibilidad lo requiera.

### 6.2 Safe areas y teclado

- Respetar notch, punch-hole, barra de estado y home indicator.
- Ninguna acción crítica puede quedar bajo la navegación del sistema.
- Al abrir el teclado, el campo activo, su mensaje de error y la acción necesaria deben permanecer alcanzables.
- Los overlays de cámara y escáner aplican insets manuales cuando ocupan toda la pantalla.

### 6.3 Header

El header interno puede incluir:

1. volver o abrir menú;
2. isotipo SIAL;
3. título y contexto de la vista;
4. una acción contextual, como cambio de tema.

No añadir acciones de negocio al header si pertenecen al formulario. El título debe mantenerse legible con escalado de texto.

### 6.4 Navegación y separación de procesos

- Volver conserva datos válidos cuando el flujo lo permita.
- Una salida con datos sin guardar requiere confirmación.
- Un proceso independiente debe tener ruta y vista independiente.
- Las vistas de consulta son de solo lectura: no incorporan acciones de creación, armado o edición encubiertas.
- Tabs cambian secciones equivalentes; segmented controls cambian modo dentro del mismo contexto.
- El drawer global mantiene un buscador visible sobre la lista desplazable cuando la navegación supera una pantalla.
- La búsqueda filtra por sección y nombre de vista, oculta grupos sin coincidencias y ofrece un estado vacío orientativo sin cambiar de ruta automáticamente.
- La consulta móvil de evidencias agrupa fotografías por evento, conserva operación, responsable, fecha, punto de control y sincronización, y abre el detalle en un bottom sheet de solo lectura.
- El rearmado de pallets en ZE es un proceso independiente de HU591 y del re-etiquetado: inicia seleccionando directamente uno o varios pallets de origen recibidos desde finca. `Incompleto` y `Mixto` son condiciones del pallet de origen y funcionan como filtros dentro del selector; no son tipos de pallet resultado. El selector también permite filtrar por SSCC, referencia o finca y agregar un origen mediante escaneo; un código escaneado solo se acepta si corresponde a un pallet disponible en ZE. Después de seleccionar, el usuario indica cuántas cajas toma de cada pallet. En un origen mixto puede escoger una o varias referencias y definir la cantidad de cajas de cada una; las referencias desmarcadas no participan en el rearmado. El saldo no utilizado permanece disponible con su composición original. Cada operación genera exactamente un pallet resultado, con una o varias referencias según la selección, y máximo 48 cajas. La cantidad del resultado se calcula desde los orígenes y no se edita por separado. La vista admite relaciones uno-a-uno y muchos-a-uno mediante conciliación exacta y una matriz de linaje origen–resultado. Muestra únicamente SSCC, finca, referencia, cajas y estado; la operación asociada se conserva internamente para compatibilidad y sincronización, sin pedirla ni mostrar cliente o certificación. Reutiliza cards, estados, escáner de resultado y confirmación compartidos.

#### Flujo operativo de pallets en ZE

La autoridad del prototipo es el estado local `sial-mobile-workflow`; el backend definitivo debe confirmar estas transiciones. El recorrido visible y la navegación mantienen una única secuencia: HU342 → HU344 → HU347.

| Estado origen | Acción | Estado destino | Guarda | Efectos y trazabilidad |
| --- | --- | --- | --- | --- |
| Contenedor recibido en ZE | HU342: descargar y conciliar cada SSCC | Pallets descargados | Recepción retorno confirmada, manifiesto completo y evidencias | Publica `zePalletInventory`; separa aptos, rechazados y pallets que requieren rearmado. |
| Pallets descargados | HU344: rearmar incompletos o mixtos | Pallet rearmado en ZE | Evento HU342 completo, conciliación exacta, SSCC válido y máximo 48 cajas | Conserva saldos y linaje, marca `zePalletReassembly` y publica el resultado como apto para consolidación. |
| Pallet rearmado en ZE | HU347: construir cargue consolidado | Consolidado cargado en ZE | Eventos HU342 y HU344 completos, seis posiciones, controles y evidencias | Registra posiciones, cajas, sello y temperatura; habilita el despacho a puerto. |

Cada registro HU344 genera una clave local de idempotencia y conserva el linaje SSCC. HU347 no puede confirmarse sin `zePalletReassembly`; el contrato backend definitivo debe resolver concurrencia y rechazo estable de duplicados.

## 7. Componentes

### 7.1 Botones

Variantes compartidas:

| Variante | Uso |
| --- | --- |
| Primario | Completar la acción principal del contexto |
| Secundario | Alternativa válida sin competir con la primaria |
| Ghost | Acción de menor prioridad o navegación contextual |
| Peligro | Acción destructiva explícita |
| Icono | Acción compacta con etiqueta accesible |
| Full width | Acción principal cuando el ancho favorece la ergonomía |

Estados obligatorios: default, pressed, focus, disabled y loading. Un botón en loading conserva su ancho, comunica progreso e impide doble envío.

Tamaño táctil mínimo: 44 × 44 px. La acción primaria de formulario debe aspirar a 48 px de alto.

Dos acciones breves relacionadas pueden aparecer juntas, como en sincronización, siempre que:

- ambas conserven objetivo táctil;
- la primaria tenga mayor peso;
- no se corten sus etiquetas;
- pasen a vertical cuando el ancho o escalado de texto no alcance.

### 7.2 Campos, inputs y selects

Anatomía:

1. label visible;
2. control;
3. ayuda o restricción, cuando aporte valor;
4. error asociado, cuando corresponda.

Estados obligatorios: vacío, con valor, focus, disabled, read-only, válido e inválido.

Reglas:

- No usar el placeholder como única etiqueta.
- El borde de focus usa el token de foco SIAL.
- El error usa `aria-invalid` en la propuesta y semántica equivalente en React Native.
- El mensaje debe explicar cómo corregir el dato.
- Fecha, hora, cantidades y códigos deben abrir el teclado o picker adecuado.
- Un dato calculado o de consulta se muestra read-only; no debe parecer editable.

### 7.3 Picker móvil

Para listas extensas o información con metadata, usar picker modal o bottom sheet con:

- título;
- búsqueda cuando sea necesaria;
- lista táctil;
- valor y detalle secundario;
- estado seleccionado;
- vacío, loading y error;
- posibilidad de cerrar aunque la carga falle o no existan opciones.

No copiar el `<select>` web cuando reduzca legibilidad o capacidad táctil.

### 7.4 Escáner

El componente de escaneo admite código de barras, QR o el formato aprobado por el flujo. Debe incluir:

- acción `Escanear` visible junto al campo correspondiente;
- permiso solicitado en contexto;
- overlay full-screen con safe areas;
- marco y guía de alineación;
- estado de lectura;
- cierre disponible;
- fallback manual cuando el negocio lo permita;
- validación inmediata del dato leído;
- prevención de lecturas duplicadas.

El escáner se ubica en la sección donde se consume el dato. No se agrega como control genérico desconectado del formulario.

### 7.5 Cards y secciones operativas

- `sial-card`: contenedor neutro.
- `sial-action-card`: entrada a una tarea o detalle.
- `sial-control-card`: resumen de control con estado.
- Cards locales solo se justifican cuando existe una anatomía propia del dominio.

Una card no debe envolver cada elemento por costumbre. Se usa cuando agrupa información relacionada, delimita una tarea o crea una superficie interactiva clara.

### 7.6 Estado, pill y badge

Se usan para estados breves como pendiente, sincronizando, sincronizado, error, activo o seleccionado.

- Siempre incluyen texto.
- Un icono puede reforzar el estado.
- No contienen mensajes largos.
- No se usan como botones salvo que su affordance sea explícita.
- Las cantidades no se colorean semánticamente sin significado operativo.

### 7.7 Empty state

Debe explicar:

- qué no existe;
- si es esperado o es un problema;
- qué puede hacer el usuario, cuando corresponda.

En una vista de consulta vacía, no se ofrece una acción de armado si la pantalla es exclusivamente de consulta.

### 7.8 Loading y skeleton

- Usar skeleton cuando se conoce la estructura final.
- Usar indicador compacto para una acción local.
- Mantener estable el layout durante la carga.
- No ocultar navegación o cancelación necesaria.
- Una carga larga debe tener texto de estado.

### 7.9 Cámara y evidencias

El patrón debe soportar evidencia individual, múltiple y secuencia guiada. Debe contemplar:

- permiso no solicitado hasta el momento de uso;
- estado sin permiso, denegado y denegado permanentemente;
- captura, revisión, reemplazo y eliminación;
- progreso de evidencias requeridas;
- cierre sin doble callback;
- conservación del estado válido si el usuario cancela antes de completar;
- feedback de archivo pendiente de carga o sincronizado.

La propuesta no inventa metadata obligatoria. URI, EXIF, GPS, fecha y demás requisitos se confirman con backend.

### 7.10 Etiqueta o resumen operativo

La etiqueta grande es una superficie de lectura y verificación, no un conjunto de KPI decorativos. Debe priorizar:

1. identificador principal;
2. contexto, finca o semana aplicable;
3. totales relevantes;
4. referencias o detalle asociado;
5. estado o vista previa, si aplica.

El diseño usa borde fino, contraste claro, jerarquía tipográfica y agrupaciones compactas. No duplicar el resumen arriba mediante KPI que repitan la misma información.

## 8. Feedback, alertas y validación

### 8.1 Selección del patrón

| Necesidad | Componente | Duración |
| --- | --- | --- |
| Confirmación breve | Toast | Temporal |
| Validación de un dato o sección | Estado inline | Hasta corregir |
| Conectividad o condición global | Banner | Persistente |
| Decisión crítica bloqueante | Modal centrado | Hasta decidir |
| Decisión contextual móvil | Bottom sheet | Hasta decidir o cerrar |

### 8.2 Reglas visuales aprobadas

- Toast y alertas usan icono semántico; no repiten el logo SIAL.
- El toast debe ser suficientemente grande, visible y legible en movimiento.
- Ninguna alerta usa un borde lateral grueso de color.
- Los modales de advertencia no usan franja amarilla superior ni su equivalente en otros colores.
- El estado se expresa mediante icono, título, mensaje y color de apoyo.
- El amarillo se limita a la iconografía o superficie semántica cuando corresponda.

### 8.3 Toast

Anatomía: icono de 40–44 px de área, título corto y mensaje de una o dos líneas. Puede incluir cierre si la duración o criticidad lo justifican.

- Éxito simple: 3–4 segundos.
- Información: 4–6 segundos.
- Error que requiere corrección: preferir inline o banner; no depender solo del toast.
- No apilar más de dos toast visibles.
- La aparición es fluida y breve; no bloquea el formulario.

### 8.4 Banner

Se usa para estado persistente de conexión, sincronización, sesión o bloqueo transversal. Puede incluir una acción corta como `Reintentar` o `Revisar`.

No debe desplazar repetidamente el contenido al cambiar de estado. En React Native se respeta safe area superior o inferior según ubicación.

### 8.5 Modal y bottom sheet

Modal centrado para decisiones críticas; bottom sheet para opciones contextuales. Ambos incluyen:

- icono semántico;
- título orientado a la decisión;
- consecuencia clara;
- acciones explícitas;
- foco inicial y restauración de foco;
- cierre controlado.

La acción segura se presenta primero. La destructiva utiliza rojo y describe exactamente lo que ocurrirá. No usar títulos genéricos como “Alerta” cuando puede nombrarse el problema.

### 8.6 Errores de formulario

Al intentar continuar:

1. validar todos los campos y reglas disponibles;
2. marcar visual y semánticamente cada control inválido;
3. revelar secciones colapsadas que contengan errores;
4. hacer scroll al primer error;
5. mover el foco al control o al resumen accesible correspondiente;
6. conservar los datos válidos;
7. indicar la corrección esperada;
8. mantener la acción bloqueada solo cuando el error realmente impida continuar.

Si existen errores en varias secciones, mostrar un resumen superior con enlaces o acciones que lleven a cada sección. El toast puede anunciar el fallo general, pero nunca reemplaza los errores inline.

## 9. Patrones operativos

### 9.1 Formularios extensos

- Dividir por secciones de negocio reconocibles.
- Mostrar progreso solo si hay pasos reales.
- No numerar bloques únicamente como recurso decorativo.
- Mantener contexto y resumen sin repetir métricas.
- Colocar observaciones al final cuando sean opcionales y no gobiernen el flujo.
- Las acciones fijas no deben cubrir el último campo.

### 9.2 Referencias y cantidades

- Una referencia tiene un único campo de total de cajas cuando no existe distribución por lote.
- No duplicar el total como consecuencia de un modelo anterior.
- Varias referencias se gestionan mediante un selector móvil y una lista editable o resumida.
- Cada fila debe conservar identificación, descripción, cantidad y acción permitida.

### 9.3 Consulta

Una vista marcada como consulta:

- permite buscar, filtrar, ordenar y abrir detalle;
- no permite armar, crear, editar o confirmar operaciones;
- diferencia filtros activos de estados del registro;
- presenta vacío y error sin ofrecer acciones fuera de alcance.

La consulta general de pallets y la consulta por finca son rutas independientes. La variante por finca:

- bloquea la finca según el contexto activo y no ofrece selector de finca;
- prioriza semana y disponibilidad (`Disponibles`, `Cargados`, `Todos`);
- reutiliza búsqueda, escaneo, estados, detalle y contrato de solo consulta del catálogo general.

### 9.4 Fechas y horas

- Mostrar formato consistente con `es-CO`.
- Para hora de inicio y finalización, diferenciar captura, dato calculado y dato confirmado.
- No inferir zona horaria ni fuente del valor en la propuesta.
- Los campos obligatorios deben indicar la regla y el orden esperado.

Los campos `input[type="time"]` consumen el selector táctil compartido de SIAL. El componente presenta únicamente dos controles nativos compactos —hora y minutos— en formato de 24 horas, ofrece el acceso rápido **Ahora** y exige confirmación antes de modificar el formulario; no utiliza listas internas extensas.

La API `SialMobileUI.openTimePicker({ target, title })` conserva el valor estándar `HH:mm`, dispara los eventos `input` y `change`, devuelve el foco al campo y respeta movimiento reducido. Un caso excepcional puede conservar el control nativo con `data-sial-native-time`.

En trazabilidad, fecha y hora se presentan como partes legibles de un mismo `time[datetime]`. La etapa actual conserva el instante del último evento confirmado; no representa ubicación GPS en tiempo real.

### 9.5 Relación vehículo + contenedor

- Vehículo y contenedor se relacionan mediante identificadores operativos estables; la placa y el número son etiquetas visibles, no la única llave.
- La consulta de vehículos permite buscar por contenedor y la consulta de contenedores permite buscar por placa o conductor.
- El detalle ofrece navegación bidireccional conservando filtro y registro relacionado.
- Si la relación no existe, la vista lo indica explícitamente y no inventa una asociación.
- Ambas superficies siguen siendo de solo consulta: el vínculo no habilita edición, armado ni confirmación.

## 10. Offline y sincronización

### 10.1 Estados canónicos

| Estado de dominio técnico | Etiqueta al usuario | Significado visual |
| --- | --- | --- |
| `LOCAL_PENDING_SYNC` | Pendiente | Guardado localmente; falta confirmación del servidor |
| `SYNCING` | Sincronizando | Existe un intento activo |
| `SYNCED` | Sincronizado | El servidor confirmó la operación |
| `SYNC_ERROR` | Error | Los datos se conservan y requieren revisión o reintento |

Estados adicionales de interfaz, como `Sin conexión`, `Bloqueado` o `Conflicto`, deben mapearse a una condición real y no sustituir los estados canónicos.

### 10.2 Reglas de experiencia

- Recuperar conectividad no equivale a sincronizar.
- No mostrar “guardado localmente” si había red, se intentó el API y ocurrió un error del servidor.
- Mostrar progreso general y detalle por módulo sin duplicar KPI.
- Permitir revisar errores sin perder los elementos correctamente sincronizados.
- El reintento manual debe ser visible cuando sea válido.
- Un error de validación o autorización no se presenta como reintento automático infinito.
- Los pendientes sobreviven cierre y relanzamiento únicamente si la implementación usa persistencia durable.

### 10.3 Vista de sincronización

La vista debe ser ágil y visual, pero la animación está subordinada al estado real. La composición recomendada incluye:

1. estado general y última revisión;
2. progreso principal;
3. acciones compactas `Sincronizar operación` y `Revisar errores` cuando ambas apliquen;
4. resumen por módulo;
5. historial o detalle de registros;
6. ayuda contextual ante bloqueos.

No agregar KPI superiores si los mismos datos ya están expresados de forma más clara en el resumen inferior.

## 11. Movimiento

### 11.1 Tokens

| Token | Duración | Uso |
| --- | --- | --- |
| `motion-fast` | 160 ms | Press, cierre y feedback inmediato |
| `motion-base` | 220 ms | Cambio de estado y controles |
| `motion-slow` | 340 ms | Entrada de pantalla o superficie |
| `motion-loading` | 900 ms | Ciclo de loading continuo |
| `ease-standard` | `cubic-bezier(.2,.8,.2,1)` | Movimiento habitual |
| `ease-emphasis` | `cubic-bezier(.16,1,.3,1)` | Entrada destacada |
| `ease-exit` | `cubic-bezier(.4,0,1,1)` | Salida |

### 11.2 Principios

- Una transición debe explicar continuidad, estado o resultado.
- Preferir opacidad y transform sobre propiedades que recalculen layout.
- Los stagger son cortos y solo se aplican a grupos pequeños.
- El progreso puede animarse de forma fluida, pero nunca fingir avance.
- Evitar rebotes excesivos, pulsos permanentes y elementos flotantes sin función.
- Press feedback debe sentirse inmediato.

La intro de marca es una excepción controlada de aproximadamente 2200 ms y solo ocurre en el acceso definido. No se reutiliza como transición general.

### 11.3 Reducción de movimiento

Cuando el usuario solicite reducción de movimiento:

- eliminar desplazamientos, escalas y órbitas continuas;
- conservar cambios de opacidad breves cuando sean necesarios;
- sustituir progreso animado por estados discretos;
- mantener toda la información y funcionalidad.

### 11.4 Mapa de aplicación

| Superficie o evento | Entrada | Salida | Aplicación | Regla |
| --- | --- | --- | --- | --- |
| Cambio entre vistas | `motion-base` | `motion-fast` | Navegación interna hacia adelante o atrás | Desplazamiento horizontal corto; no se usa loader decorativo |
| Press de botón o card accionable | `motion-fast` | `motion-fast` | Acciones táctiles compartidas | Respuesta inmediata sin rebote |
| Selección de finca, tab, segmento o picker | `motion-base` | `motion-fast` | Cambio de estado dentro de la misma vista | Solo anima el elemento que cambió |
| Menú lateral | `motion-base` | `motion-fast` | Navegación global | Desplaza el drawer y atenúa el fondo; controla foco |
| Modal centrado | `motion-base` | `motion-fast` | Decisión bloqueante | Escala y desplazamiento mínimos; fondo bloqueado |
| Bottom sheet | `motion-base` | `motion-fast` | Decisión contextual móvil | Entra desde el borde inferior y devuelve el foco al cerrar |
| Toast y banner | `motion-base` | `motion-fast` | Feedback temporal o persistente | No mueve repetidamente el contenido de la vista |
| Loading, skeleton y sincronización | `motion-loading` | `motion-fast` | Progreso comprobable | No simula avance ni bloquea cancelación válida |
| Intro de marca | Excepción de acceso | `motion-slow` | Login institucional únicamente | No se reutiliza en navegación operativa |

El objeto `SialMobileUI.motionApplications` expone este inventario para la propuesta. Todas las vistas que consumen `shared/sial-mobile-core.css` y `shared/sial-mobile-core.js` heredan los patrones compartidos; una animación local debe documentar la necesidad de negocio y su alternativa con movimiento reducido.

### 11.5 Contrato de transición entre vistas

- La navegación interna nueva entra hacia adelante; volver, regresar y los controles con `data-nav-direction="back"` entran en sentido inverso.
- El historial del navegador conserva un índice por entrada para inferir correctamente atrás y adelante, incluso al restaurar una vista desde BFCache.
- La recarga y la primera apertura no simulan una navegación: se presentan sin desplazamiento.
- La estructura del encabezado permanece estable; solo cambian suavemente su título o contexto y el cuerpo de la vista.
- Durante la salida se bloquea el segundo toque, se marca la vista como ocupada y el origen tocado confirma visualmente la acción.
- Con reducción de movimiento, el cambio de ubicación es inmediato y conserva todo el estado funcional.

### 11.6 Presupuesto de riqueza visual

- Una entrada puede revelar como máximo cuatro superficies principales, con separación de 24 ms.
- Los campos de un formulario no entran individualmente; se anima el bloque funcional completo.
- La respuesta táctil aparece solo mientras existe contacto y nunca continúa después de la acción.
- Los mensajes contextuales pueden asentarse una vez al cambiar de estado; no pulsan de forma permanente.
- Solo sincronización, cámara o progreso comprobable pueden mantener movimiento continuo.
- Una vista no combina simultáneamente intro, stagger, pulso y loading decorativo.
- La riqueza debe reforzar prioridad, continuidad o confirmación; si no cumple una de esas funciones, se elimina.

El cierre de sesión se presenta en encabezados internos junto al cambio de tema. En la propuesta elimina empresa y finca activas, conserva operaciones pendientes locales y vuelve al acceso. La implementación real debe invalidar las credenciales mediante el mecanismo de autenticación aprobado sin borrar silenciosamente la cola offline durable.

## 12. Accesibilidad

- Objetivo táctil mínimo de 44 × 44 px; preferir 48 px en acciones principales.
- Contraste WCAG AA para texto y controles esenciales.
- Foco visible y orden lógico.
- Labels accesibles en inputs, botones de icono, escáner y cámara.
- No comunicar estado únicamente por color.
- Soportar escalado de texto sin ocultar acciones.
- Evitar texto principal inferior a 12 px.
- Respetar teclado, lector de pantalla y orientación cuando el flujo lo permita.
- Modales atrapan el foco y lo devuelven al elemento que los abrió.
- Los mensajes dinámicos importantes deben anunciarse con la semántica adecuada.

## 13. Contenido y microcopy

### 13.1 Voz

Directa, respetuosa y orientada a la operación. Usar español colombiano claro.

El texto visible y accesible debe poder trasladarse al producto sin reinterpretar la intención. No mostrar números de HU, nombres de capas técnicas, «propuesta», «demo», «esta sesión» ni decisiones del equipo en títulos, ayudas, estados, detalles, historial, notificaciones o nombres accesibles. La trazabilidad se documenta fuera de la pantalla. Se conservan códigos operativos reales, como SSCC o documento, cuando ayudan a identificar la carga o completar la tarea.

### 13.2 Acciones

Usar verbo + objeto: `Escanear SSCC`, `Agregar referencia`, `Revisar errores`, `Crear pallet`. Evitar `Aceptar` o `Continuar` cuando no describan el resultado.

### 13.3 Mensajes

Un buen mensaje responde:

1. qué ocurrió;
2. sobre qué dato u operación;
3. qué puede hacer el usuario.

Ejemplo:

- Título: `No pudimos validar el SSCC`.
- Mensaje: `Revisa los 18 dígitos o vuelve a escanear la etiqueta.`

Evitar códigos técnicos como texto principal. Si ayudan a soporte, ubicarlos como detalle secundario copiable.

El título orienta; la ayuda añade una restricción; el error explica la recuperación. No repetir la misma instrucción entre encabezado, card, campo y mensaje. Una interacción local que no persiste o envía datos no debe comunicar éxito durable; su limitación se registra en el handoff y cualquier texto temporal se marca como no promocionable.

### 13.4 Consistencia terminológica

- Escribir `SIAL Móvil` en títulos y documentación.
- Respetar el nombre aprobado de cada vista, incluso cuando contenga terminología del negocio.
- No alternar sin motivo entre `código`, `etiqueta`, `lectura` y `SSCC`.
- Las cantidades incluyen unidad cuando puede existir ambigüedad: `48 cajas`.

## 14. Mapeo de propuesta a React Native

| Propuesta | Intención | Implementación móvil esperada |
| --- | --- | --- |
| Variables `--sial-*` | Tokens de tema | Tema/Banasan UI/NativeWind |
| `.sial-page` | Contenedor de pantalla | Layout con safe areas |
| `.sial-btn-*` | Jerarquía de acciones | Componente Button compartido |
| `.sial-field` / `.sial-input` | Campo accesible | Field + React Hook Form + Zod cuando aplique |
| `.sial-picker-*` | Selección móvil | Modal o bottom sheet nativo |
| `.sial-toast` | Feedback temporal | Toast compartido accesible |
| `.sial-banner` | Estado persistente | Banner compartido con safe area |
| `.sial-modal` | Decisión bloqueante | Modal accesible |
| `.sial-bottom-sheet` | Acción contextual | Bottom sheet compatible con versión instalada |
| `.sial-barcode-scanner-*` | Captura de códigos | Cámara/escáner Expo verificado |
| `.sial-camera-*` | Evidencias | Feature de cámara y archivos persistentes |
| `.sial-sync-*` | Estado offline/sync | UI conectada a store y outbox durable |

No trasladar directamente:

- DOM o selectores CSS;
- `data-theme`;
- hover;
- APIs del navegador;
- almacenamiento en `localStorage`;
- animaciones CSS sin alternativa nativa;
- reglas simuladas del prototipo.

## 15. Pantallas maestras

Toda evolución del sistema debe contrastarse con estas familias:

1. login y recuperación de acceso;
2. selección de empresa, finca o contexto;
3. HU591 y patrón de escaneo;
4. consulta de pallets;
5. sincronización de operación;
6. cámara y evidencias;
7. formulario con múltiples errores;
8. toast, banner, modal y bottom sheet;
9. estados loading, vacío, offline y error.

La validación mínima cubre:

- modo claro y oscuro;
- anchos de 340, 390, 430 y 480 px en la propuesta;
- al menos un viewport Android y uno iOS cuando se implemente en React Native;
- teclado abierto;
- texto largo y cantidades reales;
- conectividad perdida durante una acción;
- reducción de movimiento;
- permisos denegados cuando aplique.

## 16. Hacer y no hacer

### Hacer

- Reutilizar tokens, componentes y API compartida.
- Diseñar primero los estados reales del componente.
- Mantener el azul SIAL como acción principal.
- Ubicar errores junto al origen y dirigir al primer error.
- Separar procesos independientes en vistas independientes.
- Mantener las vistas de consulta como solo lectura.
- Presentar un único total cuando existe una única cantidad de negocio.
- Verificar claro, oscuro, offline, loading, vacío y error.

### No hacer

- No mover secciones o cambiar jerarquías sin alcance aprobado.
- No crear una variante local si ya existe un componente compartido.
- No repetir el logo SIAL dentro de alertas.
- No usar bordes laterales gruesos en mensajes.
- No usar franjas superiores de color en modales.
- No depender solo de toast para errores de formulario.
- No duplicar KPI o totales.
- No mezclar consulta con creación o armado.
- No declarar sincronización sin confirmación del servidor.
- No copiar HTML/CSS literalmente a React Native.

## 17. Checklist para nuevas vistas

### Alcance

- [ ] La vista tiene un propósito único y un nombre aprobado.
- [ ] Las acciones pertenecen al proceso mostrado.
- [ ] No se modificaron elementos fuera del alcance.

### Componentes

- [ ] Se reutilizan componentes compartidos antes de crear variantes.
- [ ] Botones, inputs y acciones cumplen el tamaño táctil.
- [ ] Cada componente contempla default, focus/pressed, disabled, loading y error según aplique.

### Datos y formularios

- [ ] No hay datos o totales duplicados.
- [ ] Labels, ayudas y unidades son claros.
- [ ] Los errores aparecen inline y el flujo dirige al primero.
- [ ] El teclado y scroll permiten terminar la tarea.

### Estados

- [ ] Existen loading, vacío, error y sin conexión.
- [ ] Los estados no dependen únicamente del color.
- [ ] Pendiente, sincronizando y sincronizado tienen significados distintos.

### Visual y accesibilidad

- [ ] Respeta tokens, Poppins, iconografía y jerarquía SIAL.
- [ ] Funciona en claro y oscuro.
- [ ] Respeta safe areas y reducción de movimiento.
- [ ] Contraste, foco, labels y escalado de texto fueron revisados.
- [ ] Títulos, ayudas, vacíos, errores, toasts, detalles y nombres accesibles usan lenguaje operativo sin HU ni referencias al proceso de diseño; no repiten información entre niveles.

### Implementación

- [ ] La propuesta no inventa reglas backend.
- [ ] La traducción React Native usa componentes y APIs compatibles con las versiones instaladas.
- [ ] Cámara, archivos, permisos y offline contemplan ciclo de vida y persistencia real.

## 18. Gobierno y evolución

Este documento usa versionado semántico:

- **patch:** aclaración sin impacto visual o de comportamiento;
- **minor:** nuevo componente, variante o patrón compatible;
- **major:** cambio de identidad, tokens fundamentales o comportamiento transversal.

Toda modificación debe registrar:

1. motivo;
2. vistas afectadas;
3. componente o token modificado;
4. estados revisados;
5. evidencia visual;
6. aprobación de Producto/Diseño;
7. impacto esperado en React Native.

El sistema no limita la creación de nuevas vistas, componentes, estilos o composiciones. Cuando el problema lo requiere, una vista puede introducir un **candidato visual** con alcance local. Debe documentar su propósito, estados, accesibilidad y la razón por la que el canon actual no lo cubre; un candidato no crea precedente automático.

Antes de reutilizarlo fuera de su vista de origen o declararlo como base visual, Diseño/Producto y la revisión técnica validan coherencia con marca y tokens, utilidad transversal, claro/oscuro, responsive, accesibilidad, movimiento y estados reales. Si se aprueba, se incorpora a `shared/`, se muestra en `libreria/index.html`, se registra en la matriz de patrones y pasa a ser parte de las bases visuales. Si no se aprueba, permanece aislado, se ajusta o se retira según la decisión de revisión.

## 19. Inventario vivo relacionado

- `shared/sial-mobile-core.css`: tokens y estilos transversales.
- `shared/sial-mobile-core.js`: interacciones y API UI compartida.
- `libreria/index.html`: catálogo visual y estados reutilizables.
- `libreria/patrones-de-diseno-movil.md`: mapeo completo de vistas, patrones, propietarios y plan de adopción.
- `libreria/sial-mobile-library.css`: presentación del catálogo.
- `pallets/armar-pallet.html`: formulario operativo y escaneo HU591.
- `pallets/consulta-pallets.html`: patrón de consulta de pallets.
- `trazabilidad/sincronizacion.html`: revisión y sincronización operativa.
- `demo-camara.html`: patrón de cámara y evidencias.

El inventario debe mantenerse alineado con este documento. Un componente documentado pero inexistente es una definición pendiente; un componente existente pero no documentado debe auditarse antes de reutilizarse ampliamente.
