/**
 * Reusable OpenAPI components: schemas, responses, and security schemes.
 *
 * Schemas mirror the Prisma models in `backend/prisma/schema.prisma` and the
 * serializers in `backend/src/utils/*` (e.g. `serializeUser`). When a model or
 * serializer changes, update the matching schema here so the docs stay accurate.
 *
 * These objects are merged into the OpenAPI spec under `components.*` by
 * `swagger.ts`. Route-level `@openapi` JSDoc blocks reference them via
 * `$ref: '#/components/schemas/<Name>'`.
 */

export const securitySchemes = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "JWT issued by `/auth/login` or `/auth/signup`. Send as `Authorization: Bearer <token>`. " +
      "The frontend stores it in the `shankh-token` cookie and injects it as a Bearer header.",
  },
} as const;

/**
 * Schemas. Response models match what the API actually returns (serializers),
 * not the raw DB rows — e.g. `passwordHash` is never exposed.
 */
export const schemas = {
  // ── Core response envelope ──────────────────────────────────────────────
  Error: {
    type: "object",
    properties: {
      error: { type: "string", example: "Invalid credentials" },
    },
    required: ["error"],
  },

  SuccessFlag: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: { success: { type: "boolean", example: true } },
        required: ["success"],
      },
    },
  },

  // ── User ────────────────────────────────────────────────────────────────
  // Mirrors `serializeUser` in src/utils/auth.ts (the public projection of the
  // Prisma `User` model). Never includes passwordHash.
  User: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Ada Lovelace" },
      email: { type: "string", format: "email", example: "ada@shankh.com" },
      role: { type: "string", enum: ["learner", "admin"], example: "learner" },
      planType: { type: "string", enum: ["free", "pro"], example: "free" },
      avatarUrl: { type: "string", nullable: true, example: "https://cdn.shankh.com/a.png" },
      phone: { type: "string", nullable: true, example: "+1-555-0100" },
      isOnboarded: { type: "boolean", example: false },
      username: { type: "string", nullable: true, example: "ada" },
      profession: { type: "string", nullable: true, example: "Investment Banker" },
      level: { type: "string", nullable: true, example: "beginner" },
      goal: { type: "string", nullable: true, example: "Land a finance role" },
      firstTopic: { type: "string", nullable: true, example: "time-value-of-money" },
    },
    required: ["id", "name", "email", "role", "planType", "isOnboarded"],
  },

  AuthResponse: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          token: {
            type: "string",
            description: "JWT, valid for 7 days.",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
        required: ["user", "token"],
      },
    },
  },

  UserResponse: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: { user: { $ref: "#/components/schemas/User" } },
        required: ["user"],
      },
    },
  },

  // ── Generic envelopes ─────────────────────────────────────────────────────
  // Most endpoints wrap their payload in a top-level `data` field. Where the
  // nested shape is large or deeply nested, routes reference these generic
  // envelopes and describe the concrete shape in the operation `description`.
  DataObject: {
    type: "object",
    description: "Standard response envelope. `data` holds the resource object.",
    properties: { data: { type: "object", additionalProperties: true } },
    required: ["data"],
  },
  DataArray: {
    type: "object",
    description: "Standard response envelope. `data` holds an array of resources.",
    properties: {
      data: { type: "array", items: { type: "object", additionalProperties: true } },
    },
    required: ["data"],
  },
  CreatedCount: {
    type: "object",
    description: "Bulk-create result; `data.created` is the number of rows inserted.",
    properties: {
      data: {
        type: "object",
        properties: { created: { type: "integer", example: 3 } },
        required: ["created"],
      },
    },
  },
} as const;

/**
 * Shared responses referenced by routes via
 * `$ref: '#/components/responses/<Name>'`.
 */
export const responses = {
  BadRequest: {
    description: "Validation failed — missing or malformed input.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        example: { error: "Email and password are required" },
      },
    },
  },
  Unauthorized: {
    description: "Missing, invalid, or expired JWT.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        example: { error: "Unauthorized" },
      },
    },
  },
  Forbidden: {
    description: "Authenticated but lacks the required role (e.g. not an admin).",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        example: { error: "Forbidden" },
      },
    },
  },
  NotFound: {
    description: "The requested resource does not exist.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        example: { error: "User not found" },
      },
    },
  },
  Conflict: {
    description: "The resource conflicts with existing state (e.g. duplicate email).",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        example: { error: "Email already exists" },
      },
    },
  },
  ServerError: {
    description: "Unexpected server error.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        example: { error: "Internal server error" },
      },
    },
  },
} as const;
