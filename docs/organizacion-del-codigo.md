# Organización del código

Guía corta para decidir **dónde colocar cada cosa** en `src`. La regla general: la matemática no depende de React, y los componentes no calculan nada.

## Qué va en cada carpeta

| Carpeta | Responsabilidad | Puede importar de |
|---|---|---|
| `domain/` | Lógica matemática pura y sus tipos. Sin React ni DOM. | `services/` (solo utilidades de cálculo) |
| `domain/methods/` | Un archivo por método de raíces (implementa `NumericalMethod`). | `domain/`, `services/` |
| `domain/regression/` | Regresión: contrato, tipos y algoritmo propios (usa datos (x, y), no f(x)). | `domain/`, `services/` |
| `factories/` | Registro de métodos y su metadata (nombre, fórmula, etiqueta). | `domain/` |
| `services/` | Utilidades de cálculo sin estado: analizador de expresiones, error, formato de números, motor. | `domain/`, `factories/` |
| `hooks/` | Estado de React que envuelve a `services/` (`useNumericalSolver`, `useExpressionParser`). | `services/`, `domain/` |
| `components/` | Piezas de interfaz reutilizables, una carpeta por componente. | `domain/` (solo tipos), `services/`, otros componentes |
| `pages/` | Una pantalla por carpeta (`Home`, `Calculator`, `Learn`). Ensamblan componentes y manejan el estado de la pantalla. | todo lo anterior |
| `styles/` | Variables de diseño (`variables.css`), reseteo y estilos globales. | — |
| `assets/` | Imágenes. | — |

`App.tsx` solo decide qué pantalla se muestra; `main.tsx` monta la aplicación.

## Reglas simples

1. **¿Es matemática?** Va en `domain/` (o `services/` si no pertenece a un método concreto). Debe poder probarse sin abrir el navegador.
2. **¿Se dibuja en pantalla?** Va en `components/`. Recibe los datos por props y no llama a los métodos numéricos.
3. **¿Es una pantalla completa?** Va en `pages/`. Si una pantalla crece, divídela en componentes antes de crear otra página.
4. **¿Es un método nuevo de raíces?** Un archivo en `domain/methods/`, registrarlo en `MethodFactory` y añadir su caso en `domain/methods/methods.test.ts` y su diagrama en `MethodTheoryGraph/methodDiagrams.ts`.
5. **¿Es una familia nueva de problemas** (como la regresión, que no usa f(x))? Crea su propia carpeta en `domain/` con sus tipos, en lugar de forzarla en `NumericalMethod`. Añade su metadata en `MethodFactory` y su calculadora en `pages/Calculator/`.
6. **Componentes:** `components/Nombre/Nombre.tsx` con su `Nombre.css` al lado. Si dos componentes comparten estilos, el segundo importa el CSS del primero (por ejemplo, las tablas de regresión reutilizan `IterationTable.css`) en lugar de duplicarlos.
7. **Estilos:** colores, espaciados y radios salen de las variables de `styles/variables.css`; no se escriben valores sueltos si ya existe una variable.
8. **Pruebas:** un archivo `*.test.ts` junto al código que verifica (ver [README](../README.md#pruebas)). Se ejecutan con `npm test`.
9. **Nombres:** componentes y clases en `PascalCase` (`ResultCard.tsx`), funciones, hooks y utilidades en `camelCase` (`numberFormat.ts`, `useExpressionParser.ts`).
10. **Mover archivos** solo cuando el cambio aclara algo concreto. Mover por gusto genera ruido en el historial.

## Archivos que hoy están en un lugar poco claro

Se dejan anotados aquí; no se movieron ni se eliminaron porque ese cambio merece su propia decisión.

- `components/MethodSelector/`: no lo importa ningún archivo. La selección de método la hace un `<select>` dentro de `pages/Calculator/Calculator.tsx`.
- `pages/Calculator/DerivativeCalculator.tsx`: tampoco se importa en ninguna pantalla (la calculadora de derivadas quedó fuera de la navegación). Sus estilos siguen en `Calculator.css` (clases `derivative-*` y `session-tab`).
- `services/NumericalEngine.ts` solo atiende a los métodos de raíces. La regresión se ejecuta directamente con `PolynomialRegression`, sin pasar por el motor.
- `domain/types.ts` contiene los tipos de los métodos de raíces, mientras que los de regresión están en `domain/regression/types.ts`. Si aparece una tercera familia, conviene que cada una conserve sus tipos junto a su carpeta.
