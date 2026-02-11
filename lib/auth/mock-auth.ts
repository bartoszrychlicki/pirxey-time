"use client";

import { v4 as uuidv4 } from "uuid";
import type { User } from "@/lib/types";
import { SESSION_KEY, COLLECTIONS, STORAGE_PREFIX } from "@/lib/constants";
import type { AuthSession, LoginCredentials, RegisterCredentials } from "./types";

const PASSWORDS_KEY = `${STORAGE_PREFIX}passwords`;

function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${COLLECTIONS.USERS}`);
    const parsed = raw ? (JSON.parse(raw) as User[]) : [];
    return parsed.map((user) => ({
      ...user,
      teamIds: Array.isArray(user.teamIds) ? user.teamIds : [],
    }));
  } catch {
    return [];
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(`${STORAGE_PREFIX}${COLLECTIONS.USERS}`, JSON.stringify(users));
}

function readPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePasswords(passwords: Record<string, string>): void {
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

function saveSession(user: User): void {
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getUserFromSession(): User | null {
  const session = getSession();
  if (!session) return null;
  const users = readUsers();
  return users.find((u) => u.id === session.userId) ?? null;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const users = readUsers();
  const user = users.find((u) => u.email === credentials.email);
  if (!user) {
    throw new Error("Nie znaleziono uzytkownika o podanym adresie e-mail.");
  }

  const passwords = readPasswords();
  if (passwords[user.id] !== credentials.password) {
    throw new Error("Nieprawidlowe haslo.");
  }

  saveSession(user);
  return user;
}

export async function register(credentials: RegisterCredentials): Promise<User> {
  const users = readUsers();

  if (users.some((u) => u.email === credentials.email)) {
    throw new Error("Uzytkownik o tym adresie e-mail juz istnieje.");
  }

  const now = new Date().toISOString();
  const isFirstUser = users.length === 0;

  const user: User = {
    id: uuidv4(),
    name: credentials.name,
    email: credentials.email,
    role: isFirstUser ? "ADMIN" : "EMPLOYEE",
    teamIds: [],
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  writeUsers(users);

  const passwords = readPasswords();
  passwords[user.id] = credentials.password;
  writePasswords(passwords);

  saveSession(user);
  return user;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}
