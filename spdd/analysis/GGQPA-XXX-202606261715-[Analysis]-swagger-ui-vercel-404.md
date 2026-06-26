# SPDD Analysis: Swagger UI Vercel 404 Fix

## Original Business Requirement
```
api-docs:70  GET https://divi-backend.vercel.app/api-docs/swagger-ui-standalone-preset.js net::ERR_ABORTED 404 (Not Found)
api-docs:69  GET https://divi-backend.vercel.app/api-docs/swagger-ui-bundle.js net::ERR_ABORTED 404 (Not Found)
api-docs:8  GET https://divi-backend.vercel.app/api-docs/swagger-ui.css net::ERR_ABORTED 404 (Not Found)
layout.js:99 Warning: escaping deep link whitespace with `_` will be unsupported in v4.0, use `%20` instead.
(anonymous) @ layout.js:99
(anonymous) @ utils.js:177
(anonymous) @ redux.js:546
(anonymous) @ index.js:14
(anonymous) @ system.js:175
(anonymous) @ system.js:487
(anonymous) @ index.js:175
SwaggerUI @ index.js:213
window.onload @ swagger-ui-init.js:2020
favicon-32x32.png:1  GET https://divi-backend.vercel.app/api-docs/favicon-32x32.png 404 (Not Found)
favicon-16x16.png:1  GET https://divi-backend.vercel.app/api-docs/favicon-16x16.png 404 (Not Found)
```
Fix the Swagger UI 404 errors when deployed on Vercel.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **NestJS Swagger Integration**: The `@nestjs/swagger` module used in `backend/src/main.ts` to generate and serve the `api-docs` endpoint.
- **Static Assets Serving**: Swagger UI relies on static files (JS, CSS, favicons) bundled within its node package.
- **Serverless Deployment (Vercel)**: The backend is deployed as a serverless function on Vercel, which has specific constraints regarding the serving of static files from `node_modules`.

#### New Concepts Required
- **CDN-based Swagger UI Asset Delivery**: Overriding the default local asset loading in NestJS Swagger to load all necessary JS, CSS, and favicon assets exclusively from a CDN, bypassing the need for the Vercel serverless function to serve them from local paths.

#### Key Business Rules
- The API Documentation must be fully accessible and styled correctly when deployed to production (Vercel).
- Security and CORS configurations (`app.enableCors`) must remain intact while serving the API docs.

## Strategic Approach

#### Solution Direction
The issue arises because Vercel Serverless Functions do not serve static files from `node_modules` (where `@nestjs/swagger` keeps its UI assets) out of the box unless explicitly included and routed. While `main.ts` attempts to inject CDN assets via `customJs` and `customCssUrl`, the default behavior of `@nestjs/swagger` in older/certain versions is to still try to load local assets (`./swagger-ui-bundle.js`, etc.) if not completely overridden or if the CDN options aren't fully intercepting the default template.

The approach will be to modify the `SwaggerModule.setup` configuration in `main.ts` to fully patch how assets are loaded, ensuring that Vercel does not attempt to serve any local Swagger UI static files, relying 100% on a CDN (e.g., cdnjs or unpkg), including the favicons.

#### Key Design Decisions
- **Rely on CDN vs Include Static Files in Build**: 
  - *Trade-offs*: Including static files requires complex `vercel.json` routing and build steps to copy assets from `node_modules`. Using a CDN is much simpler and requires only changes to `main.ts`, but relies on an external network request for the UI assets.
  - *Recommendation*: Use CDN. It aligns with the existing partial attempt in `main.ts` and avoids Vercel build complexity.

#### Alternatives Considered
- **Copying Swagger Assets during Build**: Modifying the build script to copy Swagger UI assets to a `public` folder and using `@nestjs/serve-static`. Rejected because it adds unnecessary bloat to the deployment and build pipeline.

## Risk & Gap Analysis

#### Requirement Ambiguities
- The exact `@nestjs/swagger` version (`^7.4.2`) behavior for asset overriding can sometimes be finicky. We need to ensure we override the exact paths it requests.

#### Edge Cases
- If the CDN goes down, the API documentation UI will not load (though the JSON specification at `/api-docs-json` would still be available).

#### Technical Risks
- **Asset version mismatch**: If the CDN versions of `swagger-ui` do not match the expected versions of the generated Swagger document, UI glitches could occur. Mitigation: Pin the CDN version to match the expected UI version for `@nestjs/swagger` v7.4.2.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | `swagger-ui-standalone-preset.js` loads without 404 | Yes | Will be routed to CDN or removed if redundant |
| 2 | `swagger-ui-bundle.js` loads without 404 | Yes | Will be routed to CDN |
| 3 | `swagger-ui.css` loads without 404 | Yes | Will be routed to CDN |
| 4 | `favicon-32x32.png` and `16x16` load without 404 | Yes | Will use `customfavIcon` option to point to a valid URL or disable |
