"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import Link from "next/link";
import { Button, Input, Avatar, AvatarFallback, Badge } from "@/components/ui";
import { ArrowLeft, Send, IndianRupee, CheckCircle, MapPin } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isAI?: boolean;
}

interface Transaction {
  id: string;
  status: string;
  escrowAmount: number;
  meetupLocation: string | null;
  countdownEnd: string | null;
  item: {
    id: string;
    name: string;
    price: number;
    photo: string | null;
  };
  buyer: {
    id: string;
    name: string;
    photo: string | null;
  };
  seller: {
    id: string;
    name: string;
    photo: string | null;
  };
  messages?: Message[];
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export default function ChatPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load current user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && typeof user.id === "string") {
          setCurrentUser(user);
        }
      } catch (err) {
        // Invalid JSON in localStorage, clear corrupted data
        console.error("Failed to parse user data from localStorage:", err);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Fetch transaction data
  const fetchTransaction = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in to view this transaction");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load transaction");
        setLoading(false);
        return;
      }

      setTransaction(data.transaction);
      // Load messages from transaction
      if (data.transaction.messages) {
        setMessages(data.transaction.messages.map((msg: Message) => ({
          ...msg,
          isAI: msg.isAI || false,
        })));
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch transaction:", err);
      setError("Something went wrong");
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchTransaction();

    // In real app, connect to Socket.io here
    // socketClient.connect();
    // socketClient.joinTransaction(transactionId);
    // socketClient.onMessage((data) => setMessages(prev => [...prev, data.message]));
  }, [fetchTransaction]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    // Add message optimistically
    const tempMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: messageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    // In real app, send via Socket.io
    // socketClient.sendMessage(transactionId, messageContent);

    setSending(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return <Badge variant="secondary">Requested</Badge>;
      case "ACCEPTED":
        return <Badge variant="success">Accepted</Badge>;
      case "PAID":
        return <Badge className="bg-green-500 text-white">Payment Secured</Badge>;
      case "MEETING":
        return <Badge className="bg-yellow-500 text-black">Meeting</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">{error || "Transaction not found"}</p>
        <Link href="/home">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const currentUserId = currentUser?.id || "";
  const otherUser = currentUserId === transaction.buyer.id ? transaction.seller : transaction.buyer;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/home" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Avatar className="h-10 w-10">
            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{otherUser.name}</p>
            <p className="text-xs text-gray-500">{transaction.item.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(transaction.status)}
        </div>
      </header>

      {/* Transaction Info Bar */}
      <div className="bg-blue-50 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm">
              <IndianRupee className="h-4 w-4 mr-1 text-blue-600" />
              <span className="font-medium">₹{transaction.escrowAmount.toFixed(2)}</span>
            </div>
            {transaction.meetupLocation && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                <span>{transaction.meetupLocation}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {transaction.status === "ACCEPTED" && (
              <Link href={`/meetup/${transactionId}`}>
                <Button size="sm">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  Pay & Meet
                </Button>
              </Link>
            )}
            {transaction.status === "PAID" && (
              <Button size="sm" variant="success">
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm Receipt
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;
          const isAI = message.isAI;

          return (
            <div
              key={message.id}
              className={`flex ${isAI ? "justify-center" : isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  isAI
                    ? "bg-yellow-50 border border-yellow-200 text-sm"
                    : isOwnMessage
                    ? "bg-blue-600 text-white"
                    : "bg-white border"
                }`}
              >
                <p className={isOwnMessage && !isAI ? "text-white" : "text-gray-800"}>
                  {message.content}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage && !isAI ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
