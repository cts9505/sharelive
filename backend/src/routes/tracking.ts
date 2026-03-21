import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma";
import { analyticsBuffer } from "../services/analytics";

const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function getClientIp(request: any) {
  return request.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()
    || request.ip
    || request.socket.remoteAddress
    || "unknown";
}

export async function trackingRoutes(fastify: FastifyInstance) {
  fastify.get("/t/:projectId/pixel.gif", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (project) {
      analyticsBuffer.addVisit(projectId, getClientIp(request));
    }

    reply
      .header("Content-Type", "image/gif")
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .header("Pragma", "no-cache")
      .header("Expires", "0")
      .header("Access-Control-Allow-Origin", "*");

    return reply.send(TRACKING_PIXEL);
  });

  fastify.post("/t/:projectId/event", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (project) {
      analyticsBuffer.addVisit(projectId, getClientIp(request));
    }

    reply
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Methods", "POST, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type");

    return reply.send({ success: true });
  });

  fastify.options("/t/:projectId/event", async (_request, reply) => {
    reply
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Methods", "POST, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type");

    return reply.status(204).send();
  });

  fastify.get("/t/:projectId/script.js", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const script = `
(function() {
  var pid = "${projectId}";
  var endpoint = "https://sharelive.site/t/" + pid;
  function trackPageView() {
    var img = new Image();
    img.src = endpoint + "/pixel.gif?t=" + Date.now() + "&url=" + encodeURIComponent(window.location.href);
  }
  if (document.readyState === "complete") {
    trackPageView();
  } else {
    window.addEventListener("load", trackPageView);
  }
  var pushState = history.pushState;
  history.pushState = function() {
    pushState.apply(history, arguments);
    setTimeout(trackPageView, 0);
  };
  window.addEventListener("popstate", trackPageView);
})();
`;

    reply
      .header("Content-Type", "application/javascript")
      .header("Cache-Control", "public, max-age=3600")
      .header("Access-Control-Allow-Origin", "*");

    return reply.send(script);
  });
}
