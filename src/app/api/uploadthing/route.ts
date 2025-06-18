import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// v7: Let UploadThing auto-detect UPLOADTHING_TOKEN from environment
const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  // No explicit config needed - v7 reads UPLOADTHING_TOKEN automatically
});

export { GET, POST };
