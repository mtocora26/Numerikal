import React, { useState, useMemo } from 'react';
import { derivative, parse } from 'mathjs';
import { MathView } from '../../components/MathView/MathView';
import { ExpressionParser } from '../../services/ExpressionParser';
import { DerivativeStepExplainer } from '../../services/DerivativeStepExplainer';
import {
  GraduationCap,
  BookOpen,
  Calculator as CalcIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trophy,
  Zap,
  Check,
} from 'lucide-react';
import './Learn.css';

interface QuizQuestion {
  id: number;
  category: 'Primera Derivada' | 'Segunda Derivada' | 'Punto Fijo / Álgebra' | 'Evaluación Numérica';
  questionLatex: string;
  questionText: string;
  options: { text: string; latex?: string; isCorrect: boolean }[];
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'Primera Derivada',
    questionLatex: 'f(x) = x^3 - 4x - 1',
    questionText: '¿Cuál es la primera derivada f\'(x) utilizada en el método de Newton-Raphson?',
    options: [
      { text: '3x^2 - 4', latex: "f'(x) = 3x^2 - 4", isCorrect: true },
      { text: '3x^2 - 4x', latex: "f'(x) = 3x^2 - 4x", isCorrect: false },
      { text: 'x^2 - 4', latex: "f'(x) = x^2 - 4", isCorrect: false },
      { text: '3x - 4', latex: "f'(x) = 3x - 4", isCorrect: false },
    ],
    explanation: 'Aplicando la regla de la potencia d/dx(x^n) = n·x^(n-1): d/dx(x^3) = 3x^2, d/dx(-4x) = -4 y d/dx(-1) = 0. Resultado: f\'(x) = 3x^2 - 4.',
  },
  {
    id: 2,
    category: 'Segunda Derivada',
    questionLatex: "f'(x) = 3x^2 - 4",
    questionText: '¿Cuál es la segunda derivada f\'\'(x) necesaria para Newton-Raphson Modificado?',
    options: [
      { text: '6x', latex: "f''(x) = 6x", isCorrect: true },
      { text: '6x - 4', latex: "f''(x) = 6x - 4", isCorrect: false },
      { text: '3x', latex: "f''(x) = 3x", isCorrect: false },
      { text: '6', latex: "f''(x) = 6", isCorrect: false },
    ],
    explanation: 'Derivamos la primera derivada f\'(x) = 3x^2 - 4: d/dx(3x^2) = 3·(2x) = 6x, y d/dx(-4) = 0. Por tanto, f\'\'(x) = 6x.',
  },
  {
    id: 3,
    category: 'Primera Derivada',
    questionLatex: 'f(x) = \\cos(x) - x',
    questionText: '¿Cuál es la primera derivada f\'(x) de la función f(x) = cos(x) - x?',
    options: [
      { text: '-sin(x) - 1', latex: "f'(x) = -\\sin(x) - 1", isCorrect: true },
      { text: 'sin(x) - 1', latex: "f'(x) = \\sin(x) - 1", isCorrect: false },
      { text: '-\\sin(x) + 1', latex: "f'(x) = -\\sin(x) + 1", isCorrect: false },
      { text: '-\\cos(x) - 1', latex: "f'(x) = -\\cos(x) - 1", isCorrect: false },
    ],
    explanation: 'La derivada de cos(x) es -sin(x) y la derivada de -x es -1. Uniendo ambos términos: f\'(x) = -sin(x) - 1.',
  },
  {
    id: 4,
    category: 'Punto Fijo / Álgebra',
    questionLatex: 'f(x) = x^3 - x - 1 = 0',
    questionText: '¿Cuál de las siguientes despejes forma una g(x) válida para Punto Fijo x = g(x)?',
    options: [
      { text: 'g(x) = (x + 1)^(1/3)', latex: 'g(x) = \\sqrt[3]{x + 1}', isCorrect: true },
      { text: 'g(x) = x^3 - 1', latex: 'g(x) = x^3 - 1', isCorrect: false },
      { text: 'g(x) = (x - 1)^3', latex: 'g(x) = (x - 1)^3', isCorrect: false },
      { text: 'g(x) = x^2 + 1', latex: 'g(x) = x^2 + 1', isCorrect: false },
    ],
    explanation: 'Despejando x^3: x^3 = x + 1. Sacando raíz cúbica en ambos lados se obtiene x = (x + 1)^(1/3).',
  },
  {
    id: 5,
    category: 'Evaluación Numérica',
    questionLatex: "f'(x) = 3x^2 - 4 \\quad \\text{en } x_0 = 2",
    questionText: '¿Cuánto vale la primera derivada f\'(2)?',
    options: [
      { text: '8', latex: "f'(2) = 8", isCorrect: true },
      { text: '12', latex: "f'(2) = 12", isCorrect: false },
      { text: '2', latex: "f'(2) = 2", isCorrect: false },
      { text: '16', latex: "f'(2) = 16", isCorrect: false },
    ],
    explanation: 'Sustituyendo x_0 = 2 en f\'(x) = 3x^2 - 4: f\'(2) = 3·(2)^2 - 4 = 3·(4) - 4 = 12 - 4 = 8.',
  },
  {
    id: 6,
    category: 'Primera Derivada',
    questionLatex: 'f(x) = e^{-x} - x',
    questionText: '¿Cuál es la primera derivada f\'(x) de f(x) = e^(-x) - x?',
    options: [
      { text: '-e^(-x) - 1', latex: "f'(x) = -e^{-x} - 1", isCorrect: true },
      { text: 'e^(-x) - 1', latex: "f'(x) = e^{-x} - 1", isCorrect: false },
      { text: '-e^(-x) + 1', latex: "f'(x) = -e^{-x} + 1", isCorrect: false },
      { text: '-e^x - 1', latex: "f'(x) = -e^x - 1", isCorrect: false },
    ],
    explanation: 'Por la regla de la cadena: d/dx(e^(-x)) = -e^(-x). Además d/dx(-x) = -1. Así, f\'(x) = -e^(-x) - 1.',
  },
];

export const Learn: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'assistant' | 'quiz'>('lessons');

  // Assistant State
  const [assistExpr, setAssistExpr] = useState('x^3 - 4*x - 1');
  const [assistPoint, setAssistPoint] = useState(2);
  const [showDerivSteps, setShowDerivSteps] = useState(true);

  // Compute Derivatives automatically using mathjs & DerivativeStepExplainer
  const assistantResult = useMemo(() => {
    try {
      const clean = ExpressionParser.sanitize(assistExpr);
      const parsedNode = parse(clean);
      const fCompiled = parsedNode.compile();
      const fVal = fCompiled.evaluate({ x: assistPoint, e: Math.E, pi: Math.PI });

      // First derivative
      const d1Node = derivative(parsedNode, 'x');
      const d1Str = d1Node.toString();
      const d1Compiled = d1Node.compile();
      const d1Val = d1Compiled.evaluate({ x: assistPoint, e: Math.E, pi: Math.PI });

      // Second derivative
      const d2Node = derivative(d1Node, 'x');
      const d2Str = d2Node.toString();
      const d2Compiled = d2Node.compile();
      const d2Val = d2Compiled.evaluate({ x: assistPoint, e: Math.E, pi: Math.PI });

      // TeX formatting
      let fTex = '';
      let d1Tex = '';
      let d2Tex = '';
      try { fTex = parsedNode.toTex(); } catch { fTex = clean; }
      try { d1Tex = d1Node.toTex(); } catch { d1Tex = d1Str; }
      try { d2Tex = d2Node.toTex(); } catch { d2Tex = d2Str; }

      // Step-by-step explainer
      const stepsResult = DerivativeStepExplainer.explain(assistExpr);

      return {
        isValid: true,
        fTex,
        d1Tex,
        d2Tex,
        d1Str,
        d2Str,
        fVal: Number(fVal),
        d1Val: Number(d1Val),
        d2Val: Number(d2Val),
        stepsResult,
      };
    } catch {
      return { isValid: false };
    }
  }, [assistExpr, assistPoint]);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedQuestionOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentQuestionIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedQuestionOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);

    const isCorrect = currentQ.options[selectedOption].isCorrect;
    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedQuestionOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedQuestionOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setStreak(0);
    setQuizCompleted(false);
  };

  return (
    <div className="learn-container">
      {/* Header */}
      <div className="learn-header">
        <div className="learn-badge">
          <GraduationCap size={14} />
          <span>Centro de Aprendizaje</span>
        </div>
        <h1 className="learn-title">Derivadas y Álgebra para Métodos Numéricos</h1>
        <p className="learn-subtitle">
          Domina los fundamentos esenciales: aprende reglas de derivación, evalúa $f'(x)$ y $f''(x)$ en tiempo real y ponte a prueba con ejercicios prácticos.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="learn-tabs-nav">
        <button
          type="button"
          className={`learn-tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          <BookOpen size={16} />
          <span>Lecciones y Reglas</span>
        </button>

        <button
          type="button"
          className={`learn-tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setActiveTab('assistant')}
        >
          <CalcIcon size={16} />
          <span>Asistente de Derivadas</span>
        </button>

        <button
          type="button"
          className={`learn-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          <Trophy size={16} />
          <span>Entrenador de Práctica</span>
        </button>
      </div>

      {/* Tab 1: Lessons & Rules */}
      {activeTab === 'lessons' && (
        <div className="learn-tab-content">
          <div className="lessons-intro glass-panel">
            <h3 className="section-block-title">
              <Sparkles size={18} /> ¿Por qué necesitamos derivadas en Métodos Numéricos?
            </h3>
            <div className="lessons-roles-grid">
              <div className="role-card">
                <div className="role-tag tag-newton">Newton-Raphson</div>
                <p>Usa la <strong>primera derivada $f'(x_i)$</strong> para calcular la pendiente de la recta tangente y proyectar la siguiente aproximación.</p>
                <div className="role-formula"><MathView math="x_{i+1} = x_i - \frac{f(x_i)}{f'(x_i)}" /></div>
              </div>

              <div className="role-card">
                <div className="role-tag tag-modified">Newton Modificado</div>
                <p>Usa $f'(x_i)$ y la <strong>segunda derivada $f''(x_i)$</strong> para mantener la convergencia rápida cuando existen raíces múltiples.</p>
                <div className="role-formula"><MathView math="x_{i+1} = x_i - \frac{f(x)f'(x)}{[f'(x)]^2 - f(x)f''(x)}" /></div>
              </div>

              <div className="role-card">
                <div className="role-tag tag-fixed">Punto Fijo</div>
                <p>Despeja $x = g(x)$ y verifica si $|g'(x)|$ es menor a 1 para asegurar que las iteraciones van a converger hacia la raíz.</p>
                <div className="role-formula"><MathView math="x_{i+1} = g(x_i) \quad \text{con } |g'(x)| < 1" /></div>
              </div>
            </div>
          </div>

          <h3 className="section-block-title">Reglas Básicas de Derivación Paso a Paso</h3>
          <div className="rules-cards-grid">
            <div className="rule-card glass-panel">
              <div className="rule-header">
                <span className="rule-badge">1. Regla de Potencias</span>
              </div>
              <div className="rule-math-box">
                <MathView math="\frac{d}{dx}[x^n] = n \cdot x^{n-1}" block />
              </div>
              <p className="rule-desc">
                Bajas el exponente multiplicando al frente y le restas 1 al exponente.
              </p>
              <div className="rule-example">
                <strong>Ejemplo:</strong> Si $f(x) = x^3$, entonces $f'(x) = 3x^{3-1} = 3x^2$.
              </div>
            </div>

            <div className="rule-card glass-panel">
              <div className="rule-header">
                <span className="rule-badge">2. Constantes y Sumas</span>
              </div>
              <div className="rule-math-box">
                <MathView math="\frac{d}{dx}[c] = 0 \quad \text{y} \quad \frac{d}{dx}[c \cdot x] = c" block />
              </div>
              <p className="rule-desc">
                La derivada de un número solo siempre es 0. La derivada de $c \cdot x$ es simplemente el coeficiente $c$.
              </p>
              <div className="rule-example">
                <strong>Ejemplo:</strong> Si $f(x) = 4x - 7$, entonces $f'(x) = 4 - 0 = 4$.
              </div>
            </div>

            <div className="rule-card glass-panel">
              <div className="rule-header">
                <span className="rule-badge">3. Exponenciales y Logaritmos</span>
              </div>
              <div className="rule-math-box">
                <MathView math="\frac{d}{dx}[e^x] = e^x \quad \text{y} \quad \frac{d}{dx}[\ln(x)] = \frac{1}{x}" block />
              </div>
              <p className="rule-desc">
                La función de potencia exponencial es su propia derivada. Para exponentes negativos, la regla de la cadena aporta el signo negativo.
              </p>
              <div className="rule-example">
                <strong>Ejemplo:</strong> Si <MathView math="f(x) = e^{-x} - x" />, entonces <MathView math="f'(x) = -e^{-x} - 1" />.
              </div>
            </div>

            <div className="rule-card glass-panel">
              <div className="rule-header">
                <span className="rule-badge">4. Funciones Trigonométricas</span>
              </div>
              <div className="rule-math-box">
                <MathView math="\frac{d}{dx}[\sin(x)] = \cos(x) \quad \text{y} \quad \frac{d}{dx}[\cos(x)] = -\sin(x)" block />
              </div>
              <p className="rule-desc">
                Ten mucho cuidado con el signo negativo al derivar el coseno ($\cos(x) \to -\sin(x)$).
              </p>
              <div className="rule-example">
                <strong>Ejemplo:</strong> Si $f(x) = \cos(x) - x$, entonces $f'(x) = -\sin(x) - 1$.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Derivatives Assistant */}
      {activeTab === 'assistant' && (
        <div className="learn-tab-content">
          <div className="assistant-card glass-panel">
            <h3 className="section-block-title">
              <CalcIcon size={18} /> Evaluador Didáctico de Derivadas $f'(x)$ y $f''(x)$
            </h3>
            <p className="assistant-hint">
              Escribe cualquier función y observa cómo el motor simbólico obtiene la primera y segunda derivada, evaluándolas numéricamente en el punto $x_0$ que elijas.
            </p>

            <div className="assistant-inputs-row">
              <div className="assistant-input-group">
                <label className="assistant-label">Función f(x):</label>
                <input
                  type="text"
                  value={assistExpr}
                  onChange={(e) => setAssistExpr(e.target.value)}
                  placeholder="Ej. x^3 - 4*x - 1"
                  className="assistant-text-input"
                />
              </div>

              <div className="assistant-input-group point-group">
                <label className="assistant-label">Punto de evaluación x0:</label>
                <input
                  type="number"
                  step="any"
                  value={assistPoint}
                  onChange={(e) => setAssistPoint(parseFloat(e.target.value) || 0)}
                  className="assistant-number-input"
                />
              </div>
            </div>

            {assistantResult.isValid ? (
              <>
                <div className="assistant-results-grid">
                {/* Original function */}
                <div className="deriv-box original-box">
                  <div className="deriv-box-header">
                    <span className="deriv-tag">Función Original</span>
                  </div>
                  <div className="deriv-math-view">
                    <MathView math={`f(x) = ${assistantResult.fTex}`} block />
                  </div>
                  <div className="deriv-eval-row">
                    <span>En $x_0 = {assistPoint}$:</span>
                    <strong className="eval-val">f({assistPoint}) = {assistantResult.fVal}</strong>
                  </div>
                </div>

                {/* First derivative */}
                <div className="deriv-box d1-box">
                  <div className="deriv-box-header">
                    <span className="deriv-tag d1-tag">Primera Derivada f'(x)</span>
                    <span className="usage-note">Para Newton-Raphson / Secante</span>
                  </div>
                  <div className="deriv-math-view">
                    <MathView math={`f'(x) = ${assistantResult.d1Tex}`} block />
                  </div>
                  <div className="deriv-eval-row">
                    <span>En $x_0 = {assistPoint}$:</span>
                    <strong className="eval-val d1-val">f'({assistPoint}) = {assistantResult.d1Val}</strong>
                  </div>
                </div>

                {/* Second derivative */}
                <div className="deriv-box d2-box">
                  <div className="deriv-box-header">
                    <span className="deriv-tag d2-tag">Segunda Derivada f''(x)</span>
                    <span className="usage-note">Para Newton Modificado</span>
                  </div>
                  <div className="deriv-math-view">
                    <MathView math={`f''(x) = ${assistantResult.d2Tex}`} block />
                  </div>
                  <div className="deriv-eval-row">
                    <span>En $x_0 = {assistPoint}$:</span>
                    <strong className="eval-val d2-val">f''({assistPoint}) = {assistantResult.d2Val}</strong>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Explanation Section */}
              {assistantResult.stepsResult && (
                <div className="deriv-step-by-step-section">
                  <div className="step-section-header">
                    <h4 className="step-section-title">
                      <Sparkles size={16} /> Explicación Paso a Paso de la Derivación
                    </h4>
                    <button
                      type="button"
                      className="toggle-steps-btn"
                      onClick={() => setShowDerivSteps(!showDerivSteps)}
                    >
                      {showDerivSteps ? 'Ocultar Paso a Paso' : 'Mostrar Paso a Paso'}
                    </button>
                  </div>

                  {showDerivSteps && (
                    <div className="step-groups-grid">
                      {/* First Derivative Steps */}
                      <div className="step-group-column">
                        <h5 className="group-column-title d1-title">
                          Paso a paso para f'(x)
                        </h5>
                        <div className="steps-flow">
                          {assistantResult.stepsResult.d1Steps.map((s) => (
                            <div key={s.stepNumber} className="deriv-step-card">
                              <div className="step-head">
                                <span className="step-num-badge">{s.stepNumber}</span>
                                <span className="step-rule-name">{s.ruleName}</span>
                              </div>
                              <div className="step-math-box">
                                <MathView math={s.latexFormula} />
                              </div>
                              <p className="step-expl-text">{s.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Second Derivative Steps */}
                      <div className="step-group-column">
                        <h5 className="group-column-title d2-title">
                          Paso a paso para f''(x)
                        </h5>
                        <div className="steps-flow">
                          {assistantResult.stepsResult.d2Steps.map((s) => (
                            <div key={s.stepNumber} className="deriv-step-card">
                              <div className="step-head">
                                <span className="step-num-badge d2-badge">{s.stepNumber}</span>
                                <span className="step-rule-name">{s.ruleName}</span>
                              </div>
                              <div className="step-math-box">
                                <MathView math={s.latexFormula} />
                              </div>
                              <p className="step-expl-text">{s.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
              <div className="assistant-error-card">
                <XCircle size={18} />
                <span>Expresión matemática incompleta. Introduce un formato válido como <code>x^3 - 4*x - 1</code>.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Quiz Trainer */}
      {activeTab === 'quiz' && (
        <div className="learn-tab-content">
          <div className="quiz-card glass-panel">
            {/* Top Stats */}
            <div className="quiz-stats-bar">
              <div className="quiz-stat-item">
                <Trophy size={16} className="stat-icon-gold" />
                <span>Puntuación: <strong>{score} / {QUIZ_QUESTIONS.length}</strong></span>
              </div>

              <div className="quiz-stat-item">
                <Zap size={16} className="stat-icon-zap" />
                <span>Racha: <strong>{streak} seguidas</strong></span>
              </div>

              <div className="quiz-progress-text">
                Pregunta {currentQuestionIndex + 1} de {QUIZ_QUESTIONS.length}
              </div>
            </div>

            {!quizCompleted ? (
              <div className="quiz-question-block">
                <div className="question-header">
                  <span className="question-cat-badge">{currentQ.category}</span>
                </div>

                <div className="question-latex-card">
                  <MathView math={currentQ.questionLatex} block />
                </div>

                <p className="question-prompt">{currentQ.questionText}</p>

                {/* Options list */}
                <div className="options-list">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    let optionStatusClass = '';

                    if (isAnswerSubmitted) {
                      if (opt.isCorrect) optionStatusClass = 'correct-option';
                      else if (isSelected && !opt.isCorrect) optionStatusClass = 'wrong-option';
                    } else if (isSelected) {
                      optionStatusClass = 'selected-option';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`quiz-option-btn ${optionStatusClass}`}
                        onClick={() => handleSelectOption(idx)}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                        <div className="option-content">
                          {opt.latex ? <MathView math={opt.latex} /> : <span>{opt.text}</span>}
                        </div>
                        {isAnswerSubmitted && opt.isCorrect && (
                          <Check size={18} className="option-icon-correct" />
                        )}
                        {isAnswerSubmitted && isSelected && !opt.isCorrect && (
                          <XCircle size={18} className="option-icon-wrong" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Submit & Next Controls */}
                <div className="quiz-controls-row">
                  {!isAnswerSubmitted ? (
                    <button
                      type="button"
                      className="btn-primary quiz-action-btn"
                      onClick={handleSubmitAnswer}
                      disabled={selectedOption === null}
                    >
                      <span>Comprobar Respuesta</span>
                      <CheckCircle2 size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary quiz-action-btn"
                      onClick={handleNextQuestion}
                    >
                      <span>
                        {currentQuestionIndex + 1 === QUIZ_QUESTIONS.length
                          ? 'Ver Resultados Finales'
                          : 'Siguiente Pregunta'}
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>

                {/* Explanation Box */}
                {isAnswerSubmitted && (
                  <div
                    className={`quiz-explanation-box ${
                      currentQ.options[selectedOption!].isCorrect ? 'exp-success' : 'exp-error'
                    }`}
                  >
                    <div className="exp-title-row">
                      <HelpCircle size={16} />
                      <strong>
                        {currentQ.options[selectedOption!].isCorrect
                          ? '¡Correcto!'
                          : 'Respuesta incorrecta'}
                      </strong>
                    </div>
                    <p className="exp-text">{currentQ.explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Completion Card */
              <div className="quiz-completed-view">
                <div className="completed-icon-box">
                  <Trophy size={36} className="trophy-big-icon" />
                </div>
                <h3 className="completed-title">¡Entrenamiento Completado!</h3>
                <p className="completed-desc">
                  Obtuviste <strong>{score} de {QUIZ_QUESTIONS.length} aciertos</strong> ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}%).
                </p>

                <div className="completed-actions">
                  <button
                    type="button"
                    className="btn-primary restart-quiz-btn"
                    onClick={handleRestartQuiz}
                  >
                    <RotateCcw size={18} />
                    <span>Intentar de nuevo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
