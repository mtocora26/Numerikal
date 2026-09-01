import { useState } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { Home } from './pages/Home/Home';
import { Calculator } from './pages/Calculator/Calculator';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'calculator'>('calculator');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('bisection');

  const handleOpenMethodInCalculator = (methodId: string) => {
    setSelectedMethodId(methodId);
    setCurrentView('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-layout">
      <Navbar
        activeView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <main className="main-content">
        {currentView === 'home' && (
          <Home onSelectMethodAndOpenCalc={handleOpenMethodInCalculator} />
        )}

        {currentView === 'calculator' && (
          <Calculator initialMethodId={selectedMethodId} />
        )}
      </main>
    </div>
  );
}

export default App;
