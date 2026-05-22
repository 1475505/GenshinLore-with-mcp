#!/usr/bin/env node
// GenshinLore MCP Server
// Provides 3 tools: get_categories, read_lore, search_lore

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load pre-parsed lore index
const loreIndexPath = join(__dirname, "data", "lore-index.json");
const loreIndex = JSON.parse(readFileSync(loreIndexPath, "utf-8"));

// Create MCP server
const server = new McpServer({
  name: "genshinlore",
  version: "1.0.0",
});

// ─── Tool 1: get_categories ─────────────────────────────────────────────────

server.tool(
  "get_categories",
  "List all available lore categories and their section titles. Use this first to discover what content is available before reading specific lore.",
  {},
  async () => {
    const categories = Object.entries(loreIndex).map(([key, value]) => ({
      key,
      title: value.title,
      sectionCount: value.sections.length,
      sections: value.sections.map((s) => s.heading),
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(categories, null, 2),
        },
      ],
    };
  }
);

// ─── Tool 2: read_lore ──────────────────────────────────────────────────────

server.tool(
  "read_lore",
  "Read lore content for a specific category. Optionally specify a section title to read only that section. Use get_categories first to discover available categories and sections.",
  {
    category: z
      .string()
      .describe(
        "Category key (e.g. 'Fontaine', 'Teyvathis', 'basiclore_god', 'Mondstadt')"
      ),
    section: z
      .string()
      .optional()
      .describe(
        "Optional section heading to read. If omitted, returns the full document."
      ),
  },
  async ({ category, section }) => {
    const entry = loreIndex[category];
    if (!entry) {
      const availableKeys = Object.keys(loreIndex).join(", ");
      return {
        content: [
          {
            type: "text",
            text: `Category "${category}" not found. Available categories: ${availableKeys}`,
          },
        ],
        isError: true,
      };
    }

    if (section) {
      // Find matching section (case-insensitive, partial match)
      const normalizedQuery = section.toLowerCase();
      const match = entry.sections.find(
        (s) =>
          s.heading.toLowerCase() === normalizedQuery ||
          s.heading.toLowerCase().includes(normalizedQuery)
      );

      if (!match) {
        const availableSections = entry.sections
          .map((s) => s.heading)
          .join(", ");
        return {
          content: [
            {
              type: "text",
              text: `Section "${section}" not found in ${entry.title}. Available sections: ${availableSections}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `# ${entry.title}\n## ${match.heading}\n\n${match.content}`,
          },
        ],
      };
    }

    // Return full document
    let fullText = `# ${entry.title}\n\n`;
    if (entry.intro) {
      fullText += entry.intro + "\n\n";
    }
    for (const sec of entry.sections) {
      fullText += `## ${sec.heading}\n\n${sec.content}\n\n`;
    }

    return {
      content: [
        {
          type: "text",
          text: fullText,
        },
      ],
    };
  }
);

// ─── Tool 3: search_lore ────────────────────────────────────────────────────

server.tool(
  "search_lore",
  "Search across all lore documents for a keyword or phrase. Returns matching sections with snippets.",
  {
    query: z.string().describe("Search keyword or phrase"),
    max_results: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results to return (default: 10)"),
  },
  async ({ query, max_results }) => {
    const normalizedQuery = query.toLowerCase();
    const results = [];

    for (const [categoryKey, entry] of Object.entries(loreIndex)) {
      // Search intro
      if (entry.intro && entry.intro.toLowerCase().includes(normalizedQuery)) {
        results.push({
          category: categoryKey,
          title: entry.title,
          section: "(intro)",
          snippet: extractSnippet(entry.intro, normalizedQuery),
        });
      }

      // Search sections
      for (const sec of entry.sections) {
        const inHeading = sec.heading.toLowerCase().includes(normalizedQuery);
        const inContent = sec.content.toLowerCase().includes(normalizedQuery);

        if (inHeading || inContent) {
          results.push({
            category: categoryKey,
            title: entry.title,
            section: sec.heading,
            snippet: inContent
              ? extractSnippet(sec.content, normalizedQuery)
              : sec.content.slice(0, 200),
          });
        }

        if (results.length >= max_results) break;
      }
      if (results.length >= max_results) break;
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No results found for "${query}".`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractSnippet(text, query, contextChars = 150) {
  const lowerText = text.toLowerCase();
  const idx = lowerText.indexOf(query);
  if (idx === -1) return text.slice(0, contextChars * 2);

  const start = Math.max(0, idx - contextChars);
  const end = Math.min(text.length, idx + query.length + contextChars);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

// ─── Start ──────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GenshinLore MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
