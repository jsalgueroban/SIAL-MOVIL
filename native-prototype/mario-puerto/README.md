# Mario puerto

Propuesta móvil de seguridad y cierre del cargue en puerto. Entrada navegable:
`puerto-ze/index.html` → **Mario puerto** → `puerto-ze/mario-puerto.html`.

La vista usa los componentes de `@banasandev/banasan-ui-mobile` mediante React
Native Web. Incluye selector de contenedor con búsqueda y paginación, precinto con
escáner, una fotografía obligatoria, hasta tres adicionales, guardado y cierre con
confirmación. Captura y acciones se presentan en tarjetas separadas. El borrador
y el cierre se conservan por contenedor en el almacenamiento local del navegador.
Cambiar de contenedor con edición pendiente ofrece guardar antes de continuar.

Los contenedores son datos de demostración procedentes de la propuesta. Cámara
y escáner usan el puente de `shared/sial-mobile-core.js`; este prototipo no envía
datos al backend ni certifica capacidades Android/iOS.

## Reconstruir el bundle

Con un consumidor móvil que tenga instalados el paquete, React, React DOM,
React Native Web, React Native SVG y esbuild:

```text
node native-prototype/mario-puerto/build.cjs <raíz-del-consumidor-móvil>
```

El build genera `assets/mario-puerto/mario-puerto.js` y
`assets/mario-puerto/library-provenance.json`. El manifiesto identifica la versión
consumida y los hashes de los componentes reales incluidos y del bundle. La
entrega actual consume `@banasandev/banasan-ui-mobile` **1.5.1-dev.1**.

La fuente de la vista es `mario-puerto.web.tsx`. `ContainerSelector.tsx` compone
el selector con los componentes móviles; `container-fixtures.json` conserva los
datos de ejemplo. Los estilos del host están en `puerto-ze/mario-puerto-native.css`.

## Verificación

Se recorrieron selección, búsqueda por viaje/placa, paginación, vacío, guardado y
recuperación por contenedor, captura de demostración, límite de evidencias,
cancelación/confirmación de cierre y bloqueo de edición. También se revisaron
340, 390 y 430 px en temas claro y oscuro, y el centrado del icono de cámara.
