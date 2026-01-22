export interface MessageData {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ConversationData {
  id: string;
  name: string;
  image: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}