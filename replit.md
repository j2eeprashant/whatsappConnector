# WhatsApp Business Messenger

## Overview

This is a full-stack WhatsApp Business messaging application built with a modern tech stack. The application allows users to manage contacts, send messages, schedule messages, and monitor delivery status through a web interface that integrates with WhatsApp Web.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom WhatsApp-inspired color scheme
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with custom middleware
- **Database**: PostgreSQL with potential for other databases
- **ORM**: Drizzle ORM with migrations support
- **WhatsApp Integration**: Puppeteer-based WhatsApp Web automation
- **Scheduling**: Node-cron for message scheduling
- **Session Management**: Express sessions with PostgreSQL store

### Key Design Decisions
1. **Monorepo Structure**: Shared schema and types between client and server for type safety
2. **Database Abstraction**: Interface-based storage layer allows switching between implementations
3. **WhatsApp Web Integration**: Uses Puppeteer to automate WhatsApp Web rather than official API
4. **Real-time Updates**: Polling-based updates for message status and system health
5. **Component-First UI**: Reusable shadcn/ui components for consistent design

## Key Components

### Database Schema (`shared/schema.ts`)
- **Contacts**: Store contact information with phone numbers and groups
- **Messages**: Track sent messages with delivery status and timestamps
- **Scheduled Messages**: Queue messages for future delivery with contact lists

### Storage Layer (`server/storage.ts`)
- **IStorage Interface**: Defines contract for data operations
- **MemStorage**: In-memory implementation for development/testing
- **Database Operations**: CRUD operations for contacts, messages, and scheduled messages

### WhatsApp Service (`server/services/whatsapp.ts`)
- **Browser Automation**: Puppeteer-based WhatsApp Web integration
- **Message Sending**: Automated message composition and sending
- **Connection Management**: QR code handling and session persistence

### Scheduler Service (`server/services/scheduler.ts`)
- **Cron Jobs**: Minute-based scheduling for message delivery
- **Queue Processing**: Handles scheduled message execution
- **Status Updates**: Updates message delivery status

### React Components
- **Dashboard**: Main application interface with statistics
- **MessageComposer**: Form for composing and sending messages
- **ContactManager**: Contact CRUD operations with search
- **MessageHistory**: Real-time message delivery tracking
- **ScheduledMessages**: Queue management interface

## Data Flow

1. **Contact Management**: Users add contacts through the UI, stored in database
2. **Message Composition**: Users select contacts and compose messages
3. **Message Scheduling**: Messages can be sent immediately or scheduled
4. **WhatsApp Integration**: Scheduler service processes queue and sends via WhatsApp Web
5. **Status Tracking**: Message delivery status is updated and displayed in real-time
6. **Real-time Updates**: Frontend polls backend for status updates every 5-10 seconds

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **puppeteer**: WhatsApp Web browser automation
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation

### UI Dependencies
- **@radix-ui/react-***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the stack
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Replit Configuration
- **Build Command**: `npm run build` - Builds both client and server
- **Start Command**: `npm run start` - Runs production server
- **Development**: `npm run dev` - Runs development server with hot reload
- **Port**: Application runs on port 5000, exposed as port 80

### Environment Setup
- **Database**: Requires `DATABASE_URL` environment variable
- **Node Modules**: postgresql-16, nodejs-20, and web modules
- **Static Files**: Client built to `dist/public`, served by Express

### Production Considerations
- **Database Migrations**: `npm run db:push` applies schema changes
- **WhatsApp Session**: Requires QR code scan for initial WhatsApp Web connection
- **Process Management**: Single process handles both web server and background jobs

## Changelog
- June 26, 2025. Initial setup
- June 26, 2025. Added Settings page with WhatsApp Web QR code connection interface
- June 26, 2025. Implemented graceful handling of browser dependency issues in demo mode

## Recent Changes

### Settings Page Implementation
- Created dedicated settings page at `/settings` route
- Added WhatsApp Web connection management interface
- Implemented QR code display functionality for browser-based WhatsApp Web linking
- Added system status monitoring and feature overview
- Integrated navigation between dashboard and settings

### WhatsApp Service Improvements
- Enhanced error handling for missing browser dependencies
- Added demo mode operation when Chrome/Chromium dependencies unavailable
- Implemented reconnection functionality for WhatsApp Web sessions
- Added proper TypeScript interfaces for status responses

### User Interface Enhancements
- Added functional settings button in main dashboard header
- Implemented responsive design for settings page
- Added clear instructions for WhatsApp Web connection process
- Enhanced error messaging for better user experience

## User Preferences

Preferred communication style: Simple, everyday language.