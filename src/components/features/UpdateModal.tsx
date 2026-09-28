import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  Server,
  X,
  ShieldCheck,
  ArrowRight,
  PackageCheck,
  Layers,
  Terminal,
} from 'lucide-react';
import { api, UpdateProgressEvent, SystemUpdateStatus } from '../../services/api';
import { useFinance } from '../../context/FinanceContext';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: SystemUpdateStatus | null;
  onCheckAgain: () => void;
}

type ModalState = 'confirm' | 'updating' | 'reconnecting' | 'success' | 'error';

const STEPS = [
  { id: 1, label: 'Safety Database Snapshot', icon: ShieldCheck },
  { id: 2, label: 'Download Update Package', icon: Download },
  { id: 3, label: 'Apply Project Files', icon: Layers },
  { id: 4, label: 'Refresh Dependencies', icon: PackageCheck },
  { id: 5, label: 'Compile Frontend Bundle', icon: Terminal },
  { id: 6, label: 'Restart Server Daemon', icon: Server },
];

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  onCheckAgain,
}) => {
  const { triggerConfetti } = useFinance();

  const [modalState, setModalState] = useState<ModalState>('confirm');
  const [percent, setPercent] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);

  const isUpdatingRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setModalState('confirm');
      setPercent(0);
      setCurrentStep(1);
      setStatusMessage('');
      setErrorMessage('');
      setReconnectAttempt(0);
      isUpdatingRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetVersion = updateInfo?.latestVersion || 'Latest';
  const currentVersion = updateInfo?.currentVersion || '1.0.2';

  const pollServerUntilOnline = async (): Promise<boolean> => {
    setModalState('reconnecting');
    setStatusMessage('Server daemon restarting. Reconnecting automatically...');
    const maxAttempts = 35;

    for (let i = 1; i <= maxAttempts; i++) {
      setReconnectAttempt(i);
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const status = await api.checkStatus();
        if (status && status.status === 'online') {
          return true;
        }
      } catch (_) {}
    }
    return false;
  };

  const handleStartUpdate = async (force: boolean = false) => {
    setModalState('updating');
    setPercent(5);
    setCurrentStep(1);
    setStatusMessage('Initiating BudgetFlow self-update engine...');
    isUpdatingRef.current = true;

    try {
      const res = await api.startUpdate({ force }, (event: UpdateProgressEvent) => {
        if (event.percent !== undefined) {
          setPercent(Math.max(5, Math.min(100, event.percent)));
        }
        if (event.step !== undefined) {
          setCurrentStep(event.step);
        }
        if (event.message) {
          setStatusMessage(event.message);
        }

        if (event.status === 'error') {
          setErrorMessage(event.error || 'Update failed during process.');
          setModalState('error');
          isUpdatingRef.current = false;
        }
      });

      if (!res.success && res.error) {
        // If the stream dropped because server is restarting, that's expected
        if (currentStep >= 5 || percent >= 80) {
          // Proceed to reconnection
        } else {
          setErrorMessage(res.error);
          setModalState('error');
          isUpdatingRef.current = false;
          return;
        }
      }

      // Enter reconnection loop
      const isOnline = await pollServerUntilOnline();
      if (isOnline) {
        setModalState('success');
        setPercent(100);
        setCurrentStep(6);
        setStatusMessage('BudgetFlow updated and restarted successfully!');
        triggerConfetti();

        // Reload page to run new production bundle
        setTimeout(() => {
          window.location.reload();
        }, 2200);
      } else {
        setErrorMessage('Server updated but taking longer than usual to restart. Run `budgetflow status` in your terminal to inspect.');
        setModalState('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during update.');
      setModalState('error');
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const canClose = modalState !== 'updating' && modalState !== 'reconnecting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-inner">
                {modalState === 'updating' || modalState === 'reconnecting' ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : modalState === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                ) : modalState === 'error' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-300" />
                ) : (
                  <Sparkles className="w-5 h-5 text-cyan-200" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">
                  {modalState === 'confirm' && 'BudgetFlow Software Update'}
                  {modalState === 'updating' && 'Updating BudgetFlow...'}
                  {modalState === 'reconnecting' && 'Restarting Server Daemon...'}
                  {modalState === 'success' && 'Update Completed!'}
                  {modalState === 'error' && 'Update Notice'}
                </h3>
                <p className="text-xs text-cyan-100 font-medium">
                  {modalState === 'confirm' && `Target: ${targetVersion}`}
                  {(modalState === 'updating' || modalState === 'reconnecting') && `${percent}% Complete`}
                  {modalState === 'success' && 'Ready to reload'}
                  {modalState === 'error' && 'Inspection required'}
                </p>
              </div>
            </div>

            {canClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* CONFIRMATION SCREEN */}
          {modalState === 'confirm' && (
            <div className="space-y-5">
              {/* Version Comparison Box */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Current Version
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 font-mono">
                    v{currentVersion}
                  </span>
                </div>

                <div className="p-2 rounded-full bg-cyan-100/50 text-cyan-700">
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 block mb-1">
                    Available Version
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-mono shadow-sm">
                    {targetVersion}
                  </span>
                </div>
              </div>

              {/* Release Notes */}
              {updateInfo?.releaseNotes && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Release Notes & Highlights
                  </label>
                  <div className="max-h-36 overflow-y-auto p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}

              {/* Safety Snapshot Guarantee */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Zero-Risk Guarantee:</strong> An automated safety backup of your database will be preserved in{' '}
                  <code className="bg-emerald-100 px-1 py-0.5 rounded text-[11px] font-mono">server/data/backups/</code>{' '}
                  before any files are touched.
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleStartUpdate(false)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-cyan-600/25 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download & Install Update</span>
                </button>
              </div>
            </div>
          )}

          {/* UPDATING OR RECONNECTING SCREEN (PROGRESS BAR) */}
          {(modalState === 'updating' || modalState === 'reconnecting') && (
            <div className="space-y-6">
              {/* Progress Bar & Percentage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="truncate pr-2">{statusMessage || 'Updating system...'}</span>
                  <span className="font-mono text-cyan-600 text-sm font-extrabold">{percent}%</span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full h-3 rounded-full bg-slate-100 p-0.5 border border-slate-200/80 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 transition-all duration-300 ease-out shadow-sm relative overflow-hidden"
                    style={{ width: `${percent}%` }}
                  >
                    {/* Animated Shimmer Stripe */}
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Step-by-Step Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isDone = currentStep > step.id || modalState === 'reconnecting';
                  const isCurrent = currentStep === step.id && modalState !== 'reconnecting';
                  const isPending = currentStep < step.id && modalState !== 'reconnecting';

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                        isCurrent
                          ? 'bg-cyan-50/80 border border-cyan-200/80 text-cyan-950 font-bold'
                          : isDone
                          ? 'bg-slate-50/80 text-slate-700 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isCurrent
                              ? 'text-cyan-600 animate-pulse'
                              : isDone
                              ? 'text-emerald-600'
                              : 'text-slate-300'
                          }`}
                        />
                        <span>{step.label}</span>
                      </div>

                      <div>
                        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {isCurrent && <RefreshCw className="w-3.5 h-3.5 text-cyan-600 animate-spin" />}
                        {isPending && <span className="w-2 h-2 rounded-full bg-slate-200 block mr-1" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {modalState === 'reconnecting' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                  <span>
                    Waiting for server to complete restart (attempt {reconnectAttempt}/35)...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {modalState === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">BudgetFlow Updated Successfully!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  The server is back online with version <strong className="text-slate-700">{targetVersion}</strong>.
                </p>
                <p className="text-[11px] text-cyan-600 font-semibold mt-2 animate-pulse">
                  Reloading application now...
                </p>
              </div>
            </div>
          )}

          {/* ERROR SCREEN */}
          {modalState === 'error' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Update Issue Encountered</span>
                </div>
                <p className="leading-relaxed font-mono text-[11px] bg-white/70 p-2.5 rounded-lg border border-rose-100">
                  {errorMessage || 'Unknown error during update execution.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Your household database was preserved. You can inspect logs with <code className="bg-white px-1 rounded">budgetflow logs -f</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleStartUpdate(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Retry Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
