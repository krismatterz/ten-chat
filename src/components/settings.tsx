"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Bot,
  Palette,
  Shield,
  Bell,
  Database,
  Zap,
  Moon,
  Sun,
  Monitor,
  Save,
  RotateCcw,
} from "lucide-react";
import { AI_PROVIDERS, type ProviderType } from "~/lib/providers";
import { cn } from "~/lib/utils";

interface UserSettings {
  defaultProvider: ProviderType;
  defaultModel: string;
  theme: "light" | "dark" | "system";
  notifications: boolean;
  dataRetention: number; // days
  autoArchive: boolean;
  streamingSpeed: "fast" | "normal" | "slow";
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultProvider: "anthropic",
  defaultModel: "claude-3-5-sonnet-20241022",
  theme: "system",
  notifications: true,
  dataRetention: 30,
  autoArchive: false,
  streamingSpeed: "normal",
};

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // TODO: Save to Convex user preferences
    console.log("Saving settings:", settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
  };

  const currentProvider = AI_PROVIDERS.find(
    (p) => p.id === settings.defaultProvider
  );

  const sections = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "ai", label: "AI & Models", icon: Bot },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "privacy", label: "Privacy & Data", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="flex h-full bg-neutral-50 dark:bg-neutral-900">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Settings
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your preferences
          </p>
        </div>

        <nav className="p-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  activeSection === section.id
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-700"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {sections.find((s) => s.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Configure your Ten Chat experience
              </p>
            </div>

            {hasChanges && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-8">
            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    Profile
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                        <User className="h-8 w-8 text-neutral-500" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          Demo User
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          demo@tenchat.app
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          Free Plan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Streaming Speed
                      </label>
                      <select
                        value={settings.streamingSpeed}
                        onChange={(e) =>
                          updateSetting("streamingSpeed", e.target.value as any)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="fast">Fast (Low latency)</option>
                        <option value="normal">Normal (Balanced)</option>
                        <option value="slow">Slow (High quality)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "ai" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    Default AI Provider
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Provider
                      </label>
                      <select
                        value={settings.defaultProvider}
                        onChange={(e) => {
                          const provider = e.target.value as ProviderType;
                          updateSetting("defaultProvider", provider);
                          const newProvider = AI_PROVIDERS.find(
                            (p) => p.id === provider
                          );
                          if (newProvider?.models[0]) {
                            updateSetting(
                              "defaultModel",
                              newProvider.models[0]
                            );
                          }
                        }}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      >
                        {AI_PROVIDERS.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Default Model
                      </label>
                      <select
                        value={settings.defaultModel}
                        onChange={(e) =>
                          updateSetting("defaultModel", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      >
                        {currentProvider?.models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Provider Information
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {currentProvider?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    Theme
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "system", label: "System", icon: Monitor },
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() =>
                            updateSetting("theme", theme.value as any)
                          }
                          className={cn(
                            "p-4 border rounded-lg text-center transition-colors",
                            settings.theme === theme.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                          )}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">{theme.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    Data Management
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Data Retention (days)
                      </label>
                      <select
                        value={settings.dataRetention}
                        onChange={(e) =>
                          updateSetting(
                            "dataRetention",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                        <option value={90}>90 days</option>
                        <option value={365}>1 year</option>
                        <option value={-1}>Forever</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Auto-archive old conversations
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Automatically archive conversations after 30 days
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSetting("autoArchive", !settings.autoArchive)
                        }
                        className={cn(
                          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          settings.autoArchive
                            ? "bg-blue-600"
                            : "bg-neutral-200 dark:bg-neutral-600"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            settings.autoArchive
                              ? "translate-x-5"
                              : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Enable notifications
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Get notified about new messages and updates
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSetting(
                            "notifications",
                            !settings.notifications
                          )
                        }
                        className={cn(
                          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          settings.notifications
                            ? "bg-blue-600"
                            : "bg-neutral-200 dark:bg-neutral-600"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            settings.notifications
                              ? "translate-x-5"
                              : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
