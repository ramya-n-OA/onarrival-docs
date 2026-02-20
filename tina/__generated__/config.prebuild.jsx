// tina/config.ts
import { defineConfig, LocalAuthProvider } from "tinacms";
var isLocal = true;
var config_default = defineConfig({
  contentApiUrlOverride: "/api/tina/gql",
  authProvider: isLocal ? new LocalAuthProvider() : void 0,
  branch: process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main",
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      // ============================================
      // DOCUMENTATION PAGES
      // ============================================
      {
        name: "docs",
        label: "Documentation",
        path: "content/docs",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return values?.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
            }
          }
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            options: [
              { label: "Get Started", value: "get-started" },
              { label: "Integration Guide", value: "integration-guide" },
              { label: "Code Samples", value: "code-samples" },
              { label: "Events & Webhooks", value: "events-webhooks" },
              { label: "Support", value: "support" }
            ]
          },
          {
            type: "number",
            name: "order",
            label: "Display Order"
          },
          {
            type: "rich-text",
            name: "body",
            label: "Content",
            isBody: true,
            templates: [
              {
                name: "callout",
                label: "Callout",
                fields: [
                  {
                    type: "string",
                    name: "type",
                    label: "Type",
                    options: ["note", "tip", "warning", "danger", "info"]
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Title"
                  },
                  {
                    type: "rich-text",
                    name: "children",
                    label: "Content"
                  }
                ]
              },
              {
                name: "codeBlock",
                label: "Code Block",
                fields: [
                  {
                    type: "string",
                    name: "language",
                    label: "Language",
                    options: [
                      "javascript",
                      "typescript",
                      "python",
                      "json",
                      "bash",
                      "kotlin",
                      "swift",
                      "dart",
                      "yaml",
                      "http"
                    ]
                  },
                  {
                    type: "string",
                    name: "code",
                    label: "Code",
                    ui: {
                      component: "textarea"
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      // ============================================
      // HOMEPAGE
      // ============================================
      {
        name: "homepage",
        label: "Homepage",
        path: "content/pages",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false
          }
        },
        fields: [
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              {
                type: "string",
                name: "badge",
                label: "Badge Text"
              },
              {
                type: "string",
                name: "title",
                label: "Title"
              },
              {
                type: "string",
                name: "titleHighlight",
                label: "Title Highlight (gradient text)"
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "primaryCta",
                label: "Primary Button Text"
              },
              {
                type: "string",
                name: "primaryCtaLink",
                label: "Primary Button Link"
              },
              {
                type: "string",
                name: "secondaryCta",
                label: "Secondary Button Text"
              },
              {
                type: "string",
                name: "secondaryCtaLink",
                label: "Secondary Button Link"
              }
            ]
          },
          {
            type: "object",
            name: "codePreview",
            label: "Code Preview Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title"
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "code",
                label: "Code Example",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "object",
                name: "features",
                label: "Feature List",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "label",
                    label: "Label"
                  },
                  {
                    type: "string",
                    name: "desc",
                    label: "Description"
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "quickstart",
            label: "Quickstart Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title"
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "object",
                name: "steps",
                label: "Steps",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "step",
                    label: "Step Number"
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Title"
                  },
                  {
                    type: "string",
                    name: "desc",
                    label: "Description"
                  },
                  {
                    type: "string",
                    name: "code",
                    label: "Code Snippet"
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "features",
            label: "Features Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title"
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "object",
                name: "items",
                label: "Feature Items",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "icon",
                    label: "Icon Name",
                    description: "Lucide icon name: Zap, Shield, CreditCard, Webhook"
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Title"
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Description"
                  },
                  {
                    type: "string",
                    name: "color",
                    label: "Color",
                    options: ["emerald", "blue", "violet", "amber", "rose", "cyan"]
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "cta",
            label: "CTA Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title"
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "primaryCta",
                label: "Primary Button Text"
              },
              {
                type: "string",
                name: "primaryCtaLink",
                label: "Primary Button Link"
              },
              {
                type: "string",
                name: "secondaryCta",
                label: "Secondary Button Text"
              },
              {
                type: "string",
                name: "secondaryCtaLink",
                label: "Secondary Button Link"
              }
            ]
          }
        ]
      },
      // ============================================
      // SITE SETTINGS
      // ============================================
      {
        name: "settings",
        label: "Site Settings",
        path: "content/settings",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false
          }
        },
        fields: [
          {
            type: "object",
            name: "site",
            label: "Site Info",
            fields: [
              {
                type: "string",
                name: "name",
                label: "Site Name"
              },
              {
                type: "string",
                name: "description",
                label: "Site Description"
              },
              {
                type: "string",
                name: "logo",
                label: "Logo Text"
              }
            ]
          },
          {
            type: "object",
            name: "environments",
            label: "Environments",
            fields: [
              {
                type: "string",
                name: "uatUrl",
                label: "UAT Base URL"
              },
              {
                type: "string",
                name: "prodUrl",
                label: "Production Base URL"
              }
            ]
          },
          {
            type: "object",
            name: "footer",
            label: "Footer",
            fields: [
              {
                type: "string",
                name: "copyright",
                label: "Copyright Text"
              },
              {
                type: "object",
                name: "links",
                label: "Footer Links",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "label",
                    label: "Label"
                  },
                  {
                    type: "string",
                    name: "href",
                    label: "URL"
                  }
                ]
              }
            ]
          }
        ]
      },
      // ============================================
      // NAVIGATION
      // ============================================
      {
        name: "navigation",
        label: "Navigation",
        path: "content/navigation",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false
          }
        },
        fields: [
          {
            type: "object",
            name: "sections",
            label: "Navigation Sections",
            list: true,
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title"
              },
              {
                type: "string",
                name: "icon",
                label: "Icon Name",
                description: "Lucide icon: Home, BookOpen, Code, HelpCircle"
              },
              {
                type: "object",
                name: "items",
                label: "Items",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Title"
                  },
                  {
                    type: "string",
                    name: "href",
                    label: "URL"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
