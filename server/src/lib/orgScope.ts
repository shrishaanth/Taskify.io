import { Types } from "mongoose";
import { AppError } from "./errors.js";

/**
 * Tenant-isolation helpers (spec §3). Every query that returns org-scoped data
 * must go through one of these, not an ad-hoc per-controller filter.
 */

/** Add `organizationId ∈ callerOrgIds` to a Mongo filter. */
export function withOrgScope<T extends Record<string, unknown>>(
  filter: T,
  callerOrgIds: string[],
): T & { organizationId: { $in: Types.ObjectId[] } } {
  return {
    ...filter,
    organizationId: {
      $in: callerOrgIds.map((id) => new Types.ObjectId(id)),
    },
  };
}

/** Scope to exactly one org (URL-scoped routes like `/orgs/:orgId/...`). */
export function withSingleOrgScope<T extends Record<string, unknown>>(
  filter: T,
  orgId: string,
): T & { organizationId: Types.ObjectId } {
  return { ...filter, organizationId: new Types.ObjectId(orgId) };
}

/**
 * Throw an indistinguishable 404 if a resource's org is not one the caller
 * belongs to. Use after a `findById` that could not be org-filtered up front.
 */
export function assertResourceOrg(
  resourceOrgId: Types.ObjectId | string,
  callerOrgIds: string[],
): void {
  if (!callerOrgIds.includes(String(resourceOrgId))) {
    throw AppError.notFound();
  }
}
