"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Avatar,
  AvatarFallback,
  Badge,
  MeetupModal,
} from "@/components/ui";
import {
  ArrowLeft,
  Send,
  IndianRupee,
  CheckCircle,
  MapPin,
  HandCoins,
} from "lucide-react";

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

export default function ChatPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [markingReceived, setMarkingReceived] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [showMeetupModal, setShowMeetupModal] = useState(false);
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
        setMessages(
          data.transaction.messages.map((msg: Message) => ({
            ...msg,
            isAI: msg.isAI || false,
          }))
        );
      }
      setLoading(false);
    } catch (err) {
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

  // Poll for new messages every 2 seconds when page is visible
  useEffect(() => {
    if (loading || !transaction) return;

    let intervalId: NodeJS.Timeout;
    let isPageVisible = true;

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const pollMessages = async () => {
      if (!isPageVisible) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`/api/transactions/${transactionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.transaction?.messages) {
          const newMessages = data.transaction.messages.map((msg: Message) => ({
            ...msg,
            isAI: msg.isAI || false,
          }));

          // Only update if message count changed
          setMessages((prev) => {
            if (prev.length !== newMessages.length) {
              return newMessages;
            }
            // Check if any message content changed (for edits)
            const hasChanges = prev.some(
              (oldMsg, idx) =>
                oldMsg.id !== newMessages[idx]?.id ||
                oldMsg.content !== newMessages[idx]?.content
            );
            return hasChanges ? newMessages : prev;
          });
        }
      } catch (err) {
        // Silently fail polling errors
      }
    };

    // Poll every 2 seconds
    intervalId = setInterval(pollMessages, 2000);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [transactionId, loading, transaction]);

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

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`/api/transactions/${transactionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageContent }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
        throw new Error(data.error || "Failed to send message");
      }

      // Replace temp message with actual message from server
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempMessage.id);
        return [
          ...filtered,
          {
            id: data.message.id,
            senderId: data.message.senderId,
            content: data.message.content,
            createdAt: data.message.createdAt,
            isAI: data.message.isAI || false,
          },
        ];
      });
    } catch (err) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async () => {
    if (!currentUser) return;

    setAccepting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/transactions/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept transaction");
      }

      // Refresh transaction data
      await fetchTransaction();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to accept transaction"
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleSetMeetup = async (location: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`/api/transactions/${transactionId}/meetup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ location }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set meetup location");
      }

      // Refresh transaction data
      await fetchTransaction();
    } catch (err) {
      throw err; // Re-throw to be handled by modal
    }
  };

  const handleMarkPaid = async () => {
    if (!currentUser) return;

    setMarkingPaid(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`/api/transactions/${transactionId}/mark-paid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark payment");
      }

      // Refresh transaction data
      await fetchTransaction();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark payment");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleMarkReceived = async () => {
    if (!currentUser) return;

    setMarkingReceived(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(
        `/api/transactions/${transactionId}/mark-received`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transactionId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark item as received");
      }

      // Refresh transaction data
      await fetchTransaction();
      alert("Item marked as received! Transaction completed.");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to mark item as received"
      );
    } finally {
      setMarkingReceived(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!currentUser) return;

    setConfirmingDelivery(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(
        `/api/transactions/${transactionId}/confirm-delivery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transactionId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm delivery");
      }

      // Refresh transaction data
      await fetchTransaction();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to confirm delivery"
      );
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return <Badge variant="secondary">Requested</Badge>;
      case "ACCEPTED":
        return <Badge variant="success">Accepted</Badge>;
      case "PAID":
        return (
          <Badge className="bg-green-500 text-white">Payment Secured</Badge>
        );
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
  const otherUser =
    currentUserId === transaction.buyer.id
      ? transaction.seller
      : transaction.buyer;
  const isSeller = currentUserId === transaction.seller.id;

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
              <span className="font-medium">
                ₹{transaction.escrowAmount.toFixed(2)}
              </span>
            </div>
            {transaction.meetupLocation && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                <span>{transaction.meetupLocation}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2 flex-wrap gap-2">
            {transaction.status === "REQUESTED" && isSeller && (
              <Button
                size="sm"
                variant="success"
                onClick={handleAccept}
                disabled={accepting}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {accepting ? "Accepting..." : "Accept Request"}
              </Button>
            )}
            {(transaction.status === "ACCEPTED" ||
              transaction.status === "REQUESTED") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowMeetupModal(true)}
              >
                <MapPin className="h-4 w-4 mr-1" />
                {transaction.meetupLocation ? "Change Meetup" : "Meet"}
              </Button>
            )}
            {transaction.status === "MEETING" && !isSeller && (
              <Button size="sm" onClick={handleMarkPaid} disabled={markingPaid}>
                <HandCoins className="h-4 w-4 mr-1" />
                {markingPaid ? "Processing..." : "Buy & Pay Physically"}
              </Button>
            )}
            {transaction.status === "PAID" && !isSeller && (
              <Button
                size="sm"
                variant="success"
                onClick={handleMarkReceived}
                disabled={markingReceived}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {markingReceived ? "Processing..." : "Item Received"}
              </Button>
            )}
            {(transaction.status === "PAID" || transaction.status === "MEETING") && isSeller && (
              <Button
                size="sm"
                variant="success"
                onClick={handleConfirmDelivery}
                disabled={confirmingDelivery}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {confirmingDelivery ? "Processing..." : "Confirm Delivery"}
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
              className={`flex ${
                isAI
                  ? "justify-center"
                  : isOwnMessage
                  ? "justify-end"
                  : "justify-start"
              }`}
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
                <p
                  className={
                    isOwnMessage && !isAI ? "text-white" : "text-gray-800"
                  }
                >
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

      {/* Meetup Modal */}
      <MeetupModal
        isOpen={showMeetupModal}
        onClose={() => setShowMeetupModal(false)}
        onSelect={handleSetMeetup}
        transactionId={transactionId}
      />
    </div>
  );
}
