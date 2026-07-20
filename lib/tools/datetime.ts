import { tool } from "ai";
import { z } from "zod";

export const datetimeTool = tool({
  description: "Get the current date and time.",
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date();
    return {
      datetime: now.toISOString(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },
});
