import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock as LockIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Lock = () => {
  const [pin, setPin] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already unlocked
    const isUnlocked = localStorage.getItem("appUnlocked");
    if (isUnlocked === "true") {
      navigate("/");
    }
  }, [navigate]);

  const handlePinSubmit = () => {
    if (pin === "1958") {
      localStorage.setItem("appUnlocked", "true");
      toast({
        title: "Unlocked",
        description: "Welcome!",
      });
      navigate("/");
    } else {
      toast({
        title: "Invalid PIN",
        description: "Please try again",
        variant: "destructive",
      });
      setPin("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePinSubmit();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="text-center space-y-8 animate-in fade-in duration-700 max-w-md w-full">
        <div className="space-y-4">
          <LockIcon className="h-16 w-16 mx-auto text-accent animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold">Enter PIN</h1>
          <p className="text-muted-foreground text-lg">Please enter your PIN to continue</p>
        </div>

        <div className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyPress={handleKeyPress}
            placeholder="Enter 4-digit PIN"
            className="text-center text-2xl tracking-widest"
          />
          <Button
            onClick={handlePinSubmit}
            size="lg"
            className="w-full text-lg py-6 rounded-full bg-gradient-to-r from-accent to-accent/80 hover:opacity-90"
          >
            Unlock
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Lock;
