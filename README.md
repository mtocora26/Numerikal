# Numerikal

Plataforma web interactiva para estudiar **métodos numéricos**. Es el proyecto de aula de Análisis Numérico de la Universidad Popular del Cesar (Seccional Aguachica).

Numerikal no solo entrega la respuesta: muestra cada iteración, cada sistema de ecuaciones y cada gráfica, para que el estudiante pueda seguir el procedimiento tal como se hace en clase y comprobar sus propios cálculos.

**Aplicación publicada:** <https://numerikal.vercel.app>

## Funcionalidades

### Ecuaciones no lineales, f(x) = 0

Seis métodos, con la misma interfaz de trabajo:

| Método | Tipo |
|---|---|
| Bisección | Cerrado |
| Regla Falsa | Cerrado |
| Newton-Raphson | Abierto |
| Secante | Abierto |
| Punto Fijo | Abierto |
| Newton-Raphson Modificado | Abierto (raíces múltiples) |

Para cada uno obtienes:
- Tabla de iteraciones con el error (absoluto, relativo o porcentual) y la tolerancia que elijas.
- Gráfica de la función con la raíz y la construcción del método.
- Explicación pedagógica con la fórmula, la condición de convergencia y, en Newton-Raphson, la derivación paso a paso de f′ y f″.
- Comprobación de convergencia (por ejemplo, |g′(x)| < 1 en Punto Fijo) y avisos cuando el intervalo no cumple el teorema de Bolzano.

### Sistemas de ecuaciones lineales, Ax = b

**Método de Jacobi** para sistemas de 2×2 hasta 6×6, con editor de la matriz A, el vector b y el vector inicial x⁽⁰⁾:

1. Comprobación de diagonal dominante fila por fila (condición suficiente de convergencia) y aviso si algún aᵢᵢ es cero.
2. Fórmulas de iteración ya despejadas para cada incógnita y la primera iteración con los valores sustituidos.
3. Tabla de iteraciones con x₁ … xₙ y el error (absoluto, relativo o porcentual).
4. Solución aproximada, residuo ‖Ax − b‖∞, número de iteraciones y motivo de finalización.

### Interpolación de Lagrange

Halla el polinomio de grado n que pasa exactamente por n+1 puntos (x, y) y lo evalúa en un valor x*, siguiendo el procedimiento de clase:

1. Polinomios base Lᵢ(x) con los valores sustituidos.
2. Armado de P(x) = Σ yᵢ·Lᵢ(x).
3. Polinomio expandido (coeficientes a₀ … aₙ) y P(x*).

Incluye gráfica con los puntos, la curva y el punto interpolado. Rechaza valores de x repetidos y avisa de extrapolación y del fenómeno de Runge. Los datos se pueden escribir o pegar desde Excel o CSV.

### Diferencias divididas de Newton

Construye el mismo polinomio interpolante con la tabla triangular de diferencias divididas:

1. Tabla completa f[xᵢ, …, xᵢ₊ₖ], con cada diferencia calculada con los valores sustituidos y la primera fila resaltada.
2. Polinomio de Newton con los símbolos de la tabla, con los valores sustituidos y expandido.
3. P(x*), con la misma gráfica y las mismas validaciones que Lagrange. Con los mismos datos, ambos métodos dan el mismo polinomio.

### Polinomio de Taylor y Maclaurin

Aproxima f(x) cerca de un punto a con el polinomio de grado n (1 a 10) que iguala a f y a sus primeras n derivadas en a:

1. Derivadas simbólicas f′, f″, …, f⁽ⁿ⁾ y su valor en a, en una tabla.
2. Coeficientes f⁽ᵏ⁾(a)/k!, polinomio sustituido y, si a ≠ 0, expandido en potencias de x. Con a = 0 se indica que es de Maclaurin.
3. P(x*), f(x*) y el error |f(x*) − P(x*)|, con la gráfica de f y P juntas.

Avisa si f o alguna derivada no está definida en a.

### Regresión polinomial por mínimos cuadrados

Ajusta un polinomio de grado 1 a 6 a una tabla de datos (x, y), siguiendo el procedimiento de clase:

1. Tabla de sumatorias (Σx, Σx², …, Σxy, Σx²y, …).
2. Sistema de ecuaciones normales de (m+1)×(m+1).
3. Resolución con Gauss-Jordan, mostrando cada matriz aumentada.
4. Modelo resultante, con R², coeficiente de correlación, Sr y error estándar.

Incluye gráfica de dispersión con la curva ajustada y los residuos, tabla de residuos, y los datos se pueden escribir o pegar desde Excel o CSV.

### En toda la plataforma

- Teclado matemático y vista previa en LaTeX de la función que escribes.
- Historial de la sesión para volver a un cálculo anterior.
- Sección **Teoría** con la definición, la fórmula y una gráfica de cada método.

## Tecnologías

[React](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [mathjs](https://mathjs.org) (análisis y derivación de expresiones) · [KaTeX](https://katex.org) (fórmulas) · [Vitest](https://vitest.dev) (pruebas) · [Oxlint](https://oxc.rs) (lint)

## Ejecutar el proyecto localmente

Necesitas [Node.js](https://nodejs.org) 20.19 o superior (o 22.12+) y npm.

```bash
git clone https://github.com/mtocora26/Numerikal.git
cd Numerikal
npm install
npm run dev
```

La aplicación queda disponible en la dirección que muestre la terminal (por defecto <http://localhost:5173>).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Revisa los tipos y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la versión de producción |
| `npm run lint` | Ejecuta Oxlint |
| `npm test` | Ejecuta las pruebas |

## Pruebas

La lógica matemática (`src/services` y `src/domain`) se comprueba con [Vitest](https://vitest.dev). Las pruebas viven junto al código que verifican, en archivos `*.test.ts`.

```bash
npm test
```

Cubren las operaciones básicas del analizador de expresiones (incluidos decimales, negativos, expresiones inválidas y división entre cero), el cálculo del error, la validación del motor, que cada método de raíces converja con los valores por defecto de la calculadora, la regresión polinomial y el método de Jacobi (convergencia, validaciones y que la solución verifique Ax ≈ b).

## Organización del código

Cada carpeta de `src` tiene una responsabilidad definida. La guía para decidir dónde colocar código nuevo está en [docs/organizacion-del-codigo.md](docs/organizacion-del-codigo.md).

## Próximas mejoras

- Página de ayuda con ejemplos de entradas válidas y errores comunes.
- Revisión de la experiencia de uso en pantallas pequeñas y mensajes de error.
- Otros modelos de regresión (exponencial, potencial, logarítmica).

Las tareas pendientes se registran como [issues](https://github.com/mtocora26/Numerikal/issues) del repositorio.

## Créditos

- **Docente:** José Javier Coronel
- **Estudiante:** Manuel David Castro Tocora
- Universidad Popular del Cesar, Seccional Aguachica
