import { z } from "zod"

export const projectSchema = z.object({
    name: z.string(),
    spaceId: z.string(),
    icon: z.string().optional(),
    image: z.string()
        .transform((value) => (value === "" ? undefined : value))
        .optional(),
    color: z.string().optional(),

})

export const updateProjectSchema = z.object({
    name: z.string(),
    icon: z.string().optional(),
    image: z.string()
        .transform((value) => (value === "" ? undefined : value))
        .optional(),
    color: z.string().optional()

})