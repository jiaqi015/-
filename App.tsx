
import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Home } from './presentation/Home';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#121212]">
      <Home />
      <SpeedInsights />
    </div>
  );
};

export default App;
