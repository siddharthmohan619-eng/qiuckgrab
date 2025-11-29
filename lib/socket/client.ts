/**
 * Socket.io Client Configuration
 * Handles real-time events for QuickGrab
 */

import { io, Socket } from "socket.io-client";

interface ServerToClientEvents {
  // Transaction events
  request: (data: { transactionId: string; itemId: string; buyerId: string }) => void;
  accept: (data: { transactionId: string }) => void;
  message: (data: { transactionId: string; message: ChatMessage }) => void;
  meetup_suggested: (data: { transactionId: string; location: MeetupLocation }) => void;
  payment_locked: (data: { transactionId: string; amount: number }) => void;
  confirmed: (data: { transactionId: string }) => void;
  
  // User events
  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string }) => void;
  
  // Notification events
  notification: (data: Notification) => void;
}

interface ClientToServerEvents {
  // Transaction actions
  join_transaction: (transactionId: string) => void;
  leave_transaction: (transactionId: string) => void;
  send_message: (data: { transactionId: string; content: string }) => void;
  suggest_meetup: (data: { transactionId: string; location: MeetupLocation }) => void;
  
  // User presence
  go_online: (userId: string) => void;
  go_offline: (userId: string) => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isAI?: boolean;
}

interface MeetupLocation {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface Notification {
  id: string;
  type: "request" | "accept" | "message" | "payment" | "confirm" | "dispute";
  title: string;
  body: string;
  createdAt: string;
}

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private serverUrl: string;

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
  }

  connect(token?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      auth: token ? { token } : undefined,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
    return this.socket;
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Transaction room management
  joinTransaction(transactionId: string): void {
    this.socket?.emit("join_transaction", transactionId);
  }

  leaveTransaction(transactionId: string): void {
    this.socket?.emit("leave_transaction", transactionId);
  }

  // Send message
  sendMessage(transactionId: string, content: string): void {
    this.socket?.emit("send_message", { transactionId, content });
  }

  // Suggest meetup location
  suggestMeetup(transactionId: string, location: MeetupLocation): void {
    this.socket?.emit("suggest_meetup", { transactionId, location });
  }

  // User presence
  setOnline(userId: string): void {
    this.socket?.emit("go_online", userId);
  }

  setOffline(userId: string): void {
    this.socket?.emit("go_offline", userId);
  }

  // Event listeners
  onRequest(callback: ServerToClientEvents["request"]): void {
    this.socket?.on("request", callback);
  }

  onAccept(callback: ServerToClientEvents["accept"]): void {
    this.socket?.on("accept", callback);
  }

  onMessage(callback: ServerToClientEvents["message"]): void {
    this.socket?.on("message", callback);
  }

  onMeetupSuggested(callback: ServerToClientEvents["meetup_suggested"]): void {
    this.socket?.on("meetup_suggested", callback);
  }

  onPaymentLocked(callback: ServerToClientEvents["payment_locked"]): void {
    this.socket?.on("payment_locked", callback);
  }

  onConfirmed(callback: ServerToClientEvents["confirmed"]): void {
    this.socket?.on("confirmed", callback);
  }

  onNotification(callback: ServerToClientEvents["notification"]): void {
    this.socket?.on("notification", callback);
  }

  onUserOnline(callback: ServerToClientEvents["user_online"]): void {
    this.socket?.on("user_online", callback);
  }

  onUserOffline(callback: ServerToClientEvents["user_offline"]): void {
    this.socket?.on("user_offline", callback);
  }

  // Remove listeners
  offRequest(): void {
    this.socket?.off("request");
  }

  offMessage(): void {
    this.socket?.off("message");
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
export const socketClient = new SocketClient();

export type { ChatMessage, MeetupLocation, Notification };
