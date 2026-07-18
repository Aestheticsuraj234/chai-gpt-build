import { tavilyClient } from "@/components/providers/tavily-provider";


export interface SearchResult {
    title: string;
    content: string;
    url: string
}

export interface WebSearchResponse {
    answers: string;
    results: SearchResult[]
}

export async function searchWeb(query: string): Promise<WebSearchResponse> {
    const response  = await tavilyClient.search(query, {
        maxResults: 5,
        searchDepth: 'advanced',
        includeAnswer: true
    })

    return {
        answers: response?.answer ?? '',
        results: response?.results.map(e => ({
            title: e?.title,
            content: e?.content,
            url: e?.url
        })) ?? []
    }
}