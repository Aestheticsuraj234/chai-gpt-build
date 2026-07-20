"use client";
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from "@ai-sdk/react"
import React, { useEffect, useMemo, useRef } from 'react'
import { useConversations } from '../hooks/use-conversation';
import { queryKeys } from '../utils/query-keys';
import { toast } from 'sonner';
import { ChatEmpty } from './chat-empty';
import { ChatMessages } from './chat-messages';
import { ChatComposer } from './chat-composer';
import { useChatBranching } from '@/hooks/use-chat-branching';
import { type MessageNode } from '@/lib/utils/tree';

type ConversationViewProps = {
    conversationId: string;
    initialMessages: MessageNode[];
    currentNodeId?: string | null;
};

export const ConversationView = ({ conversationId, initialMessages, currentNodeId }: ConversationViewProps) => {

    const queryClient = useQueryClient();
    const { data: conversations } = useConversations();

    const {
        activeMessages,
        currentNodeId: activeNodeId,
        getSiblings,
        navigateBranch
    } = useChatBranching(initialMessages, currentNodeId || null);

    const activeNodeIdRef = useRef(activeNodeId);
    activeNodeIdRef.current = activeNodeId;

    const transport = useMemo(() => new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => {
            const userMsg = messages.at(-1) as MessageNode;
            // The parent of the new message is the currently active leaf node
            // BEFORE this message was added
            return {
                body: { id, message: { ...userMsg, parentId: activeNodeIdRef.current } }
            }
        }
    }), []);

    const { messages, sendMessage, status, setMessages } = useChat({
        id: conversationId,
        messages: activeMessages,
        transport,
        onFinish: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // When the user navigates a branch, we need to sync the activeMessages into useChat
    // so that the UI reflects the newly selected branch immediately.
    // We only do this if we are not actively generating.
    useEffect(() => {
        if (status !== "submitted" && status !== "streaming") {
            setMessages(activeMessages);
        }
    }, [activeMessages, setMessages, status]);

    const title =
    conversations?.find((item) => item.id === conversationId)?.title ?? "Chat";

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-1 h-4" />
                <h1 className="truncate text-sm font-medium">{title}</h1>
            </header>

            {messages.length === 0 ? (
                <ChatEmpty />
            ) : (
                <ChatMessages 
                  messages={messages as MessageNode[]} 
                  status={status} 
                  getSiblings={getSiblings}
                  navigateBranch={navigateBranch}
                />
            )}

            <ChatComposer
                onSend={(text) => {
                    void sendMessage({ text });
                }}
                isSending={status !== "ready"}
                autoFocus
            />
        </div>
    )
}
