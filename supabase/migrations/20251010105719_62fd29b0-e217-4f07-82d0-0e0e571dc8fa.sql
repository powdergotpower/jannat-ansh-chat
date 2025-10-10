-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create spaces table (without complex policies yet)
CREATE TABLE public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Waiting for partner to join...' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create spaces"
  ON public.spaces FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create space_members table
CREATE TABLE public.space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(space_id, user_id)
);

ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their spaces"
  ON public.space_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = space_members.space_id AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join spaces"
  ON public.space_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Now add policies to spaces that reference space_members
CREATE POLICY "Users can view spaces they are members of"
  ON public.spaces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members
      WHERE space_id = spaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Space members can update space name"
  ON public.spaces FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members
      WHERE space_id = spaces.id AND user_id = auth.uid()
    )
  );

-- Update messages table to use space_id
ALTER TABLE public.messages DROP COLUMN IF EXISTS sender;
ALTER TABLE public.messages ADD COLUMN space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old policies on messages
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;

-- Create new policies for messages
CREATE POLICY "Users can view messages in their spaces"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members
      WHERE space_id = messages.space_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their spaces"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.space_members
      WHERE space_id = messages.space_id AND user_id = auth.uid()
    )
  );

-- Create user_roles table for admin
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to generate unique space code
CREATE OR REPLACE FUNCTION public.generate_space_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := lower(substr(md5(random()::text), 1, 12));
    SELECT EXISTS(SELECT 1 FROM public.spaces WHERE spaces.code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.space_members;