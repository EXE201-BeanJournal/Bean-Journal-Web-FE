/**
 * Type definitions for BeanJournal Widget components
 */

export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface Plan {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}

export interface Feature {
  title: string;
  description: string;
  icon?: string;
}

export interface PhilosophyPrinciple {
  title: string;
  description: string;
}

export interface ParsedResponse {
  success: boolean;
  content: string;
  error?: string;
}

export interface FeatureDisplayProps {
  featuresText: string;
}

export interface PlansDisplayProps {
  plansText: string;
}

export interface PhilosophyDisplayProps {
  philosophyText: string;
}

export interface ChatWidgetProps {
  onClose?: () => void;
  initialMessage?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// API Response types
export interface FinalAnswerPromptResponse {
  finalAnswerPrompt: string;
}

export interface ChatResponse {
  message: string;
  type: 'text' | 'plans' | 'features' | 'philosophy';
  data?: Plan[] | Feature[] | PhilosophyPrinciple[];
}