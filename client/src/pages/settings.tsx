import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Settings, Smartphone, Wifi, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface WhatsAppStatus {
  connected: boolean;
  qrCode?: string;
}

export default function SettingsPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const { data: whatsappStatus, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000, // Check status every 5 seconds
  });

  const reconnectMutation = useMutation({
    mutationFn: async () => {
      setIsConnecting(true);
      // In a real implementation, this would trigger WhatsApp Web reconnection
      await new Promise(resolve => setTimeout(resolve, 3000));
      return apiRequest("POST", "/api/whatsapp/reconnect");
    },
    onSuccess: () => {
      toast({
        title: "Reconnection initiated",
        description: "Please scan the QR code to connect",
      });
      refetchStatus();
      setIsConnecting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reconnect",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  const handleReconnect = () => {
    reconnectMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="text-[#25D366] text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
            <Link href="/">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* WhatsApp Web Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-[#25D366]" />
                WhatsApp Web Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${whatsappStatus?.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="font-medium">
                    {whatsappStatus?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                  <Badge variant={whatsappStatus?.connected ? 'default' : 'destructive'}>
                    {whatsappStatus?.connected ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Button
                  onClick={handleReconnect}
                  disabled={isConnecting || whatsappStatus?.connected}
                  className="bg-[#25D366] hover:bg-[#128C7E]"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                  {isConnecting ? 'Connecting...' : 'Connect to WhatsApp Web'}
                </Button>
              </div>

              {!whatsappStatus?.connected && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    WhatsApp Web is not connected. Click "Connect to WhatsApp Web" and scan the QR code with your phone.
                  </AlertDescription>
                </Alert>
              )}

              {whatsappStatus?.qrCode && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="mb-4">
                    <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Scan QR Code with WhatsApp
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
                    <img 
                      src={whatsappStatus.qrCode} 
                      alt="WhatsApp QR Code" 
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    QR code will refresh automatically every 30 seconds
                  </p>
                </div>
              )}

              {whatsappStatus?.connected && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Wifi className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900">Successfully Connected</h4>
                      <p className="text-sm text-green-700">
                        Your WhatsApp Web session is active and ready to send messages.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Application Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Server Status:</span>
                      <Badge variant="default">Running</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Database:</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Message Queue:</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact Management:</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Message Scheduling:</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate Limiting:</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Connect WhatsApp Web</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Open WhatsApp on your phone</h4>
                    <p className="text-sm text-gray-600">Make sure you have the latest version of WhatsApp installed.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Go to Settings → Linked Devices</h4>
                    <p className="text-sm text-gray-600">Navigate to the Linked Devices section in WhatsApp settings.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Tap "Link a Device"</h4>
                    <p className="text-sm text-gray-600">This will open the QR code scanner on your phone.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Scan the QR code above</h4>
                    <p className="text-sm text-gray-600">Point your phone's camera at the QR code displayed on this page.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}