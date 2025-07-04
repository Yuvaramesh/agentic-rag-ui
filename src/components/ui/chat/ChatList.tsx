import React, { useState, useEffect, useRef } from "react";
import AI_Prompt from "@/components/ai-input";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import axios from "axios";

export type ChatMsgType = {
  message: string;
  sender: "user" | "agent";
  streaming?: boolean;
  translated?: string;
};

const ChatList = () => {
  const [chats, setChats] = useState<ChatMsgType[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="w-full relative h-screen overflow-y-auto mx-auto">
      <button
        className="absolute top-4 right-4 p-2 bg-black text-white cursor-pointer hover:bg-gray-500/50 rounded-full shadow-md transition-colors"
        onClick={handleSignOut}
      >
        <LogOutIcon />
      </button>

      {/* Chat Input */}
      <div className="w-full fixed flex justify-center bottom-0">
        <AI_Prompt chat={chats} setChat={setChats} />
      </div>

      {/* Chat Messages */}
      <div className="w-[75%] py-10 pb-52 flex flex-col gap-y-4 mx-auto">
        {chats.map((msg, index) => (
          <div
            key={index}
            className={`${
              msg.sender === "user" ? "text-right" : "text-left"
            } p-2`}
          >
            <div
              className={`inline-block px-4 py-2 rounded-xl ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-zinc-800 text-black dark:text-white"
              }`}
            >
              <p className="text-sm">{msg.message}</p>

              {/* Tamil translation */}
              {msg.translated && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  🈯 Tamil: {msg.translated}
                </p>
              )}

              {/* Buttons: translate + voice */}
              {msg.sender === "agent" && (
                <div className="flex gap-2 mt-2">
                  {/* 🈯 Translate Button */}
                  {!msg.translated && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.post(
                            "http://127.0.0.1:5000/translate",
                            {
                              text: msg.message,
                              target_lang: "ta",
                            }
                          );
                          const updatedTranslation = res.data.translated_text;
                          setChats((prev) =>
                            prev.map((c, i) =>
                              i === index
                                ? { ...c, translated: updatedTranslation }
                                : c
                            )
                          );
                        } catch (err) {
                          console.error("Translation error:", err);
                        }
                      }}
                      className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                      🈯 Tamil
                    </button>
                  )}

                  {/* 🔊 Voice Button */}
                  <button
                    onClick={async () => {
                      const textToSpeak = msg.translated || msg.message;

                      try {
                        const res = await fetch("/api/tts", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ text: textToSpeak }),
                        });

                        if (
                          !res.ok ||
                          res.headers.get("Content-Type") !== "audio/mpeg"
                        ) {
                          const errorText = await res.text();
                          console.error("TTS Error Response:", errorText);
                          alert("TTS failed. Check console.");
                          return;
                        }

                        const audioBlob = await res.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play();
                      } catch (err) {
                        console.error("TTS Error:", err);
                        alert("Voice playback failed.");
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-transparent text-gray-800 hover:bg-gray-700 transition"
                  >
                    🔊
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatList;
