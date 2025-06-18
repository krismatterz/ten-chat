import { createUploadthing, type FileRouter } from "uploadthing/next";
import { env } from "~/env";

const f = createUploadthing();

export const uploadRouter = {
  chatFiles: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 3 },
    text: { maxFileSize: "1MB", maxFileCount: 3 },
  })
    .middleware(async () => {
      // Add auth logic here later
      return { userId: "demo-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", file.url);
      return { url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
