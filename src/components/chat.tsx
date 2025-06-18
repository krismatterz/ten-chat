"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "convex/react";
import {
	Bot,
	Copy,
	GitBranch,
	Paperclip,
	Plus,
	RotateCcw,
	Send,
	Upload,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AI_PROVIDERS, type ProviderType } from "~/lib/providers";
import { cn, formatTimestamp, generateChatTitle } from "~/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AIProviderSelector } from "./ai-provider-selector";
import { FileUpload } from "./file-upload";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";

interface FileAttachment {
	name: string;
	url: string;
	type: string;
	size: number;
}

interface ChatProps {
	chatId: string;
}

export function Chat({ chatId }: ChatProps) {
	const router = useRouter();
	const [isFirstMessage, setIsFirstMessage] = useState(true);

	// Load persistent AI preferences from localStorage
	const [selectedProvider, setSelectedProvider] = useState<ProviderType>(() => {
		if (typeof window !== "undefined") {
			return (
				(localStorage.getItem("tenchat-provider") as ProviderType) ||
				"anthropic"
			);
		}
		return "anthropic";
	});

	const [selectedModel, setSelectedModel] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("tenchat-model") || "claude-3.5-sonnet";
		}
		return "claude-3.5-sonnet";
	});

	const [reasoningLevel, setReasoningLevel] = useState<"low" | "mid" | "high">(
		() => {
			if (typeof window !== "undefined") {
				return (
					(localStorage.getItem("tenchat-reasoning") as
						| "low"
						| "mid"
						| "high") || "mid"
				);
			}
			return "mid";
		}
	);
	const [attachments, setAttachments] = useState<FileAttachment[]>([]);
	const [showUpload, setShowUpload] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Convex hooks
	const createConversation = useMutation(api.conversations.create);
	const addMessage = useMutation(api.messages.add);
	const autoRename = useMutation(api.conversations.autoRename);
	const branchConversation = useMutation(api.conversations.branch);

	// Convert chatId to Convex ID type if it exists as a conversation
	const [conversationId, setConversationId] =
		useState<Id<"conversations"> | null>(
			chatId !== "new" ? (chatId as Id<"conversations">) : null
		);

	// Query messages only if we have a valid conversation ID
	const messagesData = useQuery(
		api.messages.list,
		conversationId ? { conversationId } : "skip"
	);

	// Handle case where conversation was deleted
	useEffect(() => {
		if (conversationId && messagesData === undefined) {
			// If we're trying to load a specific conversation but get undefined, it might be deleted
			// Redirect to home after a brief delay
			const timer = setTimeout(() => {
				if (window.location.pathname !== "/") {
					window.location.href = "/";
				}
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [conversationId, messagesData]);

	// AI Chat hook for streaming (AI SDK v4 stable)
	const {
		messages: aiMessages,
		input,
		handleInputChange,
		handleSubmit: aiHandleSubmit,
		isLoading,
		setMessages: setAiMessages,
		reload,
	} = useChat({
		api: "/api/chat",
		body: {
			provider: selectedProvider,
			model: selectedModel,
			reasoning: reasoningLevel,
			// Include current attachments in the request body
			attachments: attachments.length > 0 ? attachments : undefined,
		},
		onFinish: async (message) => {
			console.log("🎯 onFinish called with:", message.id);
			// Save AI response to Convex (user messages are saved in handleSendMessage)
			if (conversationId) {
				try {
					const textContent = message.content || "";

					if (textContent.trim()) {
						await addMessage({
							conversationId,
							role: "assistant",
							content: textContent,
							model: selectedModel,
							provider: selectedProvider,
						});
						console.log("✅ AI message saved to Convex");
					}
				} catch (error) {
					console.error("❌ Failed to save AI message to Convex:", error);
				}
			}
		},
		onError: (error) => {
			console.error("💥 Chat API error:", error);
		},
	});

	// Use loading state from AI SDK v4
	const aiIsLoading = isLoading;

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [aiMessages.length]); // Only depend on length, not the entire array

	// Initialize AI messages from Convex only once when conversation loads
	const [hasInitialized, setHasInitialized] = useState(false);

	// Reset initialization when conversation changes
	useEffect(() => {
		setHasInitialized(false);
		setAiMessages([]); // Clear messages when switching conversations
	}, [conversationId, setAiMessages]);

	useEffect(() => {
		// Only sync once when conversation first loads, not continuously
		if (messagesData && messagesData.length > 0 && !hasInitialized) {
			const formattedMessages = messagesData.map((msg) => ({
				id: msg._id,
				role: msg.role as "user" | "assistant",
				content: msg.content,
				// Include attachments for API processing
				attachments: msg.attachments,
			}));

			setAiMessages(formattedMessages);
			setHasInitialized(true);
		}

		// Reset initialization flag when conversation changes
		if (!messagesData || messagesData.length === 0) {
			setHasInitialized(false);
		}
	}, [messagesData, hasInitialized, setAiMessages]); // Include all dependencies

	// Direct file upload handler
	const handleDirectFileUpload = () => {
		fileInputRef.current?.click();
	};

	const handleFileInputChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files) return;

		// Convert FileList to File array and handle upload
		const fileArray = Array.from(files);

		// For now, create mock FileAttachment objects
		// In a real implementation, you'd upload these to your storage service
		const fileAttachments: FileAttachment[] = fileArray.map((file) => ({
			name: file.name,
			url: URL.createObjectURL(file), // Temporary URL for preview
			type: file.type,
			size: file.size,
		}));

		setAttachments((prev) => [...prev, ...fileAttachments]);

		// Clear the input
		event.target.value = "";
	};

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() && attachments.length === 0) return;

		try {
			let convId = conversationId;

			// Create conversation if it doesn't exist
			if (!convId) {
				const title = generateChatTitle(input || "File upload");
				convId = await createConversation({
					title,
					model: selectedModel,
					provider: selectedProvider,
				});
				setConversationId(convId);
				setIsFirstMessage(false);

				// Update URL to reflect the new conversation
				window.history.pushState({}, "", `/chat/${convId}`);
			}

			// Save user message to Convex with attachments (AI SDK will handle the UI)
			await addMessage({
				conversationId: convId,
				role: "user",
				content:
					input ||
					(attachments.length > 0
						? "I've shared some files with you. Please analyze them."
						: ""),
				attachments: attachments.length > 0 ? attachments : undefined,
			});

			// Auto-rename conversation if it's the first meaningful message
			if (input.trim() && input.trim().length > 3) {
				await autoRename({
					conversationId: convId,
					content: input.trim(),
				});
			}

			// For AI SDK, we need to trigger the chat
			// The attachments will be included via the body.attachments parameter
			if (input.trim() || attachments.length > 0) {
				await aiHandleSubmit(e);
			}

			// Clear input and attachments only after successful submission
			setAttachments([]);
			setShowUpload(false);
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider);

	const handleFilesUploaded = (files: FileAttachment[]) => {
		console.log("📎 Files uploaded to chat:", files);
		setAttachments((prev) => {
			const newAttachments = [...prev, ...files];
			console.log("📋 Updated attachments:", newAttachments);
			return newAttachments;
		});
	};

	const handleRemoveAttachment = (index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index));
	};

	const handleProviderChange = (provider: string, model: string) => {
		console.log("🔄 handleProviderChange called with:", { provider, model });
		console.log("🔄 Previous state:", { selectedProvider, selectedModel });

		setSelectedProvider(provider as ProviderType);
		setSelectedModel(model);
		console.log("🔄 State updated");

		// Save to localStorage for persistence
		if (typeof window !== "undefined") {
			localStorage.setItem("tenchat-provider", provider);
			localStorage.setItem("tenchat-model", model);
			console.log("💾 Saved to localStorage:", { provider, model });
		}
	};

	// Save reasoning level changes to localStorage
	const handleReasoningChange = (level: "low" | "mid" | "high") => {
		setReasoningLevel(level);
		if (typeof window !== "undefined") {
			localStorage.setItem("tenchat-reasoning", level);
		}
	};

	// Message Actions
	const handleCopyMessage = async (content: string) => {
		try {
			await navigator.clipboard.writeText(content);
			// Show a temporary success indicator
			const button = document.activeElement as HTMLButtonElement;
			if (button) {
				const originalTitle = button.title;
				button.title = "✅ Copied!";
				button.style.color = "#10b981"; // green-500
				setTimeout(() => {
					button.title = originalTitle;
					button.style.color = "";
				}, 2000);
			}
			console.log("Message copied to clipboard");
		} catch (error) {
			console.error("Failed to copy message:", error);
			// Show error indicator
			const button = document.activeElement as HTMLButtonElement;
			if (button) {
				const originalTitle = button.title;
				button.title = "❌ Failed to copy";
				button.style.color = "#ef4444"; // red-500
				setTimeout(() => {
					button.title = originalTitle;
					button.style.color = "";
				}, 2000);
			}
		}
	};

	const handleBranchFromMessage = async (messageId: string) => {
		if (!conversationId) return;

		try {
			const branchedId = await branchConversation({
				originalConversationId: conversationId,
				fromMessageId: messageId as Id<"messages">,
			});

			// Show success notification before navigating
			const notification = document.createElement("div");
			notification.textContent = "🌿 Conversation branched successfully!";
			notification.style.cssText =
				"position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
			document.body.appendChild(notification);
			setTimeout(() => {
				if (document.body.contains(notification)) {
					document.body.removeChild(notification);
				}
			}, 3000);

			// Navigate to the new branched conversation
			router.push(`/chat/${branchedId}`);
		} catch (error) {
			console.error("Failed to branch conversation:", error);
			// Show error notification
			const notification = document.createElement("div");
			notification.textContent = "❌ Failed to branch conversation";
			notification.style.cssText =
				"position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
			document.body.appendChild(notification);
			setTimeout(() => {
				if (document.body.contains(notification)) {
					document.body.removeChild(notification);
				}
			}, 3000);
		}
	};

	const handleRetryMessage = async (messageIndex: number) => {
		if (messageIndex === 0 || aiIsLoading) return; // Can't retry first message or when loading

		console.log("🔄 Retrying message at index:", messageIndex);

		try {
			// Get the last user message before the AI response we're retrying
			const lastUserMessage = aiMessages[messageIndex - 1];
			if (!lastUserMessage || lastUserMessage.role !== "user") {
				console.error("No user message found before AI response");
				return;
			}

			// Remove the AI message we're retrying (keep all messages before it)
			const messagesToKeep = aiMessages.slice(0, messageIndex);
			setAiMessages(messagesToKeep);

			console.log("🔄 Manually triggering new AI response");

			// Create a synthetic form submission to trigger a new AI response
			const syntheticEvent = {
				preventDefault: () => {},
			} as React.FormEvent;

			// Temporarily set the input to the last user message content
			const previousInput = input;
			handleInputChange({
				target: { value: lastUserMessage.content },
			} as React.ChangeEvent<HTMLTextAreaElement>);

			// Wait a bit for state to update, then submit
			setTimeout(async () => {
				try {
					await aiHandleSubmit(syntheticEvent);
					// Reset input back to what it was
					handleInputChange({
						target: { value: previousInput },
					} as React.ChangeEvent<HTMLTextAreaElement>);
				} catch (error) {
					console.error("Failed to resubmit:", error);
					// Reset input back to what it was
					handleInputChange({
						target: { value: previousInput },
					} as React.ChangeEvent<HTMLTextAreaElement>);
				}
			}, 100);

			console.log("✅ Message retry initiated successfully");

			// Show success notification
			const notification = document.createElement("div");
			notification.textContent = "🔄 Retrying message...";
			notification.style.cssText =
				"position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
			document.body.appendChild(notification);
			setTimeout(() => {
				if (document.body.contains(notification)) {
					document.body.removeChild(notification);
				}
			}, 2000);
		} catch (error) {
			console.error("❌ Failed to retry message:", error);
			// Show user-friendly error
			const notification = document.createElement("div");
			notification.textContent =
				"❌ Failed to retry message. Please try again.";
			notification.style.cssText =
				"position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
			document.body.appendChild(notification);
			setTimeout(() => {
				if (document.body.contains(notification)) {
					document.body.removeChild(notification);
				}
			}, 3000);
		}
	};

	const popularEmojis = ["👍", "❤️", "😊", "😮", "😢", "😡"];

	return (
		<div className="flex h-full flex-col relative z-10">
			{/* Header with Sidebar Toggle */}
			<div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 modern-gradient">
				<SidebarTrigger className="shrink-0" />
			</div>

			{/* Messages - This will take available space and scroll independently */}
			<div className="flex-1 overflow-y-auto px-6 py-4">
				<div className="mx-auto max-w-3xl space-y-4">
					{aiMessages.length === 0 ? (
						<div className="flex h-full items-center justify-center min-h-[60vh]">
							<div className="text-center">
								<Bot className="mx-auto h-12 w-12 text-muted-foreground" />
								<h3 className="mt-4 font-semibold text-foreground">
									Start a conversation
								</h3>
								<p className="mt-2 text-muted-foreground">
									Type a message below to begin chatting with{" "}
									{currentProvider?.name} AI.
								</p>
								<div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
									<span>
										Powered by {currentProvider?.name} • {selectedModel}
									</span>
								</div>
							</div>
						</div>
					) : (
						aiMessages.map((msg, index) => (
							<div
								key={msg.id || index}
								className={cn(
									"flex gap-3",
									msg.role === "user" ? "justify-end" : "justify-start"
								)}
							>
								{msg.role === "assistant" && (
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
										<Bot className="h-4 w-4" />
									</div>
								)}
								<div
									className={cn(
										"max-w-[80%] rounded-xl px-4 py-3 group backdrop-blur-md border transition-all duration-200",
										msg.role === "user"
											? "bg-primary/90 text-primary-foreground border-primary/20 shadow-lg"
											: "bg-background/60 text-foreground border-border/30 shadow-sm hover:bg-background/80 hover:border-border/50"
									)}
								>
									{/* Render message content (AI SDK v4) */}
									<div className="whitespace-pre-wrap">{msg.content}</div>

									{/* Display attachments if they exist */}
									{messagesData?.find((m) => m._id === msg.id)?.attachments && (
										<div className="mt-2 space-y-1">
											{messagesData
												.find((m) => m._id === msg.id)
												?.attachments?.map((attachment) => (
													<div
														key={attachment.url}
														className={cn(
															"flex items-center gap-2 text-xs rounded p-2",
															msg.role === "user" ? "bg-primary/20" : "bg-muted"
														)}
													>
														<span>📎</span>
														<a
															href={attachment.url}
															target="_blank"
															rel="noopener noreferrer"
															className="truncate hover:underline"
														>
															{attachment.name}
														</a>
													</div>
												))}
										</div>
									)}

									<div className="mt-1 flex items-center justify-between">
										<p
											className={cn(
												"text-xs",
												msg.role === "user"
													? "text-primary-foreground/70"
													: "text-muted-foreground"
											)}
										>
											{formatTimestamp(Date.now())}
										</p>
										{msg.role === "assistant" && (
											<div className="flex items-center gap-1">
												{/* Provider Info Icon with Tooltip */}
												<div className="group relative mr-2">
													<div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:scale-110 transition-all duration-200 cursor-help border border-primary/20">
														<span className="text-xs font-bold">i</span>
													</div>

													{/* Tooltip - Positioned Below */}
													<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-popover/95 backdrop-blur-sm text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 min-w-[180px]">
														{/* Tooltip arrow pointing up */}
														<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-popover border-l border-t rotate-45 mb-1" />

														<div className="text-center space-y-1">
															<div className="font-semibold text-foreground">
																{currentProvider?.name}
															</div>
															<div className="text-muted-foreground text-[10px] font-mono">
																{selectedModel}
															</div>
															<div className="flex items-center justify-center gap-1 text-green-500">
																<div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
																<span className="text-[10px] font-medium">
																	Streaming
																</span>
															</div>
														</div>
													</div>
												</div>

												{/* Message Actions */}
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleCopyMessage(msg.content);
														}}
														className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
														title="Copy message"
													>
														<Copy className="h-3 w-3" />
													</button>

													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleBranchFromMessage(msg.id);
														}}
														className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
														title="Branch conversation from this message"
													>
														<GitBranch className="h-3 w-3" />
													</button>

													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleRetryMessage(index);
														}}
														className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
														title="Retry this response"
														disabled={aiIsLoading}
													>
														<RotateCcw className="h-3 w-3" />
													</button>
												</div>
											</div>
										)}
									</div>
								</div>
								{msg.role === "user" && (
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
										<User className="h-4 w-4" />
									</div>
								)}
							</div>
						))
					)}

					{/* Loading indicator */}
					{aiIsLoading && (
						<div className="flex justify-start gap-3">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<Bot className="h-4 w-4" />
							</div>
							<div className="max-w-[80%] rounded-lg bg-card px-4 py-2 text-card-foreground shadow-sm border">
								<div className="flex items-center gap-2">
									<div className="animate-pulse">Thinking...</div>
									<div className="flex gap-1">
										<div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
										<div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
										<div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
									</div>
								</div>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Fixed Input Area at Bottom */}
			<div className="shrink-0 border-t border-border/30 px-6 py-4 bg-background/80 backdrop-blur-xl">
				<div className="mx-auto max-w-3xl space-y-3">
					{/* File Upload Dropdown */}
					{showUpload && (
						<div className="border border-border/30 rounded-xl p-4 bg-background/60 backdrop-blur-md shadow-lg">
							<FileUpload
								onFilesUploaded={handleFilesUploaded}
								attachments={attachments}
								onRemoveAttachment={handleRemoveAttachment}
								disabled={aiIsLoading}
							/>
						</div>
					)}

					{/* Input Area */}
					<form onSubmit={handleSendMessage} className="space-y-3">
						<div className="relative flex gap-2">
							<div className="flex-1 relative">
								<textarea
									value={input}
									onChange={handleInputChange}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleSendMessage(e);
										}
									}}
									placeholder={`Ask ${currentProvider?.name} ${selectedModel.split("-").slice(-1)[0] || selectedModel} anything...`}
									className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
									rows={1}
									disabled={aiIsLoading}
								/>
							</div>

							{/* Send Button */}
							<Button
								type="submit"
								disabled={
									(!input.trim() && attachments.length === 0) || aiIsLoading
								}
								className="px-4 h-12 rounded-xl bg-primary/90 hover:bg-primary border-primary/20 backdrop-blur-md transition-all duration-200 shadow-lg hover:shadow-xl self-end"
							>
								<Send className="h-4 w-4" />
							</Button>
						</div>

						{/* Controls Row */}
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								{/* AI Provider Selector */}
								<AIProviderSelector
									selectedProvider={selectedProvider}
									selectedModel={selectedModel}
									reasoningLevel={reasoningLevel}
									onProviderChange={handleProviderChange}
									onReasoningChange={handleReasoningChange}
								/>

								{/* Direct File Upload Button - Now rounded and named "Attach" */}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleDirectFileUpload}
									className="h-8 w-8 rounded-full p-0 bg-background/60 backdrop-blur-md border-border/30 hover:bg-background/80 hover:border-border/50 transition-all duration-200"
									disabled={aiIsLoading}
									title="Attach files"
								>
									<Paperclip className="h-4 w-4" />
								</Button>
							</div>

							{attachments.length > 0 && (
								<span className="text-xs text-muted-foreground">
									{attachments.length} file{attachments.length > 1 ? "s" : ""}{" "}
									attached
								</span>
							)}
						</div>
					</form>
				</div>
			</div>

			{/* Hidden file input for direct upload */}
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileInputChange}
				multiple
				accept="image/*,.pdf,.txt,.md,.doc,.docx,.csv,.json,.js,.ts,.html,.css"
				className="hidden"
			/>
		</div>
	);
}
