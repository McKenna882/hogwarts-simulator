const ACCOUNTS_KEY = 'hogwarts-public-auth-accounts';

interface LocalAccount {
  id: string;
  email: string;
  password: string;
  displayName: string;
  createdAt: string;
}

interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

function readAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function createToken(prefix: string, account: LocalAccount) {
  const random = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}.${account.id}.${Date.now()}.${random}`;
}

function toAuthPayload(account: LocalAccount): AuthPayload {
  return {
    accessToken: createToken('public-access', account),
    refreshToken: createToken('public-refresh', account),
    user: {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
    },
  };
}

export function shouldUseLocalAuthFallback() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.endsWith('.pages.dev') || host.endsWith('.github.io');
}

export function hasAuthPayload(value: any) {
  const payload = value?.data || value;
  return Boolean(payload?.accessToken && payload?.refreshToken && payload?.user?.email);
}

export async function localRegister(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error('这封猫头鹰邮箱已经登记过了，请直接登录。');
  }

  const account: LocalAccount = {
    id: crypto.randomUUID?.() || `local-${Date.now()}`,
    email: normalizedEmail,
    password,
    displayName: normalizedEmail.split('@')[0] || '新生巫师',
    createdAt: new Date().toISOString(),
  };

  accounts.push(account);
  writeAccounts(accounts);
  return { data: toAuthPayload(account) };
}

export async function localLogin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts().find(
    (item) => item.email === normalizedEmail && item.password === password,
  );

  if (!account) {
    throw new Error('邮箱或密码错误，请检查后再试。');
  }

  return { data: toAuthPayload(account) };
}
