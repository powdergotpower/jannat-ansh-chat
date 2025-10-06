import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
}

const VoiceRecorder = ({ onRecordingComplete, isRecording, setIsRecording }: VoiceRecorderProps) => {
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Button
      variant={isRecording ? "destructive" : "ghost"}
      size="icon"
      className={`rounded-full shrink-0 transition-all duration-300 ${
        isRecording ? "scale-110 animate-pulse" : ""
      }`}
      onClick={isRecording ? stopRecording : startRecording}
    >
      {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </Button>
  );
};

export default VoiceRecorder;
