import { storage } from '../storage';
import { whatsAppService } from './whatsapp';
import * as cron from 'node-cron';

export class SchedulerService {
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;

    // Run every minute to check for scheduled messages
    cron.schedule('* * * * *', async () => {
      await this.processScheduledMessages();
    });

    this.isRunning = true;
    console.log('Scheduler service started');
  }

  stop(): void {
    this.isRunning = false;
    console.log('Scheduler service stopped');
  }

  private async processScheduledMessages(): Promise<void> {
    try {
      const pendingMessages = await storage.getPendingScheduledMessages();
      
      for (const scheduledMessage of pendingMessages) {
        try {
          // Parse contact IDs
          const contactIds = JSON.parse(scheduledMessage.contactIds as any);
          
          // Send message to each contact
          for (const contactId of contactIds) {
            const contact = await storage.getContact(contactId);
            if (!contact) continue;

            // Create message record
            const message = await storage.createMessage({
              contactId,
              content: scheduledMessage.content,
              status: 'pending',
              failureReason: null,
            });

            // Send via WhatsApp
            const result = await whatsAppService.sendMessage(contact.phone, scheduledMessage.content);
            
            if (result.success) {
              await storage.updateMessageStatus(message.id, 'sent');
            } else {
              await storage.updateMessageStatus(message.id, 'failed', undefined, result.error);
            }

            // Rate limiting - wait 2 seconds between messages
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Mark scheduled message as sent
          await storage.updateScheduledMessage(scheduledMessage.id, { status: 'sent' });
          
        } catch (error) {
          console.error('Failed to process scheduled message:', error);
          await storage.updateScheduledMessage(scheduledMessage.id, { 
            status: 'failed' 
          });
        }
      }
    } catch (error) {
      console.error('Error in scheduler:', error);
    }
  }
}

export const schedulerService = new SchedulerService();
