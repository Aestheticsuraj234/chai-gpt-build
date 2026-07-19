import {tool} from 'ai'
import {z} from 'zod'
import { searchWeb } from '../services/web-search.service'


export const webSearchTool = tool({
    description: `
        Search the public internet for up-to-date information.

        Use this tool whenever the user asks about:

        - latest news
        - current events
        - today's information
        - software releases
        - recent APIs
        - sports
        - stock prices
        - weather
        - anything after your knowledge cutoff.

        Do NOT use this tool for timeless knowledge.
    `,
    inputSchema: z.object({
        query: z.string().describe('Search Query')
    }),
    execute: async ({query}) => {
        return await searchWeb(query)
    }
})