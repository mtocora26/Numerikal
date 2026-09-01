import React from 'react';
import { MethodFactory } from '../../factories/MethodFactory';
import { MathView } from '../../components/MathView/MathView';
import { ArrowRight, Layers, Eye, BookCheck, Sparkles, Compass, Divide, Minimize, Zap, TrendingUp } from 'lucide-react';
import './Home.css';

interface HomeProps {
  onSelectMethodAndOpenCalc: (methodId: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectMethodAndOpenCalc }) => {
  const methods = MethodFactory.getAllMethods();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={13} />
          <span>Espacio de Trabajo para Métodos Numéricos</span>
        </div>

        <h1 className="hero-title">
          Calcula, visualiza y comprende.
          <br />
          <span className="hero-gradient-text">Sin complicaciones.</span>
        </h1>

        <p className="hero-subtitle">
          Numerical no es una calculadora genérica: es un entorno didáctico interactivo donde puedes
          ingresar tus funciones, observar cada iteración matemática, analizar gráficamente la convergencia
          y dominar el análisis numérico paso a paso.
        </p>

        <div className="hero-actions-row">
          <button
            type="button"
            className="btn-primary hero-main-btn"
            onClick={() => onSelectMethodAndOpenCalc('bisection')}
          >
            <span>Abrir Espacio de Trabajo</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* 3 Pillars */}
        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-box">
              <Layers size={20} className="pillar-icon" />
            </div>
            <h3 className="pillar-title">1. Motor Numérico Puro</h3>
            <p className="pillar-desc">
              Arquitectura desacoplada en TypeScript con Strategy y Factory Pattern. Cálculos transparentes, rápidos y precisos.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">
              <Eye size={20} className="pillar-icon" />
            </div>
            <h3 className="pillar-title">2. Visualización Gráfica</h3>
            <p className="pillar-desc">
              Gráficas en Canvas de alta resolución para visualizar el comportamiento de la función, intervalos, secantes y tangentes.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">
              <BookCheck size={20} className="pillar-icon" />
            </div>
            <h3 className="pillar-title">3. Enfoque Educativo</h3>
            <p className="pillar-desc">
              Explicaciones didácticas de cada iteración, fórmulas paso a paso y validación de condiciones de convergencia (Bolzano, Fourier).
            </p>
          </div>
        </div>
      </section>

      {/* Available Methods Section */}
      <section className="methods-catalog-section">
        <div className="section-header-block">
          <div className="section-badge">
            <Compass size={14} /> Métodos Numéricos Disponibles
          </div>
          <h2 className="section-title">Encuentra raíces de ecuaciones no lineales</h2>
          <p className="section-desc">
            Selecciona cualquiera de los métodos implementados para abrir inmediatamente el espacio de cálculo interactivo.
          </p>
        </div>

        <div className="catalog-grid">
          {methods.map((method) => {
            const getIcon = (iconName: string) => {
              switch (iconName) {
                case 'divide': return <Divide size={24} />;
                case 'minimize': return <Minimize size={24} />;
                case 'zap': return <Zap size={24} />;
                case 'trending-up': return <TrendingUp size={24} />;
                default: return <Layers size={24} />;
              }
            };

            return (
              <div
                key={method.id}
                className="catalog-method-card"
                onClick={() => onSelectMethodAndOpenCalc(method.id)}
              >
                <div className="card-top-row">
                  <div className="card-icon">{getIcon(method.icon)}</div>
                  <span className="card-tag">{method.tag}</span>
                </div>

                <h3 className="card-title">{method.name}</h3>
                <p className="card-desc">{method.description}</p>

                <div className="card-formula-box">
                  <span className="formula-tag">Fórmula:</span>
                  <MathView math={method.latexFormula} />
                </div>

                <div className="card-footer-row">
                  <span className="convergence-note">{method.recommendedConvergence}</span>
                  <button type="button" className="card-explore-btn">
                    <span>Resolver</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
