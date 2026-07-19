import { getUserMessageCount, loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { SYSTEM_PROMPT } from "@/features/ai/system/system-prompt";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/action/require-user";
import { tools } from "@/features/tools";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, createIdGenerator, createUIMessageStreamResponse, stepCountIs, streamText, toUIMessageStream, type UIMessage } from "ai";

const MAX_MESSAGES_PER_CONVERSATION = 8;
/**
 * POST /api/chat — Streams an AI assistant reply for a conversation.
 *
 * Validates auth and ownership, persists the user message, then streams the
 * assistant response via the AI SDK. Final messages are saved when the stream ends.
 */
export async function POST(req: Request) {
    await auth.protect();

    const body = await req.json() as {
        conversationId?: string;
        id?: string;
        branchId?: string;
        message?: unknown;
    };

    const conversationId = body.conversationId ?? body.id;
    const { branchId, message } = body;

    if (!message || !conversationId) {
        return new Response("Missing message or conversation id", { status: 400 });
    }

    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId: user.id,
        },
    });

    if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
    }

    const activeBranch = branchId
        ? await prisma.branch.findFirst({
            where: {
                id: branchId,
                conversationId,
                conversation: {
                    userId: user.id,
                },
            },
            select: { id: true },
        })
        : await prisma.branch.findFirst({
            where: {
                conversationId,
            },
            orderBy: {
                createdAt: "asc",
            },
            select: { id: true },
        });

    if (!activeBranch) {
        return new Response("Branch not found", { status: 404 });
    }

    const previousMessages = await loadChatMessages(conversationId, activeBranch.id);
    const userMessageCount = await getUserMessageCount(conversationId);

    const inputMessage = message as Partial<UIMessage> & { text?: string };

    const alreadySaved = previousMessages.some(
        (storedMessage) => storedMessage.id === inputMessage.id
    );

    if (!alreadySaved && userMessageCount >= MAX_MESSAGES_PER_CONVERSATION) {
        return new Response(`You can only send ${MAX_MESSAGES_PER_CONVERSATION} messages per conversation.`, { status: 429 });
    }

    const normalizedMessage: UIMessage = {
        id: inputMessage.id ?? `user-${Date.now()}`,
        role: inputMessage.role === "assistant" ? "assistant" : "user",
        parts: (Array.isArray(inputMessage.parts) && inputMessage.parts.length > 0
            ? inputMessage.parts
            : [{ type: "text", text: inputMessage.text ?? "" }]) as UIMessage["parts"],
    };

    const messages = alreadySaved ? previousMessages : [...previousMessages, normalizedMessage];

    if (!alreadySaved) {
        await saveChatMessages(conversationId, [normalizedMessage], { branchId: activeBranch.id });
    }

    const system = conversation.systemPrompt
        ? `${SYSTEM_PROMPT}\n\n${conversation.systemPrompt}`
        : SYSTEM_PROMPT;

    const result = streamText({
        model: getChatModel(conversation.model),
        system,
        messages: await convertToModelMessages(messages),
        tools,
        stopWhen: stepCountIs(5),
    });

    result.consumeStream();

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({
            stream: result.stream,
            originalMessages: messages,
            generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
            onEnd: async ({ messages: finalMessages }) => {
                try {
                    await saveChatMessages(conversationId, finalMessages, {
                        updateTitle: false,
                        branchId: activeBranch.id,
                    });
                } catch (error) {
                    console.error(error);
                }
            },
        }),
    });
}