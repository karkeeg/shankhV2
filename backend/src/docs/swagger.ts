/**
 * OpenAPI 3.0 spec assembly + Swagger UI mounting.
 *
 * The spec is built from:
 *  - the static `definition` below (info, servers, tags, security),
 *  - reusable `components` (schemas/responses/securitySchemes) from ./components,
 *  - `@openapi` JSDoc blocks scanned from the route files (see `apis`).
 *
 * Mounted by `mountDocs(app)` in app.ts:
 *  - Swagger UI  ->  GET /api/docs
 *  - Raw spec    ->  GET /api/docs.json
 */

import path from "path";
import type { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { schemas, responses, securitySchemes } from "./components";

// When running via ts-node the source is .ts; after `tsc` build it's .js in dist.
// Detect from this module's own extension so the route glob resolves in both.
const ext = path.extname(__filename); // ".ts" under ts-node, ".js" after build
// glob (used by swagger-jsdoc) requires forward slashes, even on Windows.
const routesGlob = path.join(__dirname, "..", "routes", `*${ext}`).replace(/\\/g, "/");

const definition: swaggerJsdoc.Options["definition"] = {
  openapi: "3.0.3",
  info: {
    title: "Shankh Platform API",
    version: "1.0.0",
    description:
      "REST API for the Shankh learning & skill-building platform.\n\n" +
      "All routes are mounted under `/api/v1`. Authentication uses a JWT " +
      "(`Authorization: Bearer <token>`), issued by `/auth/login` and `/auth/signup`.",
  },
  servers: [
    {
      url: "{base}/api/v1",
      description: "Configurable server",
      variables: {
        base: {
          default: "http://localhost:4000",
          description: "Backend origin (set to your deployment URL in production).",
        },
      },
    },
  ],
  tags: [
    { name: "Auth", description: "Login, signup, profile, and onboarding." },
    { name: "Content", description: "Curriculum hierarchy: modules, topics, subtopics, lessons." },
    { name: "Session", description: "Activity submissions (MCQ, canvas, quantus) and grading cascade." },
    { name: "Draft", description: "In-progress activity draft state." },
    { name: "Progress", description: "Curriculum progress metrics across the hierarchy." },
    { name: "Skill", description: "Skill-building: sections, professions, bundles, and bundle progress." },
    { name: "Admin", description: "Administrative content & user management (admin role required)." },
    { name: "Activities", description: "Activity definitions and legacy attempt submission." },
    { name: "Reactions", description: "Lesson reactions." },
    { name: "Bookmarks", description: "User bookmarks." },
    { name: "Cases", description: "Case studies." },
  ],
  components: {
    securitySchemes: securitySchemes as Record<string, unknown>,
    schemas: schemas as Record<string, unknown>,
    responses: responses as Record<string, unknown>,
  },
  // Applied to every operation unless an operation overrides it with `security: []`.
  security: [{ bearerAuth: [] }],
};

export const openapiSpec = swaggerJsdoc({
  definition,
  apis: [routesGlob],
});

/** Mount Swagger UI at /api/docs and the raw JSON spec at /api/docs.json. */
export function mountDocs(app: Express): void {
  app.get("/api/docs.json", (_req, res) => {
    res.json(openapiSpec);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: "Shankh API Docs",
      swaggerOptions: { persistAuthorization: true },
    })
  );
}
