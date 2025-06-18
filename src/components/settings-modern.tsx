"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
	Bell,
	Bot,
	Check,
	Loader2,
	Monitor,
	Moon,
	Palette,
	RotateCcw,
	Save,
	Settings as SettingsIcon,
	Shield,
	Sun,
	User,
} from "lucide-react";
import { Suspense, startTransition, useState, useTransition } from "react";
import { AI_PROVIDERS, type ProviderType } from "~/lib/providers";
import { cn } from "~/lib/utils";
import { api } from "../../convex/_generated/api";
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

// Settings Section Component with Suspense
function SettingsSection({
	children,
	title,
	description,
}: {
	children: React.ReactNode;
	title: string;
	description?: string;
}) {
	return (
		<div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
			<h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
			{description && (
				<p className="text-sm text-muted-foreground mb-4">{description}</p>
			)}
			<Suspense fallback={<SettingsSkeleton />}>{children}</Suspense>
		</div>
	);
}

// Loading skeleton for settings sections
function SettingsSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="h-4 bg-muted rounded w-3/4" />
			<div className="h-10 bg-muted rounded" />
			<div className="h-4 bg-muted rounded w-1/2" />
		</div>
	);
}

// Toggle Switch Component
function ToggleSwitch({
	enabled,
	onChange,
	disabled = false,
}: {
	enabled: boolean;
	onChange: (enabled: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={() => !disabled && onChange(!enabled)}
			disabled={disabled}
			className={cn(
				"relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
				enabled ? "bg-primary" : "bg-muted",
				disabled && "opacity-50 cursor-not-allowed"
			)}
		>
			<span
				className={cn(
					"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
					enabled ? "translate-x-5" : "translate-x-0"
				)}
			/>
		</button>
	);
}

// Profile Section with data fetching
function ProfileSection() {
	const { user, isLoaded } = useUser();

	if (!isLoaded) {
		return <SettingsSkeleton />;
	}

	return (
		<div className="space-y-4">
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
	);
}

// AI Settings Section
function AISettingsSection({
	settings,
	onUpdate,
	isSaving,
}: {
	settings: UserSettings;
	onUpdate: (key: keyof UserSettings, value: any) => void;
	isSaving: boolean;
}) {
	const currentProvider = AI_PROVIDERS.find(
		(p) => p.id === settings.defaultProvider
	);

	return (
		<div className="space-y-4">
			<div>
				<label
					htmlFor="defaultProvider"
					className="block text-sm font-medium text-foreground mb-2"
				>
					Default Provider
				</label>
				<select
					id="defaultProvider"
					value={settings.defaultProvider}
					onChange={(e) => {
						const provider = e.target.value as ProviderType;
						onUpdate("defaultProvider", provider);
						const newProvider = AI_PROVIDERS.find((p) => p.id === provider);
						if (newProvider?.models[0]) {
							onUpdate("defaultModel", newProvider.models[0]);
						}
					}}
					disabled={isSaving}
					className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground disabled:opacity-50"
				>
					{AI_PROVIDERS.map((provider) => (
						<option key={provider.id} value={provider.id}>
							{provider.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<label
					htmlFor="defaultModel"
					className="block text-sm font-medium text-foreground mb-2"
				>
					Default Model
				</label>
				<select
					id="defaultModel"
					value={settings.defaultModel}
					onChange={(e) => onUpdate("defaultModel", e.target.value)}
					disabled={isSaving}
					className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground disabled:opacity-50"
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
							{currentProvider?.description || "No description available"}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

// Performance Settings Section
function PerformanceSection({
	settings,
	onUpdate,
	isSaving,
}: {
	settings: UserSettings;
	onUpdate: (key: keyof UserSettings, value: any) => void;
	isSaving: boolean;
}) {
	return (
		<div className="space-y-4">
			<div>
				<label
					htmlFor="streamingSpeed"
					className="block text-sm font-medium text-foreground mb-2"
				>
					Streaming Speed
				</label>
				<select
					id="streamingSpeed"
					value={settings.streamingSpeed}
					onChange={(e) => onUpdate("streamingSpeed", e.target.value)}
					disabled={isSaving}
					className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground disabled:opacity-50"
				>
					<option value="fast">Fast (Low latency)</option>
					<option value="normal">Normal (Balanced)</option>
					<option value="slow">Slow (High quality)</option>
				</select>
			</div>
		</div>
	);
}

// Theme Settings Section
function ThemeSection({
	settings,
	onUpdate,
	isSaving,
}: {
	settings: UserSettings;
	onUpdate: (key: keyof UserSettings, value: any) => void;
	isSaving: boolean;
}) {
	const themes = [
		{ value: "light", label: "Light", icon: Sun },
		{ value: "dark", label: "Dark", icon: Moon },
		{ value: "system", label: "System", icon: Monitor },
	];

	return (
		<div className="grid grid-cols-3 gap-3">
			{themes.map((theme) => {
				const Icon = theme.icon;
				return (
					<button
						key={theme.value}
						type="button"
						onClick={() => onUpdate("theme", theme.value)}
						disabled={isSaving}
						className={cn(
							"p-4 border rounded-lg text-center transition-colors disabled:opacity-50",
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
	);
}

// Main Settings Component
export function ModernSettings() {
	const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
	const [activeSection, setActiveSection] = useState("general");
	const [hasChanges, setHasChanges] = useState(false);
	const [isPending, startTransition] = useTransition();

	// TODO: Add Convex mutations for saving settings
	const updateSetting = (key: keyof UserSettings, value: any) => {
		startTransition(() => {
			setSettings((prev) => ({ ...prev, [key]: value }));
			setHasChanges(true);
		});
	};

	const handleSave = async () => {
		startTransition(async () => {
			try {
				// TODO: Save to Convex user preferences
				console.log("Saving settings:", settings);
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
				setHasChanges(false);
			} catch (error) {
				console.error("Failed to save settings:", error);
			}
		});
	};

	const handleReset = () => {
		startTransition(() => {
			setSettings(DEFAULT_SETTINGS);
			setHasChanges(false);
		});
	};

	const sections = [
		{ id: "general", label: "General", icon: SettingsIcon },
		{ id: "ai", label: "AI & Models", icon: Bot },
		{ id: "appearance", label: "Appearance", icon: Palette },
		{ id: "privacy", label: "Privacy & Data", icon: Shield },
		{ id: "notifications", label: "Notifications", icon: Bell },
	];

	return (
		<div className="flex h-full modern-gradient">
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
								type="button"
								onClick={() => setActiveSection(section.id)}
								disabled={isPending}
								className={cn(
									"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors disabled:opacity-50",
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
									disabled={isPending}
									className="flex items-center gap-2"
								>
									<RotateCcw className="h-4 w-4" />
									Reset
								</Button>
								<Button
									onClick={handleSave}
									disabled={isPending}
									className="flex items-center gap-2"
								>
									{isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Save className="h-4 w-4" />
									)}
									{isPending ? "Saving..." : "Save Changes"}
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
								<SettingsSection title="Profile">
									<ProfileSection />
								</SettingsSection>

								<SettingsSection
									title="Performance"
									description="Optimize your chat experience"
								>
									<PerformanceSection
										settings={settings}
										onUpdate={updateSetting}
										isSaving={isPending}
									/>
								</SettingsSection>
							</div>
						)}

						{activeSection === "ai" && (
							<SettingsSection
								title="AI Configuration"
								description="Set your default AI provider and model preferences"
							>
								<AISettingsSection
									settings={settings}
									onUpdate={updateSetting}
									isSaving={isPending}
								/>
							</SettingsSection>
						)}

						{activeSection === "appearance" && (
							<SettingsSection
								title="Theme"
								description="Choose your preferred appearance"
							>
								<ThemeSection
									settings={settings}
									onUpdate={updateSetting}
									isSaving={isPending}
								/>
							</SettingsSection>
						)}

						{activeSection === "privacy" && (
							<div className="space-y-6">
								<SettingsSection
									title="Data Management"
									description="Control how your data is stored and managed"
								>
									<div className="space-y-4">
										<div>
											<label
												htmlFor="dataRetention"
												className="block text-sm font-medium text-foreground mb-2"
											>
												Data Retention (days)
											</label>
											<select
												id="dataRetention"
												value={settings.dataRetention}
												onChange={(e) =>
													updateSetting(
														"dataRetention",
														Number.parseInt(e.target.value)
													)
												}
												disabled={isPending}
												className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground disabled:opacity-50"
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
											<ToggleSwitch
												enabled={settings.autoArchive}
												onChange={(enabled) =>
													updateSetting("autoArchive", enabled)
												}
												disabled={isPending}
											/>
										</div>
									</div>
								</SettingsSection>
							</div>
						)}

						{activeSection === "notifications" && (
							<SettingsSection
								title="Notification Preferences"
								description="Manage how you receive updates"
							>
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-foreground">
											Enable notifications
										</p>
										<p className="text-sm text-muted-foreground">
											Get notified about new messages and updates
										</p>
									</div>
									<ToggleSwitch
										enabled={settings.notifications}
										onChange={(enabled) =>
											updateSetting("notifications", enabled)
										}
										disabled={isPending}
									/>
								</div>
							</SettingsSection>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
