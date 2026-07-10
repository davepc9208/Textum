// src/context/PricingTabContext.tsx

import { createContext, useContext, useState, ReactNode } from 'react';

type PricingTabContextType = {
  activeTab: number;
  setActiveTab: (index: number) => void;
};

const PricingTabContext = createContext<PricingTabContextType | null>(null);

export function PricingTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <PricingTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </PricingTabContext.Provider>
  );
}

export function usePricingTab() {
  const ctx = useContext(PricingTabContext);
  if (!ctx) throw new Error('usePricingTab must be used inside PricingTabProvider');
  return ctx;
}