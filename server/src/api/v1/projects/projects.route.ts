import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod"

import type { Variables } from "@server/lib/types";
import { db } from "@server/lib/db";
import { projectSchema, updateProjectSchema } from "@shared/schemas";
import { requireSpaceAccess } from "@server/helpers/requiresSpaceAccess";


const router = new Hono<{ Variables: Variables }>().basePath("/projects")
    .post("/", zValidator("json", projectSchema), async (c) => {

        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { name, spaceId, color, icon, image } = c.req.valid("json")

        await requireSpaceAccess(user.id, spaceId, true)


        const project = await db.project.create({
            data: {
                name, spaceId, image, icon, color

            }, include: {
                space: true
            }
        })
        if (!project) {
            throw new HTTPException(500, { message: "unable to create project" });
        }

        return c.json({ data: project })


    })
    .get("/", zValidator("query", z.object({
        spaceId: z.string()
    })), async (c) => {
        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { spaceId } = c.req.valid("query")
        if (!spaceId) {
            throw new HTTPException(400, { message: "space not found" })
        }

        await requireSpaceAccess(user.id, spaceId)

        const projects = await db.project.findMany({
            where: {
                spaceId
            }
        })
        if (!projects) {
            throw new HTTPException(500, { message: "Coundn't find any projects" })
        }

        return c.json({ data: projects })

    })
    .get("/:projectId", zValidator("query", z.object({
        spaceId: z.string()
    })), async (c) => {
        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { projectId } = c.req.param()
        if (!projectId) {
            throw new HTTPException(404, { message: "projectId not found" })
        }

        const { spaceId } = c.req.valid("query")
        if (!spaceId) {
            throw new HTTPException(404, { message: "spaceId not found" })
        }

        await requireSpaceAccess(user.id, spaceId)

        const project = await db.project.findUnique({
            where: {
                id: projectId
            }
        })

        if (!project) {
            throw new HTTPException(404, { message: "project not found" })
        }

        return c.json({ data: project })

    })

    .patch("/:projectId", zValidator("query", z.object({
        spaceId: z.string()
    })), zValidator("json", updateProjectSchema), async (c) => {
        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { projectId } = c.req.param()
        if (!projectId) {
            throw new HTTPException(404, { message: "projectId not found" })
        }

        const { spaceId } = c.req.valid("query")
        if (!spaceId) {
            throw new HTTPException(404, { message: "spaceId not found" })
        }
        await requireSpaceAccess(user.id, spaceId, true)

        const { name, color, icon, image } = c.req.valid("json")

        const updatedProject = await db.project.update({
            where: {
                id: projectId
            },
            data: {
                name, color, icon, image
            }
        })
        if (!updatedProject) {
            throw new HTTPException(500, { message: "unable to upate project " })
        }

        return c.json({
            data: updatedProject
        })
    })
    .delete("/:projectId", zValidator("query", z.object({
        spaceId: z.string()
    })), async (c) => {

        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { projectId } = c.req.param()
        if (!projectId) {
            throw new HTTPException(404, { message: "projectId not found" })
        }

        const { spaceId } = c.req.valid("query")
        if (!spaceId) {
            throw new HTTPException(404, { message: "spaceId not found" })
        }


        await requireSpaceAccess(user.id, spaceId, true)

        await db.project.delete({
            where: {
                id: projectId
            }
        })

        return c.json({
            id: projectId
        })
    })







export default router