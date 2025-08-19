import { z } from "zod"

export const organizationSchema = z.object({
    name: z.string().min(1, "organization name is required"),
    logo: z.string()
        .transform((value) => (value === "" ? undefined : value))
        .optional(),

});

export const updateOrganizationSchema = z.object({
    name: z.string().trim().min(3, "Workspace must have 3 character").optional(),
    logo: z.string()
        .transform((value) => (value === "" ? undefined : value))
        .optional(),
});