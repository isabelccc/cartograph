import { createRemoteJWKSet, jwtVerify } from "jose";

export type VerifiedIdentity = {
  readonly subject: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly tenantId: string | null;
  readonly role: string | null;
};

export type OidcVerifier = {
  verifyJwt(token: string): Promise<VerifiedIdentity>;
};

export function createOidcVerifier(opts: {
  readonly issuer: string;
  readonly audience: string;
  readonly jwksUrl: string;
}): OidcVerifier {
  const JWKS = createRemoteJWKSet(new URL(opts.jwksUrl));
  return {
    async verifyJwt(token: string): Promise<VerifiedIdentity> {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: opts.issuer,
        audience: opts.audience,
      });
      const subject = typeof payload.sub === "string" ? payload.sub : "";
      if (subject.length === 0) {
        throw new Error("missing subject claim");
      }
      const tenantId = typeof payload.org_id === "string"
        ? payload.org_id
        : typeof payload.tenant_id === "string"
          ? payload.tenant_id
          : null;
      const role = typeof payload.role === "string"
        ? payload.role
        : Array.isArray(payload.roles) && typeof payload.roles[0] === "string"
          ? payload.roles[0]
          : null;
      return {
        subject,
        email: typeof payload.email === "string" ? payload.email : null,
        name: typeof payload.name === "string" ? payload.name : null,
        tenantId,
        role,
      };
    },
  };
}
