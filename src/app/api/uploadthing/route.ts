import { createRouteHandler } from "uploadthing/next";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

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
      // You can add auth logic here if needed

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: "demo-user" }; // Will be replaced with real auth later
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Return data that will be sent to the client
      return { uploadedBy: metadata.userId, url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

export { GET, POST };
