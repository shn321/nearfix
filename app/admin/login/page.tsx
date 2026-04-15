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
        <div className="admin-login-page">
            <div className="admin-login-container">
                <Link href="/" className="admin-login-back">
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <div className="admin-login-header">
                    <div className="admin-login-icon-wrap">
                        <Lock size={24} />
                    </div>
                    <h1 className="admin-login-title">Admin Login</h1>
                    <p className="admin-login-subtitle">Sign in to manage services</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {error && (
                        <div className="admin-login-error">
                            {error}
                        </div>
                    )}

                    <div className="admin-login-field">
                        <label className="admin-login-label">Username</label>
                        <div className="admin-login-input-wrap">
                            <User size={16} className="admin-login-input-icon" />
                            <input
                                type="text"
                                value={credential}
                                onChange={(e) => setCredential(e.target.value)}
                                placeholder="admin"
                                className="admin-login-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="admin-login-field">
                        <label className="admin-login-label">Password</label>
                        <div className="admin-login-input-wrap">
                            <Lock size={16} className="admin-login-input-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="admin-login-input"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="nf-btn nf-btn-primary admin-login-submit"
                    >
                        {loading ? (
                            <div className="admin-login-spinner" />
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
