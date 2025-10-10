import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Copy, LogOut } from "lucide-react";

const SpaceSelection = () => {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingSpace();
  }, []);

  const checkExistingSpace = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: membership } = await supabase
      .from("space_members")
      .select("space_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      navigate(`/chat/${membership.space_id}`);
    }
  };

  const handleCreateSpace = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate unique code
      const { data: codeData, error: codeError } = await supabase
        .rpc("generate_space_code");
      
      if (codeError) throw codeError;
      const code = codeData;

      // Create space
      const { data: space, error: spaceError } = await supabase
        .from("spaces")
        .insert({ code })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Join space
      const { error: joinError } = await supabase
        .from("space_members")
        .insert({ space_id: space.id, user_id: user.id });

      if (joinError) throw joinError;

      setCreatedCode(code);
      toast({
        title: "Space Created!",
        description: "Share the code with your partner",
      });
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

  const handleJoinSpace = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find space by code
      const { data: space, error: spaceError } = await supabase
        .from("spaces")
        .select()
        .eq("code", joinCode.toLowerCase())
        .single();

      if (spaceError || !space) throw new Error("Invalid code");

      // Join space
      const { error: joinError } = await supabase
        .from("space_members")
        .insert({ space_id: space.id, user_id: user.id });

      if (joinError) throw joinError;

      // Update space name
      await supabase
        .from("spaces")
        .update({ name: "Couple Chat" })
        .eq("id", space.id);

      toast({
        title: "Success!",
        description: "Joined space successfully",
      });
      navigate(`/chat/${space.id}`);
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

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("appUnlocked");
    navigate("/lock");
  };

  const goToChat = () => {
    if (createdCode) {
      navigate(`/chat`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Space
          </h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {createdCode ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Your Space Code:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono">{createdCode}</code>
                <Button size="icon" variant="outline" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Share this code with your partner to join
            </p>
            <Button onClick={goToChat} className="w-full">
              Go to Chat
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Button
                onClick={handleCreateSpace}
                disabled={loading}
                className="w-full h-24 text-lg"
              >
                {loading ? "Creating..." : "Create a Space"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Enter space code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleJoinSpace()}
                />
                <Button
                  onClick={handleJoinSpace}
                  disabled={loading || !joinCode}
                  variant="outline"
                  className="w-full"
                >
                  Join Space
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SpaceSelection;
