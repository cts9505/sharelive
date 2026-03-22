import WebSocket from "ws";
import http from "http";
import { IncomingMessage } from "http";
import { ExposeOptions } from "./index";

const DEFAULT_SERVER_URL = "https://tunnel.sharelive.site";

function resolveTunnelWebSocketUrl(serverUrl?: string): string {
  const rawServerUrl = serverUrl || process.env.SHARELIVE_URL || DEFAULT_SERVER_URL;
  const normalizedUrl = new URL(rawServerUrl);

  if (normalizedUrl.protocol === "http:") {
    normalizedUrl.protocol = "ws:";
  } else if (normalizedUrl.protocol === "https:") {
    normalizedUrl.protocol = "wss:";
  }

  if (normalizedUrl.pathname === "/" || normalizedUrl.pathname === "") {
    normalizedUrl.pathname = "/tunnel";
  }

  return normalizedUrl.toString();
}

/**
 * Safely read entire HTTP response into a buffer.
 */
function streamToBuffer(stream: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/**
 * Format log message with timestamp and colors
 */
function logRequest(method: string, path: string, status: number, verbose: boolean) {
  if (!verbose) return;

  const timestamp = new Date().toISOString();
  const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
  const reset = '\x1b[0m';
  const methodColor = '\x1b[36m';

  console.log(`${timestamp} ${methodColor}${method}${reset} ${path} ${statusColor}${status}${reset}`);
}

export function startClient(port: number, options: ExposeOptions) {
  const { customSubdomain, verbose = false, token, email, serverUrl } = options;

  const ws = new WebSocket(resolveTunnelWebSocketUrl(serverUrl));

  ws.on("open", () => {
    console.log("🔗 Connected to ShareLive tunnel server");

    // Send authentication token if available
    if (token) {
      ws.send(JSON.stringify({
        type: "auth",
        token: token
      }));
    }

    // Send custom subdomain if provided
    if (customSubdomain) {
      ws.send(JSON.stringify({
        type: "register",
        subdomain: customSubdomain
      }));
    }
  });

  ws.on("error", (err) => {
    console.error("❌ Tunnel connection failed:", err.message);
  });

  ws.on("message", async (raw) => {
    const msg = JSON.parse(raw.toString());

    if (msg.type === "authenticated") {
      console.log(`✅ Authenticated as ${email}`);
      return;
    }

    if (msg.type === "tunnel_created") {
      console.log(`\n✅ Tunnel active!`);
      console.log(`📡 Public URL: \x1b[32mhttps://${msg.subdomain}.sharelive.site\x1b[0m`);
      console.log(`🔌 Forwarding to: localhost:${port}`);
      if (msg.authenticated && email) {
        console.log(`🔐 Authenticated tunnel for ${email}`);
      }
      if (msg.expiresAt) {
        console.log(`⏳ Expires at: ${msg.expiresAt}`);
      } else {
        console.log(`♾️ No automatic tunnel expiry configured on the server.`);
      }
      console.log(`\n⚡ Tunnel will stay alive even if local port ${port} is not running yet.`);
      console.log(`   Start your server on port ${port} whenever you're ready!\n`);
      if (verbose) {
        console.log(`📊 Verbose logging enabled. Watching for requests...\n`);
      }
      return;
    }

    if (msg.type === "error") {
      console.error(`\n❌ Error: ${msg.message}`);
      if (msg.message.includes("already in use")) {
        console.log(`💡 Try a different subdomain name or let it be auto-generated.\n`);
      }
      process.exit(1);
    }

    if (msg.type !== "request") return;

    const { requestId, method, path, headers } = msg;

    const options = {
      hostname: "localhost",
      port,
      path: path,
      method: method,
      headers: {
        ...headers,
        // ✅ Override the host header so local server accepts it
        host: `localhost:${port}`,
        "accept-encoding": "identity"
      }
    };

    const proxyReq = http.request(options, async (res) => {
      try {
        const bodyBuffer = await streamToBuffer(res);
        const responseHeaders = { ...res.headers };

        delete responseHeaders["content-length"];
        delete responseHeaders["content-encoding"];
        delete responseHeaders["transfer-encoding"];
        delete responseHeaders["connection"];

        const status = res.statusCode || 200;
        logRequest(method, path, status, verbose);

        ws.send(JSON.stringify({
          type: "response",
          requestId: requestId,
          status: status,
          headers: responseHeaders,
          // Sending as Base64 string over WebSocket
          body: bodyBuffer.toString("base64")
        }));

      } catch (err) {
        console.error(`❌ Error reading response from localhost:${port}:`, err);
        logRequest(method, path, 500, verbose);

        ws.send(JSON.stringify({
          type: "response",
          requestId: requestId,
          status: 500,
          headers: { "content-type": "text/plain" },
          body: Buffer.from("Tunnel read error").toString("base64")
        }));
      }
    });

    proxyReq.on("error", (err) => {
      // ✅ Improved error handling - tunnel stays alive
      const errorMessage = `⚠️  Nothing running on localhost:${port}\n\nYou can still keep this tunnel open and start your server later.\nThe tunnel URL remains active and ready to forward requests.`;

      if (verbose) {
        console.log(`\n${errorMessage}\n`);
        console.log(`📝 Request details: ${method} ${path}`);
        console.log(`💡 Error: ${err.message}\n`);
      }

      logRequest(method, path, 502, verbose);

      ws.send(JSON.stringify({
        type: "response",
        requestId: requestId,
        status: 502,
        headers: { "content-type": "text/html" },
        body: Buffer.from(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Tunnel Active - Server Not Running</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                max-width: 600px;
                margin: 100px auto;
                padding: 20px;
                text-align: center;
              }
              .status { font-size: 64px; margin-bottom: 20px; }
              h1 { color: #333; }
              p { color: #666; line-height: 1.6; }
              .info { background: #f0f0f0; padding: 20px; border-radius: 8px; margin-top: 20px; }
              code { background: #333; color: #fff; padding: 2px 8px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="status">🚀</div>
            <h1>Tunnel is Active!</h1>
            <p>Nothing is running on <code>localhost:${port}</code> yet.</p>
            <div class="info">
              <p><strong>Your tunnel URL is ready and waiting.</strong></p>
              <p>Start your local server on port ${port}, and requests will automatically be forwarded.</p>
              <p>The tunnel will stay active until you close it with Ctrl+C.</p>
            </div>
          </body>
          </html>
        `).toString("base64")
      }));
    });

    // If the incoming public request had a body (like a POST),
    // you would write it to proxyReq here before calling end().
    proxyReq.end();
  });

  process.on("SIGINT", () => {
    console.log("\n\n👋 Closing tunnel...");
    ws.close();
    process.exit(0);
  });
}
