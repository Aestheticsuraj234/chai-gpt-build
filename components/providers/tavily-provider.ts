import {tavily} from '@tavily/core'

export const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY!,
})