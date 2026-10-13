import React, { useState } from 'react';
import { BookOpen, Grid3x3, Sigma, Spline, Waves } from 'lucide-react';
import { RootsTopic } from './topics/RootsTopic';
import { SystemsTopic } from './topics/SystemsTopic';
import { InterpolationTopic } from './topics/InterpolationTopic';
import { SeriesTopic } from './topics/SeriesTopic';
import { RegressionTopic } from './topics/RegressionTopic';
import './Learn.css';

type Topic = 'roots' | 'systems' | 'interpolation' | 'series' | 'regression';

export const Learn: React.FC = () => {
  const [topic, setTopic] = useState<Topic>('roots');

  return (
    <div className="learn-container">
      <header className="learn-header">
        <div className="learn-badge">
          <BookOpen size={14} />
          <span>Guía de estudio</span>
        </div>
        <h1 className="learn-title">Ecuaciones No Lineales, Sistemas, Interpolación, Series y Regresión</h1>
        <p className="learn-subtitle">
          Aprende qué hace cada método, qué fórmula utiliza y qué debes revisar antes de ejecutar una solución.
        </p>
      </header>

      <div className="learn-topic-switcher" role="tablist" aria-label="Tema">
        <button
          type="button"
          role="tab"
          aria-selected={topic === 'roots'}
          className={`learn-tab ${topic === 'roots' ? 'active' : ''}`}
          onClick={() => setTopic('roots')}
        >
          <span className="learn-tab-symbol">f(x)=0</span>
          <span>Ecuaciones no lineales</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={topic === 'systems'}
          className={`learn-tab ${topic === 'systems' ? 'active' : ''}`}
          onClick={() => setTopic('systems')}
        >
          <span className="learn-tab-symbol"><Grid3x3 size={16} /></span>
          <span>Sistemas lineales</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={topic === 'interpolation'}
          className={`learn-tab ${topic === 'interpolation' ? 'active' : ''}`}
          onClick={() => setTopic('interpolation')}
        >
          <span className="learn-tab-symbol"><Spline size={16} /></span>
          <span>Interpolación</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={topic === 'series'}
          className={`learn-tab ${topic === 'series' ? 'active' : ''}`}
          onClick={() => setTopic('series')}
        >
          <span className="learn-tab-symbol"><Waves size={16} /></span>
          <span>Series</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={topic === 'regression'}
          className={`learn-tab ${topic === 'regression' ? 'active' : ''}`}
          onClick={() => setTopic('regression')}
        >
          <span className="learn-tab-symbol"><Sigma size={16} /></span>
          <span>Regresión</span>
        </button>
      </div>

      {topic === 'roots' && <RootsTopic />}
      {topic === 'systems' && <SystemsTopic />}
      {topic === 'interpolation' && <InterpolationTopic />}
      {topic === 'series' && <SeriesTopic />}
      {topic === 'regression' && <RegressionTopic />}
    </div>
  );
};
