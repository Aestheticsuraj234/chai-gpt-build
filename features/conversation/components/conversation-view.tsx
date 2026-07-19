"use client";

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PencilLine, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { createBranchForMessage, deleteBranch, getConversationBranches, renameBranch } from '@/features/branch/actions/branch-actions';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from "@ai-sdk/react";
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConversations } from '../hooks/use-conversation';
import { queryKeys } from '../utils/query-keys';
import { ChatComposer } from './chat-composer';
import { ChatEmpty } from './chat-empty';
import { ChatMessages } from './chat-messages';

const MAX_MESSAGES_PER_CONVERSATION = 8;

type ConversationViewProps = {
    conversationId: string;
    initialMessages: UIMessage[];
    branchId: string;
};

type BranchOption = {
    id: string;
    name: string;
};

/**
 * Main chat view — header, message list (or empty state), and composer with streaming.
 */
export const ConversationView = ({ conversationId, initialMessages, branchId }: ConversationViewProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: conversations } = useConversations();
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [isBranchLoading, setIsBranchLoading] = useState(true);

    const refreshBranches = useCallback(async () => {
        try {
            setIsBranchLoading(true);
            const nextBranches = await getConversationBranches(conversationId);
            setBranches(nextBranches);
        } finally {
            setIsBranchLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        void refreshBranches();
    }, [refreshBranches]);

    const transport = useMemo(() => new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
            body: {
                id,
                branchId,
                message: messages.at(-1),
            },
        }),
    }), [branchId]);

    const { messages, sendMessage, status } = useChat({
        id: conversationId,
        messages: initialMessages,
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

    const title = conversations?.find((item) => item.id === conversationId)?.title ?? "Chat";
    const userMessageCount = messages.filter((message) => message.role === "user").length;
    const isAtMessageLimit = userMessageCount >= MAX_MESSAGES_PER_CONVERSATION;

    const handleCreateBranchFromMessage = async (messageId: string) => {
        try {
            const createdBranch = await createBranchForMessage(conversationId, messageId);
            await refreshBranches();
            router.push(`/c/${conversationId}?branchId=${createdBranch.id}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create branch");
        }
    };

    const handleRenameBranch = async () => {
        const activeBranch = branches.find((item) => item.id === branchId);
        if (!activeBranch) return;

        const nextName = window.prompt("Rename branch", activeBranch.name);
        if (!nextName) return;

        try {
            await renameBranch(activeBranch.id, nextName);
            await refreshBranches();
            toast.success("Branch renamed");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not rename branch");
        }
    };

    const handleDeleteBranch = async () => {
        const activeBranch = branches.find((item) => item.id === branchId);
        if (!activeBranch) return;

        const confirmed = window.confirm(`Delete ${activeBranch.name}?`);
        if (!confirmed) return;

        try {
            await deleteBranch(activeBranch.id);
            const fallbackBranch = branches.find((item) => item.id !== activeBranch.id);
            if (fallbackBranch) {
                router.push(`/c/${conversationId}?branchId=${fallbackBranch.id}`);
            } else {
                router.push(`/c/${conversationId}`);
            }
            await refreshBranches();
            toast.success("Branch deleted");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete branch");
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-1 h-4" />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h1>
                    <div className="ml-auto flex min-w-0 items-center gap-1.5">
                        <select
                            value={branchId}
                            onChange={(event) => router.push(`/c/${conversationId}?branchId=${event.target.value}`)}
                            disabled={isBranchLoading}
                            className="h-8 min-w-0 max-w-[120px] rounded-md border border-input bg-background px-2 text-sm sm:max-w-[160px]"
                        >
                            {branches.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => void handleRenameBranch()} aria-label="Rename branch">
                            <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => void handleDeleteBranch()} aria-label="Delete branch">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {messages.length === 0 ? (
                    <div className="flex-1 overflow-hidden">
                        <ChatEmpty />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ChatMessages messages={messages} status={status} onCreateBranch={handleCreateBranchFromMessage} />
                    </div>
                )}
            </div>

            <div className="shrink-0 border-t bg-background/95 backdrop-blur">
                <ChatComposer
                onSend={(text) => {
                    void sendMessage({ text });
                }}
                isSending={status !== "ready"}
                autoFocus
                    disabled={isAtMessageLimit}
                    placeholder={isAtMessageLimit ? "Conversation limit reached" : "Message ChaiGPT…"}
                />
            </div>
        </div>
    );
};
