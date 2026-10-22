/**
 * TTR Technology Sanity project. The project ID is public (it is in every
 * image URL); set it as NEXT_PUBLIC_SANITY_PROJECT_ID (repository variable
 * SANITY_PROJECT_ID for the GitHub workflows). Without it the site uses its
 * built-in content and /cms explains what to set.
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2025-02-19";
