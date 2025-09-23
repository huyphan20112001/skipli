import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { logger } from "../utils/logger";
import { JwtPayload, UserRole, ChatMessage } from "../types";
import { ChatService } from "./chat";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: UserRole;
}

export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private chatService: ChatService;

  constructor(io: Server) {
    this.io = io;
    this.chatService = new ChatService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          logger.warn("Socket connection attempted without token", {
            socketId: socket.id,
          });
          return next(new Error("Authentication token required"));
        }

        const decoded: JwtPayload = verifyToken(token);
        socket.userId = decoded.userId;
        socket.role = decoded.role;

        logger.info("Socket authenticated successfully", {
          socketId: socket.id,
          userId: decoded.userId,
          role: decoded.role,
        });

        next();
      } catch (error) {
        logger.warn("Socket authentication failed", {
          socketId: socket.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        next(new Error("Invalid authentication token"));
      }
    });
  }

  private setupEventHandlers() {
    logger.info("User connected via Socket.IO 1");
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      logger.info("User connected via Socket.IO 2");
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: AuthenticatedSocket) {
    const { userId, role } = socket;

    if (!userId || !role) {
      logger.error("Socket connected without proper authentication", {
        socketId: socket.id,
      });
      socket.disconnect();
      return;
    }

    this.connectedUsers.set(userId, socket);

    logger.info("User connected via Socket.IO", {
      socketId: socket.id,
      userId,
      role,
      totalConnections: this.connectedUsers.size,
    });

    socket.join(`user:${userId}`);

    socket.join(`role:${role}`);

    socket.on("join-chat-room", (data: { participantId: string }) => {
      this.handleJoinChatRoom(socket, data);
    });

    socket.on("leave-chat-room", (data: { participantId: string }) => {
      this.handleLeaveChatRoom(socket, data);
    });

    socket.on("get-online-users", () => {
      this.handleGetOnlineUsers(socket);
    });

    socket.on(
      "send-message",
      (data: { receiverId: string; message: string }) => {
        this.handleSendMessage(socket, data);
      }
    );

    socket.on(
      "get-messages",
      (data: { participantId: string; limit?: number }) => {
        console.log("🚀 ~ SocketService ~ handleConnection ~ data => ", data);
        this.handleGetMessages(socket, data);
      }
    );

    socket.on("mark-messages-read", (data: { senderId: string }) => {
      this.handleMarkMessagesRead(socket, data);
    });

    socket.on("get-unread-count", () => {
      this.handleGetUnreadCount(socket);
    });

    socket.on("delete-message", (data: { messageId: string }) => {
      this.handleDeleteMessage(socket, data);
    });

    socket.on("disconnect", () => {
      this.handleDisconnection(socket);
    });
  }

  private handleJoinChatRoom(
    socket: AuthenticatedSocket,
    data: { participantId: string }
  ) {
    const { userId, role } = socket;
    const { participantId } = data;

    if (!userId || !participantId) {
      socket.emit("error", { message: "Invalid room join request" });
      return;
    }

    const roomName = this.createChatRoomName(userId, participantId);

    socket.join(roomName);

    logger.info("User joined chat room", {
      socketId: socket.id,
      userId,
      role,
      roomName,
      participantId,
    });

    socket.emit("joined-chat-room", {
      roomName,
      participantId,
      message: "Successfully joined chat room",
    });
  }

  private handleLeaveChatRoom(
    socket: AuthenticatedSocket,
    data: { participantId: string }
  ) {
    const { userId } = socket;
    const { participantId } = data;

    if (!userId || !participantId) {
      socket.emit("error", { message: "Invalid room leave request" });
      return;
    }

    const roomName = this.createChatRoomName(userId, participantId);
    socket.leave(roomName);

    logger.info("User left chat room", {
      socketId: socket.id,
      userId,
      roomName,
      participantId,
    });

    socket.emit("left-chat-room", {
      roomName,
      participantId,
      message: "Successfully left chat room",
    });
  }

  private handleGetOnlineUsers(socket: AuthenticatedSocket) {
    const { userId, role } = socket;

    const onlineUsers = Array.from(this.connectedUsers.entries())
      .filter(([id]) => id !== userId)
      .map(([id, userSocket]) => ({
        userId: id,
        role: userSocket.role,
        isOnline: true,
      }));

    socket.emit("online-users", { users: onlineUsers });

    logger.info("Online users requested", {
      socketId: socket.id,
      userId,
      role,
      onlineCount: onlineUsers.length,
    });
  }

  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: { receiverId: string; message: string }
  ) {
    const { userId, role } = socket;
    console.log(userId, role);
    const { receiverId, message } = data;
    console.log(receiverId, message);

    if (!userId || !receiverId || !message) {
      socket.emit("error", { message: "Invalid message data" });
      return;
    }

    if (!this.chatService.isValidMessage(message)) {
      socket.emit("error", { message: "Invalid message content" });
      return;
    }

    try {
      const messageType =
        role === UserRole.OWNER ? "owner-to-employee" : "employee-to-owner";

      const savedMessage = await this.chatService.saveMessage({
        senderId: userId,
        receiverId,
        message,
        messageType,
      });

      const roomName = this.createChatRoomName(userId, receiverId);

      this.io.to(roomName).emit("message-received", {
        message: savedMessage,
        roomName,
      });

      const receiverSocket = this.connectedUsers.get(receiverId);
      if (receiverSocket) {
        receiverSocket.emit("new-message-notification", {
          message: savedMessage,
          roomName,
        });
      }

      logger.info("Message sent successfully", {
        messageId: savedMessage.id,
        senderId: userId,
        receiverId,
        roomName,
      });
    } catch (error) {
      logger.error("Failed to send message", {
        error: error instanceof Error ? error.message : "Unknown error",
        senderId: userId,
        receiverId,
      });

      socket.emit("error", {
        message: "Failed to send message",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleGetMessages(
    socket: AuthenticatedSocket,
    data: { participantId: string; limit?: number }
  ) {
    const { userId } = socket;
    console.log("🚀 ~ SocketService ~ handleGetMessages ~ userId => ", userId);
    const { participantId, limit = 50 } = data;
    console.log(
      "🚀 ~ SocketService ~ handleGetMessages ~ participantId => ",
      participantId
    );

    if (!userId || !participantId) {
      socket.emit("error", { message: "Invalid request data" });
      return;
    }

    try {
      const messages = await this.chatService.getMessages(
        userId,
        participantId,
        limit
      );
      console.log(
        "🚀 ~ SocketService ~ handleGetMessages ~ messages => ",
        messages
      );

      socket.emit("messages-history", {
        messages,
        participantId,
        count: messages.length,
      });

      logger.info("Message history retrieved", {
        userId,
        participantId,
        messageCount: messages.length,
      });
    } catch (error) {
      logger.error("Failed to retrieve messages", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        participantId,
      });

      socket.emit("error", {
        message: "Failed to retrieve messages",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleMarkMessagesRead(
    socket: AuthenticatedSocket,
    data: { senderId: string }
  ) {
    const { userId } = socket;
    const { senderId } = data;

    if (!userId || !senderId) {
      socket.emit("error", { message: "Invalid request data" });
      return;
    }

    try {
      await this.chatService.markMessagesAsRead(userId, senderId);

      socket.emit("messages-marked-read", {
        senderId,
        success: true,
      });

      const senderSocket = this.connectedUsers.get(senderId);
      if (senderSocket) {
        senderSocket.emit("messages-read-by-recipient", {
          readBy: userId,
        });
      }

      logger.info("Messages marked as read", {
        receiverId: userId,
        senderId,
      });
    } catch (error) {
      logger.error("Failed to mark messages as read", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        senderId,
      });

      socket.emit("error", {
        message: "Failed to mark messages as read",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleGetUnreadCount(socket: AuthenticatedSocket) {
    const { userId } = socket;

    if (!userId) {
      socket.emit("error", { message: "Invalid user" });
      return;
    }

    try {
      const unreadCount = await this.chatService.getUnreadMessageCount(userId);

      socket.emit("unread-count", {
        count: unreadCount,
      });

      logger.info("Unread count retrieved", {
        userId,
        unreadCount,
      });
    } catch (error) {
      logger.error("Failed to get unread count", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });

      socket.emit("error", {
        message: "Failed to get unread count",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleDeleteMessage(
    socket: AuthenticatedSocket,
    data: { messageId: string }
  ) {
    const { userId } = socket;
    const { messageId } = data;

    if (!userId || !messageId) {
      socket.emit("error", { message: "Invalid request data" });
      return;
    }

    try {
      await this.chatService.deleteMessage(messageId, userId);

      socket.emit("message-deleted", {
        messageId,
        success: true,
      });

      socket.broadcast.emit("message-deleted-by-sender", {
        messageId,
        deletedBy: userId,
      });

      logger.info("Message deleted", {
        messageId,
        deletedBy: userId,
      });
    } catch (error) {
      logger.error("Failed to delete message", {
        error: error instanceof Error ? error.message : "Unknown error",
        messageId,
        userId,
      });

      socket.emit("error", {
        message: "Failed to delete message",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private handleDisconnection(socket: AuthenticatedSocket) {
    const { userId, role } = socket;

    if (userId) {
      this.connectedUsers.delete(userId);
    }

    logger.info("User disconnected from Socket.IO", {
      socketId: socket.id,
      userId,
      role,
      remainingConnections: this.connectedUsers.size,
    });
  }

  public createChatRoomName(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `chat:${sortedIds[0]}:${sortedIds[1]}`;
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getConnectedSocket(userId: string): AuthenticatedSocket | undefined {
    return this.connectedUsers.get(userId);
  }

  public emitToUser(userId: string, event: string, data: any): boolean {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  public emitToRoom(roomName: string, event: string, data: any): void {
    this.io.to(roomName).emit(event, data);
  }

  public emitToRole(role: UserRole, event: string, data: any): void {
    this.io.to(`role:${role}`).emit(event, data);
  }
}
