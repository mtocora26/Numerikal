import React from 'react';
import { ArrowRight, Layers, Eye, BookCheck, Sparkles } from 'lucide-react';
import universityLogo from '../../assets/UNICESAR 2024.png';
import './Home.css';

interface HomeProps {
  onSelectMethodAndOpenCalc: (methodId: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectMethodAndOpenCalc }) => {
  return (
    <div className="home-container">
      <section className="institutional-header" aria-label="Información institucional del proyecto">
        <div className="institutional-logo-frame">
          <img
            src={universityLogo}
            alt="Universidad Popular del Cesar, Seccional Aguachica"
            className="institutional-logo"
          />
        </div>
        <div className="institutional-details">
          <span className="institutional-kicker">Proyecto académico</span>
          <h1>Análisis numérico</h1>
          <p>Plataforma interactiva para el estudio de métodos numéricos.</p>
          <div className="institutional-credits">
            <span><strong>Docente:</strong> José Javier Coronel</span>
            <span><strong>Estudiante:</strong> Manuel David Castro Tocora</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={13} />
          <span>Universidad Popular del Cesar · Seccional Aguachica</span>
        </div>

        <h1 className="hero-title">
          Métodos numéricos
          <br />
          <span className="hero-gradient-text">de forma clara y visual.</span>
        </h1>

        <p className="hero-subtitle">
          Numerikal es un entorno didáctico para ingresar funciones, resolver ecuaciones no lineales,
          observar cada iteración matemática y analizar gráficamente la convergencia de distintos métodos.
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
              Procedimientos claros para estudiar el comportamiento de cada método y sus criterios de convergencia.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">
              <Eye size={20} className="pillar-icon" />
            </div>
            <h3 className="pillar-title">2. Visualización Gráfica</h3>
            <p className="pillar-desc">
              Representación gráfica de funciones, intervalos, secantes y aproximaciones de la raíz.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">
              <BookCheck size={20} className="pillar-icon" />
            </div>
            <h3 className="pillar-title">3. Enfoque Educativo</h3>
            <p className="pillar-desc">
              Fórmulas, iteraciones y conceptos fundamentales explicados paso a paso para apoyar el aprendizaje.
            </p>
          </div>
        </div>
      </section>

      <section className="home-next-step" aria-label="Siguiente paso">
        <span className="home-next-step-label">¿Listo para comenzar?</span>
        <p>Dirígete a Métodos para configurar una función y estudiar su solución paso a paso.</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onSelectMethodAndOpenCalc('bisection')}
        >
          Ir a Métodos
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
};
