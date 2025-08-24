import { Hono } from "hono";
import { cors } from "hono/cors";

import { auth } from "@server/api/v1/user/auth";
import type { Variables } from "./lib/types";
import OrganizationsRoute from "./api/v1/organizations/organization.route";
import SpaceRoute from "./api/v1/spaces/spaces.route"
import ProjectRoute from "./api/v1/projects/projects.route"

export const app = new Hono<{ Variables: Variables }>().use(cors())

app.use("*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	c.set("user", session.user);
	c.set("session", session.session);
	return next();
});

const routes = [OrganizationsRoute, SpaceRoute, ProjectRoute]


app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

routes.forEach((route) => {
	app.route("/api/v1", route)
})

export default app;