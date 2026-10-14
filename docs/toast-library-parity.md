# Toast móvil · adopción en propuesta

Fuente del contrato: `@banasandev/banasan-ui-mobile`, exports `Toast`, `ToastProvider` y `useToast`. Esta propuesta HTML usa `SialMobileUI.showToast` como adaptador de demostración; no es código React Native ni certifica el comportamiento nativo.

| Contrato de librería | Adaptador de propuesta | Estado |
| --- | --- | --- |
| `tone`: info, success, warning, error; `danger` legado | `tone` o `type`; `danger` se normaliza a error | Adaptado |
| Título, mensaje, icono semántico y superficie temática | Misma anatomía y tokens semánticos | Adaptado |
| `icon` ReactNode | `icon` DOM Node clonado | Adaptado al medio HTML |
| `action` ReactNode | `action: { label, onClick, dismiss? }` | Adaptado al medio HTML |
| Duración por defecto 2800 ms; `0` usa el valor por defecto | Igual | Adaptado |
| `placement`: top/bottom; `offset` para safe area | Opciones por invocación; bottom por defecto | Adaptado |
| Varias notificaciones y `hideToast` | Apilado visible de hasta dos, según `DESIGN.md`; `hideToast()` retira todas | Diferencia intencional: el provider nativo aún no limita a dos |
| `onDismiss` | Callback tras retirada | Adaptado |
| Animación con reducción de movimiento | Entrada/salida y reducción de movimiento CSS | Adaptado para navegador |

El catálogo `libreria/index.html#feedback` permite probar los cuatro tonos, posición superior, acción, apilado y ocultación. Los errores corregibles conservan feedback inline además del toast. La restricción de dos mensajes visibles pertenece al contrato UX de la propuesta y debe reconciliarse con el provider nativo antes de afirmar paridad conductual completa.

Decisión de delegación: **SELF**. Slice transversal de contrato visual y adaptador de la propuesta; el código nativo se consultó como fuente y no se modificó. No hay una construcción independiente que reduzca el coste de integración de este ajuste.
