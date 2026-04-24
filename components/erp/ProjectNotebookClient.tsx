"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useMemo, useState } from "react";
import { ProjectNotebookUI } from "./ProjectNotebookUI";

function textFromUIMessage(m: UIMessage): string {
  if (!m.parts?.length) return "";
  return m.parts
    .map((p) =>
      p.type === "text" || p.type === "reasoning" ? p.text : "",
    )
    .filter(Boolean)
    .join("\n");
}

export function ProjectNotebookClient({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/erp/project-notebook/chat-stream",
        body: { projectId },
      }),
    [projectId],
  );

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport,
  });

  const sending = status === "submitted" || status === "streaming";

  const uiMessages = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: textFromUIMessage(m),
        timestamp: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    [messages],
  );

  const onSend = useCallback(() => {
    const t = input.trim();
    if (!t || sending) return;
    clearError();
    void sendMessage({ text: t });
    setInput("");
  }, [clearError, input, sendMessage, sending]);

  return (
    <ProjectNotebookUI
      projectName={projectName}
      messages={uiMessages}
      inputValue={input}
      onInputChange={setInput}
      onSend={onSend}
      sending={sending}
      errorMessage={error?.message ?? null}
    />
  );
}
