import { useQuery } from "@tanstack/react-query";
import { Circle, Wifi, Clock, Shield, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemStatus() {
  const { data: whatsappStatus } = useQuery({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 10000, // Check every 10 seconds
  });

  const { data: messageStats } = useQuery({
    queryKey: ["/api/messages/stats"],
    refetchInterval: 5000, // Check every 5 seconds
  });

  const { data: scheduledMessages = [] } = useQuery({
    queryKey: ["/api/scheduled-messages"],
    refetchInterval: 10000,
  });

  const pendingCount = scheduledMessages.filter((msg: any) => msg.status === 'pending').length;
  const lastBackup = "2 hours ago"; // This would be dynamic in a real app

  const getStatusIcon = (connected: boolean) => (
    <Circle className={`h-3 w-3 ${connected ? 'text-green-400 fill-green-400' : 'text-red-400 fill-red-400'}`} />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(whatsappStatus?.connected)}
              <span className="text-sm text-gray-700 ml-2">WhatsApp Web</span>
            </div>
            <span className={`text-sm font-medium ${whatsappStatus?.connected ? 'text-green-600' : 'text-red-600'}`}>
              {whatsappStatus?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(true)}
              <span className="text-sm text-gray-700 ml-2">Message Queue</span>
            </div>
            <span className="text-sm font-medium text-green-600">
              Active ({messageStats?.pending || 0} pending)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Circle className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-gray-700 ml-2">Rate Limiting</span>
            </div>
            <span className="text-sm font-medium text-yellow-600">
              Enabled
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Circle className="h-3 w-3 text-blue-400 fill-blue-400" />
              <span className="text-sm text-gray-700 ml-2">Scheduled Jobs</span>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {pendingCount} pending
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Circle className="h-3 w-3 text-green-400 fill-green-400" />
              <span className="text-sm text-gray-700 ml-2">Last Backup</span>
            </div>
            <span className="text-sm font-medium text-green-600">
              {lastBackup}
            </span>
          </div>
        </div>

        {!whatsappStatus?.connected && whatsappStatus?.qrCode && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 mb-2">
              Scan QR code to connect WhatsApp Web:
            </p>
            <img 
              src={whatsappStatus.qrCode} 
              alt="WhatsApp QR Code" 
              className="w-32 h-32 mx-auto"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
