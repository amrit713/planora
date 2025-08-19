import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod"

import { organizationSchema, } from "@shared/schemas";
import type { Variables } from "@server/lib/types";
import { db } from "@server/lib/db";
import { MemberRole } from "@server/generated/prisma";
import { updateOrganizationSchema } from "@shared/schemas/organizations";



const router = new Hono<{ Variables: Variables }>()
    .post(
        "/organizations",
        zValidator("json", organizationSchema), async (c) => {

            const user = c.get("user")
            if (!user) {
                throw new HTTPException(401, { message: "unauthorized" });
            }

            const { name, logo } = c.req.valid("json");
            const organization = await db.organization.create({
                data: {
                    name, logo,
                    members: {
                        create: [
                            {
                                userId: user.id,
                                role: MemberRole.ADMIN,
                            },
                        ],
                    },


                }, include: { members: true }
            })
            if (!organization) {
                throw new HTTPException(500, { message: "unable to create" });
            }



            return c.json({ data: organization });
        }

    )
    .get("/organizations", async (c) => {

        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const members = await db.member.findMany({
            where: {
                userId: user.id
            }
        })
        if (!members || members.length === 0) {
            throw new HTTPException(500, {
                message: "You are not not member of this organization",
            });
        }

        const organizationIds = members.map((member) => member.organizationId);

        const organizations = await db.organization.findMany({
            where: {
                id: {
                    in: organizationIds
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })
        if (!organizations) {
            throw new HTTPException(500, {
                message: "Couldn't find any organizations",
            });
        }

        return c.json({ data: organizations });

    })
    .get("/organizations/:organizationId", async c => {

        const user = c.get("user");
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized user" });
        }

        const { organizationId } = c.req.param()
        if (!organizationId) {
            throw new HTTPException(400, { message: "organizationId not found" })
        }

        const organization = await db.organization.findUnique({
            where: {
                id: organizationId
            }
        })
        if (!organization) {
            throw new HTTPException(500, {
                message: "Couldn't find any workspaces",
            })
        };

        return c.json({ data: organization })

    })
    .patch("/organizations/:organizationId", zValidator("json", updateOrganizationSchema), async c => {

        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { organizationId } = c.req.param()
        if (!organizationId) {
            throw new HTTPException(400, { message: "organizationId not found" })
        }

        const { name, logo } = c.req.valid("json")


        //TODO: need to make user.id and organization unique
        const member = await db.member.findFirst({
            where: {
                userId: user.id, organizationId
            }
        })
        if (!member || member.role !== MemberRole.ADMIN) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const organization = await db.organization.update({
            where: {
                id: organizationId,
            },
            data: {
                name, logo
            }
        })
        if (!organization) {
            throw new HTTPException(400, {
                message: `No organization found with this ID: ${organizationId}`,
            });
        }

        return c.json({ data: organization })
    })
    .delete("/organizations/:organizationId", async c => {
        const user = c.get("user")
        if (!user) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        const { organizationId } = c.req.param()
        if (!organizationId) {
            throw new HTTPException(400, { message: "organizationId not found" })
        }

        const member = await db.member.findFirst({
            where: {
                userId: user.id, organizationId
            }
        })
        if (!member || member.role !== MemberRole.ADMIN) {
            throw new HTTPException(401, { message: "unauthorized" });
        }

        await db.organization.delete({
            where: {
                id: organizationId,
            },
        });

        return c.json({
            data: {
                id: organizationId,
            },
        });

    })




export default router