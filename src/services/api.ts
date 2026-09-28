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

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
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
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/data`, { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return null;
  },

  async getCurrentUser(): Promise<any | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        return json.user || null;
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

  async saveCategories(categories: any[]): Promise<boolean> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories }),
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

  // Universal Full-State Save
  async saveAll(payload: any): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/save-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || `HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  saveAllKeepAlive(payload: any): void {
    const token = this.getToken();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(`${API_BASE}/api/save-all`, {
        method: 'POST',
        keepalive: true,
        headers,
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      // ignore
    }
  },

  async bulkImportTransactions(transactions: any[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/transactions/bulk`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ transactions }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updatePreferences(preferences: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/preferences`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(preferences),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async saveMerchantRule(merchant: string, category: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/merchant-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant, category }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async migrateFromClient(clientState: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/sync/migrate-from-client`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(clientState),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // System Self-Update
  async checkForUpdate(): Promise<SystemUpdateStatus> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/system/check-update`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { success: false, updateAvailable: false, currentVersion: '1.0.2', error: err.error };
    } catch (e: any) {
      return { success: false, updateAvailable: false, currentVersion: '1.0.2', error: e.message };
    }
  },


  async startUpdate(
    options: { force?: boolean; channel?: string } = {},
    onProgress: (data: UpdateProgressEvent) => void
  ): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/system/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        return { success: false, error: err.error || 'Update request failed' };
      }

      const reader = res.body?.getReader();
      if (!reader) {
        return { success: false, error: 'Streaming response not supported by browser' };
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const data = JSON.parse(trimmed.slice(5).trim());
              onProgress(data);
              if (data.status === 'error') {
                return { success: false, error: data.error };
              }
            } catch (_) {}
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

export interface SystemUpdateStatus {
  success: boolean;
  repo?: string;
  currentVersion: string;
  latestVersion?: string;
  updateAvailable: boolean;
  releaseNotes?: string;
  publishedAt?: string;
  commitsBehind?: number;
  isGit?: boolean;
  error?: string;
}

export interface UpdateProgressEvent {
  step: number;
  totalSteps: number;
  percent: number;
  stage: string;
  message: string;
  status?: 'progress' | 'complete' | 'error';
  error?: string;
}

