import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI, organization } from "better-auth/plugins"

import { db } from "@server/lib/db";



export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true
    }, plugins: [
        openAPI(),
    ]
});