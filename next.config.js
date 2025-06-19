/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	// Enable experimental features for better performance
	experimental: {
		optimizePackageImports: ["lucide-react", "@radix-ui/react-tooltip"],
	},

	// External packages for server components
	serverExternalPackages: ["pdf-parse"],

	// Turbopack configuration (moved from experimental as it's now stable)
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},

	// Production optimizations
	compress: true,
	poweredByHeader: false,
	generateEtags: true,

	// Image optimization
	images: {
		formats: ["image/webp", "image/avif"],
		minimumCacheTTL: 31536000, // 1 year
		dangerouslyAllowSVG: false,
	},

	// Headers for security and performance
	headers: async () => [
		{
			source: "/(.*)",
			headers: [
				{
					key: "X-DNS-Prefetch-Control",
					value: "on",
				},
				{
					key: "Strict-Transport-Security",
					value: "max-age=63072000; includeSubDomains; preload",
				},
			],
		},
	],

	// Redirects
	redirects: async () => [
		{
			source: "/chat",
			destination: "/",
			permanent: true,
		},
	],

	// Webpack optimizations
	webpack: (config, { dev, isServer, webpack }) => {
		// Optimize bundle size
		if (!dev && !isServer) {
			config.optimization = {
				...config.optimization,
				usedExports: true,
				sideEffects: false,
			};
		}

		// Ignore test files from pdf-parse package to prevent build errors
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /test\/data\//,
				contextRegExp: /pdf-parse/,
			})
		);

		// Add support for importing .node files (for PDF parsing)
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
			net: false,
			tls: false,
			crypto: false,
			stream: false,
			url: false,
			zlib: false,
			http: false,
			https: false,
			assert: false,
			os: false,
			path: false,
		};

		return config;
	},

	// Output configuration for standalone deployment
	output: "standalone",

	// Logging configuration
	logging: {
		fetches: {
			fullUrl: true,
		},
	},

	// TypeScript configuration
	typescript: {
		ignoreBuildErrors: false,
	},

	// ESLint configuration
	eslint: {
		ignoreDuringBuilds: false,
	},
};

export default config;
