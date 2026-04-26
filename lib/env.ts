const ENV_SETUP_HINT =
  "Add it to the project root .env.local file and restart the dev server.";

export class MissingEnvironmentVariableError extends Error {
  constructor(name: string, options?: { aliases?: string[] }) {
    const aliasHint =
      options?.aliases && options.aliases.length > 0
        ? ` The legacy ${options.aliases.map((alias) => `"${alias}"`).join(" or ")} name is also supported.`
        : "";

    super(
      `Missing required environment variable: ${name}.${aliasHint} ${ENV_SETUP_HINT}`,
    );
    this.name = "MissingEnvironmentVariableError";
  }
}

function requireEnvValue(
  value: string | undefined,
  name: string,
  options?: { aliases?: string[] },
): string {
  if (!value) {
    throw new MissingEnvironmentVariableError(name, options);
  }

  return value;
}

export function getRequiredEnv(name: string): string {
  return requireEnvValue(process.env[name], name);
}

export function getSupabaseUrl(): string {
  return requireEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
}

export function getSupabasePublishableKey(): string {
  return requireEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    { aliases: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"] },
  );
}

export function isMissingEnvironmentVariableError(
  error: unknown,
): error is MissingEnvironmentVariableError {
  return error instanceof MissingEnvironmentVariableError;
}
