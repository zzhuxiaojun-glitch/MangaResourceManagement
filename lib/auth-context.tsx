'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /**
   * 用户注册功能
   *
   * 注意：当前为开发期配置，允许任何人注册
   *
   * 生产环境安全加固建议：
   * 1. 在 Supabase Dashboard > Authentication > Providers > Email 中
   *    启用 "Enable email confirmations" 要求邮箱验证
   * 2. 限制注册域名：在 Email Provider 中设置允许的邮箱域名
   * 3. 使用邀请码机制：在注册前验证邀请码
   * 4. 添加管理员审核流程：注册后账号默认禁用，需管理员激活
   * 5. 在数据库层面添加用户角色和权限表，注册用户默认无管理权限
   *
   * 如需完全关闭公开注册：
   * - 在 Supabase Dashboard > Authentication > Settings 中
   *   关闭 "Enable sign-ups"
   * - 删除此注册页面和相关路由
   */
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      // 未来可在此添加 metadata 用于用户角色管理
      // options: {
      //   data: {
      //     role: 'pending', // 待审核状态
      //   }
      // }
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
