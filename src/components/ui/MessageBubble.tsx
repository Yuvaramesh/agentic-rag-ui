// components/MessageBubble.tsx
"use client";

import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: string;
  sender: "user" | "agent";
};

export default function MessageBubble({ message, sender }: MessageBubbleProps) {
  const isUser = sender === "user";

  return (
    <div
      className={cn(
        "  -z-50 flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-md",
          isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-black rounded-bl-none"
        )}
      >
        {message.length == 0 && !isUser ? "Loading..." : message}
      </div>
    </div>
  );
}
