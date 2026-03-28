import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserSummary {
    principal: Principal;
    role: UserRole;
    profile: UserProfile;
}
export interface UserProfile {
    status: Variant_active_suspended;
    name: string;
    email: string | null;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_suspended {
    active = "active",
    suspended = "suspended"
}
export interface backendInterface {
    registerSelf(): Promise<void>;
    addUser(principal: Principal, name: string, email: string | null, role: UserRole): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listUsers(): Promise<Array<UserSummary>>;
    removeUser(principal: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    suspendUser(principal: Principal): Promise<void>;
    unsuspendUser(principal: Principal): Promise<void>;
    updateUser(principal: Principal, name: string, email: string | null, role: UserRole): Promise<void>;
}
