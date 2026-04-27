import { and, eq } from "drizzle-orm";
import type { AppDb } from "../client.js";
import { tenantMemberships, tenants, users } from "../schema/index.js";

export type TenantRecord = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type UserRecord = {
  readonly id: string;
  readonly externalSubject: string;
  readonly email: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TenantMembershipRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly role: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

function ensureAuthzTables(db: AppDb): void {
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id text primary key,
      slug text not null,
      name text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id text primary key,
      external_subject text not null,
      email text not null,
      name text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS tenant_memberships (
      id text primary key,
      tenant_id text not null references tenants(id) on delete cascade,
      user_id text not null references users(id) on delete cascade,
      role text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
}

export function createAuthzRepository(db: AppDb) {
  ensureAuthzTables(db);
  return {
    async saveTenant(row: TenantRecord): Promise<void> {
      await db
        .insert(tenants)
        .values(row)
        .onConflictDoUpdate({
          target: tenants.id,
          set: {
            slug: row.slug,
            name: row.name,
            updatedAt: row.updatedAt,
          },
        });
    },
    async saveUser(row: UserRecord): Promise<void> {
      await db
        .insert(users)
        .values(row)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            externalSubject: row.externalSubject,
            email: row.email,
            name: row.name,
            updatedAt: row.updatedAt,
          },
        });
    },
    async saveMembership(row: TenantMembershipRecord): Promise<void> {
      await db
        .insert(tenantMemberships)
        .values(row)
        .onConflictDoUpdate({
          target: tenantMemberships.id,
          set: {
            tenantId: row.tenantId,
            userId: row.userId,
            role: row.role,
            updatedAt: row.updatedAt,
          },
        });
    },
    async findMembership(tenantId: string, userId: string): Promise<TenantMembershipRecord | null> {
      const [row] = await db
        .select()
        .from(tenantMemberships)
        .where(and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.userId, userId)))
        .limit(1);
      return row ?? null;
    },
    async listUsersForTenant(tenantId: string): Promise<
      ReadonlyArray<{
        readonly user: UserRecord;
        readonly membership: TenantMembershipRecord;
      }>
    > {
      const rows = await db
        .select({
          user: users,
          membership: tenantMemberships,
        })
        .from(tenantMemberships)
        .innerJoin(users, eq(users.id, tenantMemberships.userId))
        .where(eq(tenantMemberships.tenantId, tenantId));
      return rows;
    },
  };
}
