import { MessageSquare, Settings, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MessageComposer from "@/components/message-composer";
import ContactManager from "@/components/contact-manager";
import MessageHistory from "@/components/message-history";
import ScheduledMessages from "@/components/scheduled-messages";
import SystemStatus from "@/components/system-status";

export default function Dashboard() {
  const { data: whatsappStatus } = useQuery({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 10000, // Check status every 10 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/messages/stats"],
    refetchInterval: 5000, // Update stats every 5 seconds
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageSquare className="text-[#25D366] text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">WhatsApp Business Messenger</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <Circle className={`h-3 w-3 ${whatsappStatus?.connected ? 'text-green-400 fill-green-400' : 'text-red-400 fill-red-400'}`} />
                <span>{whatsappStatus?.connected ? 'Connected to WhatsApp Web' : 'Disconnected from WhatsApp Web'}</span>
              </div>
              <Link href="/settings">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-[#25D366]/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.sent || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.delivered || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.failed || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalContacts || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <MessageComposer />
            <MessageHistory />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ContactManager />
            <ScheduledMessages />
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
