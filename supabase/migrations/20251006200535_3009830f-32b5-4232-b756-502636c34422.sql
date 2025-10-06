-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender TEXT NOT NULL CHECK (sender IN ('ansh', 'jannat')),
  content TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'voice')),
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read messages (since it's just you two)
CREATE POLICY "Anyone can read messages" 
ON public.messages 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert messages
CREATE POLICY "Anyone can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true);

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-notes', 'voice-notes', true);

-- Create storage policies for images
CREATE POLICY "Anyone can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Anyone can view images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-images');

-- Create storage policies for voice notes
CREATE POLICY "Anyone can upload voice notes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-notes');

CREATE POLICY "Anyone can view voice notes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'voice-notes');