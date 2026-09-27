import React from 'react';
import { HelpCircle } from 'lucide-react';
import { GuideId } from '../../types/finance';

interface GuideButtonProps {
  guideId: GuideId;
  onOpenGuide: (id: GuideId) => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const GuideButton: React.FC<GuideButtonProps> = ({
  guideId,
  onOpenGuide,
  label,
  className = '',
  size = 'sm',
}) => {
  if (label) {
    return (
      <button
        type="button"
        onClick={() => onOpenGuide(guideId)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100/80 rounded-lg border border-teal-200/60 transition-colors shadow-sm ${className}`}
        title="Learn how this feature works"
      >
        <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
        <span>{label}</span>
      </button>
    );
  }

  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm';

  return (
    <button
      type="button"
      onClick={() => onOpenGuide(guideId)}
      className={`inline-flex items-center justify-center ${sizeClasses} rounded-full text-slate-400 hover:text-teal-600 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400/50 ${className}`}
      title="How it works"
      aria-label="Feature guide"
    >
      <HelpCircle className="w-4 h-4" />
    </button>
  );
};
