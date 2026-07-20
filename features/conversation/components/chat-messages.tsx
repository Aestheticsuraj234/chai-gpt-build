"use client";

import { isTextUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  ToolBadge,
  MessageToolbar,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { type MessageNode } from "@/lib/utils/tree";

type ChatMessagesProps = {
  messages: MessageNode[];
  status: ChatStatus;
  getSiblings: (id: string) => MessageNode[];
  navigateBranch: (id: string, direction: "prev" | "next") => void;
};

export function ChatMessages({ messages, status, getSiblings, navigateBranch }: ChatMessagesProps) {
  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => {
          const siblings = getSiblings(message.id);
          const hasBranches = siblings.length > 1;
          const currentIndex = siblings.findIndex(s => s.id === message.id);

          return (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts?.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <MessageResponse key={index}>
                        {part.text}
                      </MessageResponse>
                    );
                  }
                  if (part.type.startsWith("tool-") || part.type === "tool-invocation") {
                    const p = part as any;
                    const toolName = p.toolName || p.toolInvocation?.toolName || "tool";
                    const hasResult = p.type === "tool-result" || p.result !== undefined || p.toolInvocation?.result !== undefined || p.state === "result";
                    return (
                      <ToolBadge
                        key={index}
                        toolName={toolName}
                        state={hasResult ? "complete" : "loading"}
                      />
                    );
                  }
                  return null;
                })}

                {hasBranches && (
                  <MessageToolbar>
                    <ButtonGroup orientation="horizontal" className="[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md">
                      <Button
                        aria-label="Previous branch"
                        onClick={() => navigateBranch(message.id, "prev")}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <ChevronLeftIcon size={14} />
                      </Button>
                      <ButtonGroupText className="border-none bg-transparent text-muted-foreground shadow-none">
                        {currentIndex + 1} of {siblings.length}
                      </ButtonGroupText>
                      <Button
                        aria-label="Next branch"
                        onClick={() => navigateBranch(message.id, "next")}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <ChevronRightIcon size={14} />
                      </Button>
                    </ButtonGroup>
                  </MessageToolbar>
                )}
              </MessageContent>
            </Message>
          );
        })}

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
