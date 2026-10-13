import { useState } from 'react';
import { Navbar, type AppView } from './components/Navbar/Navbar';
import { Home } from './pages/Home/Home';
import { Calculator } from './pages/Calculator/Calculator';
import { Learn } from './pages/Learn/Learn';
import { Help } from './pages/Help/Help';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
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

        {currentView === 'learn' && (
          <Learn />
        )}

        {currentView === 'help' && (
          <Help
            onOpenMethod={handleOpenMethodInCalculator}
            onOpenLearn={() => {
              setCurrentView('learn');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
