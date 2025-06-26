import { 
  contacts, 
  messages, 
  scheduledMessages,
  type Contact, 
  type InsertContact,
  type Message,
  type InsertMessage,
  type ScheduledMessage,
  type InsertScheduledMessage
} from "@shared/schema";

export interface IStorage {
  // Contact operations
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  getContactByPhone(phone: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  searchContacts(query: string): Promise<Contact[]>;

  // Message operations
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByContact(contactId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageStatus(id: number, status: string, deliveredAt?: Date, failureReason?: string): Promise<Message | undefined>;
  getMessageStats(): Promise<{sent: number, delivered: number, failed: number, pending: number}>;

  // Scheduled message operations
  getScheduledMessages(): Promise<ScheduledMessage[]>;
  getScheduledMessage(id: number): Promise<ScheduledMessage | undefined>;
  createScheduledMessage(scheduledMessage: InsertScheduledMessage): Promise<ScheduledMessage>;
  updateScheduledMessage(id: number, scheduledMessage: Partial<InsertScheduledMessage>): Promise<ScheduledMessage | undefined>;
  deleteScheduledMessage(id: number): Promise<boolean>;
  getPendingScheduledMessages(): Promise<ScheduledMessage[]>;
}

export class MemStorage implements IStorage {
  private contacts: Map<number, Contact>;
  private messages: Map<number, Message>;
  private scheduledMessages: Map<number, ScheduledMessage>;
  private currentContactId: number;
  private currentMessageId: number;
  private currentScheduledMessageId: number;

  constructor() {
    this.contacts = new Map();
    this.messages = new Map();
    this.scheduledMessages = new Map();
    this.currentContactId = 1;
    this.currentMessageId = 1;
    this.currentScheduledMessageId = 1;
  }

  // Contact operations
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactByPhone(phone: string): Promise<Contact | undefined> {
    return Array.from(this.contacts.values()).find(contact => contact.phone === phone);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const contact: Contact = {
      ...insertContact,
      id,
      group: insertContact.group || null,
      createdAt: new Date(),
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;

    const updatedContact = { ...contact, ...updateData };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.contacts.values()).filter(contact => 
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.phone.includes(query) ||
      (contact.group && contact.group.toLowerCase().includes(lowerQuery))
    );
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByContact(contactId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(message => message.contactId === contactId);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      sentAt: new Date(),
      deliveredAt: null,
      failureReason: insertMessage.failureReason ?? null,
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessageStatus(id: number, status: string, deliveredAt?: Date, failureReason?: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;

    const updatedMessage = {
      ...message,
      status,
      deliveredAt: deliveredAt || message.deliveredAt,
      failureReason: failureReason || message.failureReason,
    };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getMessageStats(): Promise<{sent: number, delivered: number, failed: number, pending: number}> {
    const messages = Array.from(this.messages.values());
    return {
      sent: messages.filter(m => m.status === 'sent').length,
      delivered: messages.filter(m => m.status === 'delivered').length,
      failed: messages.filter(m => m.status === 'failed').length,
      pending: messages.filter(m => m.status === 'pending').length,
    };
  }

  // Scheduled message operations
  async getScheduledMessages(): Promise<ScheduledMessage[]> {
    return Array.from(this.scheduledMessages.values()).sort((a, b) => 
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  }

  async getScheduledMessage(id: number): Promise<ScheduledMessage | undefined> {
    return this.scheduledMessages.get(id);
  }

  async createScheduledMessage(insertScheduledMessage: InsertScheduledMessage): Promise<ScheduledMessage> {
    const id = this.currentScheduledMessageId++;
    const scheduledMessage: ScheduledMessage = {
      ...insertScheduledMessage,
      id,
      status: insertScheduledMessage.status || 'pending',
      createdAt: new Date(),
    };
    this.scheduledMessages.set(id, scheduledMessage);
    return scheduledMessage;
  }

  async updateScheduledMessage(id: number, updateData: Partial<InsertScheduledMessage>): Promise<ScheduledMessage | undefined> {
    const scheduledMessage = this.scheduledMessages.get(id);
    if (!scheduledMessage) return undefined;

    const updatedScheduledMessage = { ...scheduledMessage, ...updateData };
    this.scheduledMessages.set(id, updatedScheduledMessage);
    return updatedScheduledMessage;
  }

  async deleteScheduledMessage(id: number): Promise<boolean> {
    return this.scheduledMessages.delete(id);
  }

  async getPendingScheduledMessages(): Promise<ScheduledMessage[]> {
    const now = new Date();
    return Array.from(this.scheduledMessages.values()).filter(
      sm => sm.status === 'pending' && new Date(sm.scheduledFor) <= now
    );
  }
}

export const storage = new MemStorage();
