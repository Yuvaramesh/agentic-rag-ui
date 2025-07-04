"use client";

import type React from "react";

/**
 * @author: @kokonutui
 * @description: AI Prompt Input with Toast Notifications
 * @version: 1.1.0
 * @date: 2025-06-29
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { useToast } from "@/hook/use-toast";
import { useSession } from "next-auth/react";

// Types
interface ChatMsgType {
  message: string;
  sender: "user" | "agent";
  streaming?: boolean; // Optional for streaming messages
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
}

type Props = {
  chat: ChatMsgType[];
  setChat: React.Dispatch<React.SetStateAction<ChatMsgType[]>>;
};

// Custom hook for auto-resize textarea
const useAutoResizeTextarea = ({
  minHeight,
  maxHeight,
}: {
  minHeight: number;
  maxHeight: number;
}) => {
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(
    null
  );

  const adjustHeight = (reset = false) => {
    if (textareaRef) {
      if (reset) {
        textareaRef.style.height = `${minHeight}px`;
      } else {
        textareaRef.style.height = "auto";
        const scrollHeight = Math.min(textareaRef.scrollHeight, maxHeight);
        textareaRef.style.height = `${Math.max(scrollHeight, minHeight)}px`;
      }
    }
  };

  return { textareaRef: setTextareaRef, adjustHeight };
};

export default function AI_Prompt({ chat, setChat }: Props) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const { data } = useSession();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("Select File");
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  const getUploadedFiles = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/uploaded_docx");
      return res.data.uploaded_files || [];
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      toast({
        title: "Error",
        description: "Failed to fetch uploaded files",
        variant: "destructive",
      });
      return [];
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setChat((prev) => [
      ...prev,
      { message: query, sender: "user" },
      { message: "Processing your query...", sender: "agent", streaming: true },
    ]);
    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/query", {
        query,
        selectedFile: selectedFile === "all_files" ? null : selectedFile,
        chat_history: history,
        user_email: data?.user?.email || "",
      });
      const responseData = res.data;
      const translationRes = await axios.post(
        "http://127.0.0.1:5000/translate",
        {
          text: responseData.answer,
          target_lang: "ta",
        }
      );
      const tamilTranslation = translationRes.data.translated_text;
      setChat((prev) => [
        ...prev.slice(0, -1),
        {
          message: responseData.answer,
          sender: "agent",
          streaming: false,
          translated: "",
        },
      ]);
      setQuery("");
      setSuggestions([]);
    } catch (error) {
      alert("Error processing query");
      console.error("Query error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUploadedFiles = async () => {
    const files = await getUploadedFiles();
    setUploadedFiles(files);
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setQuery("");
      handleQuery();
      adjustHeight(true);
    }
  };
  const fetchSuggestions = async (lastWord: string) => {
    if (!selectedFile || selectedFile === "Select File" || !lastWord) return;
    try {
      const res = await axios.post("http://127.0.0.1:5000/suggest_words", {
        prefix: lastWord,
        selected_file: selectedFile, // ✅ Use the correct key
      });
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error("Suggestion fetch failed", err);
    }
  };

  useEffect(() => {
    const lastWord = query.trim().split(" ").pop();
    fetchSuggestions(lastWord || "");
  }, [query]);
  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const initialProgress: UploadProgress[] = fileArray.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadProgress(initialProgress);

    // Show initial toast
    toast({
      title: "Upload Started",
      description: `Uploading ${fileArray.length} file(s)...`,
    });

    const formData = new FormData();
    fileArray.forEach((file) => {
      formData.append("files", file);
    });

    try {
      // Simulate progress updates (since axios doesn't provide real progress for multipart uploads easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) =>
          prev.map((item) => ({
            ...item,
            progress: Math.min(item.progress + Math.random() * 20, 90),
          }))
        );
      }, 500);

      const response = await axios.post(
        "http://127.0.0.1:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress((prev) =>
                prev.map((item) => ({
                  ...item,
                  progress: percentCompleted,
                }))
              );
            }
          },
        }
      );

      clearInterval(progressInterval);

      // Mark all as successful
      setUploadProgress((prev) =>
        prev.map((item) => ({
          ...item,
          progress: 100,
          status: "success" as const,
        }))
      );

      // Success toast
      toast({
        title: "Upload Successful",
        description: `${fileArray.length} file(s) uploaded and processed successfully!`,
      });

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);

      fetchUploadedFiles(); // Refresh the file list
    } catch (error) {
      console.error("Upload error:", error);

      // Mark all as error
      setUploadProgress((prev) =>
        prev.map((item) => ({
          ...item,
          status: "error" as const,
        }))
      );

      toast({
        title: "Upload Failed",
        description: "Error uploading files. Please try again.",
        variant: "destructive",
      });

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
    }
  };

  const removeUploadProgress = (fileName: string) => {
    setUploadProgress((prev) =>
      prev.filter((item) => item.fileName !== fileName)
    );
  };

  return (
    <div className="w-[78%] bg-white dark:bg-black z-50 pb-4">
      {suggestions.length > 0 && (
        <div
          ref={suggestionBoxRef}
          className="absolute bottom-44 left-17 w-44 z-50 bg-white dark:bg-transparent shadow-lg border border-gray-200 dark:border-gray-700 rounded-md p-2"
        >
          {suggestions.map((word, index) => (
            <div
              key={index}
              className="text-sm text-gray-700 dark:text-gray-200 p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={() => {
                const words = query.trim().split(" ");
                words.pop();
                const newQuery = [...words, word].join(" ") + " ";
                setQuery(newQuery);
                setSuggestions([]);
              }}
            >
              {word}
            </div>
          ))}
        </div>
      )}
      {/* Upload Progress Display */}
      <AnimatePresence>
        {uploadProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 z-50 space-y-2"
          >
            {uploadProgress.map((item) => (
              <motion.div
                key={item.fileName}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "rounded-lg p-3 border shadow-sm",
                  "bg-white dark:bg-gray-800",
                  "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.status === "uploading" && (
                      <Upload className="w-4 h-4 text-blue-500 animate-pulse" />
                    )}
                    {item.status === "success" && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {item.status === "error" && (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {item.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {item.progress}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeUploadProgress(item.fileName)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={item.progress}
                  className={cn(
                    "h-2",
                    item.status === "error" && "bg-red-100 dark:bg-red-900"
                  )}
                />
                <div className="mt-1 text-xs text-gray-500">
                  {item.status === "uploading" && "Uploading..."}
                  {item.status === "success" && "Upload complete"}
                  {item.status === "error" && "Upload failed"}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-1.5">
        <div className="relative">
          <div className="relative flex flex-col">
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              <Textarea
                id="ai-input-15"
                value={query}
                placeholder="What can I do for you?"
                className={cn(
                  "w-full rounded-xl z-50 rounded-b-none px-4 py-3",
                  "bg-white text-black placeholder:text-black/70",
                  "dark:bg-zinc-900 dark:text-white dark:placeholder:text-white/70",
                  "border border-gray-300 dark:border-zinc-700",
                  "resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  "min-h-[72px]"
                )}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setQuery(e.target.value);
                  adjustHeight();
                }}
                disabled={isLoading}
              />
            </div>

            {/* Footer Bar */}
            <div className="h-14 bg-gray-100 dark:bg-zinc-800 rounded-b-xl flex items-center">
              <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
                {/* LEFT BUTTONS */}
                <div className="flex items-center gap-2">
                  {/* File Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 h-8 pl-1 pr-2 text-xs rounded-md text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={selectedFile}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                          >
                            {selectedFile}
                            <ChevronDown className="w-3 h-3 opacity-50" />
                          </motion.div>
                        </AnimatePresence>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-[10rem] max-h-64 overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700">
                      {uploadedFiles.map((model) => (
                        <DropdownMenuItem
                          key={model}
                          onSelect={() => setSelectedFile(model)}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 opacity-50" />
                            <span>{model}</span>
                          </div>
                          {selectedFile === model && (
                            <Check className="w-4 h-4 text-blue-500 dark:text-white" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Divider */}
                  <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />

                  {/* Attachment Button */}
                  <label
                    className={cn(
                      "rounded-lg p-2 bg-black/5 dark:bg-white/5 cursor-pointer",
                      "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                      "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white",
                      uploadProgress.length > 0 &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Attach file"
                  >
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                      disabled={uploadProgress.length > 0}
                    />
                    <Paperclip className="w-4 h-4 transition-colors" />
                  </label>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  className={cn(
                    "rounded-lg p-2 bg-black/5 dark:bg-white/5",
                    "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={handleQuery}
                  aria-label="Send message"
                  disabled={!query.trim() || isLoading}
                >
                  <ArrowRight
                    className={cn(
                      "w-4 h-4 text-black dark:text-white transition-opacity duration-200",
                      query.trim() && !isLoading ? "opacity-100" : "opacity-30",
                      isLoading && "animate-pulse"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
