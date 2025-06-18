"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
	Archive,
	Calendar,
	Copy,
	Download,
	Edit2,
	GitBranch,
	Home,
	LogOut,
	MessageSquare,
	MoreHorizontal,
	PanelLeftClose,
	Pin,
	Plus,
	Search,
	Settings,
	Trash2,
	User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useChatContext } from "~/components/chat-context";
import { BetaBadge } from "~/components/ui/beta-badge";
import { Button } from "~/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "~/components/ui/context-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "~/components/ui/sidebar";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { cn, formatTimestamp, generateChatTitle } from "~/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Type for conversation data
type Conversation = {
	_id: Id<"conversations">;
	title: string;
	provider?: string;
	updatedAt: number;
	isPinned?: boolean;
	isArchived?: boolean;
	branchedFrom?: Id<"conversations">;
	branchFromMessageId?: Id<"messages">;
};

export function AppSidebar() {
	const router = useRouter();
	const pathname = usePathname();
	const { signOut } = useClerk();
	const { user } = useUser();
	const [searchQuery, setSearchQuery] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingTitle, setEditingTitle] = useState("");
	const { currentChatId } = useChatContext();

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "O") {
				e.preventDefault();
				handleNewChat();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Convex hooks with error handling
	const conversations = useQuery(api.conversations.list);
	const createConversation = useMutation(api.conversations.create);
	const archiveConversation = useMutation(api.conversations.archive);
	const updateConversation = useMutation(api.conversations.update);
	const deleteConversation = useMutation(api.conversations.remove);

	const handleNewChat = useCallback(async () => {
		try {
			const conversationId = await createConversation({
				title: generateChatTitle("New Chat"),
				model: "claude-3.5-sonnet",
				provider: "anthropic",
			});
			router.push(`/chat/${conversationId}`);
		} catch (error) {
			console.error("Failed to create conversation:", error);
		}
	}, [createConversation, router]);

	const handleArchive = async (conversationId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await archiveConversation({
				conversationId: conversationId as Id<"conversations">,
			});
		} catch (error) {
			console.error("Failed to archive conversation:", error);
		}
	};

	const handleDelete = async (conversationId: string) => {
		if (confirm("Are you sure you want to delete this conversation?")) {
			try {
				// Always redirect to home first if this is the current chat
				if (currentChatId === conversationId) {
					router.push("/");
				}

				// Then delete the conversation
				await deleteConversation({
					conversationId: conversationId as Id<"conversations">,
				});
			} catch (error) {
				console.error("Failed to delete conversation:", error);
			}
		}
	};

	const handlePin = async (conversationId: string) => {
		try {
			const conversation = conversations?.find((c) => c._id === conversationId);
			if (conversation) {
				await updateConversation({
					conversationId: conversationId as Id<"conversations">,
					title: conversation.title,
					isPinned: !conversation.isPinned,
				});
			}
		} catch (error) {
			console.error("Failed to pin conversation:", error);
		}
	};

	const handleStartEdit = (
		conversation: Conversation,
		e?: React.MouseEvent
	) => {
		if (e) {
			e.stopPropagation();
			e.preventDefault();
		}
		setEditingId(conversation._id);
		setEditingTitle(conversation.title);
		// Focus the input after a brief delay to ensure it's rendered
		setTimeout(() => {
			const input = document.querySelector(
				`input[data-editing-id="${conversation._id}"]`
			) as HTMLInputElement;
			if (input) {
				input.focus();
				input.select();
			}
		}, 50);
	};

	const handleSaveEdit = async (conversationId: string) => {
		if (editingTitle.trim()) {
			try {
				await updateConversation({
					conversationId: conversationId as Id<"conversations">,
					title: editingTitle.trim(),
				});
			} catch (error) {
				console.error("Failed to update conversation:", error);
			}
		}
		setEditingId(null);
		setEditingTitle("");
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditingTitle("");
	};

	const handleCopy = async (conversation: Conversation) => {
		try {
			const conversationUrl = `${window.location.origin}/chat/${conversation._id}`;
			await navigator.clipboard.writeText(conversationUrl);
			console.log("Conversation link copied to clipboard");
			// Simple success feedback - could be enhanced with a proper toast system
			const notification = document.createElement("div");
			notification.textContent = "✅ Link copied to clipboard!";
			notification.style.cssText =
				"position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
			document.body.appendChild(notification);
			setTimeout(() => {
				document.body.removeChild(notification);
			}, 3000);
		} catch (error) {
			console.error("Failed to copy conversation link:", error);
			// Simple error feedback
			const notification = document.createElement("div");
			notification.textContent = "❌ Failed to copy link";
			notification.style.cssText =
				"position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
			document.body.appendChild(notification);
			setTimeout(() => {
				document.body.removeChild(notification);
			}, 3000);
		}
	};

	const handleExport = async (conversation: Conversation) => {
		try {
			// Fetch messages for this conversation
			const messages = await fetch(
				`/api/conversations/${conversation._id}/messages`
			).catch(() => null);

			let markdownContent = `# ${conversation.title}\n\n`;
			markdownContent += `**Provider:** ${conversation.provider || "Unknown"}\n`;
			markdownContent += `**Created:** ${new Date(conversation.updatedAt).toLocaleDateString()}\n`;
			markdownContent += `**Exported:** ${new Date().toLocaleDateString()}\n\n`;

			if (conversation.branchedFrom) {
				markdownContent += `**Branched from:** ${conversation.branchedFrom}\n\n`;
			}

			markdownContent += "---\n\n";

			if (messages?.ok) {
				const messageData = await messages.json();
				if (messageData && messageData.length > 0) {
					markdownContent += "## Conversation Messages\n\n";

					messageData.forEach((msg: any, index: number) => {
						const timestamp = new Date(msg.timestamp).toLocaleString();
						const role = msg.role === "user" ? "👤 User" : "🤖 Assistant";

						markdownContent += `### ${role} - ${timestamp}\n\n`;
						markdownContent += `${msg.content}\n\n`;

						if (msg.attachments && msg.attachments.length > 0) {
							markdownContent += "**Attachments:**\n";
							msg.attachments.forEach((attachment: any) => {
								markdownContent += `- [${attachment.name}](${attachment.url})\n`;
							});
							markdownContent += "\n";
						}

						markdownContent += "---\n\n";
					});
				} else {
					markdownContent += "## No messages found\n\n";
				}
			} else {
				markdownContent +=
					"## Messages\n\n*Unable to load messages for export*\n\n";
			}

			markdownContent += `\n\n*Exported from Ten Chat on ${new Date().toLocaleString()}*\n`;

			const blob = new Blob([markdownContent], { type: "text/markdown" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${conversation.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.md`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			// Show success notification
			const notification = document.createElement("div");
			notification.textContent = "📄 Conversation exported successfully!";
			notification.style.cssText =
				"position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
			document.body.appendChild(notification);
			setTimeout(() => {
				document.body.removeChild(notification);
			}, 3000);
		} catch (error) {
			console.error("Failed to export conversation:", error);
			// Show error notification
			const notification = document.createElement("div");
			notification.textContent = "❌ Failed to export conversation";
			notification.style.cssText =
				"position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
			document.body.appendChild(notification);
			setTimeout(() => {
				document.body.removeChild(notification);
			}, 3000);
		}
	};

	const handleDoubleClick = (conversation: Conversation) => {
		setEditingId(conversation._id);
		setEditingTitle(conversation.title);
	};

	// Filter conversations based on search
	const filteredConversations = useMemo(() => {
		if (!conversations) return [];
		return conversations
			.filter(
				(conv) =>
					conv.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
					!conv.isArchived
			)
			.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
			);
	}, [conversations, searchQuery]);

	// Group conversations by time periods like T3.chat
	const groupedConversations = useMemo(() => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
		const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

		const pinned = filteredConversations.filter((conv) => conv.isPinned);
		const todayConvs = filteredConversations.filter(
			(conv) => !conv.isPinned && new Date(conv.updatedAt) >= today
		);
		const yesterdayConvs = filteredConversations.filter(
			(conv) =>
				!conv.isPinned &&
				new Date(conv.updatedAt) >= yesterday &&
				new Date(conv.updatedAt) < today
		);
		const lastWeekConvs = filteredConversations.filter(
			(conv) =>
				!conv.isPinned &&
				new Date(conv.updatedAt) >= lastWeek &&
				new Date(conv.updatedAt) < yesterday
		);

		return {
			pinned,
			today: todayConvs,
			yesterday: yesterdayConvs,
			lastWeek: lastWeekConvs,
		};
	}, [filteredConversations]);

	const handleLogout = async () => {
		try {
			await signOut();
			router.push("/sign-in");
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	const handleConversationClick = (conversationId: string) => {
		if (editingId !== conversationId) {
			router.push(`/chat/${conversationId}`);
		}
	};

	const handleConversationKeyDown = (
		e: React.KeyboardEvent,
		conversationId: string
	) => {
		if (editingId === conversationId) {
			if (e.key === "Enter") {
				e.preventDefault();
				handleSaveEdit(conversationId);
			} else if (e.key === "Escape") {
				e.preventDefault();
				handleCancelEdit();
			}
			return;
		}

		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			router.push(`/chat/${conversationId}`);
		}
	};

	const renderConversationGroup = (
		conversations: Conversation[],
		title: string,
		icon?: React.ReactNode
	) => {
		if (conversations.length === 0) return null;

		return (
			<SidebarGroup className="mb-6">
				<SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
					{icon}
					{title}
				</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu className="space-y-4">
						{conversations.map((conversation) => (
							<SidebarMenuItem key={conversation._id}>
								<ContextMenu>
									<ContextMenuTrigger asChild>
										<SidebarMenuButton
											asChild
											isActive={currentChatId === conversation._id}
											className="group relative h-auto"
										>
											<button
												type="button"
												onClick={() =>
													handleConversationClick(conversation._id)
												}
												onDoubleClick={() => handleDoubleClick(conversation)}
												onKeyDown={(e) =>
													handleConversationKeyDown(e, conversation._id)
												}
												className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-sm transition-all duration-200 hover:bg-background/60 focus:outline-none focus:ring-2 focus:ring-sidebar-ring min-h-[60px] backdrop-blur-md border border-border/20 hover:border-border/40 hover:shadow-lg hover:scale-[1.02] bg-background/30"
											>
												<div className="flex items-center gap-2 shrink-0 group/icons">
													{conversation.isPinned && (
														<div className="relative group/pin">
															<Pin className="h-3 w-3 text-sidebar-foreground/70 fill-current hover:text-sidebar-foreground transition-colors" />
															{/* Tooltip for pinned */}
															<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover/pin:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
																Pinned conversation
																<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-popover rotate-45 -mt-1" />
															</div>
														</div>
													)}
													{conversation.branchedFrom && (
														<div className="relative group/branch">
															<GitBranch className="h-3 w-3 text-purple-500 hover:text-purple-400 transition-colors" />
															{/* Tooltip for branched */}
															<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover/branch:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
																Branched conversation
																<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-popover rotate-45 -mt-1" />
															</div>
														</div>
													)}
													<div className="relative group/message">
														<MessageSquare className="h-4 w-4 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors" />
														{/* Tooltip for conversation info */}
														<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover/message:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none min-w-[120px]">
															<div className="text-center space-y-1">
																<div className="font-medium">
																	{conversation.title}
																</div>
																<div className="text-muted-foreground text-[10px]">
																	{formatTimestamp(conversation.updatedAt)}
																</div>
																{conversation.provider && (
																	<div className="text-muted-foreground text-[10px] font-mono">
																		{conversation.provider}
																	</div>
																)}
															</div>
															<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-popover rotate-45 -mt-1" />
														</div>
													</div>
												</div>

												<div className="flex-1 overflow-hidden">
													{editingId === conversation._id ? (
														<input
															type="text"
															value={editingTitle}
															onChange={(e) => setEditingTitle(e.target.value)}
															onBlur={(e) => {
																// Add a small delay to prevent conflicts with other events
																setTimeout(() => {
																	// Only save if we're still in editing mode and not clicking another element
																	if (editingId === conversation._id) {
																		handleSaveEdit(conversation._id);
																	}
																}, 150);
															}}
															onKeyDown={(e) => {
																e.stopPropagation();
																if (e.key === "Enter") {
																	e.preventDefault();
																	handleSaveEdit(conversation._id);
																} else if (e.key === "Escape") {
																	e.preventDefault();
																	handleCancelEdit();
																}
															}}
															onClick={(e) => e.stopPropagation()}
															data-editing-id={conversation._id}
															className="w-full bg-transparent border-none outline-none font-medium text-sidebar-foreground"
														/>
													) : (
														<h3 className="truncate font-medium text-sidebar-foreground leading-tight">
															{conversation.title}
														</h3>
													)}
													<div className="text-xs text-sidebar-foreground/60 mt-1">
														<span>
															{formatTimestamp(conversation.updatedAt)}
														</span>
													</div>
												</div>
											</button>
										</SidebarMenuButton>
									</ContextMenuTrigger>

									<ContextMenuContent className="w-48">
										<ContextMenuItem
											onClick={(e) => handleStartEdit(conversation, e)}
											className="flex items-center gap-2"
										>
											<Edit2 className="h-4 w-4" />
											Rename
										</ContextMenuItem>

										<ContextMenuItem
											onClick={() => handlePin(conversation._id)}
											className="flex items-center gap-2"
										>
											<Pin
												className={cn(
													"h-4 w-4",
													conversation.isPinned && "fill-current"
												)}
											/>
											{conversation.isPinned ? "Unpin" : "Pin"}
										</ContextMenuItem>

										<ContextMenuItem
											onClick={() => handleCopy(conversation)}
											className="flex items-center gap-2"
										>
											<Copy className="h-4 w-4" />
											Copy Link
										</ContextMenuItem>

										<ContextMenuItem
											onClick={() => handleExport(conversation)}
											className="flex items-center gap-2"
										>
											<Download className="h-4 w-4" />
											Export
											<span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
												BETA
											</span>
										</ContextMenuItem>

										<ContextMenuSeparator />

										<ContextMenuItem
											onClick={() => handleDelete(conversation._id)}
											className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
										>
											<Trash2 className="h-4 w-4" />
											Delete
										</ContextMenuItem>
									</ContextMenuContent>
								</ContextMenu>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	};

	// Handle conversations loading state
	if (conversations === undefined) {
		return (
			<Sidebar
				variant="inset"
				collapsible="offcanvas"
				className="bg-sidebar border-sidebar-border modern-gradient"
			>
				<SidebarContent>
					<div className="flex h-full items-center justify-center">
						<div className="flex items-center space-x-2">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<span className="text-muted-foreground text-sm">
								Loading conversations...
							</span>
						</div>
					</div>
				</SidebarContent>
			</Sidebar>
		);
	}

	return (
		<Sidebar
			variant="inset"
			collapsible="offcanvas"
			className="bg-sidebar border-sidebar-border modern-gradient"
		>
			<SidebarHeader>
				{/* Simple header with title and beta badge */}
				<div className="flex items-center justify-center p-4 border-b border-sidebar-border">
					<div className="flex flex-col items-center">
						<div className="flex items-center gap-2">
							<span className="font-bold text-sidebar-foreground text-sm">
								Ten Chat
							</span>
							<BetaBadge />
						</div>
					</div>
				</div>

				{/* New Chat Button */}
				<div className="p-3">
					<Button
						onClick={handleNewChat}
						className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
						size="sm"
					>
						<Plus className="h-4 w-4 shrink-0" />
						<span>New Chat</span>
					</Button>
				</div>
			</SidebarHeader>

			<SidebarContent>
				{/* Search */}
				<SidebarGroup>
					<SidebarGroupContent>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/60" />
							<SidebarInput
								placeholder="Search your threads..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 bg-sidebar-accent border-sidebar-border"
							/>
						</div>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				{/* Conversations organized by time periods with proper spacing */}
				<div className="space-y-6">
					{renderConversationGroup(
						groupedConversations.pinned,
						"Pinned",
						<Pin className="h-3 w-3" />
					)}

					{renderConversationGroup(groupedConversations.today, "Today")}

					{renderConversationGroup(groupedConversations.yesterday, "Yesterday")}

					{renderConversationGroup(
						groupedConversations.lastWeek,
						"Last 7 Days"
					)}
				</div>

				{/* Empty state */}
				{filteredConversations.length === 0 && (
					<SidebarGroup>
						<SidebarGroupContent>
							<div className="flex flex-col items-center justify-center h-32 text-center text-sidebar-foreground/60 text-sm">
								<MessageSquare className="h-8 w-8 mb-2" />
								<p>No conversations yet</p>
								<p className="text-xs">Start a new chat to begin</p>
							</div>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>

			<SidebarFooter>
				{/* Settings and Theme toggle */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{/* Settings */}
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={pathname === "/settings"}>
									<a href="/settings" className="flex items-center gap-2">
										<Settings className="h-4 w-4" />
										<span>Settings</span>
									</a>
								</SidebarMenuButton>
							</SidebarMenuItem>

							{/* Theme Toggle */}
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<ThemeToggle />
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				{/* User section */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton>
									{user?.imageUrl ? (
										<img
											src={user.imageUrl}
											alt={user.fullName || "User"}
											className="h-4 w-4 rounded-full"
										/>
									) : (
										<User className="h-4 w-4" />
									)}
									<span className="truncate">
										{user?.fullName ||
											user?.emailAddresses?.[0]?.emailAddress ||
											"User"}
									</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton onClick={handleLogout}>
									<LogOut className="h-4 w-4" />
									<span>Logout</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarFooter>
		</Sidebar>
	);
}
