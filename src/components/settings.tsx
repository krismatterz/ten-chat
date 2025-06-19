"use client";

import {
	Bell,
	Bot,
	Database,
	Monitor,
	Moon,
	Palette,
	RotateCcw,
	Save,
	Settings as SettingsIcon,
	Shield,
	Sun,
	User,
	Zap,
} from "lucide-react";
import { useState } from "react";
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
}

const DEFAULT_SETTINGS: UserSettings = {
	defaultProvider: "anthropic",
	defaultModel: "claude-3-5-sonnet-20241022",
	theme: "system",
	notifications: true,
	dataRetention: 30,
	autoArchive: false,
};

export function Settings() {
	const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
	const [activeSection, setActiveSection] = useState("general");
	const [hasChanges, setHasChanges] = useState(false);

	const updateSetting = (key: keyof UserSettings, value: unknown) => {
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
		<div className="flex h-full dub-gradient">
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
								type="button"
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
							</div>
						)}

						{activeSection === "ai" && (
							<div className="space-y-6">
								<div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
									<h3 className="text-lg font-medium text-foreground mb-4">
										Default AI Provider & Model
									</h3>
									<div className="space-y-6">
										{/* AI Provider Selector */}
										<div>
											<span className="block text-sm font-medium text-foreground mb-3">
												AI Provider & Model
											</span>
											<div className="bg-background/50 border rounded-lg p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-3">
														<div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
															<Bot className="h-5 w-5 text-primary" />
														</div>
														<div>
															<p className="font-medium text-foreground">
																{currentProvider?.name || "No Provider"}
															</p>
															<p className="text-sm text-muted-foreground">
																{settings.defaultModel || "No Model Selected"}
															</p>
														</div>
													</div>
													<button
														type="button"
														onClick={() => {
															/* TODO: Open model selector modal */
														}}
														className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
													>
														Change Model
													</button>
												</div>

												{/* Provider Info */}
												{currentProvider && (
													<div className="pt-3 border-t border-border/50">
														<p className="text-sm text-muted-foreground">
															{currentProvider.description}
														</p>
													</div>
												)}
											</div>
										</div>

										{/* Quick Model Selection */}
										<div>
											<span className="block text-sm font-medium text-foreground mb-3">
												Quick Select Popular Models
											</span>
											<div className="grid grid-cols-2 gap-3">
												{[
													{
														provider: "anthropic",
														model: "claude-3.5-sonnet",
														name: "Claude 3.5 Sonnet",
														description: "Best overall",
													},
													{
														provider: "anthropic",
														model: "claude-4-sonnet-20250522",
														name: "Claude 4 Sonnet",
														description: "Latest & most capable",
														badge: "NEW",
													},
													{
														provider: "openai",
														model: "gpt-4o",
														name: "GPT-4o",
														description: "Fast & versatile",
													},
													{
														provider: "openai",
														model: "o3-mini-2025-01-31",
														name: "o3 Mini",
														description: "Advanced reasoning",
														badge: "REASONING",
													},
												].map((quickModel) => (
													<button
														key={`${quickModel.provider}-${quickModel.model}`}
														type="button"
														onClick={() => {
															updateSetting(
																"defaultProvider",
																quickModel.provider as ProviderType
															);
															updateSetting("defaultModel", quickModel.model);
														}}
														className={cn(
															"p-4 border rounded-lg text-left transition-all hover:shadow-md",
															settings.defaultProvider ===
																quickModel.provider &&
																settings.defaultModel === quickModel.model
																? "border-primary bg-primary/10 shadow-sm"
																: "border-input hover:bg-accent"
														)}
													>
														<div className="flex items-start justify-between mb-2">
															<h4 className="font-medium text-sm">
																{quickModel.name}
															</h4>
															{quickModel.badge && (
																<span
																	className={cn(
																		"px-1.5 py-0.5 text-xs font-medium rounded",
																		quickModel.badge === "NEW" &&
																			"bg-green-500/20 text-green-600 dark:text-green-400",
																		quickModel.badge === "REASONING" &&
																			"bg-purple-500/20 text-purple-600 dark:text-purple-400"
																	)}
																>
																	{quickModel.badge}
																</span>
															)}
														</div>
														<p className="text-xs text-muted-foreground">
															{quickModel.description}
														</p>
													</button>
												))}
											</div>
										</div>

										{/* Advanced Settings */}
										<div>
											<span className="block text-sm font-medium text-foreground mb-3">
												Advanced Settings
											</span>
											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<div>
														<p className="text-sm font-medium text-foreground">
															Always use fastest streaming
														</p>
														<p className="text-sm text-muted-foreground">
															Optimized for best performance and lowest latency
														</p>
													</div>
													<div className="flex items-center gap-2">
														<Zap className="h-4 w-4 text-green-500" />
														<span className="text-sm font-medium text-green-600 dark:text-green-400">
															Enabled
														</span>
													</div>
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
													type="button"
													key={theme.value}
													onClick={() =>
														updateSetting("theme", theme.value as unknown)
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
											<label
												htmlFor="dataRetention"
												className="block text-sm font-medium text-foreground mb-2"
											>
												Data Retention (days)
											</label>
											<select
												value={settings.dataRetention}
												onChange={(e) =>
													updateSetting(
														"dataRetention",
														Number.parseInt(e.target.value)
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
												type="button"
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
												type="button"
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
