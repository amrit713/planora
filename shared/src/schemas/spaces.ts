import { z } from "zod"

export const spaceSchema = z.object({
    name: z.string().min(3, "organization name is required"),
    organizationId: z.string(),
    icon: z.string().optional(),
    color: z.string().optional()
})


export const updateSpaceSchema = z.object({
    name: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional()
}) 