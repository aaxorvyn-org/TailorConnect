export interface HealthResponse {
  status: string;
  message: string;
}

export interface DatabaseHealth {
  status: string;
  connected: boolean;
  message: string;
  host: string;
  database: string;
  error?: string | null;
}

export interface DetailedHealthResponse extends HealthResponse {
  app_name: string;
  environment: string;
  database: DatabaseHealth;
}
