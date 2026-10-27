# HU1920 móvil · lectura funcional de la gráfica

Fuente: [HU1920](https://dev.azure.com/banasanti/Proyecto%20SIAL/_workitems/edit/1920), revisión 6, consultada el 27 de octubre de 2026. Vista: `materiales/control-entregas.html`. `ROUTER: SELF`: gráfico, fixture y selector comparten estado local y una sola decisión semántica.

## Unidad de análisis

Cada registro ilustrativo representa **una línea de material de un pedido**, identificada por pedido y número de línea. La gráfica principal suma únicamente las líneas del **material y unidad seleccionados** y compara consolidado aprobado por Materiales → programado en vehículos por Transporte → despacho confirmado → cantidad recibida con POD. El cuarto paso de despacho explicita la diferencia entre programar y salir, acordada para esta propuesta. Un Aviso de Corte es contexto y no se suma a las unidades de insumos.

Las barras usan la misma escala numérica para las cuatro etapas. No son partes de un total ni deben sumar 100 %. Un dato ausente en cualquier línea deja el total de esa etapa como «Sin dato», no como cero ni como suma incompleta. Bajo la gráfica se muestran todas las diferencias agregadas entre etapas; tocar una barra presenta valor, fuente y diferencia respecto a la etapa anterior. Una segunda gráfica compara despacho y entrega con POD contra el aprobado **por finca** para el mismo material. El detalle conserva las cuatro cantidades y brechas de la línea elegida. Una línea solo aparece «Conciliada» cuando las cuatro cantidades coinciden y hay identificador de POD para una entrega positiva.

## Lectura de los ejemplos

| Pedido y línea | Aprobado | Programado | Despachado | Con POD | Lectura |
| --- | ---: | ---: | ---: | ---: | --- |
| PED-2026-11021 · 01 · UN | 1.480 | 1.480 | 1.280 | 1.180 | 200 UN programados sin salida y 100 UN despachados sin POD validado. |
| PED-2026-11022 · 01 · UN | 520 | 520 | 520 | 520 | Cuatro etapas coinciden. |
| PED-2026-11021 · 02 · M | 400 | 450 | 380 | Sin dato | 50 M sobre lo aprobado; 70 M programados sin salida; falta cantidad con POD. |
| PRC-2026-006 · 01 · PAR | 24 | 24 | Sin dato | Sin dato | Falta cantidad de salida confirmada; no se presume entrega cero. |
| PED-2026-11023 · 01 · PAQ | 35 | 35 | 35 | 22 | 13 PAQ despachados sin POD validado. |

El ejemplo contiene **5 líneas de 4 pedidos**, distribuidas en cuatro materiales. El material inicial, caja de cartón corrugado (UN), reúne dos líneas: **2.000 aprobadas, 2.000 programadas, 1.800 despachadas y 1.700 con POD**. La diferencia agregada es 200 UN sin salida y 100 UN despachadas sin POD. Por finca, Santa Isabel tiene 1.480 / 1.280 / 1.180 UN en aprobado / despacho / POD, mientras El Retiro tiene 520 / 520 / 520 UN. Estas gráficas localizan la diferencia sin mezclar UN, M, PAR y PAQ. El selector de material cambia el alcance de ambas; el selector de línea cambia solo el detalle.

El indicador «Despachado» es `despachado / consolidado aprobado`; «Con POD» es `entregado con POD / despacho confirmado` solo cuando existe denominador positivo, cantidad no superior al despacho e identificador de POD en las líneas agregadas. Los porcentajes son auxiliares; las cantidades y brechas son la lectura principal. El conteo global de líneas se retiró de la superficie analítica porque mezclaba materiales sin ayudar a ubicar las diferencias de cantidad.

## Límite de la propuesta

Los registros, documentos y estados son ejemplos fijos. La propuesta no consulta Materiales, Transporte ni Finca en vivo, no verifica autenticidad de POD ni identifica el evento productivo que confirma la salida. La HU pide detección en tiempo real; esta capacidad requiere contrato de fuentes, frescura, versiones, permisos y actualización en producto. La vista no debe presentarse como cumplimiento funcional productivo de la HU.
