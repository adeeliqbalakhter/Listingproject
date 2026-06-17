"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Building2,
  Send,
  Loader2,
  Inbox,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/providers/SessionProvider";

interface Conversation {
  assignment_id: string;
  lead_id: string;
  assignment_status: string;
  company_name: string;
  project_description: string;
  agency_id: string;
  agency_name: string;
  agency_logo: string | null;
  agency_slug: string | null;
  message_count: number;
  last_message: string | null;
  last_message_at: string | null;
}

interface Message {
  id: string;
  lead_assignment_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

function ClientMessagesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchConversations();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/client/messages");
      if (res.ok) {
        const json = await res.json();
        const convos: Conversation[] = json.data ?? [];
        setConversations(convos);

        const targetId = searchParams.get("assignmentId");
        if (targetId) {
          const match = convos.find((c) => c.assignment_id === targetId);
          if (match) selectConversation(match);
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function selectConversation(convo: Conversation) {
    setActiveConvo(convo);
    setMsgLoading(true);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const res = await fetch(`/api/leads/${convo.lead_id}/messages?assignmentId=${convo.assignment_id}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data ?? []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch { /* ignore */ }
    finally { setMsgLoading(false); }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/leads/${convo.lead_id}/messages?assignmentId=${convo.assignment_id}`);
        if (res.ok) {
          const json = await res.json();
          setMessages(json.data ?? []);
        }
      } catch { /* ignore */ }
    }, 15000);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/leads/${activeConvo.lead_id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: activeConvo.assignment_id,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [...prev, json.data]);
        setNewMessage("");
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Messages</h1>
        <p className="mt-1 text-gray-500">Chat with agencies about your projects.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 240px)", minHeight: 500 }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col ${activeConvo ? "hidden sm:flex" : "flex"}`}>
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-navy">Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Agencies will appear here once they respond to your project.</p>
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.assignment_id}
                    onClick={() => selectConversation(c)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      activeConvo?.assignment_id === c.assignment_id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                        {c.agency_logo ? (
                          <img src={c.agency_logo} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <Building2 className="w-4 h-4 text-brand" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-navy truncate">{c.agency_name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {c.last_message || c.company_name}
                        </p>
                      </div>
                      {Number(c.message_count) > 0 && (
                        <span className="text-[10px] font-medium text-brand bg-blue-50 px-1.5 py-0.5 rounded-full">
                          {c.message_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!activeConvo ? "hidden sm:flex" : "flex"}`}>
            {activeConvo ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => { setActiveConvo(null); if (pollRef.current) clearInterval(pollRef.current); }}
                    className="sm:hidden text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    {activeConvo.agency_logo ? (
                      <img src={activeConvo.agency_logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <Building2 className="w-4 h-4 text-brand" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{activeConvo.agency_name}</p>
                    <p className="text-xs text-gray-400">{activeConvo.company_name}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-brand animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? "bg-brand text-white rounded-br-md"
                              : "bg-gray-100 text-navy rounded-bl-md"
                          }`}>
                            {!isMe && (
                              <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-gray-400"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Compose */}
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-100">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 resize-none border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-navy focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="p-2.5 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    }>
      <ClientMessagesContent />
    </Suspense>
  );
}
