"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  Crown,
  Trash2,
  User,
  Palette,
  BarChart3,
  Settings as SettingsIcon,
  Save,
  Loader2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const AVAILABLE_TRAITS = [
  "concise",
  "creative",
  "curious",
  "friendly",
  "empathetic",
  "patient",
  "witty",
  "formal",
  "casual",
  "technical",
  "analytical",
  "supportive",
  "humorous",
  "direct",
  "encouraging",
  "detailed",
  "practical",
  "innovative",
  "thoughtful",
  "collaborative",
];

type SettingsTab = "account" | "customization" | "stats";

export function Settings() {
  const { user } = useUser();
  const { setTheme, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [isSaving, setIsSaving] = useState(false);

  // Form state for customization
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Data queries
  const userPrefs = useQuery(api.users.getPreferences);
  const userStats = useQuery(api.conversations.getUserStats);
  const updatePreferences = useMutation(api.users.updatePreferences);

  // Update form when preferences load
  useEffect(() => {
    if (userPrefs) {
      setDisplayName(userPrefs.displayName || "");
      setJobTitle(userPrefs.jobTitle || "");
      setSelectedTraits(userPrefs.traits || ["helpful", "concise"]);
      setAdditionalInfo(userPrefs.additionalInfo || "");
    }
  }, [userPrefs]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePreferences({
        displayName,
        jobTitle,
        traits: selectedTraits,
        additionalInfo,
      });

      // Show success notification
      const notification = document.createElement("div");
      notification.textContent = "✅ Preferences saved!";
      notification.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  const sections = [
    { id: "account", label: "Account", icon: Crown },
    { id: "customization", label: "Customization", icon: Palette },
    { id: "stats", label: "Stats for Nerds", icon: BarChart3 },
  ];

  const renderTabButton = (
    tab: SettingsTab,
    icon: React.ReactNode,
    label: string,
    key?: string
  ) => (
    <button
      key={key}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
        activeTab === tab
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Settings Sidebar */}
      <div className="w-64 bg-card/50 backdrop-blur-sm border-r border-border/30">
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Customize Ten Chat
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return renderTabButton(
              section.id as SettingsTab,
              <Icon className="h-4 w-4" />,
              section.label,
              section.id
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {activeTab === "account" && (
            <div className="space-y-8">
              {/* Profile Section */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Profile</h3>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {user?.fullName || user?.firstName || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress || "No email"}
                    </p>
                    <p className="text-xs text-muted-foreground">Free Plan</p>
                  </div>
                </div>
              </div>

              {/* Pro Plan Benefits */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Pro Plan Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Crown className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">Access to All Models</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get access to our full suite of models including Claude,
                      o3-mini-high, and more!
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Generous Limits</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive 1500 standard credits per month, plus 100 premium
                      credits* per month.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Priority Support</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get faster responses and dedicated assistance from the T3
                      team whenever you need help!
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Manage Subscription
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  * Premium credits are used for GPT Image Gen, o3, Claude
                  Sonnet, Gemini 2.5 Pro, and Grok 3. Additional Premium credits
                  can be purchased separately for $8 per 100.
                </p>
              </div>

              {/* Danger Zone */}
              <div className="bg-card/50 backdrop-blur-sm border border-destructive/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-destructive">
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data.
                </p>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          )}

          {activeTab === "customization" && (
            <div className="space-y-8">
              <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Customize Ten Chat
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Help Ten Chat understand you better to provide more
                  personalized responses.
                </p>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="displayName"
                      className="text-sm font-medium block mb-2"
                    >
                      What should Ten Chat call you?
                    </label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="max-w-md"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {displayName.length}/50
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="jobTitle"
                      className="text-sm font-medium block mb-2"
                    >
                      What do you do?
                    </label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Frontend Developer, UI Designer, Student..."
                      className="max-w-md"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {jobTitle.length}/100
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="traits"
                      className="text-sm font-medium block mb-2"
                    >
                      What traits should Ten Chat have? (up to 50, max 100 chars
                      each)
                    </label>
                    <div id="traits" className="flex flex-wrap gap-2 mb-3">
                      {AVAILABLE_TRAITS.map((trait) => (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => toggleTrait(trait)}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                            selectedTraits.includes(trait)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {trait}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedTraits.join(", ")} (
                      {selectedTraits.length}/50)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="additionalInfo"
                      className="text-sm font-medium block mb-2"
                    >
                      Anything else Ten Chat should know about you?
                    </label>
                    <textarea
                      id="additionalInfo"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Tell Ten Chat about how you work, your interests, your writing style, or anything else that would help personalize your experience..."
                      className="w-full min-h-[120px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      maxLength={3000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {additionalInfo.length}/3000
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <Button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="px-6"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Visual Options */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-6">
                <h4 className="text-md font-medium mb-3">Visual Options</h4>
                <div>
                  <label
                    htmlFor="theme"
                    className="text-sm font-medium block mb-2"
                  >
                    Theme
                  </label>
                  <div id="theme" className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex items-center gap-2"
                    >
                      🌞 Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex items-center gap-2"
                    >
                      🌙 Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                    >
                      💻 System
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-8">
              <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Stats for Nerds</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Detailed statistics about your Ten Chat usage and performance.
                </p>

                {userStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                      <div className="text-2xl font-bold text-blue-600">
                        {userStats.totalTokens.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Tokens Used
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        ≈ {Math.round(userStats.totalTokens / 1000)}K tokens
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                      <div className="text-2xl font-bold text-green-600">
                        {userStats.avgResponseTime}s
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Response Time
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Per AI response
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                      <div className="text-2xl font-bold text-purple-600">
                        {userStats.tokensPerSecond}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tokens per Second
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Processing speed
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                      <div className="text-2xl font-bold text-orange-600">
                        {userStats.totalMessages.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Messages
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Both sent & received
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20">
                      <div className="text-2xl font-bold text-pink-600">
                        {userStats.totalConversations}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Conversations
                      </div>
                      <div className="text-xs text-pink-600 mt-1">
                        Active & archived
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-500/20">
                      <div className="text-2xl font-bold text-teal-600">
                        {userStats.assistantMessages}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        AI Responses
                      </div>
                      <div className="text-xs text-teal-600 mt-1">
                        From all models
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading statistics...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
