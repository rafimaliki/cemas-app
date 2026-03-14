export const swaggerConfig = {
  openapi: "3.0.0",
  info: {
    title: "Compliance Management API",
    version: "1.0.0",
    description: "API documentation for Compliance Management System",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "authToken",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          avatar: { type: "string" },
          role: {
            type: "string",
            enum: ["Administrator", "Contributor", "Auditor"],
          },
          status: { type: "string", enum: ["Active", "Inactive"] },
          lastLogin: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Compliance: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          expiry_date: { type: "string", format: "date-time", nullable: true },
        },
      },
      Criteria: {
        type: "object",
        properties: {
          id: { type: "integer" },
          prefix: { type: "string" },
          compliance_id: { type: "integer" },
          parent_id: { type: "integer", nullable: true },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          level: { type: "integer" },
          pic_id: { type: "integer", nullable: true },
          status: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Tag: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Evidence: {
        type: "object",
        properties: {
          id: { type: "integer" },
          file_name: { type: "string" },
          file_path: { type: "string" },
          drive_file_id: { type: "string" },
          uploaded_by: { type: "integer" },
          uploaded_at: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          id: { type: "integer" },
          criteria_id: { type: "integer" },
          user_id: { type: "integer" },
          comment: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ComplianceAccess: {
        type: "object",
        properties: {
          id: { type: "integer" },
          compliance_id: { type: "integer" },
          auditor_id: { type: "integer" },
          accessible: { type: "boolean" },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    // Users routes
    "/users": {
      get: {
        summary: "Get all users",
        description: "Retrieve a list of all users in the system",
        tags: ["Users"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Get user by ID",
        description: "Retrieve a specific user by their ID",
        tags: ["Users"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "User ID",
          },
        ],
        responses: {
          "200": {
            description: "User details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "404": {
            description: "User not found",
          },
        },
      },
    },
    "/users/whitelist": {
      post: {
        summary: "Whitelist a new user",
        description: "Add a new user to the whitelist",
        tags: ["Users"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  role: {
                    type: "string",
                    enum: ["Administrator", "Contributor", "Auditor"],
                  },
                },
                required: ["name", "email", "role"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
          },
          "400": {
            description: "Invalid input or user already exists",
          },
        },
      },
    },

    // Authentication routes
    "/auth/google": {
      get: {
        summary: "Google OAuth Login",
        description: "Redirect to Google for authentication",
        tags: ["Authentication"],
        responses: {
          "302": {
            description: "Redirect to Google",
          },
        },
      },
    },
    "/auth/callback/google": {
      get: {
        summary: "Google OAuth Callback",
        description: "Callback endpoint for Google OAuth",
        tags: ["Authentication"],
        parameters: [
          {
            name: "code",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "302": {
            description: "Redirect to frontend with authentication result",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current user",
        description: "Get information about the currently authenticated user",
        tags: ["Authentication"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Current user info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    email: { type: "string" },
                    name: { type: "string" },
                    picture: { type: "string" },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout user",
        description: "Log out the current user by clearing their auth token",
        tags: ["Authentication"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Logged out successfully",
          },
        },
      },
    },

    // Compliance routes
    "/compliance": {
      get: {
        summary: "Get all compliances",
        description: "Retrieve a list of all compliance standards",
        tags: ["Compliance"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of compliances",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Compliance",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
      post: {
        summary: "Create a new compliance",
        description: "Create a new compliance standard",
        tags: ["Compliance"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  expiry_date: { type: "string", format: "date-time" },
                },
                required: ["name", "description"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Compliance created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      $ref: "#/components/schemas/Compliance",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid input",
          },
        },
      },
    },
    "/compliance/{id}": {
      get: {
        summary: "Get compliance by ID",
        description: "Retrieve a specific compliance by its ID",
        tags: ["Compliance"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Compliance ID",
          },
        ],
        responses: {
          "200": {
            description: "Compliance details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      $ref: "#/components/schemas/Compliance",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Compliance not found",
          },
        },
      },
    },
    "/compliance/{id}/edit": {
      put: {
        summary: "Update compliance",
        description: "Update an existing compliance standard",
        tags: ["Compliance"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Compliance ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  expiry_date: { type: "string", format: "date-time" },
                },
                required: ["name", "description"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Compliance updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      $ref: "#/components/schemas/Compliance",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Compliance not found",
          },
        },
      },
    },
    "/compliance/import-excel": {
    post: {
      summary: "Import compliance from Excel",
      description: "Create a new compliance with criteria from an Excel file with prefix and name columns",
      tags: ["Compliance"],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "Excel file with criteria data (prefix and name columns)"
                },
                name: {
                  type: "string",
                  description: "Name of the compliance standard"
                },
                description: {
                  type: "string",
                  description: "Description of the compliance standard"
                },
                expiryDate: {
                  type: "string",
                  format: "date-time",
                  description: "Optional expiry date for the compliance"
                }
              },
              required: ["file", "name", "description"]
            }
          }
        }
      },
      responses: {
        "201": {
          description: "Compliance import successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      complianceId: { type: "integer" }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          description: "Invalid input"
        },
        "500": {
          description: "Import failed"
        }
      }
    }
  },
    "/compliance/{id}/delete": {
      delete: {
        summary: "Delete compliance",
        description: "Delete a compliance standard and its associated criteria",
        tags: ["Compliance"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Compliance ID",
          },
        ],
        responses: {
          "200": {
            description: "Compliance deleted successfully",
          },
          "404": {
            description: "Compliance not found",
          },
        },
      },
    },

    // Criteria routes
    "/criteria/create": {
      post: {
        summary: "Create a new criteria",
        description: "Create a new criteria for a compliance standard",
        tags: ["Criteria"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  compliance_id: { type: "integer" },
                  parent_id: { type: "integer", nullable: true },
                  prefix: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string", nullable: true },
                  level: { type: "integer" },
                  pic_id: { type: "integer", nullable: true },
                  status: { type: "string" },
                },
                required: [
                  "compliance_id",
                  "prefix",
                  "name",
                  "level",
                  "status",
                ],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Criteria created",
          },
          "400": {
            description: "Invalid input",
          },
        },
      },
    },
    "/criteria/{id}/edit": {
      put: {
        summary: "Update criteria",
        description: "Update an existing criteria",
        tags: ["Criteria"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Criteria ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  compliance_id: { type: "integer" },
                  parent_id: { type: "integer", nullable: true },
                  prefix: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string", nullable: true },
                  level: { type: "integer" },
                  pic_id: { type: "integer", nullable: true },
                  status: { type: "string" },
                },
                required: [
                  "compliance_id",
                  "prefix",
                  "name",
                  "level",
                  "status",
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Criteria updated successfully",
          },
          "404": {
            description: "Criteria not found",
          },
        },
      },
    },
    "/criteria/{id}/delete": {
      delete: {
        summary: "Delete criteria",
        description: "Delete a criteria and its child criteria",
        tags: ["Criteria"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Criteria ID",
          },
        ],
        responses: {
          "200": {
            description: "Criteria deleted successfully",
          },
          "404": {
            description: "Criteria not found",
          },
        },
      },
    },
    "/criteria/compliance/{complianceId}": {
      get: {
        summary: "Get criteria by compliance ID",
        description: "Retrieve all criteria for a specific compliance standard",
        tags: ["Criteria"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "complianceId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Compliance ID",
          },
        ],
        responses: {
          "200": {
            description: "List of criteria for the compliance",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Criteria",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Evidence routes
    "/evidence": {
      get: {
        summary: "Get all evidences",
        description: "Retrieve a list of all evidences",
        tags: ["Evidence"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of evidence",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Evidence",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/evidence/{id}": {
      get: {
        summary: "Get evidence by ID",
        description: "Retrieve a specific evidence by its ID",
        tags: ["Evidence"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Evidence ID",
          },
        ],
        responses: {
          "200": {
            description: "Evidence details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      $ref: "#/components/schemas/Evidence",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Evidence not found",
          },
        },
      },
    },
    "/evidence/e-criteria/all": {
      get: {
        summary: "Get all evidence-criteria relationships",
        description: "Retrieve all relationships between evidence and criteria",
        tags: ["Evidence"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of evidence-criteria relationships",
          },
        },
      },
    },
    "/evidence/e-criteria/create": {
      post: {
        summary: "Create evidence-criteria relationship",
        description: "Associate an evidence with a criteria",
        tags: ["Evidence"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  criteria_id: { type: "integer" },
                  evidence_id: { type: "integer" },
                },
                required: ["criteria_id", "evidence_id"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Relationship created successfully",
          },
          "400": {
            description: "Invalid input or relationship already exists",
          },
        },
      },
    },
    "/evidence/e-criteria/{id}/delete": {
      delete: {
        summary: "Delete evidence-criteria relationship",
        description:
          "Remove the association between an evidence and a criteria",
        tags: ["Evidence"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Relationship ID",
          },
        ],
        responses: {
          "200": {
            description: "Relationship deleted successfully",
          },
          "404": {
            description: "Relationship not found",
          },
        },
      },
    },
    "/evidence/by-criteria/{criteriaId}": {
      get: {
        summary: "Get evidences by criteria ID",
        description:
          "Retrieve all evidences associated with a specific criteria",
        tags: ["Evidence"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "criteriaId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Criteria ID",
          },
        ],
        responses: {
          "200": {
            description: "List of evidences for the criteria",
          },
        },
      },
    },
    "/evidence/criteria-by-evidence/{evidenceId}": {
      get: {
        summary: "Get criteria by evidence ID",
        description:
          "Retrieve all criteria associated with a specific evidence",
        tags: ["Evidence"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "evidenceId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Evidence Drive ID",
          },
        ],
        responses: {
          "200": {
            description: "List of criteria for the evidence",
          },
          "404": {
            description: "Evidence not found",
          },
        },
      },
    },
    "/evidence/e-criteria/from-tag": {
      post: {
        summary: "Create evidence-criteria relationship by tag",
        description:
          "Associate an evidence with all criteria having a specific tag",
        tags: ["Evidence"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  drive_file_id: { type: "string" },
                  tag_id: { type: "integer" },
                },
                required: ["drive_file_id", "tag_id"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Relationships created successfully",
          },
          "400": {
            description: "Invalid input",
          },
          "404": {
            description: "Evidence, tag, or criteria not found",
          },
        },
      },
    },

    // Comment routes
    "/comment/criteria/{criteriaId}": {
      get: {
        summary: "Get comments by criteria ID",
        description: "Retrieve all comments for a specific criteria",
        tags: ["Comments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "criteriaId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Criteria ID",
          },
        ],
        responses: {
          "200": {
            description: "List of comments for the criteria",
          },
          "404": {
            description: "Criteria not found",
          },
        },
      },
    },
    "/comment/{criteriaId}": {
      post: {
        summary: "Create comment",
        description: "Add a comment to a criteria",
        tags: ["Comments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "criteriaId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Criteria ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  comment: { type: "string" },
                },
                required: ["comment"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Comment added successfully",
          },
          "400": {
            description: "Invalid input",
          },
          "404": {
            description: "Criteria not found",
          },
        },
      },
    },
    "/comment/{commentId}": {
      get: {
        summary: "Get comment by ID",
        description: "Retrieve a specific comment by its ID",
        tags: ["Comments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Comment ID",
          },
        ],
        responses: {
          "200": {
            description: "Comment details",
          },
          "404": {
            description: "Comment not found",
          },
        },
      },
      put: {
        summary: "Update comment",
        description: "Update an existing comment",
        tags: ["Comments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Comment ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  comment: { type: "string" },
                },
                required: ["comment"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Comment updated successfully",
          },
          "403": {
            description: "Permission denied",
          },
          "404": {
            description: "Comment not found",
          },
        },
      },
      delete: {
        summary: "Delete comment",
        description: "Delete a comment",
        tags: ["Comments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Comment ID",
          },
        ],
        responses: {
          "200": {
            description: "Comment deleted successfully",
          },
          "403": {
            description: "Permission denied",
          },
          "404": {
            description: "Comment not found",
          },
        },
      },
    },

    // Tag routes
    "/tag": {
      get: {
        summary: "Get all tags",
        description: "Retrieve a list of all tags",
        tags: ["Tags"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of tags",
          },
        },
      },
    },
    "/tag/create": {
      post: {
        summary: "Create a new tag",
        description: "Create a new tag for criteria categorization",
        tags: ["Tags"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
                required: ["name", "description"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Tag created successfully",
          },
          "400": {
            description: "Invalid input",
          },
        },
      },
    },
    "/tag/{id}": {
      get: {
        summary: "Get tag by ID",
        description: "Retrieve a specific tag by its ID",
        tags: ["Tags"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Tag ID",
          },
        ],
        responses: {
          "200": {
            description: "Tag details",
          },
          "404": {
            description: "Tag not found",
          },
        },
      },
    },
    "/tag/with-criteria": {
      get: {
        summary: "Get tags with criteria",
        description: "Retrieve all tags with their associated criteria",
        tags: ["Tags"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of tags with criteria",
          },
        },
      },
    },
    "/tag/{id}/delete": {
      delete: {
        summary: "Delete tag",
        description: "Delete a tag",
        tags: ["Tags"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Tag ID",
          },
        ],
        responses: {
          "200": {
            description: "Tag deleted successfully",
          },
          "404": {
            description: "Tag not found",
          },
        },
      },
    },

    // Google Drive routes
    "/drive/upload": {
      post: {
        summary: "Upload file to Google Drive",
        description:
          "Upload a file to Google Drive and create an evidence record",
        tags: ["Google Drive"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                  expiryDate:{
                type: "string",
                format: "date",
                }
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "File uploaded successfully",
          },
          "400": {
            description: "Invalid input",
          },
          "500": {
            description: "Upload failed",
          },
        },
      },
    },
    "/drive/view": {
      get: {
        summary: "List files from Google Drive",
        description: "Retrieve a list of files from Google Drive",
        tags: ["Google Drive"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "query",
            in: "query",
            schema: {
              type: "string",
            },
            description: "Search query",
          },
          {
            name: "startDate",
            in: "query",
            schema: {
              type: "string",
              format: "date",
            },
            description: "Start date for filtering",
          },
          {
            name: "endDate",
            in: "query",
            schema: {
              type: "string",
              format: "date",
            },
            description: "End date for filtering",
          },
        ],
        responses: {
          "200": {
            description: "List of files",
          },
          "500": {
            description: "Failed to fetch files",
          },
        },
      },
    },
    "/drive/delete": {
      delete: {
        summary: "Delete file from Google Drive",
        description:
          "Delete a file from Google Drive and remove associated evidence record",
        tags: ["Google Drive"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "fileId",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            description: "Google Drive file ID",
          },
        ],
        responses: {
          "200": {
            description: "File deleted successfully",
          },
          "400": {
            description: "Invalid input",
          },
          "500": {
            description: "Delete failed",
          },
        },
      },
    },

    // Compliance Access routes
    "/compliance-access/create": {
      post: {
        summary: "Create compliance access",
        description: "Grant access to a compliance for an auditor",
        tags: ["Compliance Access"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  compliance_id: { type: "integer" },
                  auditor_id: { type: "integer" },
                  accessible: { type: "boolean" },
                },
                required: ["compliance_id", "auditor_id", "accessible"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Access created successfully",
          },
          "400": {
            description: "Invalid input or access already exists",
          },
          "404": {
            description: "Compliance or auditor not found",
          },
        },
      },
    },
    "/compliance-access/{id}": {
      put: {
        summary: "Update compliance access",
        description: "Update access settings for a compliance and auditor",
        tags: ["Compliance Access"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Access record ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  compliance_id: { type: "integer" },
                  auditor_id: { type: "integer" },
                  accessible: { type: "boolean" },
                },
                required: ["compliance_id", "auditor_id", "accessible"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Access updated successfully",
          },
          "404": {
            description: "Access record not found",
          },
        },
      },
      delete: {
        summary: "Delete compliance access",
        description: "Remove access for a compliance and auditor",
        tags: ["Compliance Access"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Access record ID",
          },
        ],
        responses: {
          "200": {
            description: "Access deleted successfully",
          },
          "404": {
            description: "Access record not found",
          },
        },
      },
    },
    "/compliance-access/compliance/{complianceId}/auditor/{auditorId}": {
      delete: {
        summary: "Delete compliance access by compliance and auditor",
        description:
          "Delete access record for a specific compliance and auditor combination",
        tags: ["Compliance Access"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "complianceId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Compliance ID",
          },
          {
            name: "auditorId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Auditor ID",
          },
        ],
        responses: {
          "200": {
            description: "Access deleted successfully",
          },
          "400": {
            description: "Invalid compliance or auditor ID",
          },
          "404": {
            description: "Access record not found",
          },
        },
      },
    },
    "/compliance-access/compliance/{complianceId}": {
      get: {
        summary: "Get access by compliance ID",
        description: "Retrieve all access records for a specific compliance",
        tags: ["Compliance Access"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "complianceId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Compliance ID",
          },
        ],
        responses: {
          "200": {
            description: "List of access records",
          },
        },
      },
    },
    "/compliance-access/auditor/{auditorId}": {
      get: {
        summary: "Get access by auditor ID",
        description: "Retrieve all access records for a specific auditor",
        tags: ["Compliance Access"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "auditorId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Auditor ID",
          },
        ],
        responses: {
          "200": {
            description: "List of access records",
          },
        },
      },
    },
    "/api/dashboard": {
      get: {
        summary: "Get dashboard information",
        description: "Retrieve dashboard information",
        tags: ["Dashboard"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Dashboard information retrieved successfully",
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/logs": {
      get: {
        summary: "Get logs",
        description: "Retrieve logs",
        tags: ["Logs"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Logs retrieved successfully",
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
    },
  },
};
