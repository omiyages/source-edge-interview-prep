
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";
import { environment } from "@/config/environment";

export const useDeleteUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      const clerkJwt = await getToken({ skipCache: true });
      if (!clerkJwt) throw new Error("Not authenticated");

      const resp = await fetch(`${environment.supabase.url}/functions/v1/admin-user-management`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: environment.supabase.anonKey,
          "x-clerk-jwt": clerkJwt,
        },
        body: JSON.stringify({
          method: "DELETE_USER",
          body: { userId },
        }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(json?.error || `Failed to delete user (${resp.status})`);
      }
      if (json?.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });
};
