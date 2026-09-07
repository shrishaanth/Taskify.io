export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export interface ErrorBody {
  message: string;
  code: ErrorCode;
  details?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  toBody(): ErrorBody {
    return this.details === undefined
      ? { message: this.message, code: this.code }
      : { message: this.message, code: this.code, details: this.details };
  }

  static unauthenticated(message = "Authentication required") {
    return new AppError("UNAUTHENTICATED", message);
  }
  static forbidden(message = "You do not have permission to do that") {
    return new AppError("FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new AppError("NOT_FOUND", message);
  }
  static conflict(message: string) {
    return new AppError("CONFLICT", message);
  }
  static validation(message: string, details?: unknown) {
    return new AppError("VALIDATION_ERROR", message, details);
  }
}
