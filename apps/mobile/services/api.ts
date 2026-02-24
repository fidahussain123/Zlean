import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';

const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb && typeof localStorage !== 'undefined') {
    return Promise.resolve(localStorage.getItem(key));
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export type Role = 'super_admin' | 'admin' | 'worker' | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  shopId?: string;
}

export async function clearSession(): Promise<void> {
  await supabase.auth.signOut();
}

export const authApi = {
  login: async (loginId: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginId.trim(),
      password,
    });

    if (authError) throw new Error(authError.message);

    if (authData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, role, shop_id')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw new Error(profileError.message);

      return {
        token: authData.session?.access_token || '',
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: profile.role as Role,
          shopId: profile.shop_id,
        },
      };
    }

    throw new Error('Login failed');
  },

  signupCustomer: async (email: string, password: string, name: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name,
          role: 'customer',
        },
      },
    });

    if (authError) throw new Error(authError.message);

    if (authData.user) {
      return {
        token: authData.session?.access_token || '',
        user: {
          id: authData.user.id,
          name,
          email: email.trim().toLowerCase(),
          role: 'customer' as Role,
        },
      };
    }

    throw new Error('Signup failed');
  },

  logout: async () => {
    await supabase.auth.signOut();
  },
};

export const shopsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (shop: { name: string; address?: string; phone?: string; plan?: string }) => {
    const { data, error } = await supabase
      .from('shops')
      .insert({ ...shop, status: 'active' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('shops')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};

export const visitsApi = {
  getAll: async (shopId?: string) => {
    let query = supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (visit: {
    customer_id?: string;
    worker_id?: string;
    shop_id: string;
    car_plate: string;
    car_model?: string;
    service: string;
    notes?: string;
  }) => {
    const { data, error } = await supabase
      .from('visits')
      .insert({ ...visit, status: 'waiting' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('visits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  getQueue: async (workerId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('worker_id', workerId)
      .gte('created_at', `${today}T00:00:00`)
      .not('status', 'eq', 'delivered')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  },
};

export const invitesApi = {
  checkEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('invites')
      .select('id, email, token, status, expires_at')
      .eq('email', email.trim().toLowerCase())
      .eq('status', 'pending')
      .single();
    
    if (error || !data) {
      throw new Error('No invitation found for this email');
    }
    
    if (new Date(data.expires_at) < new Date()) {
      await supabase
        .from('invites')
        .update({ status: 'expired' })
        .eq('id', data.id);
      throw new Error('Your invitation has expired');
    }
    
    return {
      hasInvite: true,
      token: data.token,
      email: data.email,
    };
  },

  validate: async (token: string) => {
    const { data, error } = await supabase
      .from('invites')
      .select('id, email, status, expires_at')
      .eq('token', token)
      .single();
    
    if (error || !data) {
      throw new Error('Invalid invite link');
    }
    
    if (data.status === 'accepted') {
      throw new Error('This invite has already been used');
    }
    
    if (data.status === 'revoked') {
      throw new Error('This invite has been revoked');
    }
    
    if (new Date(data.expires_at) < new Date()) {
      await supabase
        .from('invites')
        .update({ status: 'expired' })
        .eq('id', data.id);
      throw new Error('This invite has expired');
    }
    
    return {
      email: data.email,
      valid: true,
    };
  },
};

export const profilesApi = {
  getCurrent: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (updates: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },
};
