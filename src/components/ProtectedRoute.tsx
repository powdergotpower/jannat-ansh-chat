import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isUnlocked = localStorage.getItem("appUnlocked");
    if (isUnlocked !== "true") {
      navigate("/lock");
    }
  }, [navigate]);

  return <>{children}</>;
};

export default ProtectedRoute;
