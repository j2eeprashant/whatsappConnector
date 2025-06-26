import puppeteer, { Browser, Page } from 'puppeteer';

export class WhatsAppService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isConnected = false;
  private initializationFailed = false;

  async initialize(): Promise<void> {
    console.log('Initializing WhatsApp Web service...');
    try {
      this.browser = await puppeteer.launch({ 
        headless: true,
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows'
        ],
        timeout: 30000
      });
      
      this.page = await this.browser.newPage();
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('Navigating to WhatsApp Web...');
      await this.page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try multiple selectors for QR code and chat interface
      const qrSelectors = [
        'div[data-testid="qr-code"]',
        'canvas[aria-label*="qr"]',
        'canvas[aria-label*="QR"]',
        'div[data-ref="qr-code"]',
        'canvas'
      ];
      
      const chatSelectors = [
        'div[data-testid="chat-list"]',
        'div[data-testid="chat-list-search"]',
        'div[role="textbox"][data-testid="chat-list-search"]'
      ];
      
      let foundElement = false;
      for (const selector of [...qrSelectors, ...chatSelectors]) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          foundElement = true;
          break;
        } catch (e) {
          // Continue trying other selectors
        }
      }
      
      // Check if we're logged in by looking for chat interface
      const isLoggedIn = await this.page.$('div[data-testid="chat-list"]') || 
                        await this.page.$('div[data-testid="chat-list-search"]');
      this.isConnected = !!isLoggedIn;
      
      console.log('WhatsApp Web service initialized successfully, connected:', this.isConnected);
      
      if (!foundElement) {
        console.log('Warning: Could not find expected WhatsApp Web elements, but continuing...');
      }
    } catch (error) {
      console.error('WhatsApp Web initialization failed:', error instanceof Error ? error.message : 'Unknown error');
      this.initializationFailed = true;
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (this.initializationFailed || !this.page) {
      return { 
        success: false, 
        error: 'WhatsApp Web service unavailable - please connect first' 
      };
    }

    if (!this.isConnected) {
      return { success: false, error: 'WhatsApp Web not connected - scan QR code first' };
    }

    try {
      const chatUrl = `https://web.whatsapp.com/send?phone=${phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
      await this.page.goto(chatUrl, { waitUntil: 'networkidle2' });

      await this.page.waitForSelector('div[data-testid="conversation-compose-box-input"]', { timeout: 10000 });

      await this.page.click('div[data-testid="conversation-compose-box-input"]');
      await this.page.keyboard.type(message);
      await this.page.keyboard.press('Enter');

      await new Promise(resolve => setTimeout(resolve, 2000));

      return { success: true };
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getConnectionStatus(): Promise<{ connected: boolean; qrCode?: string }> {
    if (this.initializationFailed) {
      return { connected: false };
    }

    if (!this.page) {
      return { connected: false };
    }

    try {
      // Check if we're logged in first
      const chatList = await this.page.$('div[data-testid="chat-list"]') ||
                       await this.page.$('div[data-testid="chat-list-search"]');
      
      if (chatList) {
        this.isConnected = true;
        return { connected: true };
      }

      // Look for QR code with multiple approaches
      let qrCode: string | null = null;
      
      // Try to find QR code canvas
      const canvas = await this.page.$('canvas');
      if (canvas) {
        qrCode = await this.page.evaluate((canvasElement) => {
          return canvasElement.toDataURL();
        }, canvas);
      }
      
      // If no QR code found, try screenshot of QR area
      if (!qrCode) {
        const qrContainer = await this.page.$('div[data-testid="qr-code"]') ||
                           await this.page.$('div[data-ref="qr-code"]');
        
        if (qrContainer) {
          const screenshot = await qrContainer.screenshot({ encoding: 'base64' });
          qrCode = `data:image/png;base64,${screenshot}`;
        }
      }
      
      return { connected: false, qrCode: qrCode || undefined };
    } catch (error) {
      console.error('Failed to get connection status:', error);
      return { connected: false };
    }
  }

  async reconnect(): Promise<void> {
    console.log('Attempting to reconnect to WhatsApp Web...');
    this.isConnected = false;
    this.initializationFailed = false;
    
    // Re-attempt initialization
    await this.initialize();
  }

  async close(): Promise<void> {
    // Clean up any resources if needed
    this.isConnected = false;
  }
}

export const whatsAppService = new WhatsAppService();
