"use server";

import { requireUser } from '@/features/auth/action/require-user';
import { prisma } from '@/lib/db';

async function ensureMainBranch(conversationId: string) {
    const existingBranch = await prisma.branch.findFirst({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
    });

    if (existingBranch) {
        return existingBranch;
    }

    return prisma.branch.create({
        data: {
            conversationId,
            name: "Main",
            leafMessageId: null,
        },
    });
}

export async function createMainBranch(conversationId: string) {
    return ensureMainBranch(conversationId);
}

export async function createBranchForMessage(conversationId: string, sourceMessageId: string, name?: string) {
    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId: user.id,
        },
        select: { id: true },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    const sourceMessage = await prisma.message.findFirst({
        where: {
            id: sourceMessageId,
            conversationId,
        },
        select: { id: true },
    });

    if (!sourceMessage) {
        throw new Error("Message not found");
    }

    const existingBranches = await prisma.branch.findMany({
        where: { conversationId },
        select: { id: true },
    });

    const branchName = name?.trim() || `Branch ${existingBranches.length + 1}`;

    return prisma.branch.create({
        data: {
            conversationId,
            name: branchName,
            leafMessageId: sourceMessage.id,
        },
    });
}

export async function getConversationBranches(conversationId: string) {
    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId: user.id,
        },
        select: { id: true },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    return prisma.branch.findMany({
        where: {
            conversationId,
        },
        orderBy: {
            createdAt: 'asc',
        },
        select: {
            id: true,
            name: true,
            createdAt: true,
        },
    });
}

export async function getBranch(branchId: string) {
    const user = await requireUser();

    const branch = await prisma.branch.findFirst({
        where: {
            id: branchId,
            conversation: {
                userId: user.id,
            },
        },
    });

    if (!branch) {
        throw new Error("Branch not found");
    }

    return branch;
}

export async function getBranchForConversation(branchId: string, conversationId: string) {
    const user = await requireUser();

    const branch = await prisma.branch.findFirst({
        where: {
            id: branchId,
            conversationId,
            conversation: {
                userId: user.id,
            },
        },
    });

    if (!branch) {
        throw new Error("Branch not found");
    }

    return branch;
}

export async function renameBranch(branchId: string, name: string) {
    const user = await requireUser();

    const branch = await prisma.branch.findFirst({
        where: {
            id: branchId,
            conversation: {
                userId: user.id,
            },
        },
        select: { id: true },
    });

    if (!branch) {
        throw new Error("Branch not found");
    }

    return prisma.branch.update({
        where: {
            id: branchId,
        },
        data: {
            name: name.trim() || "Untitled Branch",
        },
    });
}

export async function deleteBranch(branchId: string) {
    const user = await requireUser();

    const branch = await prisma.branch.findFirst({
        where: {
            id: branchId,
            conversation: {
                userId: user.id,
            },
        },
        select: { id: true, name: true },
    });

    if (!branch) {
        throw new Error("Branch not found");
    }

    if (branch.name === "Main") {
        throw new Error("The main branch cannot be deleted");
    }

    return prisma.branch.delete({
        where: {
            id: branchId,
        },
    });
}

export async function getMainBranch(conversationId: string) {
    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId: user.id,
        },
        select: { id: true },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    const branch = await ensureMainBranch(conversationId);

    return branch;
}