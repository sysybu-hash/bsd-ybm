"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

export type WizardStepConfig = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  isCompleted?: boolean;
  canAdvance?: boolean;
  content: ReactNode;
};

type WizardContainerProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  steps: WizardStepConfig[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onFinish?: () => void;
  finishLabel?: string;
};

export default function WizardContainer({
  title,
  subtitle,
  icon,
  steps,
  currentStepIndex,
  onStepChange,
  onFinish,
  finishLabel = "סיום",
}: WizardContainerProps) {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!currentStep.canAdvance) return;
    if (isLastStep && onFinish) {
      onFinish();
    } else if (!isLastStep) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      onStepChange(currentStepIndex - 1);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-surface-white shadow-sm ring-1 ring-slate-100/80 overflow-hidden w-full" dir={dir}>
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-6 md:px-8">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-black italic text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-8 flex flex-nowrap items-center gap-0 overflow-x-auto pb-1">
          {steps.map((step, idx) => {
            const isCompleted = step.isCompleted || idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.id} className="flex shrink-0 items-center">
                <div
                  className={`flex flex-col md:flex-row md:items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-slate-50 text-slate-400 border border-slate-200"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                      isCurrent
                        ? "bg-white/20 text-white"
                        : isCompleted
                        ? "bg-emerald-200 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                  </span>
                  <div className="flex flex-col text-start leading-tight">
                    <span>{step.title}</span>
                    {step.subtitle && <span className="text-[10px] opacity-80 font-normal hidden md:block">{step.subtitle}</span>}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`mx-2 h-px w-6 md:w-10 ${isCompleted ? "bg-emerald-300" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[400px] overflow-hidden p-6 md:p-8 bg-surface-white">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full w-full"
          >
            {currentStep.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 md:px-8">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirstStep}
          className={`btn-ghost flex items-center gap-2 ${isFirstStep ? "opacity-0 pointer-events-none" : ""}`}
        >
          {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          הקודם
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!currentStep.canAdvance}
          className="btn-primary flex items-center gap-2"
        >
          {isLastStep ? finishLabel : "המשך לשלב הבא"}
          {!isLastStep && (isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />)}
        </button>
      </div>
    </div>
  );
}
