import { useMemo, useState, useEffect } from "react";
import { type MessageNode, getBranchPath, getChildrenMap } from "@/lib/utils/tree";

export function useChatBranching(initialMessages: MessageNode[], initialNodeId: string | null) {
  const [messages, setMessages] = useState<MessageNode[]>(initialMessages);
  
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(
    initialNodeId || (initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null)
  );

  useEffect(() => {
    setMessages(initialMessages);
    if (!currentNodeId && initialMessages.length > 0) {
      setCurrentNodeId(initialMessages[initialMessages.length - 1].id);
    }
  }, [initialMessages]);

  const activeMessages = useMemo(() => getBranchPath(messages, currentNodeId), [messages, currentNodeId]);
  const childrenMap = useMemo(() => getChildrenMap(messages), [messages]);

  const addMessage = (msg: MessageNode) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setCurrentNodeId(msg.id);
  };

  const getSiblings = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return [];
    const pid = msg.parentId || "root";
    return childrenMap[pid] || [];
  };
  
  const navigateBranch = (msgId: string, direction: "prev" | "next") => {
    const siblings = getSiblings(msgId);
    if (siblings.length <= 1) return;
    
    const currentIndex = siblings.findIndex(m => m.id === msgId);
    if (currentIndex === -1) return;
    
    let targetIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0) targetIndex = siblings.length - 1;
    if (targetIndex >= siblings.length) targetIndex = 0;
    
    const targetSibling = siblings[targetIndex];
    
    // Find the deepest leaf node starting from this sibling
    let deepestLeafId = targetSibling.id;
    let currentChildren = childrenMap[deepestLeafId];
    
    while (currentChildren && currentChildren.length > 0) {
      deepestLeafId = currentChildren[currentChildren.length - 1].id;
      currentChildren = childrenMap[deepestLeafId];
    }
    
    setCurrentNodeId(deepestLeafId);
  };

  return {
    messages,
    activeMessages,
    currentNodeId,
    setCurrentNodeId,
    childrenMap,
    addMessage,
    getSiblings,
    navigateBranch,
  };
}
