# HU533 · Inspección preoperacional (móvil)

Captura móvil de una columna: selección de vehículo, contexto, avance, seis grupos de checklist, revisión y borrador local. Usa cabecera, secciones, inputs, botones e iconografía de la propuesta/librería móvil. No replica la tabla web.

## Evolución de UX · 14/10/2026

El formulario inicial mostraba los 42 puntos en una sola página. Por indicación explícita del usuario, se sustituyó por una secuencia de seis pasos de negocio (Documentos, Luces, Habitáculo, Motor, Kit de carretera y Generales) y un séptimo paso de revisión. Solo un grupo es visible a la vez; «Siguiente» valida sus respuestas y descripciones de novedades, «Anterior» conserva los datos y el borrador recuerda también el paso al recargar. Esto es una decisión específica de HU533, no un nuevo patrón global de inspecciones. La composición utiliza las mismas cards, encabezados, controles y botones compartidos; la coordinación de pasos es local a la vista.

Delegación: `SELF`. Ajuste acotado a una vista y un repositorio; el contexto de interacción y su verificación son inseparables de la edición local.

## Feedback de borrador · 14/10/2026

Las acciones explícitas «Guardar borrador» y «Guardar localmente» usan el Toast compartido de la propuesta: éxito al persistir y error cuando falla el almacenamiento. El guardado automático al responder o avanzar no produce toasts repetitivos. La validación de puntos incompletos permanece inline, junto a la sección que debe corregirse. El mensaje persistente delimita que la copia es local y no sincroniza ni habilita el vehículo. Esta adopción es específica de HU533; no implica que el HTML sea el componente React Native productivo.

## Fuente y alcance

- HU533 y tarea Azure 2594.
- FR-PTR-010, revisión 1 (31/12/2021), originalmente para particulares. El usuario aprobó sus seis grupos como checklist **provisional adaptable** a todos los tipos. Son 42 puntos; no se declara cobertura oficial para camión/tractomula.
- El PDF pregunta si hay novedades. Por claridad, las opciones son «Sin novedad» y «Con novedad»; esta última exige descripción.
- Vehículos, conductores y programación en la propuesta son datos de ejemplo.
- El borrador se guarda en `localStorage` solo para demostrar continuidad de la interacción. No es SQLite, no hay servidor, no se afirma sincronización ni se altera la disponibilidad.

## Pendiente de definición funcional

Checklist oficial/versiones por tipo, puntos críticos, evidencias obligatorias y formatos, no-aplica por tipo, vigencia, resultado y autorización, corrección/reinspección, permisos y contrato offline real (SQLite/outbox/idempotencia). El flujo final del producto debe bloquear la salida de acuerdo con esas reglas, no con el valor bruto de los botones.
