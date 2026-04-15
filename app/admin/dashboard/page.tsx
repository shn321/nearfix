'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus, Pencil, Trash2, LogOut, ArrowLeft, X, Save, Loader2,
    Database, RefreshCw, BarChart3, MessageSquare, AlertTriangle,
    CheckCircle2, Clock, CircleDot, Star, Users, Layers
} from 'lucide-react';
import { isAdminLoggedIn, adminLogout, getAdminEmail } from '@/lib/auth';
import { getServices, addService, updateService, deleteService, resetServices, seedServices } from '@/lib/serviceStore';
import { CATEGORIES, type Service } from '@/data/services';

interface DashboardStats {
    totalServices: number;
    totalReviews: number;
    avgRating: number;
    helpRequests: { total: number; pending: number; resolved: number };
    categoryBreakdown: { key: string; label: string; icon: string; color: string; count: number }[];
    recentRequests: { id: number; category: string; phone: string; description: string | null; status: string; created_at: string }[];
    recentReviews: { id: number; service_id: number; rating: number; comment: string | null; created_at: string }[];
}

type Tab = 'services' | 'requests' | 'reviews' | 'analytics';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('analytics');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminEmail, setAdminEmail] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '', category: 'puncture' as string, address: '', phone: '',
        latitude: '', longitude: '', rating: '',
    });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Auth check
    useEffect(() => {
        async function checkAuth() {
            setMounted(true);
            const loggedIn = await isAdminLoggedIn();
            if (!loggedIn) {
                router.push('/admin/login');
                return;
            }
            const email = await getAdminEmail();
            setAdminEmail(email);
        }
        checkAuth();
    }, [router]);

    // Load services
    const reloadServices = useCallback(async () => {
        setLoading(true);
        const data = await getServices();
        setServices(data);
        setLoading(false);
    }, []);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch {
            // Silently fail
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            reloadServices();
            loadStats();
        }
    }, [mounted, reloadServices, loadStats]);

    if (!mounted) return null;

    const handleLogout = async () => {
        await adminLogout();
        router.push('/admin/login');
    };

    const resetForm = () => {
        setForm({ name: '', category: 'puncture', address: '', phone: '', latitude: '', longitude: '', rating: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (service: Service) => {
        setForm({
            name: service.name, category: service.category, address: service.address,
            phone: service.phone, latitude: service.latitude.toString(),
            longitude: service.longitude.toString(), rating: service.rating.toString(),
        });
        setEditingId(service.id);
        setShowForm(true);
        setActiveTab('services');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this service?')) {
            const success = await deleteService(id);
            if (success) { showToast('Service deleted successfully', 'success'); await reloadServices(); loadStats(); }
            else { showToast('Failed to delete service', 'error'); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const serviceData = {
            name: form.name, category: form.category, address: form.address,
            phone: form.phone, latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude), rating: parseFloat(form.rating),
        };

        if (editingId) {
            const success = await updateService(editingId, serviceData);
            showToast(success ? 'Service updated successfully' : 'Failed to update service', success ? 'success' : 'error');
        } else {
            const result = await addService(serviceData);
            showToast(result ? 'Service added successfully' : 'Failed to add service', result ? 'success' : 'error');
        }

        resetForm();
        await reloadServices();
        loadStats();
        setSaving(false);
    };

    const handleReset = async () => {
        if (confirm('This will reset all services to default data. Are you sure?')) {
            setLoading(true);
            const success = await resetServices();
            showToast(success ? 'Services reset to defaults' : 'Failed to reset services', success ? 'success' : 'error');
            await reloadServices();
            loadStats();
        }
    };

    const handleSeed = async () => {
        if (confirm('This will populate the database with default services (only if empty). Continue?')) {
            setLoading(true);
            const success = await seedServices();
            showToast(success ? 'Database seeded successfully' : 'Failed to seed database', success ? 'success' : 'error');
            await reloadServices();
            loadStats();
        }
    };

    const handleUpdateRequestStatus = async (id: number, status: string) => {
        try {
            const res = await fetch('/api/help-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) {
                showToast(`Request ${status}`, 'success');
                loadStats();
            } else {
                showToast('Failed to update request', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    };

    const handleDeleteReview = async (id: number) => {
        if (confirm('Delete this review?')) {
            try {
                const res = await fetch('/api/reviews', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id }),
                });
                if (res.ok) {
                    showToast('Review deleted', 'success');
                    loadStats();
                } else {
                    showToast('Failed to delete review', 'error');
                }
            } catch {
                showToast('Network error', 'error');
            }
        }
    };

    const filteredServices = filterCategory === 'all' ? services : services.filter((s) => s.category === filterCategory);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
        { key: 'services', label: 'Services', icon: <Layers size={16} /> },
        { key: 'requests', label: 'Help Requests', icon: <AlertTriangle size={16} /> },
        { key: 'reviews', label: 'Reviews', icon: <MessageSquare size={16} /> },
    ];

    return (
        <div className="admin-dash">
            {/* Toast */}
            {toast && (
                <div className={`admin-toast ${toast.type === 'success' ? 'admin-toast-success' : 'admin-toast-error'}`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-left">
                    <Link href="/" className="admin-back">
                        <ArrowLeft size={17} />
                    </Link>
                    <div>
                        <h1 className="admin-title">Admin Dashboard</h1>
                        {adminEmail && <p className="admin-email">{adminEmail}</p>}
                    </div>
                </div>
                <button onClick={handleLogout} className="admin-logout">
                    <LogOut size={15} />
                    Logout
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="admin-stats">
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                            <Layers size={22} />
                        </div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.totalServices}</span>
                            <span className="admin-stat-label">Services</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                            <MessageSquare size={22} />
                        </div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.totalReviews}</span>
                            <span className="admin-stat-label">Reviews</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                            <AlertTriangle size={22} />
                        </div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.helpRequests.pending}</span>
                            <span className="admin-stat-label">Pending</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                            <Star size={22} />
                        </div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.avgRating || '—'}</span>
                            <span className="admin-stat-label">Avg Rating</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="admin-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`admin-tab ${activeTab === tab.key ? 'admin-tab-active' : ''}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Analytics Tab ── */}
            {activeTab === 'analytics' && stats && (
                <div className="admin-analytics nf-slide-up">
                    {/* Category Breakdown */}
                    <div className="admin-section">
                        <h2 className="admin-section-title">
                            <BarChart3 size={18} />
                            Services by Category
                        </h2>
                        <div className="admin-category-chart">
                            {stats.categoryBreakdown.map(cat => {
                                const maxCount = Math.max(...stats.categoryBreakdown.map(c => c.count), 1);
                                const pct = (cat.count / maxCount) * 100;
                                return (
                                    <div key={cat.key} className="admin-chart-row">
                                        <span className="admin-chart-label">
                                            {cat.icon} {cat.label}
                                        </span>
                                        <div className="admin-chart-bar-wrap">
                                            <div
                                                className="admin-chart-bar"
                                                style={{ width: `${pct}%`, background: cat.color }}
                                            />
                                        </div>
                                        <span className="admin-chart-count">{cat.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="admin-section">
                        <h2 className="admin-section-title">
                            <Clock size={18} />
                            Recent Activity
                        </h2>
                        <div className="admin-activity">
                            {stats.recentRequests.slice(0, 5).map(req => (
                                <div key={`req-${req.id}`} className="admin-activity-item">
                                    <span className="admin-activity-icon admin-activity-req">🆘</span>
                                    <div className="admin-activity-content">
                                        <span className="admin-activity-text">
                                            Help request for <strong>{req.category}</strong> — {req.phone}
                                        </span>
                                        <span className="admin-activity-time">{formatDate(req.created_at)}</span>
                                    </div>
                                    <span className={`admin-status admin-status-${req.status}`}>
                                        {req.status}
                                    </span>
                                </div>
                            ))}
                            {stats.recentReviews.slice(0, 5).map(rev => (
                                <div key={`rev-${rev.id}`} className="admin-activity-item">
                                    <span className="admin-activity-icon admin-activity-rev">⭐</span>
                                    <div className="admin-activity-content">
                                        <span className="admin-activity-text">
                                            {rev.rating}-star review on service #{rev.service_id}
                                        </span>
                                        <span className="admin-activity-time">{formatDate(rev.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                            {stats.recentRequests.length === 0 && stats.recentReviews.length === 0 && (
                                <p className="admin-empty">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Services Tab ── */}
            {activeTab === 'services' && (
                <div className="admin-services nf-slide-up">
                    {/* Actions */}
                    <div className="admin-actions">
                        <div className="admin-actions-left">
                            <button onClick={() => { resetForm(); setShowForm(true); }} className="admin-btn admin-btn-primary">
                                <Plus size={16} /> Add Service
                            </button>
                            <button onClick={handleSeed} disabled={loading} className="admin-btn admin-btn-purple">
                                <Database size={15} /> Seed Data
                            </button>
                            <button onClick={() => reloadServices()} disabled={loading} className="admin-btn admin-btn-outline">
                                <RefreshCw size={14} className={loading ? 'nf-spin' : ''} /> Refresh
                            </button>
                        </div>
                        <div className="admin-actions-right">
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="admin-select">
                                <option value="all">All Categories ({services.length})</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.key} value={cat.key}>
                                        {cat.icon} {cat.label} ({services.filter((s) => s.category === cat.key).length})
                                    </option>
                                ))}
                            </select>
                            <button onClick={handleReset} className="admin-reset-btn">Reset to defaults</button>
                        </div>
                    </div>

                    {/* Add/Edit Form */}
                    {showForm && (
                        <div className="admin-form-card">
                            <div className="admin-form-header">
                                <h2>{editingId ? 'Edit Service' : 'Add New Service'}</h2>
                                <button onClick={resetForm}><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="admin-form">
                                <div className="admin-form-grid">
                                    <div>
                                        <label>Service Name</label>
                                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label>Category</label>
                                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="admin-form-full">
                                        <label>Address</label>
                                        <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                                    </div>
                                    <div><label>Phone</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+919876543210" required /></div>
                                    <div><label>Rating (1-5)</label><input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} required /></div>
                                    <div><label>Latitude</label><input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="14.2819" required /></div>
                                    <div><label>Longitude</label><input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="74.4442" required /></div>
                                </div>
                                <div className="admin-form-actions">
                                    <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
                                        {saving ? <Loader2 size={15} className="nf-spin" /> : <Save size={15} />}
                                        {editingId ? 'Update Service' : 'Add Service'}
                                    </button>
                                    <button type="button" onClick={resetForm} className="admin-btn admin-btn-ghost">Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="admin-loading">
                            <Loader2 size={24} className="nf-spin" />
                            <p>Loading services from database…</p>
                        </div>
                    )}

                    {/* Services Table */}
                    {!loading && (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th className="admin-hide-mobile">Address</th>
                                        <th className="admin-hide-sm">Phone</th>
                                        <th>Rating</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredServices.map((service) => {
                                        const cat = CATEGORIES.find((c) => c.key === service.category);
                                        return (
                                            <tr key={service.id}>
                                                <td className="admin-table-name">{service.name}</td>
                                                <td>
                                                    <span className="admin-table-cat" style={{ color: cat?.color, backgroundColor: `${cat?.color}15` }}>
                                                        {cat?.icon} {cat?.label}
                                                    </span>
                                                </td>
                                                <td className="admin-hide-mobile admin-table-address">{service.address}</td>
                                                <td className="admin-hide-sm admin-table-phone">{service.phone}</td>
                                                <td className="admin-table-rating">{service.rating}</td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button onClick={() => handleEdit(service)} className="admin-table-btn admin-table-btn-edit" title="Edit">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button onClick={() => handleDelete(service.id)} className="admin-table-btn admin-table-btn-delete" title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredServices.length === 0 && (
                                <div className="admin-empty">No services found. Click &quot;Seed Data&quot; to populate.</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Help Requests Tab ── */}
            {activeTab === 'requests' && (
                <div className="admin-requests nf-slide-up">
                    <div className="admin-section">
                        <h2 className="admin-section-title">
                            <Users size={18} />
                            Help Request Queue
                        </h2>
                        {!stats?.recentRequests?.length ? (
                            <div className="admin-empty">No help requests yet</div>
                        ) : (
                            <div className="admin-request-list">
                                {stats.recentRequests.map(req => (
                                    <div key={req.id} className="admin-request-card">
                                        <div className="admin-request-top">
                                            <span className="admin-request-id">#{req.id}</span>
                                            <span className={`admin-status admin-status-${req.status}`}>
                                                {req.status === 'pending' && <Clock size={12} />}
                                                {req.status === 'assigned' && <CircleDot size={12} />}
                                                {req.status === 'resolved' && <CheckCircle2 size={12} />}
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="admin-request-info">
                                            <span className="admin-request-cat">{req.category}</span>
                                            <span className="admin-request-phone">📞 {req.phone}</span>
                                            {req.description && <p className="admin-request-desc">{req.description}</p>}
                                            <span className="admin-request-time">{formatDate(req.created_at)}</span>
                                        </div>
                                        {req.status !== 'resolved' && (
                                            <div className="admin-request-actions">
                                                {req.status === 'pending' && (
                                                    <button onClick={() => handleUpdateRequestStatus(req.id, 'assigned')} className="admin-btn admin-btn-sm admin-btn-blue">
                                                        <CircleDot size={12} /> Assign
                                                    </button>
                                                )}
                                                <button onClick={() => handleUpdateRequestStatus(req.id, 'resolved')} className="admin-btn admin-btn-sm admin-btn-green">
                                                    <CheckCircle2 size={12} /> Resolve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Reviews Tab ── */}
            {activeTab === 'reviews' && (
                <div className="admin-reviews nf-slide-up">
                    <div className="admin-section">
                        <h2 className="admin-section-title">
                            <MessageSquare size={18} />
                            Review Moderation
                        </h2>
                        {!stats?.recentReviews?.length ? (
                            <div className="admin-empty">No reviews yet</div>
                        ) : (
                            <div className="admin-review-list">
                                {stats.recentReviews.map(rev => (
                                    <div key={rev.id} className="admin-review-card">
                                        <div className="admin-review-top">
                                            <div className="admin-review-stars">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={14} className={s <= rev.rating ? 'admin-star-filled' : 'admin-star-empty'} />
                                                ))}
                                            </div>
                                            <span className="admin-review-service">Service #{rev.service_id}</span>
                                        </div>
                                        {rev.comment && <p className="admin-review-comment">{rev.comment}</p>}
                                        <div className="admin-review-bottom">
                                            <span className="admin-review-date">{formatDate(rev.created_at)}</span>
                                            <button onClick={() => handleDeleteReview(rev.id)} className="admin-review-delete">
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
