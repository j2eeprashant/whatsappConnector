import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import AddContactModal from "./add-contact-modal";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

export default function ContactManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: searchQuery ? ["/api/contacts/search", { q: searchQuery }] : ["/api/contacts"],
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  const handleContactSelect = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const handleDeleteContact = (id: number) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contact Manager</CardTitle>
            <Button 
              size="sm" 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#25D366] hover:bg-[#128C7E]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Loading contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  {searchQuery ? "No contacts found" : "No contacts available"}
                </p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) =>
                        handleContactSelect(contact.id, checked as boolean)
                      }
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#25D366]/10 rounded-full flex items-center justify-center mr-3">
                        <span className="text-[#25D366] text-sm font-medium">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.phone}</p>
                        {contact.group && (
                          <p className="text-xs text-blue-600">{contact.group}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="p-1">
                      <Edit className="h-4 w-4 text-gray-400 hover:text-[#25D366]" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-1"
                      onClick={() => handleDeleteContact(contact.id)}
                      disabled={deleteContactMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {selectedContacts.length} of {contacts.length} selected
            </p>
            <div className="flex space-x-2">
              <Button
                variant="link"
                size="sm"
                onClick={handleSelectAll}
                className="text-gray-600 hover:text-[#25D366] p-0"
              >
                {selectedContacts.length === contacts.length ? "Deselect All" : "Select All"}
              </Button>
              <Button size="sm" variant="outline" className="text-[#25D366] border-[#25D366]">
                <Upload className="h-4 w-4 mr-1" />
                Import CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}
