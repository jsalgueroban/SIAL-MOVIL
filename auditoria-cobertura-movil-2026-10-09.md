# Cobertura móvil — bloque 1, 2026-10-09

El inventario por vista está en [la matriz completa](auditoria/cobertura-vistas-2026-10-09.md). También se entrega [CSV para filtrar](auditoria/cobertura-vistas-2026-10-09.csv), [rutas sin equivalente](auditoria/producto-sin-equivalente-2026-10-09.csv) y [evidencia estructurada](auditoria/cobertura-vistas-2026-10-09.json).

Se revisaron 49 HTML de propuesta y 35 archivos de pantalla Expo Router de `origin/dev`, contrastados con las 358 HUs de Azure. El corte remoto vigente es `5b8e63e`, accesible desde el checkout `fe-sial-mobile-native`. El antiguo checkout detached en `1b18282` no es autoridad para esta auditoría. La app actual declara `@banasandev/banasan-ui-mobile`; la adopción de sus componentes corresponde al bloque 2.

Veintisiete rutas tienen relación con la propuesta. De las ocho restantes, cuatro son pantallas de negocio, dos son placeholders, una es AuthGate y otra es una herramienta técnica de diagnóstico.

## Pantallas reales sin propuesta equivalente

| Pantalla real | Ruta | Relación funcional |
| --- | --- | --- |
| Ingreso mediante PAT/credencial offline | /pat | HU1916; crear la credencial no cubre el acceso con ella |
| Consulta y generación POMA móvil | /admin/audit/poma | HU337; revisar canal, porque la HU vigente prioriza generación Web y consulta móvil por rol |
| Cargue de camión en finca | /admin/truck-loading | HU332; la propuesta actual solo representa cargue de contenedor y posiciones |
| Salida de vehículo desde Puerto Final | /admin/vehicle-movement/dispatches-vehicle-final-port | Hito distinto de recepción/entrega; HU350 es contexto candidato, no respaldo inequívoco |

## Archivos de producto que no generan una nueva propuesta de negocio

- `/admin/farms-sectors` está vacío.
- `/admin/farms` monta ManagementFarms, que solo muestra “Prueba de Enrutamiento”.
- `/` resuelve AuthGate para entrada y sesión.
- `/admin/synchronization/users` consulta un snapshot de diagnóstico de autenticación local. Su exposición al usuario necesita una decisión de producto.

## Propuestas y diferencias que requieren tratamiento

- El cierre de contenedor (HU760) está implementado dentro del cargue: ContainerSecurityCloseCard y finalClose. La propuesta lo separa. Es una diferencia de composición, no una funcionalidad ausente.
- Las ocho vistas operativas de `materiales/` tienen HUs funcionales salvo el inventario de pallets, cuya fuente HU559 está en `Removed` y HU560 está vacía. No procede retirar todo el módulo por no encontrar rutas homónimas.
- `puerto-ze/entrega-puerto.html` propone estados de entrega/exportación y liberación del vehículo sin una HU inequívoca identificada entre las 358 consultadas. Su continuidad exige aclarar el hito funcional.
- Rearmado corresponde a HU344; HU342/HU347 son actividades vecinas. Despacho a Puerto Final corresponde a HU350; HU347 es cargue previo. Recepción cargada en retorno se contrasta con HU348; HU342 es descarga posterior.
- Reetiquetado se contrasta con HU593 (regeneración tras modificación), sin asumir que la mención histórica HU591 cubra una pantalla independiente.
- Responsabilidad conductor/supervisor y consulta integral de operación conservan HUs candidatas y alcance pendiente de confirmar.
- Las tres alternativas de login y el catálogo/demo son referencias. No se cuentan automáticamente como vistas sobrantes.
- La propuesta conserva sus dos commits locales y cambios previos de diseño, materiales y core; esta entrega solo añade documentación de cobertura.

## Estado de la entrega

Cada HTML tiene clasificación, rutas relacionadas, HUs y estado actual, referencia de entrada, observación y hash. Se comprobaron la cobertura completa de archivos/rutas y los IDs de HU. El código acredita presencia; no sustituye QA funcional ni pruebas de capacidades nativas.

La evidencia de este corte está en la matriz nueva. El antiguo `product-library-alignment.generated.json` puede corresponder al checkout obsoleto y deberá regenerarse en el bloque 2. El menú efectivo por rol permanece pendiente de snapshot runtime.

## Planificación posterior a la normalización Móvil

Las cuatro brechas de negocio tienen tareas en el proyecto de propuestas SIAL, en `Backlog`, dependientes de [normalizar la propuesta Móvil](https://app.notion.com/p/3e270c9c1cbc81c58d1ee1e7499911be):

| Ruta | Tarea | Relación HU |
| --- | --- | --- |
| `/pat` | [Ingreso con credencial offline PAT](https://app.notion.com/p/3f870c9c1cbc81789ff4ec17dc58d4ca) | HU1916 |
| `/admin/audit/poma` | [Consulta POMA por rol](https://app.notion.com/p/3f870c9c1cbc8117996bebfd20503467) | HU337; resolver si generar POMA en móvil pertenece al alcance |
| `/admin/truck-loading` | [Cargue de camión en finca](https://app.notion.com/p/3f870c9c1cbc81c1a8eecb8f30d19ddc) | HU332; distinto del cargue de contenedor ya propuesto |
| `/admin/vehicle-movement/dispatches-vehicle-final-port` | [Salida desde Puerto Final](https://app.notion.com/p/3f870c9c1cbc8110bdd5f47192ee3a06) | HU350 es candidata, falta fuente específica |

Las relaciones candidatas no equivalen todavía a tareas hijas en Azure. La fecha 2026-10-13 registrada en Notion es de captura administrativa, sin compromiso de ejecución antes de completar la normalización.
