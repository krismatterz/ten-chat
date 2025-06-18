# Ten Chat 🚀

A modern AI-powered chat application built with Next.js 15, React 19, and the latest web technologies. Ten Chat provides a beautiful interface for interacting with multiple AI providers including Anthropic Claude, OpenAI GPT, Groq, and more.

## ✨ Features

- **Multiple AI Providers**: Support for Anthropic, OpenAI, Groq, OpenRouter, Perplexity, Ollama, and LM Studio
- **Real-time Chat**: Powered by Convex for instant message synchronization
- **File Uploads**: Support for images (4MB), PDFs (16MB), and text files (1MB) with drag-and-drop
- **Conversation Management**: Pin, archive, rename, and export conversations
- **Modern UI**: Beautiful gradients, dark/light mode, and responsive design
- **Streaming Responses**: Real-time AI responses with proper loading states
- **Conversation Branching**: Create branches from specific messages
- **Search**: Quickly find conversations with semantic search
- **Keyboard Shortcuts**: Efficient navigation with keyboard shortcuts

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3.3, React 19.1, TypeScript
- **Backend**: Convex (real-time database and auth)
- **AI Integration**: AI SDK v4.3.16 (stable)
- **Styling**: Tailwind CSS with custom gradients
- **File Uploads**: UploadThing
- **Authentication**: Clerk
- **Package Manager**: Bun 1.2.16
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.2.16
- Node.js >= 18

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ten-chat.git
   cd ten-chat
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables** (see [Environment Setup](#environment-setup))

5. **Start Convex development server**

   ```bash
   bunx convex dev
   ```

6. **Start the development server**

   ```bash
   bun dev
   ```

7. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

### Required for Core Functionality

```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex
CONVEX_URL=https://...
CONVEX_DEPLOY_KEY=...

# File Uploads
UPLOADTHING_APP_ID=...
UPLOADTHING_SECRET=...
```

### AI Providers (Configure as needed)

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Groq
GROQ_API_KEY=gsk_...

# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# Perplexity
PERPLEXITY_API_KEY=pplx-...

# Local AI (Optional)
OLLAMA_BASE_URL=http://localhost:11434
LM_STUDIO_BASE_URL=http://localhost:1234/v1
```

## 📝 Usage

### Starting a New Conversation

- Click "New Chat" or use `Cmd/Ctrl + Shift + O`
- Select your preferred AI provider and model
- Start typing your message

### File Uploads

- Drag and drop files into the chat
- Or click the attachment button
- Supported formats: Images (JPEG, PNG, WebP), PDFs, Text files

### Conversation Management

- **Pin**: Right-click → Pin (or context menu)
- **Rename**: Double-click conversation title or right-click → Rename
- **Export**: Right-click → Export (saves as Markdown)
- **Delete**: Right-click → Delete

### Keyboard Shortcuts

- `Cmd/Ctrl + Shift + O`: New Chat
- `Enter`: Send message
- `Shift + Enter`: New line
- `Escape`: Cancel editing

## 🏗️ Project Structure

```
ten-chat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/chat/          # AI streaming endpoint
│   │   ├── chat/[id]/         # Dynamic chat pages
│   │   └── settings/          # Settings page
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   ├── chat.tsx          # Main chat interface
│   │   ├── app-sidebar.tsx   # Sidebar navigation
│   │   └── file-upload.tsx   # File upload component
│   ├── lib/                  # Utilities and configurations
│   └── styles/               # Global styles
├── convex/                   # Convex backend
│   ├── schema.ts            # Database schema
│   ├── conversations.ts     # Conversation CRUD
│   └── messages.ts          # Message handling
└── public/                  # Static assets
```

## 🧪 Development

### Commands

```bash
# Development
bun dev                 # Start development server
bun build              # Build for production
bun start              # Start production server

# Convex
bunx convex dev         # Start Convex development
bunx convex deploy      # Deploy Convex to production

# Code Quality
bun lint               # Run ESLint
bun type-check         # Run TypeScript checks
```

### Key Development Patterns

#### AI SDK v4 (Stable)

```typescript
const { messages, input, handleSubmit, isLoading } = useChat({
  api: "/api/chat",
  body: { provider, model },
  onFinish: async (message) => {
    await addMessage({
      conversationId,
      role: "assistant",
      content: message.content,
    });
  },
});
```

#### File Upload with UploadThing

```typescript
onClientUploadComplete: (res) => {
  res.forEach((file) => {
    const fileUrl = file.url; // Use file.url (not file.fileUrl)
  });
};
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with `bunx convex deploy`

### Manual Deployment

```bash
bun build
bunx convex deploy
# Deploy build folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Theo](https://x.com/theo) for the Cloneathon opportunity
- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integration patterns
- [Convex](https://convex.dev/) for real-time backend
- [Clerk](https://clerk.com/) for authentication
- [UploadThing](https://uploadthing.com/) for file uploads
- [Lucide](https://lucide.dev/) for beautiful icons

## 📞 Support

- Create an [issue](https://github.com/yourusername/ten-chat/issues) for bug reports
- Start a [discussion](https://github.com/yourusername/ten-chat/discussions) for questions
- Check out the [documentation](https://github.com/yourusername/ten-chat/wiki)

---

Built with ❤️ by Krisusing modern web technologies
