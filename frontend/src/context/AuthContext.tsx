import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const getApiUrl = (path: string) => {
    // Connect to backend port (8000)
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `http://localhost:8000/${cleanPath}`;
  };

  const apiFetch = async (urlPath: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // Inject Bearer token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const fullUrl = getApiUrl(urlPath);
    const res = await fetch(fullUrl, {
      ...options,
      headers
    });

    if (res.status === 204) {
      return null;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'API error occurred.' }));
      throw new Error(errData.detail || 'API request failed.');
    }

    return res.json();
  };

  const fetchProfile = async (currentToken: string) => {
    try {
      const res = await fetch(getApiUrl('api/v1/auth/me'), {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email); // oauth2 login uses username
    params.append('password', password);

    const res = await fetch(getApiUrl('api/v1/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
      throw new Error(err.detail || 'Incorrect email or password.');
    }

    const data = await res.json();
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
  };

  const registerUser = async (email: string, fullName: string, password: string) => {
    await apiFetch('api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        full_name: fullName,
        password
      })
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerUser, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
