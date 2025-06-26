import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Save, Eye, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

const messageSchema = z.object({
  contactIds: z.array(z.number()).min(1, "At least one contact must be selected"),
  content: z.string().min(1, "Message content is required").max(4096, "Message is too long"),
  sendOption: z.enum(['immediate', 'scheduled']),
  scheduledTime: z.string().optional(),
  rateLimiting: z.boolean().default(true),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function MessageComposer() {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const { toast } = useToast();

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      contactIds: [],
      content: "",
      sendOption: "immediate",
      rateLimiting: true,
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const payload = {
        contactIds: data.contactIds,
        content: data.content,
        scheduled: data.sendOption === 'scheduled' ? data.scheduledTime : null,
      };
      return apiRequest("POST", "/api/messages/send", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      form.reset();
      setSelectedContacts([]);
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleContactSelect = (contactId: number, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedContacts, contactId]
      : selectedContacts.filter(id => id !== contactId);
    
    setSelectedContacts(newSelection);
    form.setValue('contactIds', newSelection);
  };

  const onSubmit = (data: MessageFormData) => {
    if (data.sendOption === 'scheduled' && !data.scheduledTime) {
      form.setError('scheduledTime', { message: 'Scheduled time is required' });
      return;
    }
    sendMessageMutation.mutate(data);
  };

  const sendOption = form.watch('sendOption');
  const messageContent = form.watch('content');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Compose Message</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="contactIds"
              render={() => (
                <FormItem>
                  <FormLabel>Recipients</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2">
                      <div className="flex-1 border rounded-md p-2 max-h-32 overflow-y-auto">
                        {contacts.length === 0 ? (
                          <p className="text-sm text-gray-500">No contacts available</p>
                        ) : (
                          contacts.map((contact) => (
                            <div key={contact.id} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`contact-${contact.id}`}
                                checked={selectedContacts.includes(contact.id)}
                                onCheckedChange={(checked) => 
                                  handleContactSelect(contact.id, checked as boolean)
                                }
                              />
                              <label htmlFor={`contact-${contact.id}`} className="text-sm cursor-pointer">
                                {contact.name} ({contact.phone})
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button type="button" size="sm" className="bg-[#25D366] hover:bg-[#128C7E]">
                          +
                        </Button>
                        <Button type="button" variant="outline" size="sm">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-500">Select contacts to send message to</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message here..."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      {messageContent?.length || 0}/4096 characters
                    </p>
                    <div className="flex space-x-2">
                      <Button type="button" variant="link" size="sm" className="text-[#25D366] p-0">
                        <Paperclip className="h-4 w-4 mr-1" />
                        Attach File
                      </Button>
                      <Button type="button" variant="link" size="sm" className="text-[#25D366] p-0">
                        <Smile className="h-4 w-4 mr-1" />
                        Emoji
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sendOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Send Option</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select send option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">Send Immediately</SelectItem>
                        <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={sendOption !== 'scheduled'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <FormField
                control={form.control}
                name="rateLimiting"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">Enable rate limiting (1 msg/2 sec)</FormLabel>
                  </FormItem>
                )}
              />
              <div className="space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setSelectedContacts([]);
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="bg-[#25D366] hover:bg-[#128C7E]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
