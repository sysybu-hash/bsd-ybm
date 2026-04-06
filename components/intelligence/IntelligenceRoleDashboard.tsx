"use client";

import type { IntelligenceModuleId } from "@/lib/intelligence-access";
import { INTELLIGENCE_MODULE_ORDER } from "@/lib/intelligence-access";
import IntelligenceHub from "@/components/intelligence/IntelligenceHub";
import ForecastChart from "@/components/intelligence/ForecastChart";
import ForecastSimulator from "@/components/intelligence/ForecastSimulator";
import SimulationMode from "@/components/intelligence/SimulationMode";
import VoiceInsights from "@/components/intelligence/VoiceInsights";
import ProjectProfitability from "@/components/intelligence/ProjectProfitability";
import ProjectGuardian from "@/components/intelligence/ProjectGuardian";
import InteractivePulse from "@/components/intelligence/InteractivePulse";
import ValuationWidget from "@/components/intelligence/ValuationWidget";
import SentimentBadge from "@/components/intelligence/SentimentBadge";

type Props = {
  modules: IntelligenceModuleId[];
};

export default function IntelligenceRoleDashboard({ modules }: Props) {
  const set = new Set(modules);
  const ordered = INTELLIGENCE_MODULE_ORDER.filter((id) => set.has(id));

  return (
    <div className="space-y-8">
      {ordered.map((id) => {
        switch (id) {
          case "hub":
            return (
              <section key={id} className="rounded-2xl border border-gray-200 bg-gray-50">
                <IntelligenceHub />
              </section>
            );
          case "forecast_chart":
            return <ForecastChart key={id} />;
          case "forecast_simulator":
            return <ForecastSimulator key={id} />;
          case "simulation_mode":
            return <SimulationMode key={id} />;
          case "voice":
            return <VoiceInsights key={id} />;
          case "profitability":
            return (
              <div key={id} className="overflow-hidden rounded-2xl border border-gray-200">
                <ProjectProfitability />
              </div>
            );
          case "project_guardian":
            return <ProjectGuardian key={id} />;
          case "interactive_pulse":
            return <InteractivePulse key={id} />;
          case "valuation":
            return <ValuationWidget key={id} />;
          case "sentiment_demo":
            return (
              <section
                key={id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-sm font-black text-gray-500 mb-4">
                  דמו סנטימנט לקוח
                </h3>
                <div className="flex flex-wrap gap-3">
                  <SentimentBadge score="happy" />
                  <SentimentBadge score="neutral" />
                  <SentimentBadge score="angry" />
                </div>
              </section>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
