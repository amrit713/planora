import { MemberRole } from "@server/generated/prisma";
import { db } from "@server/lib/db";
import { HTTPException } from "hono/http-exception";


export async function requireSpaceAccess(userId: string, spaceId: string, adminRequire: boolean = false) {
    const space = await db.space.findUnique({
        where: { id: spaceId },
        select: {
            id: true, organizationId: true,
            organization: {
                select: {
                    members: {
                        where: { userId },
                        select: { id: true }
                    }
                }
            },
            spaceMembers: {
                where: {
                    member: { userId }
                },
                select: { id: true, role: true }
            }
        },

    })

    if (!space) {
        throw new HTTPException(404, { message: "Space not found" });
    }

    if (space.organization.members.length === 0) {
        throw new HTTPException(403, { message: "You don't have access to this organization" });
    }


    const spaceMember = space.spaceMembers[0];

    if (!spaceMember) {
        throw new HTTPException(403, { message: "You are not a member of this space" });
    }

    if (adminRequire && spaceMember.role !== MemberRole.ADMIN) {
        throw new HTTPException(403, { message: "Admin access required" });
    }

    return space;
}
