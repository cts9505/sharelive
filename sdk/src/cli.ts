#!/usr/bin/env node

import { Command } from "commander";
import { expose } from "./index";
import { version } from "../package.json";
import { loginCommand } from "./commands/login";
import { logoutCommand } from "./commands/logout";
import { loadConfig } from "./config";

const program = new Command();

program
  .name("sharelive")
  .description("Expose your localhost to the internet via secure tunnel")
  .version(version);

// Login command
program
  .command('login')
  .description('Login to your ShareLive account')
  .action(async () => {
    await loginCommand();
  });

// Logout command
program
  .command('logout')
  .description('Logout from your ShareLive account')
  .action(() => {
    logoutCommand();
  });

// Default command (tunnel)
program
  .option("-p, --port <port>", "Local port to expose", "3000")
  .option("-n, --name <subdomain>", "Custom subdomain (optional, must be unique)")
  .option("-v, --verbose", "Enable verbose logging of incoming requests", false)
  .action((options) => {
    const port = parseInt(options.port, 10);

    if (isNaN(port) || port < 1 || port > 65535) {
      console.error("❌ Invalid port number. Must be between 1 and 65535.");
      process.exit(1);
    }

    // Load stored config
    const config = loadConfig();

    expose(port, {
      customSubdomain: options.name,
      verbose: options.verbose,
      token: config.token,
      email: config.email,
      serverUrl: config.serverUrl,
    });
  });

program.parse(process.argv);
