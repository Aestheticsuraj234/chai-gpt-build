import { type UIMessage } from "ai";

export type MessageNode = UIMessage & {
  parentId?: string | null;
};

/**
 * Traverses backwards from a given leaf node ID to the root to build the active branch path.
 */
export function getBranchPath(
  messages: MessageNode[],
  leafId: string | null
): MessageNode[] {
  if (!leafId || messages.length === 0) return [];
  
  const msgMap: Map<string, MessageNode> = new Map(messages.map(m => [m.id, m]));
  const path: MessageNode[] = [];
  let currentId: string | null = leafId;
  
  while (currentId && msgMap.has(currentId)) {
    const msg: MessageNode = msgMap.get(currentId)!;
    path.unshift(msg);
    currentId = msg.parentId || null;
  }
  
  return path;
}

/**
 * Returns a mapping of message ID to its children, useful for rendering branch selectors.
 */
export function getChildrenMap(messages: MessageNode[]): Record<string, MessageNode[]> {
  const map: Record<string, MessageNode[]> = {};
  for (const msg of messages) {
    const pid = msg.parentId;
    if (pid) {
      if (!map[pid]) map[pid] = [];
      map[pid].push(msg);
    } else {
      if (!map["root"]) map["root"] = [];
      map["root"].push(msg);
    }
  }
  return map;
}
