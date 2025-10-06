import { formatDistanceToNow } from "date-fns";
import { Play, Pause } from "lucide-react";
import { useState, useRef } from "react";

type Message = {
  id: string;
  sender: "ansh" | "jannat";
  content: string | null;
  message_type: "text" | "image" | "voice";
  file_url: string | null;
  created_at: string;
};

interface MessageBubbleProps {
  message: Message;
  currentUser: string;
}

const MessageBubble = ({ message, currentUser }: MessageBubbleProps) => {
  const isOwn = message.sender === currentUser;
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const bubbleClass = isOwn
    ? "bg-gradient-to-br from-[hsl(var(--ansh-bubble))] to-[hsl(var(--ansh-bubble))]/90 text-[hsl(var(--ansh-bubble-foreground))] ml-auto"
    : "bg-gradient-to-br from-[hsl(var(--jannat-bubble))] to-[hsl(var(--jannat-bubble))]/90 text-[hsl(var(--jannat-bubble-foreground))] mr-auto";

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[75%] rounded-2xl p-3 shadow-lg ${bubbleClass}`}>
        {message.message_type === "text" && (
          <p className="text-sm break-words">{message.content}</p>
        )}

        {message.message_type === "image" && message.file_url && (
          <img
            src={message.file_url}
            alt="Shared"
            className="rounded-lg max-w-full h-auto"
          />
        )}

        {message.message_type === "voice" && message.file_url && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <audio
              ref={audioRef}
              src={message.file_url}
              onEnded={() => setIsPlaying(false)}
            />
            <span className="text-xs opacity-80">Voice note</span>
          </div>
        )}

        <p className="text-xs opacity-70 mt-1">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
