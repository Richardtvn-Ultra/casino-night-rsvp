import { handleRsvp } from "./src/handlers/rsvp.js";
import { handleAdminLogin } from "./src/handlers/adminLogin.js";
import { handleAdminRsvps } from "./src/handlers/adminRsvps.js";
import { handleRsvpCount } from "./src/handlers/rsvpCount.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/rsvp" && request.method === "POST") {
      return handleRsvp(request, env);
    }
    if (url.pathname === "/api/rsvp-count" && request.method === "GET") {
      return handleRsvpCount(request, env);
    }
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      return handleAdminLogin(request, env);
    }
    if (url.pathname === "/api/admin/rsvps" && request.method === "GET") {
      return handleAdminRsvps(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
