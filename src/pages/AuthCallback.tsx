import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const finishAuth = async () => {
      const callbackUrl = new URL(window.location.href);
      const code = callbackUrl.searchParams.get("code");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
      } catch (err: any) {
        if (mounted) {
          toast.error(err.message || "Erreur de connexion Google");
          navigate("/auth", { replace: true });
        }
        return;
      }

      if (mounted) navigate("/", { replace: true });
    };

    void finishAuth();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <p className="text-sm text-muted-foreground">Connexion en cours...</p>
    </div>
  );
};

export default AuthCallback;
