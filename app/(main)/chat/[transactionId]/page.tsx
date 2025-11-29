"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import Link from "next/link";
import { Button, Input, Avatar, AvatarFallback, Badge } from "@/components/ui";
import { ArrowLeft, Send, DollarSign, CheckCircle, MapPin } from "lucide-react";

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
}

export default function ChatPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = "mock-user-id"; // In real app, get from auth context

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    // Mock data for demo
    setTransaction({
      id: transactionId,
      status: "ACCEPTED",
      escrowAmount: 25.00,
      meetupLocation: null,
      countdownEnd: null,
      item: {
        id: "item-1",
        name: "iPhone Charger",
        price: 25.00,
        photo: null,
      },
      buyer: {
        id: "buyer-1",
        name: "John Doe",
        photo: null,
      },
      seller: {
        id: "seller-1",
        name: "Jane Smith",
        photo: null,
      },
    });

    setMessages([
      {
        id: "1",
        senderId: "buyer-1",
        content: "Hi! I'm interested in the iPhone charger. Is it still available?",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "2",
        senderId: "seller-1",
        content: "Yes, it's available! It's brand new, never used.",
        createdAt: new Date(Date.now() - 3500000).toISOString(),
      },
      {
        id: "3",
        senderId: "ai",
        content: "🗺️ AI Suggestion: Based on both your locations, the Student Union Building lobby would be a great meetup spot. It's well-lit and has security cameras.",
        createdAt: new Date(Date.now() - 3400000).toISOString(),
        isAI: true,
      },
    ]);

    setLoading(false);

    // In real app, connect to Socket.io here
    // socketClient.connect();
    // socketClient.joinTransaction(transactionId);
    // socketClient.onMessage((data) => setMessages(prev => [...prev, data.message]));
  }, [transactionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    // Add message optimistically
    const tempMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
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

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Transaction not found</p>
      </div>
    );
  }

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
              <DollarSign className="h-4 w-4 mr-1 text-blue-600" />
              <span className="font-medium">${transaction.escrowAmount.toFixed(2)}</span>
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
                  <DollarSign className="h-4 w-4 mr-1" />
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
          const isOwnMessage = message.senderId === currentUserId || message.senderId === "buyer-1";
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
