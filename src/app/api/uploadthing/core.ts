import { type FileRouter, createUploadthing } from "uploadthing/next";

const f = createUploadthing({
	errorFormatter: (err) => {
		console.log("UploadThing error:", err.message);
		return { message: err.message };
	},
});

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
	// Define as many FileRoutes as you like, each with a unique routeKey
	chatAttachment: f({
		image: { maxFileSize: "4MB", maxFileCount: 5 },
		pdf: { maxFileSize: "16MB", maxFileCount: 3 },
		text: { maxFileSize: "1MB", maxFileCount: 3 },
	})
		// Set permissions and file types for this FileRoute
		.middleware(async ({ req }) => {
			// This code runs on your server before upload
			try {
				// For now, use demo user - this will be replaced with Clerk auth later
				const userId = "demo-user";

				if (!userId) {
					throw new Error("Unauthorized - no user found");
				}

				// Whatever is returned here is accessible in onUploadComplete as `metadata`
				return { userId };
			} catch (error) {
				console.error("Upload middleware error:", error);
				throw error;
			}
		})
		.onUploadComplete(async ({ metadata, file }) => {
			// This code RUNS ON YOUR SERVER after upload
			console.log("Upload complete for userId:", metadata.userId);
			console.log("file url", file.url);

			// Return data that will be sent to the client
			return {
				uploadedBy: metadata.userId,
				url: file.url,
				name: file.name,
				type: file.type,
				size: file.size,
			};
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
