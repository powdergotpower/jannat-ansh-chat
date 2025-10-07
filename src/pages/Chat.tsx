import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "@capacitor/camera";
import { Filesystem } from "@capacitor/filesystem";
import MessageBubble from "@/components/MessageBubble";
import VoiceRecorder from "@/components/VoiceRecorder";

type Message = {
  id: string;
  sender: "ansh" | "jannat";
  content: string | null;
  message_type: "text" | "image" | "voice";
  file_url: string | null;
  created_at: string;
};

const Chat = () => {
  const { user } = useParams<{ user: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const otherUser = user === "ansh" ? "ayushi" : "ansh";

  useEffect(() => {
    if (!user || (user !== "ansh" && user !== "ayushi")) {
      navigate("/");
      return;
    }
    fetchMessages();
    subscribeToMessages();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }
    setMessages((data || []) as Message[]);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const { error } = await supabase.from("messages").insert({
      sender: user,
      content: newMessage,
      message_type: "text",
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return;
    }
    setNewMessage("");
  };

  // -----------------------------
  // Request storage/gallery permission
  // -----------------------------
  const requestGalleryPermission = async () => {
    try {
      const cameraStatus = await Camera.checkPermissions();
      if (cameraStatus.photos === "prompt" || cameraStatus.photos === "prompt-with-rationale") {
        const result = await Camera.requestPermissions();
        if (result.photos !== "granted") {
          toast({
            title: "Permission Required",
            description: "Please allow access to Photos to send images.",
            variant: "destructive",
          });
          return false;
        }
      } else if (cameraStatus.photos === "denied") {
        toast({
          title: "Permission Required",
          description: "Please allow access to Photos in your device settings.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error("Permission error:", err);
      toast({
        title: "Error",
        description: "Failed to request permissions.",
        variant: "destructive",
      });
      return false;
    }
  };

  // -----------------------------
  // Image upload handler
  // -----------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("chat-images")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("messages").insert({
      sender: user,
      message_type: "image",
      file_url: publicUrl,
    });

    if (insertError) {
      toast({
        title: "Error",
        description: "Failed to send image",
        variant: "destructive",
      });
    }

    e.target.value = "";
  };

  // -----------------------------
  // Voice note handler
  // -----------------------------
  const handleVoiceNote = async (audioBlob: Blob) => {
    const fileName = `${Math.random()}.webm`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("voice-notes")
      .upload(filePath, audioBlob);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload voice note",
        variant: "destructive",
      });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("voice-notes")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("messages").insert({
      sender: user,
      message_type: "voice",
      file_url: publicUrl,
    });

    if (insertError) {
      toast({
        title: "Error",
        description: "Failed to send voice note",
        variant: "destructive",
      });
    }
  };

  // -----------------------------
  // JSX
  // -----------------------------
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border p-4 flex items-center gap-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold capitalize">{otherUser}</h2>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} currentUser={user!} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card/80 backdrop-blur-lg border-t border-border p-4">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <VoiceRecorder
            onRecordingComplete={handleVoiceNote}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />

          {!isRecording && (
            <>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-full border-border/50 focus-visible:ring-accent"
              />
              <Button
                onClick={sendMessage}
                size="icon"
                className="rounded-full shrink-0 bg-gradient-to-r from-accent to-accent/80 hover:opacity-90"
              >
                <Send className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
        </div>
    </div>
  );
};

export default Chat;
