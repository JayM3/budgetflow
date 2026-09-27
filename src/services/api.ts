/**
 * API Service for BudgetFlow Family Hub
 * Handles communication with the lightweight Node.js backend.
 * Gracefully falls back if running on GitHub Pages (static demo mode).
 */

const API_BASE = ''; // Relative path, works automatically when served by Express or reverse proxy

export interface ServerStatus {
  status: string;
  mode: string;
  isSetupCompleted: boolean;
  householdName: string;
  currency: string;
  currencySymbol: string;
  lanIp: string;
  port: number;
}

const TOKEN_KEY = 'budgetflow_session_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async checkStatus(): Promise<ServerStatus | null> {
    try {
      const res = await fetch(`${API_BASE}/api/status`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running (e.g. GitHub Pages static hosting)
    }
    return null;
  },

  async setupHousehold(data: any): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.token) {
        this.setToken(json.token);
      }
      return json;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getFamilyUsers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async verifyPattern(userId: string, pattern: number[]): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-pattern`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pattern }),
      });
      const json = await res.json();
      if (res.ok && json.token) {
        this.setToken(json.token);
      }
      return json;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async registerMember(memberData: {
    name: string;
    avatar: string;
    color: string;
    patternSequence: number[];
  }): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const json = await res.json();
      if (res.ok && json.token) {
        this.setToken(json.token);
      }
      return json;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getData(): Promise<any | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/api/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return null;
  },

  async createTransaction(tx: any): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tx),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateTransaction(id: string, updates: any): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Categories / Budgets
  async createCategory(cat: any): Promise<any> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cat),
      });
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
    return null;
  },

  async updateCategory(id: string, updates: any): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Bills and Recurring Income
  async createBill(bill: any): Promise<any> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bill),
      });
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
    return null;
  },

  async updateBill(id: string, updates: any): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/bills/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteBill(id: string): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/bills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Goals
  async createGoal(goal: any): Promise<any> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(goal),
      });
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
    return null;
  },

  async updateGoal(id: string, updates: any): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteGoal(id: string): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/goals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async allocateLeftoverToGoals(payload: {
    allocations: { goalId: string; amount: number; targetWalletId?: string }[];
    sourceWalletId?: string;
    description?: string;
  }): Promise<{ success: boolean; goals?: any[]; wallets?: any[] }> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/goals/allocate-leftover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {
      return { success: false };
    }
    return { success: false };
  },

  // Wallets
  async createWallet(wallet: any): Promise<any> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(wallet),
      });
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
    return null;
  },

  async updateWallet(id: string, updates: any): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/wallets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteWallet(id: string): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/wallets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getActivityLogs(): Promise<any[]> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/activity-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
    } catch {
      return [];
    }
    return [];
  },

  async addMember(member: any): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(member),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateMember(id: string, updates: any): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteMember(id: string): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
