import React from 'react';
import { X, HelpCircle, Lightbulb, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { guidesData } from '../../data/guidesData';
import { GuideId } from '../../types/finance';

interface GuideModalProps {
  guideId: GuideId | null;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ guideId, onClose }) => {
  if (!guideId) return null;

  const guide = guidesData[guideId];
  if (!guide) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 rounded-full border border-teal-100 mb-1">
                {guide.badge}
              </span>
              <h3 className="text-xl font-bold text-slate-800 leading-snug">
                {guide.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle / Core Concept */}
        <div className="relative z-10 mb-6 bg-slate-50/80 rounded-2xl p-4 border border-slate-100/80">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {guide.concept}
          </p>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="relative z-10 mb-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" />
            How to use this feature:
          </h4>
          <div className="space-y-2.5">
            {guide.steps.map((step, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-xs sm:text-sm text-slate-700 leading-normal">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pro-Tip Box */}
        <div className="relative z-10 mb-6 bg-amber-50/80 border border-amber-200/70 rounded-2xl p-4 flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5">
              Pro Tip
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {guide.proTip}
            </p>
          </div>
        </div>

        {/* Footer / Got It button */}
        <div className="relative z-10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95"
          >
            <span>Got it, let's budget</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
