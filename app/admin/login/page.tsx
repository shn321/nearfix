'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { adminLogin } from '@/lib/auth';

export default function AdminLoginPage() {
    const router = useRouter();
    const [credential, setCredential] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await adminLogin(credential, password);

        if (result.success) {
            router.push('/admin/dashboard');
        } else {
            setError(result.error || 'Invalid credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center px-6 py-8">
            <div className="w-full max-w-sm">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl bg-[#FF5C00] flex items-center justify-center mx-auto mb-3">
                        <Lock size={24} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Admin Login</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in to manage services</p>
                </div>



                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="py-2.5 px-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Username
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={credential}
                                onChange={(e) => setCredential(e.target.value)}
                                placeholder="admin"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00]"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="admin123"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00]"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#FF5C00] text-white font-semibold text-sm hover:bg-[#e85400] disabled:opacity-50 transition-colors"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <LogIn size={16} />
                        )}
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
