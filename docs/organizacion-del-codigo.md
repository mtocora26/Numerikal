# Organización del código

Guía corta para decidir **dónde colocar cada cosa** en `src`. La regla general: la matemática no depende de React, y los componentes no calculan nada.

## Qué va en cada carpeta

| Carpeta | Responsabilidad | Puede importar de |
|---|---|---|
| `domain/` | Lógica matemática pura y sus tipos. Sin React ni DOM. | `services/` (solo utilidades de cálculo) |
| `domain/methods/` | Un archivo por método de raíces (implementa `NumericalMethod`). | `domain/`, `services/` |
| `domain/regression/` | Regresión: contrato, tipos y algoritmo propios (usa datos (x, y), no f(x)). | `domain/`, `services/` |
| `domain/systems/` | Sistemas lineales Ax = b: tipos, utilidades comunes (`linearSystem.ts`: validación, dominancia diagonal, residuo, LaTeX) la base `IterativeLinearMethod.ts` (el bucle iterativo, con `sequential` para distinguir Jacobi de Gauss-Seidel) y un archivo mínimo por método (`Jacobi.ts`, `GaussSeidel.ts`). | `domain/`, `services/` |
| `domain/interpolation/` | Interpolación polinomial: tipos, utilidades de polinomios y validación comunes (`polynomial.ts`) y un archivo por método (`Lagrange.ts`, `NewtonDividedDifferences.ts`). Usa datos (x, y) y un valor x*. | `domain/`, `services/` |
| `domain/taylor/` | Polinomio de Taylor: tipos y algoritmo propios (usa f(x) y sus derivadas simbólicas con mathjs, no una tabla de datos). Reutiliza las utilidades de polinomios de `domain/interpolation/polynomial.ts`. | `domain/`, `services/` |
| `factories/` | Registro de métodos y su metadata (nombre, fórmula, etiqueta). | `domain/` |
| `services/` | Utilidades de cálculo sin estado: analizador de expresiones, error, formato de números, motor. | `domain/`, `factories/` |
| `hooks/` | Estado de React que envuelve a `services/` (`useNumericalSolver`, `useExpressionParser`). | `services/`, `domain/` |
| `components/` | Piezas de interfaz reutilizables, una carpeta por componente. | `domain/` (solo tipos), `services/`, otros componentes |
| `pages/` | Una pantalla por carpeta (`Home`, `Calculator`, `Learn`, `Help`). Ensamblan componentes y manejan el estado de la pantalla. | todo lo anterior |
| `styles/` | Variables de diseño (`variables.css`), reseteo y estilos globales. | — |
| `assets/` | Imágenes. | — |

`App.tsx` solo decide qué pantalla se muestra; `main.tsx` monta la aplicación.

## Reglas simples

1. **¿Es matemática?** Va en `domain/` (o `services/` si no pertenece a un método concreto). Debe poder probarse sin abrir el navegador.
2. **¿Se dibuja en pantalla?** Va en `components/`. Recibe los datos por props y no llama a los métodos numéricos.
3. **¿Es una pantalla completa?** Va en `pages/`. Si una pantalla crece, divídela en componentes antes de crear otra página. La ayuda (`pages/Help/Help.tsx`) reutiliza los estilos de `Learn`; si cambias un mensaje de error o un aviso de un método, revisa su tabla de errores comunes.
4. **¿Es un método nuevo de raíces?** Un archivo en `domain/methods/`, registrarlo en `MethodFactory` y añadir su caso en `domain/methods/methods.test.ts` y su diagrama en `MethodTheoryGraph/methodDiagrams.ts`.
5. **¿Es una familia nueva de problemas** (como la regresión, que no usa f(x))? Crea su propia carpeta en `domain/` con sus tipos, en lugar de forzarla en `NumericalMethod`. Añade su metadata en `MethodFactory` (`getSystemMethods()`, `getInterpolationMethods()`, `getSeriesMethods()`, `getRegressionMethods()`…), su calculadora en `pages/Calculator/` (`SystemsCalculator.tsx`, `InterpolationCalculator.tsx`, `TaylorCalculator.tsx`, `RegressionCalculator.tsx`) y su pestaña en el selector de familias de `Calculator.tsx`.
   - **¿Es un método nuevo de interpolación?** Una clase en `domain/interpolation/` cuyo resultado extienda `InterpolationResultBase` (mismo polinomio, distinta construcción), su entrada en `getInterpolationMethods()` y su opción en `InterpolationCalculator.tsx`; `InterpolationResultCard` e `InterpolationGraph` sirven sin cambios.
   - **¿Es un método nuevo para sistemas lineales** ? Una subclase de `IterativeLinearMethod` en `domain/systems/`, su entrada en `getSystemMethods()` y su opción en `SystemsCalculator.tsx`; devuelve `LinearSystemResult`, para que `MatrixInput`, `SystemResultCard`, `LinearSystemSteps` e `IterationTable` sirvan sin cambios.
6. **Componentes:** `components/Nombre/Nombre.tsx` con su `Nombre.css` al lado. Si dos componentes comparten estilos, el segundo importa el CSS del primero (por ejemplo, las tablas de regresión reutilizan `IterationTable.css`) en lugar de duplicarlos.
7. **Estilos:** colores, espaciados y radios salen de las variables de `styles/variables.css`; no se escriben valores sueltos si ya existe una variable.
8. **Pruebas:** un archivo `*.test.ts` junto al código que verifica (ver [README](../README.md#pruebas)). Se ejecutan con `npm test`.
9. **Nombres:** componentes y clases en `PascalCase` (`ResultCard.tsx`), funciones, hooks y utilidades en `camelCase` (`numberFormat.ts`, `useExpressionParser.ts`).
10. **Mover archivos** solo cuando el cambio aclara algo concreto. Mover por gusto genera ruido en el historial.

## Archivos que hoy están en un lugar poco claro

Se dejan anotados aquí; no se movieron ni se eliminaron porque ese cambio merece su propia decisión.

- `components/MethodSelector/`: no lo importa ningún archivo. La selección de método la hace un `<select>` dentro de `pages/Calculator/Calculator.tsx`.
- `pages/Calculator/DerivativeCalculator.tsx`: tampoco se importa en ninguna pantalla (la calculadora de derivadas quedó fuera de la navegación). Sus estilos siguen en `Calculator.css` (clases `derivative-*`).
- `services/NumericalEngine.ts` solo atiende a los métodos de raíces. La regresión, la interpolación y los sistemas lineales se ejecutan directamente con su clase (`PolynomialRegression`, `LagrangeInterpolation`, `NewtonDividedDifferences`, `TaylorPolynomial`, `JacobiMethod`, `GaussSeidelMethod`), sin pasar por el motor.
- `domain/types.ts` contiene los tipos de los métodos de raíces; los de regresión están en `domain/regression/types.ts` y los de sistemas en `domain/systems/types.ts`, los de interpolación en `domain/interpolation/types.ts`, los de Taylor en `domain/taylor/types.ts`, cada familia junto a su carpeta.
