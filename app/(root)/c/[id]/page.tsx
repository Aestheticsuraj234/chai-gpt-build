import { loadChatMessages } from '@/features/ai/actions/chat-store';
import { getBranchForConversation, getMainBranch } from '@/features/branch/actions/branch-actions';
import { getConversation } from '@/features/conversation/actions/conversation-actions';
import { ConversationView } from '@/features/conversation/components/conversation-view';
import { notFound } from 'next/navigation';
import React from 'react';

type ConversationPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ branchId?: string | string[] }>;
};

/**
 * Conversation page — loads messages and renders the chat UI for a given ID.
 */
const page = async ({ params, searchParams }: ConversationPageProps) => {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;

    try {
        await getConversation(id);
    } catch {
        notFound();
    }

    const requestedBranchId = typeof resolvedSearchParams.branchId === 'string'
        ? resolvedSearchParams.branchId
        : null;

    const branch = requestedBranchId
        ? await getBranchForConversation(requestedBranchId, id)
        : await getMainBranch(id);

    const initialMessages = await loadChatMessages(id, branch.id);

    return (
        <ConversationView
            key={`${id}-${branch.id}`}
            conversationId={id}
            initialMessages={initialMessages}
            branchId={branch.id}
        />
    );
};

export default page;