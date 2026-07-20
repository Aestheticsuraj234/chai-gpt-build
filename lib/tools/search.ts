import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export const searchTool = tool({
  description: "Search the web for current information, news, and facts.",
  inputSchema: z.object({
    query: z.string().describe("The search query to execute"),
  }),
  execute: async (args: { query: string }) => {
    try {
      const response = await tvly.search(args.query, {
        searchDepth: "basic",
        maxResults: 5,
      });
      return response.results.map(r => ({ title: r.title, content: r.content, url: r.url }));
    } catch (error) {
      console.error("Tavily Search Error:", error);
      return { error: "Failed to perform web search." };
    }
  },
});
