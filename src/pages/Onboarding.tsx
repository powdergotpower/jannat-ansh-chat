import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "@capacitor/camera";
import { Upload } from "lucide-react";

const Onboarding = () => {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const handleImageUpload = async () => {
    try {
      const permission = await Camera.checkPermissions();
      if (permission.photos !== 'granted') {
        const result = await Camera.requestPermissions({ permissions: ['photos'] });
        if (result.photos !== 'granted') {
          toast({
            title: "Permission Required",
            description: "Please allow access to photos",
            variant: "destructive",
          });
          return;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: 'dataUrl' as any,
      });

      if (!photo.dataUrl) return;

      setUploading(true);

      const base64Data = photo.dataUrl.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(r => r.blob());
      
      const fileName = `${Math.random()}.jpg`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-images")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile picture uploaded!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile created!",
      });
      navigate("/space-selection");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground">
            Add your photo and name to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{displayName?.[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              onClick={handleImageUpload}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !displayName}
          >
            {loading ? "Creating Profile..." : "Continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Onboarding;
