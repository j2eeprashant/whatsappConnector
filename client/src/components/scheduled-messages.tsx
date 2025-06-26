import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { ScheduledMessage, Contact } from "@shared/schema";

export default function ScheduledMessages() {
  const { toast } = useToast();

  const { data: scheduledMessages = [], isLoading } = useQuery<ScheduledMessage[]>({
    queryKey: ["/api/scheduled-messages"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const deleteScheduledMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/scheduled-messages/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scheduled message deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete scheduled message",
        variant: "destructive",
      });
    },
  });

  const formatScheduledTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRecipientCount = (contactIds: string) => {
    try {
      const ids = JSON.parse(contactIds);
      return Array.isArray(ids) ? ids.length : 0;
    } catch {
      return 0;
    }
  };

  const handleDeleteScheduledMessage = (id: number) => {
    if (confirm("Are you sure you want to delete this scheduled message?")) {
      deleteScheduledMessageMutation.mutate(id);
    }
  };

  const pendingMessages = scheduledMessages.filter(msg => msg.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scheduled Messages</CardTitle>
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            {pendingMessages.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Loading scheduled messages...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledMessages.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No scheduled messages</p>
              </div>
            ) : (
              scheduledMessages.map((message) => (
                <div key={message.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="font-medium">
                        {formatScheduledTime(message.scheduledFor)}
                      </span>
                      <Badge 
                        variant={message.status === 'pending' ? 'outline' : 'secondary'}
                        className="ml-2"
                      >
                        {message.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" className="p-1">
                        <Edit className="h-4 w-4 text-gray-400 hover:text-[#25D366]" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1"
                        onClick={() => handleDeleteScheduledMessage(message.id)}
                        disabled={deleteScheduledMessageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2" title={message.content}>
                    {message.content.length > 60 
                      ? `${message.content.substring(0, 60)}...` 
                      : message.content
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRecipientCount(message.contactIds)} recipients
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
