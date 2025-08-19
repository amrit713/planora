import type { Session, User } from "better-auth";

export type Variables = {
    user: User | null;
    session: Session | null;
}