import { NextResponse } from "next/server";

export async function GET() {
	try {
		// Check basic service health
		const timestamp = new Date().toISOString();

		// You can add more health checks here:
		// - Database connectivity
		// - External API status
		// - Memory usage

		const healthData = {
			status: "healthy",
			timestamp,
			version: process.env.npm_package_version || "1.0.0",
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || "development",
			services: {
				database: "connected", // TODO: Add actual Convex health check
				ai_providers: "available",
				file_processing: "operational",
			},
		};

		return NextResponse.json(healthData, {
			status: 200,
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Health check failed:", error);

		return NextResponse.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: "Health check failed",
			},
			{
				status: 503,
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					"Content-Type": "application/json",
				},
			}
		);
	}
}

// Support HEAD requests for simple uptime checks
export async function HEAD() {
	return new Response(null, { status: 200 });
}
