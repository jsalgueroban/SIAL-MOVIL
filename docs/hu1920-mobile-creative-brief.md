# HU1920 · dirección móvil revisada

- **Modo:** operación y consulta; Auditor/Supervisor identifica el siguiente pedido que requiere revisión y entiende su brecha.
- **Plataforma:** propuesta móvil SIAL, con intención traducible a React Native; no es un Web dashboard reducido.
- **Amplitud:** reemplazar composición y recorrido de la pantalla HU1920; conservar definiciones funcionales, datos ilustrativos, shell SIAL y acceso existente.
- **Primera tarea:** identificar o cambiar el pedido activo y leer su avance sin atravesar una gráfica agregada.
- **Identidad:** Poppins, azul SIAL, superficies y estados semánticos. La firma visual debe ser el rastro logístico y la lectura de brechas, no un KPI financiero.
- **Restricciones:** cuatro magnitudes separadas; cantidades por material/unidad; Aviso de Corte solo contexto; cero distinto de dato ausente; no fingir conexión en vivo ni enlace a otro registro.
- **Dirección implementada para revisión:** selector contextual de pedido con chips de estado, ficha de entidad elegida, información en filas compactas, avance de cuatro etapas y acceso a viajes/documentos en sheets. Se usa la escala táctil y tipográfica del core móvil. Referencia compositiva: `puerto-ze/inspeccion-interna.html?selectContainer=1`; no se copia su flujo de captura.
- **Evolución de analítica:** resumen global por conteo de casos con distribución visual y tres señales de revisión. La gráfica principal adopta columnas compactas tocables para las cuatro cantidades de un solo material y pedido; el detalle inferior muestra fuente y brecha de la etapa elegida. Dos tarjetas pequeñas muestran razones de despacho/programación y POD/despacho. Los conteos de casos y las cantidades de insumos se mantienen en ámbitos visuales distintos.
- **Decisión abierta:** revisión visual de esta nueva composición. La implementación anterior queda como evidencia de descarte, no como patrón calibrado.

## Comparación de direcciones

| Dirección | Concepto | Jerarquía | Interacción | Decisión |
| --- | --- | --- | --- | --- |
| A, vigente y cuestionada | Dashboard agregado | Gráfica antes de casos | Desplegable y scroll largo | Reemplazar: oculta la tarea principal bajo el primer viewport. |
| B, explorada y reemplazada | Bandeja de excepciones | Casos primero; panorama a un toque | Buscar, filtrar en sheet, abrir caso, consultar viajes/documentos | Seguía ordenando bloques como una Web reducida. |
| C, actual | Consulta por pedido | Selector → ficha → datos compactos → avance → soportes | Cambiar pedido, consultar viajes y documentos | Revisar visualmente con John. |
