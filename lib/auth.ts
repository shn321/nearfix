'use server';

import { cookies } from 'next/headers';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const AUTH_KEY = 'nearfix_admin_auth';

export async function adminLogin(
    username: string,
    password: string
): Promise<{ success: boolean; error?: string }> {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set(AUTH_KEY, 'true', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        return { success: true };
    }
    return { success: false, error: 'Invalid username or password.' };
}

export async function isAdminLoggedIn(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_KEY)?.value === 'true';
}

export async function adminLogout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_KEY);
}

export async function getAdminEmail(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_KEY)?.value === 'true' ? 'Admin' : null;
}
