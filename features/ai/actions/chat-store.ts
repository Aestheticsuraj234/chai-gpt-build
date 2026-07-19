"use server";

import { isTextUIPart, type UIMessage } from "ai";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";


/** Extracts plain text from an AI SDK `UIMessage` by joining all text parts. */
function getMessageText(message: UIMessage) {
  return message.parts.filter(isTextUIPart).map((part) => part.text).join("");
}

/**
 * Normalizes stored message parts from the database into AI SDK `UIMessage` parts.
 * Falls back to a single text part when no structured parts are stored.
 */
function toUIMessageParts(
  parts: Prisma.JsonValue | null,
  content: string
): UIMessage["parts"] {
  const stored = parts as UIMessage["parts"] | null;
  if (Array.isArray(stored) && stored.length > 0) {
    return stored;
  }

  return [{ type: "text", text: content }];
}

/**
 * Loads the message history for a specific branch from the database.
 *
 * Each branch reuses the parent chain from the selected message onward, so the
 * history before the branch point is preserved without duplicating messages.
 */
export async function loadChatMessages(
  conversationId: string,
  branchId?: string
): Promise<UIMessage[]> {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  if (!branchId) {
    return rows.map((row) => ({
      id: row.id,
      role: row.role === "ASSISTANT" ? "assistant" : "user",
      parts: toUIMessageParts(row.parts, row.content),
    }));
  }

  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      conversationId,
    },
    select: {
      leafMessageId: true,
    },
  });

  if (!branch?.leafMessageId) {
    return [];
  }

  // const rowsById = new Map(rows.map((row: any) => [row.id, row]));
  const rowsById: Map<string, (typeof rows)[number]> = new Map(
    rows.map((row) => [row.id, row])
  );
  const includedIds = new Set<string>();
  let currentMessageId: string | null = branch.leafMessageId;

  while (currentMessageId) {
    const current = rowsById.get(currentMessageId);
    if (!current || includedIds.has(current.id)) {
      break;
    }

    includedIds.add(current.id);
    currentMessageId = current.parentMessageId;
  }

  return rows
    .filter((row) => includedIds.has(row.id))
    .map((row) => ({
      id: row.id,
      role: row.role === "ASSISTANT" ? "assistant" : "user",
      parts: toUIMessageParts(row.parts, row.content),
    }));
}

export async function getUserMessageCount(conversationId: string) {
  return prisma.message.count({
    where: {
      conversationId,
      role: "USER",
    },
  });
}

type SaveChatMessagesOptions = {
  updateTitle?: boolean;
  branchId?: string;
};

/**
 * Upserts AI SDK `UIMessage`s into the database for a conversation.
 *
 * @param conversationId - Target conversation ID.
 * @param messages - Messages to persist (system messages are skipped).
 * @param options.updateTitle - When true, auto-titles "New Chat" from the first user message.
 * @param options.branchId - The active branch that owns the message chain.
 */
export async function saveChatMessages(
  conversationId: string,
  messages: UIMessage[],
  options: SaveChatMessagesOptions = {}
) {
  const { updateTitle = true, branchId } = options;

  const branch = branchId
    ? await prisma.branch.findFirst({
      where: {
        id: branchId,
        conversationId,
      },
      select: {
        id: true,
        leafMessageId: true,
      },
    })
    : null;

  if (branchId && !branch) {
    throw new Error("Branch not found");
  }

  await prisma.$transaction(async (tx) => {
    let previousMessageId: string | null = branch?.leafMessageId ?? null;

    for (const message of messages) {
      if (message.role === "system") continue;

      const content = getMessageText(message);
      const role = message.role === "assistant" ? "ASSISTANT" : "USER";

      const existingMessage = await tx.message.findUnique({
        where: { id: message.id },
        select: { id: true },
      });

      const parentMessageId = existingMessage ? null : previousMessageId;

      await tx.message.upsert({
        where: { id: message.id },
        create: {
          id: message.id,
          conversationId,
          parentMessageId,
          role,
          status: "COMPLETE",
          content,
          parts: message.parts as Prisma.InputJsonValue,
        },
        update: {
          content,
          parts: message.parts as Prisma.InputJsonValue,
          status: "COMPLETE",
        },
      });

      if (!existingMessage) {
        previousMessageId = message.id;
      }
    }

    const latestMessage = [...messages]
      .filter((message) => message.role !== "system")
      .at(-1);

    if (branch && latestMessage) {
      await tx.branch.update({
        where: { id: branch.id },
        data: {
          leafMessageId: latestMessage.id,
        },
      });
    }
  });

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    select: { title: true },
  });

  const firstUser = messages.find((message) => message.role === "user");
  const firstUserText = firstUser ? getMessageText(firstUser).trim() : "";

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      title:
        updateTitle && conversation.title === "New Chat" && firstUserText
          ? firstUserText.slice(0, 48)
          : conversation.title,
    },
  });
}
