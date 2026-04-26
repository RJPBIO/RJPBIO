/* SCIM 2.0 /Schemas — RFC 7643 §7.
   Okta consume estos para entender qué atributos podemos crear/leer.
   Sprint 12: incluye User core + Group core (subset implementado). */

import { NextResponse } from "next/server";

const USER_SCHEMA = {
  id: "urn:ietf:params:scim:schemas:core:2.0:User",
  name: "User",
  description: "User account",
  attributes: [
    {
      name: "userName", type: "string", required: true, uniqueness: "server",
      caseExact: false, mutability: "readWrite", returned: "default", multiValued: false,
    },
    {
      name: "displayName", type: "string", multiValued: false,
      mutability: "readWrite", returned: "default",
    },
    {
      name: "active", type: "boolean", multiValued: false,
      mutability: "readWrite", returned: "default",
    },
    {
      name: "emails", type: "complex", multiValued: true,
      mutability: "readWrite", returned: "default",
      subAttributes: [
        { name: "value", type: "string", required: true },
        { name: "primary", type: "boolean" },
        { name: "type", type: "string" },
      ],
    },
    {
      name: "name", type: "complex", multiValued: false,
      mutability: "readWrite", returned: "default",
      subAttributes: [
        { name: "formatted", type: "string" },
        { name: "givenName", type: "string" },
        { name: "familyName", type: "string" },
      ],
    },
    {
      name: "externalId", type: "string", multiValued: false,
      mutability: "readWrite", returned: "default", caseExact: true,
    },
  ],
  meta: { resourceType: "Schema", location: "/api/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:User" },
};

const GROUP_SCHEMA = {
  id: "urn:ietf:params:scim:schemas:core:2.0:Group",
  name: "Group",
  description: "Group resource",
  attributes: [
    {
      name: "displayName", type: "string", required: true, multiValued: false,
      mutability: "readWrite", returned: "default",
    },
    {
      name: "members", type: "complex", multiValued: true,
      mutability: "readWrite", returned: "default",
      subAttributes: [
        { name: "value", type: "string", required: true },
        { name: "display", type: "string" },
        { name: "type", type: "string" },
      ],
    },
  ],
  meta: { resourceType: "Schema", location: "/api/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:Group" },
};

export function GET() {
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: 2,
    itemsPerPage: 2,
    startIndex: 1,
    Resources: [USER_SCHEMA, GROUP_SCHEMA],
  });
}
