export type BackendEnv = "staging" | "prod" | "custom";

export interface BackendConnectionConfig {
  env: BackendEnv;
  customUrl?: string;
}

export interface HealthStatus {
  status: "ok" | "db_unreachable" | "unreachable";
  env: BackendEnv;
  targetUrl: string;
  latencyMs?: number;
}

export type WorkspaceTab = "overview" | "decks" | "study" | "scan";
