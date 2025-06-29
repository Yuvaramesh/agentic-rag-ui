import React, { useState } from "react";
import MessageBubble from "../MessageBubble";
import AI_Prompt from "@/components/ai-input";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";

type Props = {};
export type ChatMsgType = {
  message: string;
  sender: "user" | "agent";
};
const ChatList = (props: Props) => {
  const [chats, setChats] = useState<ChatMsgType[]>([]);
  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };
  return (
    <div className=" w-full relative h-screen overflow-y-auto  mx-auto">
      <button
        className=" absolute top-4 right-4 p-2 bg-black text-white cursor-pointer hover:bg-gray-500/50 rounded-full shadow-md  transition-colors"
        onClick={() => handleSignOut()}
      >
        <LogOutIcon />
      </button>
      <div className=" w-full  fixed flex justify-center bottom-0">
        <AI_Prompt chat={chats} setChat={setChats} />
      </div>
      <div className="w-[75%] -z py-10 pb-52 flex flex-col gap-y-4 mx-auto">
        {chats.map((chat, index) => (
          <MessageBubble
            key={index}
            message={chat.message}
            sender={chat.sender}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatList;
