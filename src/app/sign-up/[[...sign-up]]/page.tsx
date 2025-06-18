import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold">Join Ten Chat</h1>
					<p className="text-muted-foreground mt-2">
						Start chatting with 30+ AI models from 8 providers
					</p>
				</div>
				<SignUp
					appearance={{
						elements: {
							rootBox: "mx-auto",
							card: "shadow-2xl border-0 bg-background/80 backdrop-blur-lg",
							headerTitle: "hidden",
							headerSubtitle: "hidden",
							socialButtonsBlockButton:
								"bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 border-0 shadow-lg font-medium py-3",
							socialButtonsBlockButtonText: "font-medium",
							formButtonPrimary:
								"bg-primary hover:bg-primary/90 transition-colors duration-200 font-medium py-3",
							footerActionLink: "text-primary hover:text-primary/80",
						},
					}}
					forceRedirectUrl="/chat"
					signInUrl="/sign-in"
				/>
			</div>
		</div>
	);
}
