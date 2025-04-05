import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBot } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Bot } from "@shared/schema";
import { useAppContext } from "@/App";

interface BotCreationModalProps {
  open: boolean;
  onClose: () => void;
}

const AVATAR_COLORS = [
  { color: "#0078D4", bg: "bg-[#0078D4]" },
  { color: "#16A34A", bg: "bg-green-600" },
  { color: "#9333EA", bg: "bg-purple-600" },
  { color: "#EAB308", bg: "bg-yellow-500" },
  { color: "#DC2626", bg: "bg-red-600" },
];

export default function BotCreationModal({ open, onClose }: BotCreationModalProps) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].color);
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("gpt-4o");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setActiveBot } = useAppContext();

  // Create bot mutation
  const createBotMutation = useMutation({
    mutationFn: async (botData: {
      name: string;
      avatar: string;
      color: string;
      description: string;
      model: string;
    }) => {
      return createBot(botData);
    },
    onSuccess: (newBot: Bot) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot created",
        description: `${newBot.name} has been created successfully.`,
      });
      setActiveBot(newBot);
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !avatar.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name and avatar for your bot.",
        variant: "destructive",
      });
      return;
    }
    
    createBotMutation.mutate({
      name,
      avatar,
      color: selectedColor,
      description,
      model,
    });
  };

  const resetForm = () => {
    setName("");
    setAvatar("");
    setSelectedColor(AVATAR_COLORS[0].color);
    setDescription("");
    setModel("gpt-4o");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Bot</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="botName">Bot Name</Label>
              <Input
                id="botName"
                placeholder="e.g., Code Helper, Writing Assistant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="avatar">Bot Avatar Initial</Label>
              <Input
                id="avatar"
                placeholder="Single letter or emoji"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value.charAt(0))}
                maxLength={1}
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label>Avatar Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.color}
                    type="button"
                    className={cn(
                      "h-12 w-12 rounded-full cursor-pointer transition-all",
                      color.bg,
                      selectedColor === color.color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    )}
                    data-color={color.color}
                    onClick={() => setSelectedColor(color.color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="description">Bot Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this bot is specialized in..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="model">Base Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createBotMutation.isPending}
            >
              {createBotMutation.isPending ? "Creating..." : "Create Bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
