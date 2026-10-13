import React from 'react';
import { Compass } from 'lucide-react';

interface TopicIntroProps {
  title: string;
  children: React.ReactNode;
}

export const TopicIntro: React.FC<TopicIntroProps> = ({ title, children }) => (
  <div className="theory-intro glass-panel">
    <div className="theory-intro-icon"><Compass size={24} /></div>
    <div>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  </div>
);

interface StepsGridProps {
  steps: { label?: string; title: string; text: string }[];
}

export const StepsGrid: React.FC<StepsGridProps> = ({ steps }) => (
  <div className="how-to-grid">
    {steps.map((step, index) => (
      <div className="how-to-card" key={step.title}>
        <span className="how-to-number">{step.label ?? index + 1}</span>
        <div><h3>{step.title}</h3><p>{step.text}</p></div>
      </div>
    ))}
  </div>
);
