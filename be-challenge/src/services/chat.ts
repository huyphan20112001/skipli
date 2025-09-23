import FirebaseService from "./firebase";
import { ChatMessage, UserRole } from "../types";
import { logger } from "../utils/logger";

export class ChatService {
  private firebaseService: FirebaseService;

  constructor() {
    this.firebaseService = FirebaseService.getInstance();
  }

  async saveMessage(messageData: {
    senderId: string;
    receiverId: string;
    message: string;
    messageType: "owner-to-employee" | "employee-to-owner";
  }): Promise<ChatMessage> {
    try {
      const chatMessage: Omit<ChatMessage, "id"> = {
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        message: this.sanitizeMessage(messageData.message),
        timestamp: new Date(),
        messageType: messageData.messageType,
        isRead: false,
      };

      const docId = await this.firebaseService.createDocument(
        "chatMessages",
        chatMessage
      );

      const savedMessage: ChatMessage = {
        id: docId,
        ...chatMessage,
      };

      logger.info("Chat message saved", {
        messageId: savedMessage.id,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        messageType: messageData.messageType,
      });

      return savedMessage;
    } catch (error) {
      logger.error("Failed to save chat message", {
        error: error instanceof Error ? error.message : "Unknown error",
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
      });
      throw new Error("Failed to save message");
    }
  }

  async getMessages(
    userId1: string,
    userId2: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const db = this.firebaseService.getFirestore();
      const messagesRef = db.collection("chatMessages");

      const query = messagesRef
        .where("senderId", "in", [userId1, userId2])
        .where("receiverId", "in", [userId1, userId2])
        .orderBy("timestamp", "desc")
        .limit(limit);

      const snapshot = await query.get();

      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
          timestamp: data.timestamp.toDate(),
          messageType: data.messageType,
          isRead: data.isRead,
        });
      });

      return messages.reverse();
    } catch (error) {
      logger.error("Failed to retrieve chat messages", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId1,
        userId2,
      });
      throw new Error("Failed to retrieve messages");
    }
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    try {
      const db = this.firebaseService.getFirestore();
      const messagesRef = db.collection("chatMessages");

      const query = messagesRef
        .where("senderId", "==", senderId)
        .where("receiverId", "==", userId)
        .where("isRead", "==", false);

      const snapshot = await query.get();

      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();

      logger.info("Messages marked as read", {
        receiverId: userId,
        senderId: senderId,
        messageCount: snapshot.size,
      });
    } catch (error) {
      logger.error("Failed to mark messages as read", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        senderId,
      });
      throw new Error("Failed to mark messages as read");
    }
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const db = this.firebaseService.getFirestore();
      const messagesRef = db.collection("chatMessages");

      const query = messagesRef
        .where("receiverId", "==", userId)
        .where("isRead", "==", false);

      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      logger.error("Failed to get unread message count", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return 0;
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const db = this.firebaseService.getFirestore();
      const messageRef = db.collection("chatMessages").doc(messageId);

      const messageDoc = await messageRef.get();
      if (!messageDoc.exists) {
        throw new Error("Message not found");
      }

      const messageData = messageDoc.data();

      if (messageData?.senderId !== userId) {
        throw new Error("Unauthorized to delete this message");
      }

      await messageRef.delete();

      logger.info("Chat message deleted", {
        messageId,
        deletedBy: userId,
      });
    } catch (error) {
      logger.error("Failed to delete chat message", {
        error: error instanceof Error ? error.message : "Unknown error",
        messageId,
        userId,
      });
      throw error;
    }
  }

  private sanitizeMessage(message: string): string {
    return message
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .substring(0, 1000);
  }

  private validateMessage(message: string): boolean {
    if (!message || typeof message !== "string") {
      return false;
    }

    const trimmed = message.trim();
    return trimmed.length > 0 && trimmed.length <= 1000;
  }

  public isValidMessage(message: string): boolean {
    return this.validateMessage(message);
  }
}
