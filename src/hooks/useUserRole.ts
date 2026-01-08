import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  role: AppRole;
}

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return (data as UserRole[]) || [];
    },
    enabled: !!user?.id,
  });

  const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
  const isModerator = roles?.some(r => r.role === 'moderator') ?? false;

  return {
    roles,
    isAdmin,
    isModerator,
    isLoading,
  };
};
