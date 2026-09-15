import React from 'react';
import { Compass, Calculator, GraduationCap } from 'lucide-react';
import universitySymbol from '../../assets/SÍMBOLO UNICESAR 2024.png';
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
            <img
              src={universitySymbol}
              alt="Símbolo de la Universidad Popular del Cesar"
              className="brand-university-symbol"
            />
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
            <span>Métodos</span>
          </button>

          <button
            type="button"
            className={`nav-item-btn ${activeView === 'learn' ? 'active' : ''}`}
            onClick={() => onNavigate('learn')}
          >
            <GraduationCap size={16} />
            <span>Teoría</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
