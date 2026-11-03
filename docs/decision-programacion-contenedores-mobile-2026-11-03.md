# Programación de contenedores móvil

Fecha operativa: 2026-11-03. Plataforma: mobile. Operación: build. Perfil local: adopción de los patrones establecidos solicitados por John. Estado: propuesta implementada y comprobada en navegador; aceptación visual y publicación pendientes.

## Alcance y fuentes

Vista nueva `puerto-ze/programacion-contenedores.html`, con CSS/JS de dominio. Acceso desde menú global → ZE Puerto / Control de contenedores → Programación de contenedores. La única modificación del core es el enlace de navegación.

Fuentes visuales: DESIGN.md, libreria/patrones-de-diseno-movil.md, docs/pattern-registry.mobile.json y contratos móviles de sial-design-proposals. La skill sial-mobile-library se consultó para respetar la separación entre adapter HTML y componente nativo; no se modifica el paquete React Native.

Fuente funcional de referencia: parametrización vigente de contenedores, selección múltiple por semana, exclusión de ya programados, observación común y asignación automática de etapa. Se contrastó el comportamiento de `initContainerScheduling` de la propuesta existente, sin importar sus componentes ni estilos Web. HU específica móvil pendiente de confirmación; no se atribuye a la vista una HU web por semejanza.

## Decisión de composición

Objetivo: programar varios contenedores desde teléfono y revisar el resultado. Restricción explícita: identidad y patrones móviles SIAL. Se conserva la familia de captura: encabezado SIAL, secciones con icono y título en una fila, controles neutrales y confirmación hermana con un único CTA a ancho completo conectado mediante `form`.

La selección múltiple usa filas seleccionables del core dentro de `openDialog` tipo sheet. `openMobilePicker` se usa para semana: su API es de selección simple, por lo que no se simula soporte múltiple. El listado y el detalle son composiciones de dominio, no nuevos componentes de librería. El sheet local limita su altura y desplaza el cuerpo para mantener las acciones visibles a 340 px.

Se adopta explícitamente la confirmación de la familia de captura. La consulta se separa mediante segmentado Programar / Programaciones; no hereda la tarjeta de confirmación. No se agrega ticket de operación: aún no existe operación activa. No se añaden fotografía decorativa, métricas, trazabilidad ni etapa editable.

Ejes evaluados: composición en una columna, selección contextual, consulta separada y densidad táctil. Se conserva movimiento suave del core, con soporte de movimiento reducido. No hay animación local ni dependencia nueva. Alternativa considerada: lista completa incrustada; descartada para evitar que el catálogo desplace el formulario y la confirmación. La elección es propuesta para revisión, no patrón nuevo promovido.

Recursos: sial-design-proposals activated (composición y contratos); sial-mobile-library consulted (frontera nativa); Playwright activated (recorridos y capturas); Dona activated (planificación). Delegación: SELF. Slice: vista móvil y comprobación local; el costo de transferir contexto equivale al trabajo directo y no hay entregable independiente que justifique delegación.

## Datos y límites

Todos los datos son ejemplos. Catálogo fijo de semanas 45–47 de 2026, anclado a la fecha de esta propuesta, no calendario productivo ni cálculo del dispositivo. Los cambios viven en memoria y desaparecen al recargar. No se afirma guardado durable ni sincronización. La observación se presenta mediante textContent.

En producto deben resolverse catálogo de semanas reales, permisos, elegibilidad, etapa inicial desde servicio, concurrencia, persistencia, errores de red y política offline. No hay llamada de red de negocio en esta vista: no se simulan loading ni errores de servidor. El filtro de duplicados solo acredita el recorrido local. No se implementan edición ni eliminación sin un contrato móvil confirmado.

## Verificación ejecutada

- Sintaxis JavaScript y `git diff --check`: correctos.
- `node qa/mobile-library-integration-contract.js`: correcto.
- Navegador: error inline sin selección; selección múltiple; aplicación/cancelación; programación; observación conservada en detalle; consulta sin resultados; exclusión de programados para la misma semana; disponibilidad al cambiar semana; limpieza de selección.
- Claro/oscuro a 340, 390, 430 y 480 px: sin desborde horizontal.
- Selector a 340 × 740: acciones visibles y lista con scroll; Escape y retorno de foco comprobados. Movimiento reducido activado en navegador.
- Evidencia: `../output/programacion-contenedores-mobile.png` y `../output/programacion-contenedores-mobile-picker-dark.png`, bajo la raíz de trabajo superior (no dentro del repositorio móvil).
- Se corrigió el recorte del CTA del selector detectado en la primera comprobación. Las comprobaciones de cierre esperan la retirada real del backdrop y restauración asíncrona de foco del core.
- Único error de recurso observado: favicon.ico ausente en el servidor local. Sin error JavaScript de la vista.

No se acredita QA funcional de producto, lector de pantalla real, dispositivo Android/iOS ni integración de librería nativa. No hay commit, push ni despliegue.

## Seguimiento

Tarea Notion: 40d70c9c-1cbc-8181-b5f9-fa7052525415, proyecto SIAL PROPUETA UI (WEB-MOVIL), origen Externa. Entrega para revisión: validar composición, selección y consulta. Azure no modificado.
