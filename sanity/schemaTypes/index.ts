import { documentTypes } from "./documents";
import { objectTypes } from "./objects";

export const schemaTypes = [...documentTypes, ...objectTypes];
export const singletonTypes = new Set(["siteSettings"]);
