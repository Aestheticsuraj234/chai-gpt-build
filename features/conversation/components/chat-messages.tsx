"use client";

import { isTextUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { GitBranchPlus } from "lucide-react";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";

/** Extracts plain text from a `UIMessage` by joining all text parts. */
function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

type ChatMessagesProps = {
  messages: UIMessage[];
  status: ChatStatus;
  onCreateBranch: (messageId: string) => void | Promise<void>;
};

/**
 * Renders the conversation message list with markdown responses and a loading indicator.
 */
export function ChatMessages({ messages, status, onCreateBranch }: ChatMessagesProps) {
  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <Conversation>
      <ConversationContent className="py-8 px-4 md:px-12 lg:px-24 xl:px-42">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              <MessageResponse>{getMessageText(message)}</MessageResponse>
              {message.role === "assistant" ? (
                <div className="mt-3 flex justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void onCreateBranch(message.id)}
                  >
                    <GitBranchPlus className="mr-1 h-3.5 w-3.5" />
                    Branch
                  </Button>
                </div>
              ) : null}
            </MessageContent>
          </Message>
        ))}

        {isWaiting ? (
          <Message from="assistant">
            <MessageContent>
              <Loader />
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
    </Conversation>
  );
}
