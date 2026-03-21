import { startClient } from "./client";

export interface ExposeOptions {
  customSubdomain?: string;
  verbose?: boolean;
  token?: string;
  email?: string;
  serverUrl?: string;
}

export function expose(port: number, options?: ExposeOptions) {
  startClient(port, options || {});
}
