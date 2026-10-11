# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Numerikal es una app educativa (React 19 + Vite + TypeScript) de métodos numéricos. Toda la interfaz y los textos están en **español**.

## Comandos

- `npm run dev` — servidor de desarrollo (Vite)
- `npm run build` — `tsc -b && vite build` (el chequeo de tipos es parte del build)
- `npm run lint` — oxlint (config en `.oxlintrc.json`; no hay ESLint)
- `npm test` — vitest, una sola corrida (`vitest run`)
- Un solo archivo: `npx vitest run src/domain/systems/Jacobi.test.ts`; un solo caso: `npx vitest run -t "nombre del caso"`

Las pruebas viven junto al código (`*.test.ts`) y solo cubren lógica (`domain/`, `services/`, `graphEngine`), no componentes.

## Arquitectura

La regla central: **la matemática no depende de React y los componentes no calculan nada**. La guía detallada de qué va en cada carpeta, con las reglas para añadir métodos, está en [docs/organizacion-del-codigo.md](docs/organizacion-del-codigo.md); léela antes de crear archivos.

Lo que requiere leer varios archivos para entenderse:

- **Tres familias de problemas, cada una con su propio contrato.** No se fuerzan en una sola interfaz:
  - Raíces f(x)=0: `domain/methods/*` implementan `NumericalMethod` y se ejecutan vía `services/NumericalEngine` / `hooks/useNumericalSolver`.
  - Sistemas lineales Ax=b: `domain/systems/` (utilidades en `linearSystem.ts`; `IterativeLinearMethod` es la base y Jacobi/Gauss-Seidel solo fijan `sequential`).
  - Regresión: `domain/regression/` (datos (x, y), no f(x)).
  Sistemas y regresión **no pasan por `NumericalEngine`**; se instancian directamente (`JacobiMethod`, `PolynomialRegression`).
- **`factories/MethodFactory.ts` es el registro de metadata** (nombre, fórmula LaTeX, dificultad, convergencia) para las tres familias: `getAllMethods()` (raíces), `getSystemMethods()`, `getRegressionMethods()`. La calculadora y la teoría leen de aquí.
- **Navegación sin router:** `App.tsx` guarda la vista (`home | calculator | learn`) en estado. `pages/Calculator/Calculator.tsx` y `pages/Learn/Learn.tsx` repiten el mismo patrón de pestañas por familia (`roots | systems | regression`); `Calculator` delega en `SystemsCalculator.tsx` y `RegressionCalculator.tsx`.
- **Página de teoría:** `Learn.tsx` solo renderiza las pestañas; el contenido está en `pages/Learn/topics/{Roots,Systems,Regression}Topic.tsx`, con piezas comunes en `topics/shared.tsx`. Los ejemplos numéricos de teoría se calculan ejecutando los métodos reales del dominio.
- Un método nuevo de raíces además de registrarse en `MethodFactory` requiere su caso en `domain/methods/methods.test.ts` y su diagrama en `components/MethodTheoryGraph/methodDiagrams.ts`; la teoría de `RootsTopic.tsx` (`methodGuidance`) también necesita su entrada por `id`.

## Convenciones

- Fórmulas con KaTeX vía `components/MathView`; expresiones del usuario con mathjs vía `services/ExpressionParser`.
- Estilos: colores/espaciados/radios desde `styles/variables.css`. Un `Nombre.css` por componente; si dos comparten estilos, el segundo importa el CSS del primero.
- `components/MethodSelector` y `pages/Calculator/DerivativeCalculator.tsx` están huérfanos (no se importan); no los tomes como patrón vigente.
