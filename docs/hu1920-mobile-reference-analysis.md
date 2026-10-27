# HU1920 móvil · análisis de referencias y dirección de composición

Fecha: 27 de octubre de 2026. Operación: `explore` → `build` → `evolve`. Estado: rediseño móvil listo para publicación de propuesta. `ROUTER: SELF`: composición, navegación y fixture locales del mismo flujo; separarlos añadiría contexto sin un slice independiente.

## Fuente funcional

HU1920 (rev. 6): Auditor/Supervisor compara pedido consolidado aprobado de Materiales, programación en vehículos de Transporte y entrega con POD en finca para detectar desvíos, entregas pendientes y sobreasignaciones. La decisión de esta conversación añade despacho confirmado como cuarta magnitud explícita. Las cantidades se comparan **por material y unidad**; el Aviso de Corte es contexto/filtro y sus cantidades no se suman a las de insumos. Un caso sin dato se distingue de un valor cero. El prototipo Web proporciona definiciones y ejemplos, no un contrato de datos productivo.

## Lectura de las tres referencias adjuntas

| Referencia | Valor transferible | Ajuste necesario para SIAL | Evitar |
| --- | --- | --- | --- |
| 1. Tarjetas blancas, barras y línea | Números legibles, una gráfica enfocada y progresión de resumen a detalle. | Una única gráfica de las cuatro etapas y brechas, con cifras y unidades siempre visibles. | Repetir la misma cifra en tres tarjetas y otra gráfica. |
| 2. Panel financiero azul y anillo | Contraste de una superficie protagonista, jerarquía de número principal y acabado pulido. | Azul SIAL como acento de acción y progreso; una sola superficie destacada si ayuda a la decisión. | Anillo que trate etapas como porciones sumables; degradados y acciones financieras sin significado logístico. |
| 3. Resumen y agenda neutra | Lista de asuntos prioritarios, lectura calmada y detalle al tocar un registro. | Lista de casos con desvío y acceso directo al pedido, orden y POD. | Calendario mensual, tareas genéricas y botón de creación: HU1920 es consulta. |

## Alternativas de experiencia

### A. Panorama por material + casos prioritarios — recomendada

1. Encabezado SIAL: «Control de entregas», búsqueda y filtro; selector visible de material/unidad. Finca y Aviso de Corte en filtros secundarios.
2. Una sola superficie de comparación: cuatro barras o marcas consecutivas — aprobado, programado, despachado y con POD — con valor y unidad. Entre etapas, diferencia explícita («200 UN sin salida»). Si el programado supera lo aprobado, mostrar la cifra real y «50 M sobreprogramados»; nunca recortar la barra a 100 % sin explicación.
3. Lista plana «Requieren revisión» con conteos de **casos**, no suma de unidades distintas. Tocar una categoría abre los casos filtrados; tocar un caso abre su detalle.
4. Detalle de solo lectura en pantalla propia: identidad del pedido/material, cuatro magnitudes, reparto por viaje y vehículo, documento de origen, orden, entrega/POD y acceso al proceso. Volver conserva filtros y posición.

Ventaja: satisface la expectativa de estadísticas y gráfica sin trasladar el dashboard Web entero al teléfono. Riesgo: la comparación por material requiere que el selector y la unidad permanezcan muy claros; las alertas generales deben indicar que abarcan todos los materiales.

### B. Cola de excepciones + comparación en el detalle

La pantalla inicial ordena los casos que requieren revisión y ofrece búsqueda/filtros. El gráfico de cuatro etapas aparece solo al abrir un caso. Es más rápido para actuar sobre una excepción concreta, pero deja menos visible el contraste global que pide HU1920 y aprovecha menos la dirección gráfica de las referencias.

## Decisiones de composición recomendadas

- **Forma:** consulta y trazabilidad, no captura. Mantener shell, drawer, identidad, estados y controles existentes de SIAL móvil. No crear navegación inferior nueva por semejanza con las referencias.
- **Jerarquía:** una pregunta por superficie: «¿cómo avanza este material?» en la gráfica; «¿qué casos revisar?» en la lista; «¿por qué difiere este pedido?» en detalle. Sin cards anidadas ni KPI duplicados.
- **Interacción:** tocar una alerta filtra la lista; tocar una etapa explica origen y brecha sin ocultar su valor. La transición puede guiar la entrada al detalle, breve y respetando movimiento reducido.
- **Color:** fondo neutro, superficie clara, azul SIAL `#005CA8` para progreso/acción y color semántico para anomalías. Amarillo institucional solo como acento de identidad. No usar rojo o ámbar para cantidades normales.
- **Precisión:** cantidades agregadas solo con material y unidad homogéneos. Alertas globales expresadas como número de casos. Cero, ausencia de dato y fuente atrasada son estados diferentes; «en vivo» solo con confirmación real de fuentes.
- **Componentes:** reutilizar navegación y filtros del core móvil; clasificar gráfica de etapas y lista de alertas como composición local de HU1920. Verificar la API nativa antes de cualquier promoción a librería.
- **Estados a prototipar:** con datos, sin casos, sin resultados de búsqueda, cantidad faltante, sobreprogramación, error de fuente, offline y carga. En error/offline conservar último dato solo si se identifica su fecha y procedencia.

## Trazabilidad y decisiones abiertas

`HU1920 → Materiales y Suministros → consultar cumplimiento → casos / panorama → detalle → cantidades, viajes y documentos`. El prototipo Web y `materiales/` móvil son evidencia de definiciones, shell y flujos vecinos; no se copian sus layouts.

La ruta candidata se añadió al menú y al inicio de Materiales. El acceso productivo de Auditor/Supervisor y el contrato de frescura de Materiales, Transporte y POD siguen pendientes de definición funcional. La propuesta muestra fechas de ejemplo y no declara actualización en vivo.

## Implementación móvil actual

- URL local: `http://127.0.0.1:4176/materiales/control-entregas.html?v=34`. El parámetro `?selectCase=1` abre el selector de líneas para revisar ese estado.
- Referencia específica señalada por John: `puerto-ze/inspeccion-interna.html?selectContainer=1`. Se trasladan **selector contextual, ficha de entidad elegida, filas compactas de datos y encabezados con icono funcional**. La secuencia de inspección y su CTA de captura no pertenecen a HU1920.
- El primer nivel es el material en seguimiento, con código, unidad, número de líneas y fincas. «Cambiar material» abre un selector de materiales. El detalle ofrece «Cambiar línea» solo cuando existe otra línea del material y abre un sheet de búsqueda acotado a ese material.
- El selector de línea usa chips publicados para `Todas`, `Revisar` y `Conciliadas`; el filtro afecta las líneas del material y conserva la búsqueda. Los encabezados usan `sial-mobile-section-heading`.
- Escala verificada: campo de búsqueda 16 px; datos 13 px; etapas 14 px; insignia 12 px; controles interactivos de 44 px o más. Se comprobó a 340 y 390 px sin desbordamiento.
- La ficha de operación conserva finca, Aviso de Corte y versión, código de material/unidad y orden. El avance presenta cuatro cantidades del mismo material con barras en escala común y brechas entre etapas. Un dato ausente aparece como `Sin dato`; no se representa como cero.
- La evolución retira el conteo global de casos, que no explicaba cantidades. La gráfica principal suma líneas del **mismo material y unidad**: cuatro barras con escala común, cifras, fuente por etapa y diferencias entre etapas. El toque conserva foco y estado en la URL; una etapa sin evidencia se marca `—` y se explica como `Sin dato`.
- Una segunda gráfica compara **despachado y con POD frente al aprobado por finca** para ese material. Las cifras aparecen junto a cada barra; cambiar el material actualiza ambas gráficas. El detalle separado conserva los cuatro valores y brechas de la línea elegida.
- Dos tarjetas métricas muestran `despachado / consolidado aprobado` y `entregado con POD / despachado` del material, con cantidades y denominadores visibles. Cuando falta evidencia o el denominador no es positivo muestran `Sin dato`, sin dibujar avance cero. Ver `hu1920-mobile-semantic-audit.md`.
- No se usa tendencia diaria ni cambio respecto a una semana anterior: la fixture no contiene series temporales. Tampoco se copia la navegación inferior ni la paleta verde neón de las referencias; la composición mantiene el shell y el azul SIAL.
- «Cambiar material» adopta el mismo botón secundario compartido de la ficha ZE: flecha completa, tipografía 14 px/600, altura 48 px, icono 20 px, separación 10 px. Se retiró el override local `font: inherit` que deshacía el contrato del botón.
- Viajes/vehículos y documentos permanecen bajo demanda en sheets. Los identificadores son ilustrativos y no enlazan a registros ajenos. El corte muestra fechas de ejemplo, sin insinuar actualización en vivo.
- Se reutilizan shell, drawer, cards hermanas, botones y sheet del core móvil. Los gráficos de etapas y la ficha son composición local de HU1920; no se modificó la librería móvil ni se añadieron reglas de negocio.
- Estados consultables: `?scenario=empty`, `?scenario=loading`, `?scenario=error`, `?scenario=offline` y pedido con POD ausente (`?case=PED-2026-11021-Z`). La comprobación en dispositivo real sigue pendiente.

## Auditoría de las iteraciones descartadas

La primera versión colocó un dashboard agregado antes de los casos; la primera alerta quedaba fuera de 390 × 844. La segunda puso `Casos | Panorama` y una lista de texto como entrada. Aunque mejoró la densidad, mantuvo un orden heredado de Web. La composición actual sigue el recorrido de consulta móvil de la referencia ZE: seleccionar entidad, confirmar contexto, leer cantidades, abrir soportes.
