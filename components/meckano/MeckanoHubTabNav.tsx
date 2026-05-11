"use client";

import { MECKANO_HUB_TABS, type MeckanoHubTabId } from "./meckano-hub-constants";

type Props = {
  activeTab: MeckanoHubTabId;
  onTabChange: (id: MeckanoHubTabId) => void;
};

export default function MeckanoHubTabNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="flex gap-0 overflow-x-auto border-b border-gray-200 px-2">
      {MECKANO_HUB_TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === id
              ? "border-teal-600 text-teal-400"
              : "border-transparent text-gray-400 hover:border-white/35 hover:text-gray-700"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </nav>
  );
}
