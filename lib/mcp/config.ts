import "server-only";

import { getAppUrl } from "@/lib/email/reminder";

// The exact redirect URI Claude uses for the MCP OAuth callback. Registered
// clients must match this (allowlist) to prevent open redirects.
export const CLAUDE_REDIRECT_URI = "https://claude.ai/api/mcp/auth_callback";

export const MCP_SERVER_NAME = "Duely";
export const MCP_SERVER_VERSION = "1.0.0";
// Latest protocol version we implement; echoed on initialize if the client
// doesn't request a specific one.
export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const MCP_SCOPE = "read";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour; Claude refreshes.
// Idle timeout for a connection: the refresh token lapses this long after its
// last use. Each refresh slides it forward, so an actively-used connection never
// expires; only one unused for this long forces a fresh consent.
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
export const AUTH_CODE_TTL_SECONDS = 5 * 60; // 5 minutes

// Base URL of this app (NEXT_PUBLIC_APP_URL, no trailing slash).
export function mcpBaseUrl() {
  return getAppUrl();
}
export function mcpResourceUrl() {
  return `${mcpBaseUrl()}/api/mcp`;
}
export function authorizationEndpoint() {
  return `${mcpBaseUrl()}/mcp/authorize`;
}
export function tokenEndpoint() {
  return `${mcpBaseUrl()}/api/mcp/token`;
}
export function registrationEndpoint() {
  return `${mcpBaseUrl()}/api/mcp/register`;
}
export function protectedResourceMetadataUrl() {
  return `${mcpBaseUrl()}/.well-known/oauth-protected-resource`;
}
