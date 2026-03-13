"use client";

import dynamic from "next/dynamic";
import { MessageSquare } from "lucide-react";

const MessagesUI = dynamic(() => import("@/components/shared/MessagesUI"), {
  loading: () => (
    <div className="h-[600px] w-full bg-surface-50 animate-pulse rounded-2xl flex items-center justify-center text-surface-400 text-sm font-medium">
      Loading messages...
    </div>
  ),
});

export default function MessagesPage() {
  return (
    <div className="space-y-6 animate-fade-in h-full">
      <h1 className="page-title flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
          <MessageSquare size={22} className="text-pink-600" />
        </div>
        Messages
      </h1>
      <MessagesUI />
    </div>
  );
}
