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
import { Button } from "./ui/button";

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
    <div className="flex h-full gradient-dub-light dark:gradient-dub-dark">
      {/* Settings Sidebar */}
      <div className="w-64 bg-card/50 backdrop-blur-sm border-r">
        <div className="p-6 border-b">
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
        <div className="bg-card/50 backdrop-blur-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {sections.find((s) => s.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure your Ten Chat experience
              </p>
            </div>

            {hasChanges && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-8">
            {activeSection === "general" && (
              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Profile
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Demo User</p>
                        <p className="text-sm text-muted-foreground">
                          demo@tenchat.app
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Free Plan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Streaming Speed
                      </label>
                      <select
                        value={settings.streamingSpeed}
                        onChange={(e) =>
                          updateSetting("streamingSpeed", e.target.value as any)
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
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
                <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Default AI Provider
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
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
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                      >
                        {AI_PROVIDERS.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Default Model
                      </label>
                      <select
                        value={settings.defaultModel}
                        onChange={(e) =>
                          updateSetting("defaultModel", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                      >
                        {currentProvider?.models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Bot className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Provider Information
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
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
                <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">
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
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-input hover:bg-accent hover:text-accent-foreground"
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
                <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Data Management
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
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
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
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
                        <p className="text-sm font-medium text-foreground">
                          Auto-archive old conversations
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Automatically archive conversations after 30 days
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSetting("autoArchive", !settings.autoArchive)
                        }
                        className={cn(
                          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          settings.autoArchive ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
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
                <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Enable notifications
                        </p>
                        <p className="text-sm text-muted-foreground">
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
                          settings.notifications ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
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
