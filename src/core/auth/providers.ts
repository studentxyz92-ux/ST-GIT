import type { AuthProvider, ProviderConfig } from "../types.js";

function getEnv(name: string): string {
  return process.env[name] || "";
}

/**
 * Provider configurations for all supported Git providers.
 * Each provider implements the OAuth device flow protocol.
 */
export const PROVIDERS: Record<AuthProvider, ProviderConfig> = {
  github: {
    id: "github",
    name: "GitHub",
    color: "#24292e",
    deviceCodeUrl: "https://github.com/login/device/code",
    tokenUrl: "https://github.com/login/oauth/access_token",
    apiBaseUrl: "https://api.github.com",
    userInfoUrl: "https://api.github.com/user",
    defaultScopes: ["read:user", "repo", "read:org"],
    clientIdEnvVar: "DEVSCORE_GITHUB_CLIENT_ID",
    getClientId: () =>
      getEnv("DEVSCORE_GITHUB_CLIENT_ID") || "Ov23liDevScoreDev",
  },

  gitlab: {
    id: "gitlab",
    name: "GitLab",
    color: "#fc6d26",
    deviceCodeUrl: "https://gitlab.com/oauth/authorize",
    tokenUrl: "https://gitlab.com/oauth/token",
    apiBaseUrl: "https://gitlab.com/api/v4",
    userInfoUrl: "https://gitlab.com/api/v4/user",
    defaultScopes: ["read_user", "read_api", "read_repository"],
    clientIdEnvVar: "DEVSCORE_GITLAB_CLIENT_ID",
    getClientId: () => getEnv("DEVSCORE_GITLAB_CLIENT_ID") || "",
  },

  bitbucket: {
    id: "bitbucket",
    name: "Bitbucket",
    color: "#0052cc",
    deviceCodeUrl: "https://bitbucket.org/site/oauth2/device",
    tokenUrl: "https://bitbucket.org/site/oauth2/access_token",
    apiBaseUrl: "https://api.bitbucket.org/2.0",
    userInfoUrl: "https://api.bitbucket.org/2.0/user",
    defaultScopes: ["account", "repository", "pullrequest"],
    clientIdEnvVar: "DEVSCORE_BITBUCKET_CLIENT_ID",
    getClientId: () => getEnv("DEVSCORE_BITBUCKET_CLIENT_ID") || "",
  },
};

/**
 * Validate that a provider has a client ID configured.
 */
export function validateProviderConfig(provider: AuthProvider): {
  valid: boolean;
  missingEnv?: string;
} {
  const config = PROVIDERS[provider];
  if (!config) return { valid: false, missingEnv: undefined };

  const clientId = config.getClientId();
  if (!clientId) {
    return { valid: false, missingEnv: config.clientIdEnvVar };
  }

  return { valid: true };
}

/**
 * Get all available providers (that have client IDs configured).
 */
export function getAvailableProviders(): AuthProvider[] {
  return (Object.keys(PROVIDERS) as AuthProvider[]).filter((p) => {
    const cfg = PROVIDERS[p];
    return !!cfg.getClientId();
  });
}

/**
 * Pretty-print a provider name with its color for terminal output.
 */
export function formatProvider(provider: AuthProvider): string {
  const config = PROVIDERS[provider];
  return config ? `${config.name}` : provider;
}
