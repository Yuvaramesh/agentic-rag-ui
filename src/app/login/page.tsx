"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Chrome, Loader2 } from "lucide-react";
import BackgroundPaths from "../../components/ui/backgroundpaths"; // ✅ Fixed import

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  if (status === "loading" || session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ✅ Background animated waves */}
      <BackgroundPaths title="Welcome to Agentic RAG">
        {/* ✅ Login Card on top of background */}
        <Card className="relative z-10 w-130 h-90 max-w-md  shadow-xl border-0 bg-gradient-to-br from-fuchsia-100 via-pink-200 to-indigo-200 backdrop-blur-sm p-4">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Chrome className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-900">
                Welcome to Agentic RAG
              </CardTitle>
              <CardDescription className="text-slate-600">
                Sign in with Google to access your AI-powered document chat
                system
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-violet-100 text-slate-900 border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-3" />
              ) : (
                <Chrome className="w-5 h-5 mr-3 text-blue-600" />
              )}
              {isLoading ? "Signing in..." : "Continue with Google"}
            </Button>

            <div className="text-center">
              <p className="text-xs text-slate-500">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </BackgroundPaths>
    </div>
  );
}
