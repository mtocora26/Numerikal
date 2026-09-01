import React from 'react';
import { Sigma, Compass, Calculator, GraduationCap } from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  activeView: 'home' | 'calculator' | 'learn';
  onNavigate: (view: 'home' | 'calculator' | 'learn') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate }) => {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-brand" onClick={() => onNavigate('home')}>
          <div className="brand-logo-badge">
            <Sigma size={20} className="brand-sigma-icon" />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">Numerikal</span>
            <span className="brand-tagline">Entorno Educativo</span>
          </div>
        </div>

        <nav className="navbar-links">
          <button
            type="button"
            className={`nav-item-btn ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            <Compass size={16} />
            <span>Inicio</span>
          </button>

          <button
            type="button"
            className={`nav-item-btn ${activeView === 'calculator' ? 'active' : ''}`}
            onClick={() => onNavigate('calculator')}
          >
            <Calculator size={16} />
            <span>Calculadora</span>
          </button>

          <button
            type="button"
            className={`nav-item-btn ${activeView === 'learn' ? 'active' : ''}`}
            onClick={() => onNavigate('learn')}
          >
            <GraduationCap size={16} />
            <span>Aprende</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
