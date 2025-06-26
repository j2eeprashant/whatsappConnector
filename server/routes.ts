import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { whatsAppService } from "./services/whatsapp";
import { schedulerService } from "./services/scheduler";
import { insertContactSchema, insertMessageSchema, insertScheduledMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize WhatsApp service
  await whatsAppService.initialize();
  schedulerService.start();

  // Contact routes
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const contacts = await storage.searchContacts(query);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to search contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      
      // Check if contact already exists
      const existingContact = await storage.getContactByPhone(validatedData.phone);
      if (existingContact) {
        return res.status(400).json({ error: "Contact with this phone number already exists" });
      }

      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contact data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      
      const contact = await storage.updateContact(id, validatedData);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contact data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContact(id);
      
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/stats", async (req, res) => {
    try {
      const stats = await storage.getMessageStats();
      const contacts = await storage.getContacts();
      res.json({ ...stats, totalContacts: contacts.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch message stats" });
    }
  });

  app.post("/api/messages/send", async (req, res) => {
    try {
      const { contactIds, content, scheduled } = req.body;
      
      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({ error: "Contact IDs are required" });
      }
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Message content is required" });
      }

      if (scheduled) {
        // Schedule message for later
        const scheduledMessage = await storage.createScheduledMessage({
          contactIds: contactIds,
          content,
          scheduledFor: new Date(scheduled),
          status: 'pending',
        });
        
        res.json({ scheduled: true, id: scheduledMessage.id });
      } else {
        // Send immediately
        const results = [];
        
        for (const contactId of contactIds) {
          const contact = await storage.getContact(contactId);
          if (!contact) {
            results.push({ contactId, success: false, error: "Contact not found" });
            continue;
          }

          // Create message record
          const message = await storage.createMessage({
            contactId,
            content,
            status: 'pending',
            failureReason: null,
          });

          // Send via WhatsApp
          const result = await whatsAppService.sendMessage(contact.phone, content);
          
          if (result.success) {
            await storage.updateMessageStatus(message.id, 'sent');
            results.push({ contactId, success: true, messageId: message.id });
          } else {
            await storage.updateMessageStatus(message.id, 'failed', undefined, result.error);
            results.push({ contactId, success: false, error: result.error, messageId: message.id });
          }

          // Rate limiting - wait 2 seconds between messages
          if (contactIds.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        res.json({ results });
      }
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Scheduled message routes
  app.get("/api/scheduled-messages", async (req, res) => {
    try {
      const scheduledMessages = await storage.getScheduledMessages();
      res.json(scheduledMessages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scheduled messages" });
    }
  });

  app.delete("/api/scheduled-messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteScheduledMessage(id);
      
      if (!success) {
        return res.status(404).json({ error: "Scheduled message not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scheduled message" });
    }
  });

  // WhatsApp status route
  app.get("/api/whatsapp/status", async (req, res) => {
    try {
      const status = await whatsAppService.getConnectionStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get WhatsApp status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
