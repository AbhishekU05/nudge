"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingEnvironmentVariableError = void 0;
exports.getRequiredEnv = getRequiredEnv;
exports.getSupabaseUrl = getSupabaseUrl;
exports.getSupabasePublishableKey = getSupabasePublishableKey;
exports.isMissingEnvironmentVariableError = isMissingEnvironmentVariableError;
const ENV_SETUP_HINT = "Add it to the project root .env.local file and restart the dev server.";
class MissingEnvironmentVariableError extends Error {
    constructor(name, options) {
        const aliasHint = options?.aliases && options.aliases.length > 0
            ? ` The legacy ${options.aliases.map((alias) => `"${alias}"`).join(" or ")} name is also supported.`
            : "";
        super(`Missing required environment variable: ${name}.${aliasHint} ${ENV_SETUP_HINT}`);
        this.name = "MissingEnvironmentVariableError";
    }
}
exports.MissingEnvironmentVariableError = MissingEnvironmentVariableError;
function requireEnvValue(value, name, options) {
    if (!value) {
        throw new MissingEnvironmentVariableError(name, options);
    }
    return value;
}
function getRequiredEnv(name) {
    return requireEnvValue(process.env[name], name);
}
function getSupabaseUrl() {
    return requireEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
}
function getSupabasePublishableKey() {
    return requireEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", { aliases: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"] });
}
function isMissingEnvironmentVariableError(error) {
    return error instanceof MissingEnvironmentVariableError;
}
