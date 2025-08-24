import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod"

import type { Variables } from "@server/lib/types";
import { db } from "@server/lib/db";
import { spaceSchema, updateSpaceSchema } from "@shared/schemas";
import { MemberRole } from "@server/generated/prisma";


const router = new Hono<{ Variables: Variables }>().basePath("/spaces")
    .post("/", zValidator("json", spaceSchema), async (c) => {

        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { name, organizationId, color, icon } = c.req.valid("json")

        const member = await db.member.findFirst({
            where: {
                userId: user.id, organizationId
            }
        })


        if (!member || member.role !== MemberRole.ADMIN) {
            throw new HTTPException(401, { message: "unauthorized " });
        }

        const space = await db.space.create({
            data: {
                name, organizationId, color, icon,
                spaceMembers: {
                    create: [
                        {
                            memberId: member.id,
                            role: member.role
                        }
                    ]
                }
            },
            include: { spaceMembers: true }
        })
        if (!space) {
            throw new HTTPException(500, { message: "unable to create space" });
        }

        return c.json({ data: space })


    }).get("/", zValidator("query", z.object({
        organizationId: z.string()
    })), async (c) => {
        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { organizationId } = c.req.valid("query")
        if (!organizationId) {
            throw new HTTPException(400, { message: "organizationId not found" })
        }

        const spaces = await db.space.findMany({
            where: {
                organizationId
            }
        })
        if (!spaces) {
            throw new HTTPException(500, { message: "Coundn't find any spaces" })
        }

        return c.json({ data: spaces })

    })
    .get("/:spaceId",
        zValidator("query", z.object({
            organizationId: z.string()
        }))
        , async c => {
            const user = c.get("user")
            if (!user) {
                throw new HTTPException(401, { message: "unauthorized" });
            }

            const { spaceId } = c.req.param()
            if (!spaceId) {
                throw new HTTPException(400, { message: "spaceId not found" })
            }

            const { organizationId } = c.req.valid("query")
            if (!organizationId) {
                throw new HTTPException(400, { message: "organizationId not found" })
            }

            const member = await db.member.findFirst({
                where: {
                    organizationId, userId: user.id
                }
            })
            if (!member) {
                throw new HTTPException(500, {
                    message: "You are not not member of this organization",
                });
            }

            const space = await db.space.findUnique({
                where: {
                    id: spaceId,
                    organizationId
                }
            })

            if (!space) {
                throw new HTTPException(400, {
                    message: `No space found with this ID: ${spaceId}`,
                });
            }

            const spaceMember = await db.spaceMember.findFirst({
                where: {
                    spaceId: space.id,
                    memberId: member.id,
                }
            })

            if (!spaceMember) {
                throw new HTTPException(401, { message: "you are not a member of this space" })
            }

            return c.json({
                data: space
            })
        })
    .patch("/:spaceId",
        zValidator("query", z.object({
            organizationId: z.string()
        })), zValidator("json", updateSpaceSchema),
        async c => {
            const user = c.get("user")
            if (!user) {
                throw new HTTPException(401, { message: "unauthorized" });
            }

            const { spaceId } = c.req.param()
            if (!spaceId) {
                throw new HTTPException(400, { message: "spaceId not found" })
            }

            const { organizationId } = c.req.valid("query")
            if (!organizationId) {
                throw new HTTPException(400, { message: "organizationId not found" })
            }

            const { name, color, icon } = c.req.valid("json")

            const member = await db.member.findFirst({
                where: {
                    organizationId, userId: user.id
                }
            })

            if (!member) {
                throw new HTTPException(500, {
                    message: "You are not a member of this organization",
                });
            }

            const spaceMember = await db.spaceMember.findFirst({
                where: {
                    memberId: member.id,
                    spaceId,
                    role: MemberRole.ADMIN
                }
            })

            if (!spaceMember) {
                throw new HTTPException(401, { message: "you are not allow to edit space" })
            }


            const updatedSpace = await db.space.update({
                where: {
                    id: spaceId,
                    organizationId,
                },
                data: {
                    name, color, icon
                }
            })

            if (!updatedSpace) {
                throw new HTTPException(500, {
                    message: `Unable to update space`,
                });
            }

            return c.json({
                data: updatedSpace
            })
        })
    .delete("/:spaceId",
        zValidator("query", z.object({
            organizationId: z.string()
        })),
        async c => {
            const user = c.get("user")
            if (!user) {
                throw new HTTPException(401, { message: "unauthorized" });
            }

            const { spaceId } = c.req.param()
            if (!spaceId) {
                throw new HTTPException(400, { message: "spaceId not found" })
            }

            const { organizationId } = c.req.valid("query")
            if (!organizationId) {
                throw new HTTPException(400, { message: "organizationId not found" })
            }


            const member = await db.member.findFirst({
                where: {
                    organizationId, userId: user.id
                }
            })

            if (!member) {
                throw new HTTPException(500, {
                    message: "You are not a member of this organization",
                });
            }

            const spaceMember = await db.spaceMember.findFirst({
                where: {
                    memberId: member.id,
                    spaceId,
                    role: MemberRole.ADMIN
                }
            })

            if (!spaceMember) {
                throw new HTTPException(401, { message: "you are not allow to delete this space" })
            }


            await db.space.delete({
                where: {
                    id: spaceId,
                    organizationId,
                }
            })


            return c.json({
                data: spaceId
            })
        })




export default router