import { Type } from "typebox";

import { sdkRequest } from "../operations";
import { cursorField, limitField } from "../schemas";
import type { DefinedTool, ToolFactory } from "../toolTypes";
import { getVideoGenClient } from "../videoGenClient";

const entityIdField = Type.String({ description: "Entity id (vg_enti_...)." });
const entityBrandConfigField = Type.Object({
  fonts: Type.String({ description: "Font guidance." }),
  colors: Type.String({ description: "Color guidance, including hex codes when available." }),
  writingStyle: Type.String({ description: "Voice and tone for copy." }),
});
const entityTypeField = Type.Union(
  [
    Type.Literal("ACTOR"),
    Type.Literal("PRODUCT"),
    Type.Literal("VISUAL_STYLE"),
    Type.Literal("SLIDESHOW_THEME"),
    Type.Literal("BRAND"),
    Type.Literal("LOCATION"),
    Type.Literal("PROP"),
  ],
  { description: "Entity type." },
);

export function buildEntityTools(tool: ToolFactory): DefinedTool[] {
  return [
    tool({
      name: "list_entities",
      label: "List entities",
      description:
        "List ACTOR, PRODUCT, VISUAL_STYLE, SLIDESHOW_THEME, BRAND, LOCATION, and PROP entities on the team. Filter with entityType when you only need one kind.",
      parameters: Type.Object({
        entityType: Type.Optional(entityTypeField),
        cursor: cursorField,
        limit: limitField,
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.entities.listEntities(sdkRequest(params));
      },
    }),

    tool({
      name: "create_entity",
      label: "Create entity",
      description:
        "Create an ACTOR (character), PRODUCT (something the user sells or promotes), VISUAL_STYLE, SLIDESHOW_THEME, BRAND, LOCATION (place or set), or PROP (background object that is not for sale) entity. Anything the user sells is a PRODUCT, never a PROP. A BRAND accepts brandConfig with fonts, colors, and writingStyle. After create, attach reference images with add_entity_reference (upload the image first).",
      parameters: Type.Object({
        entityType: entityTypeField,
        name: Type.String({ minLength: 1, description: "Display name for the entity." }),
        description: Type.Optional(Type.String({ description: "Optional longer description." })),
        brandConfig: Type.Optional(entityBrandConfigField),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.entities.createEntity(sdkRequest(params));
      },
    }),

    tool({
      name: "get_entity",
      label: "Get entity",
      description: "Fetch one entity by id, including its reference images.",
      parameters: Type.Object({ entityId: entityIdField }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.entities.getEntity(params);
      },
    }),

    tool({
      name: "update_entity",
      label: "Update entity",
      description: "Update an entity's display name, description, or complete brandConfig.",
      parameters: Type.Object({
        entityId: entityIdField,
        name: Type.Optional(
          Type.String({ minLength: 1, description: "New display name. Omit to leave unchanged." }),
        ),
        description: Type.Optional(
          Type.String({ description: "New description. Omit to leave unchanged." }),
        ),
        brandConfig: Type.Optional(entityBrandConfigField),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.entities.updateEntity(sdkRequest(params));
      },
    }),

    tool({
      name: "archive_entity",
      label: "Archive entity",
      description: "Archive an entity so it no longer appears in lists or pickers.",
      parameters: Type.Object({ entityId: entityIdField }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.entities.archiveEntity(params);
      },
    }),

    tool({
      name: "add_entity_reference",
      label: "Add entity reference",
      description:
        "Attach an uploaded image file (vg_file_...) as a reference on an entity. For a BRAND, set role BRAND_LOGO for its overlay logo or BRAND_STYLE_GUIDE for its visual generation reference. For new PRODUCT or ACTOR entities, set isDefault to true.",
      parameters: Type.Object({
        entityId: entityIdField,
        fileId: Type.String({
          description: "Image file id (vg_file_...) to attach as a reference.",
        }),
        description: Type.Optional(
          Type.String({ description: "Optional description of this reference image." }),
        ),
        role: Type.Optional(
          Type.Union(
            [
              Type.Literal("REFERENCE"),
              Type.Literal("BRAND_LOGO"),
              Type.Literal("BRAND_STYLE_GUIDE"),
            ],
            {
              description:
                "What the file is used for. Defaults to REFERENCE. BRAND_LOGO and BRAND_STYLE_GUIDE are only for BRAND entities.",
            },
          ),
        ),
        isDefault: Type.Optional(
          Type.Boolean({
            description: "When true, make this the primary reference. Defaults to false.",
          }),
        ),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.entities.addEntityReference(sdkRequest(params));
      },
    }),

    tool({
      name: "remove_entity_reference",
      label: "Remove entity reference",
      description: "Detach a reference image from an entity by file id.",
      parameters: Type.Object({
        entityId: entityIdField,
        fileId: Type.String({
          description: "Reference image file id (vg_file_...) to remove.",
        }),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.entities.removeEntityReference(params);
      },
    }),
  ];
}
