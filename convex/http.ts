import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Clerk webhook endpoint (we'll configure this later if needed)
http.route({
	path: "/clerk",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const payloadString = await request.text();
		const svixHeaders = {
			"svix-id": request.headers.get("svix-id") ?? "",
			"svix-timestamp": request.headers.get("svix-timestamp") ?? "",
			"svix-signature": request.headers.get("svix-signature") ?? "",
		};

		// For now, just acknowledge the webhook
		return new Response("Webhook received", { status: 200 });
	}),
});

export default http;
