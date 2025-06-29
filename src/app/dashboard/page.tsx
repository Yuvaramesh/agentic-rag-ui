"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Head from "next/head";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Upload, MessageCircle, Bot, FileText } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<FileList | null>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("all_files");
  const [history, setHistory] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    } else {
      fetchUploadedFiles();
    }
  }, [session, status, router]);

  const handleUpload = async () => {
    if (!files) return;

    setUploadLoading(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      await axios.post("http://127.0.0.1:5000/upload", formData);
      alert("Files uploaded and processed successfully!");
      fetchUploadedFiles(); // Refresh the file list
      setFiles(null); // Clear the file input
      // Reset the file input element
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      alert("Error uploading files");
      console.error("Upload error:", error);
    } finally {
      setUploadLoading(false);
    }
  };

  const getUploadedFiles = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/uploaded_docx");
      return res.data.uploaded_files || [];
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      return [];
    }
  };

  const fetchUploadedFiles = async () => {
    const files = await getUploadedFiles();
    setUploadedFiles(files);
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/query", {
        query,
        selectedFile: selectedFile === "all_files" ? null : selectedFile,
        chat_history: history,
      });

      setResponse(res.data.answer);
      setAgentType(res.data.agent_type);
      setHistory(res.data.chat_history || []);
      setQuery(""); // Clear the query input
    } catch (error) {
      alert("Error processing query");
      console.error("Query error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case "technical":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "customer":
        return "bg-green-100 text-green-800 border-green-200";
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Agentic RAG Chatbot</title>
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-slate-900">
              📚 Agentic RAG Chatbot
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.user?.image || ""} />
                <AvatarFallback>
                  {session.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-700 hidden sm:block">
                {session.user?.name}
              </span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6 min-h-screen bg-slate-50">
        {/* File Selection */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select File for Query (Optional)
                </label>
                <Select value={selectedFile} onValueChange={setSelectedFile}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a file or search all files" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_files">
                      🔍 Search All Files
                    </SelectItem>
                    {uploadedFiles.length > 0 ? (
                      uploadedFiles.map((file, index) => (
                        <SelectItem key={index} value={file}>
                          📄 {file}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no_files" disabled>
                        No files uploaded yet
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card className="shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">📂 Upload Files</h2>
            </div>
            <div className="space-y-3">
              <Input
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.csv"
                onChange={(e) => setFiles(e.target.files)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <Button
                onClick={handleUpload}
                disabled={!files || uploadLoading}
                className="w-full sm:w-auto"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-2">
                  📁 Uploaded Files ({uploadedFiles.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Query Section */}
        <Card className="shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">💬 Ask a Question</h2>
            </div>
            <div className="space-y-3">
              <Textarea
                placeholder="Type your question here... (e.g., 'What is the main topic of the document?')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery();
                  }
                }}
              />
              {selectedFile !== "all_files" && (
                <p className="text-sm text-slate-600">
                  🎯 Searching in:{" "}
                  <span className="font-medium">{selectedFile}</span>
                </p>
              )}
              <Button
                onClick={handleQuery}
                disabled={!query.trim() || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ask Question
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Response Section */}
        {response && (
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-blue-600" />
                  🧠 Answer
                </h2>
                {agentType && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getAgentColor(
                      agentType
                    )}`}
                  >
                    {agentType} Agent
                  </span>
                )}
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {response}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat History */}
        {history.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h2 className="text-xl font-semibold flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                📜 Chat History ({history.length})
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {history.map((entry, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 p-4 rounded-lg bg-white"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-blue-700 flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Question:
                          </strong>
                          {entry.selected_file && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                              📄 {entry.selected_file}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 bg-slate-50 p-2 rounded">
                          {entry.question}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-green-700 flex items-center">
                            <Bot className="w-4 h-4 mr-1" />
                            Answer:
                          </strong>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getAgentColor(
                              entry.agent
                            )}`}
                          >
                            {entry.agent}
                          </span>
                        </div>
                        <p className="text-slate-700 bg-slate-50 p-2 rounded whitespace-pre-wrap">
                          {entry.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
