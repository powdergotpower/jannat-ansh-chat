import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="text-center space-y-8 animate-in fade-in duration-700">
        <div className="space-y-4">
          <Heart className="h-16 w-16 mx-auto text-accent animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--ansh-bubble))] to-[hsl(var(--jannat-bubble))] bg-clip-text text-transparent">
            Ansh & Ayushi
          </h1>
          <p className="text-muted-foreground text-lg">Choose your profile to start chatting</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
          <Button
            onClick={() => navigate("/chat/ansh")}
            size="lg"
            className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-gradient-to-r from-[hsl(var(--ansh-bubble))] to-[hsl(var(--ansh-bubble))]/90 hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Ansh
          </Button>

          <Button
            onClick={() => navigate("/chat/ayushi")}
            size="lg"
            className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-gradient-to-r from-[hsl(var(--jannat-bubble))] to-[hsl(var(--jannat-bubble))]/90 hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Ayushi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
