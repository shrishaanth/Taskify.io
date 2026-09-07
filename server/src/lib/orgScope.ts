import { Types } from "mongoose";
import { AppError } from "./errors.js";

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

export function withSingleOrgScope<T extends Record<string, unknown>>(
  filter: T,
  orgId: string,
): T & { organizationId: Types.ObjectId } {
  return { ...filter, organizationId: new Types.ObjectId(orgId) };
}

export function assertResourceOrg(
  resourceOrgId: Types.ObjectId | string,
  callerOrgIds: string[],
): void {
  if (!callerOrgIds.includes(String(resourceOrgId))) {
    throw AppError.notFound();
  }
}
