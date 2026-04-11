'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, LogOut, ArrowLeft, X, Save, Loader2, Database, RefreshCw } from 'lucide-react';
import { isAdminLoggedIn, adminLogout, getAdminEmail } from '@/lib/auth';
import { getServices, addService, updateService, deleteService, resetServices, seedServices } from '@/lib/serviceStore';
import { CATEGORIES, type Service } from '@/data/services';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
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
        name: '',
        category: 'puncture' as string,
        address: '',
        phone: '',
        latitude: '',
        longitude: '',
        rating: '',
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

    useEffect(() => {
        if (mounted) {
            reloadServices();
        }
    }, [mounted, reloadServices]);

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
            name: service.name,
            category: service.category,
            address: service.address,
            phone: service.phone,
            latitude: service.latitude.toString(),
            longitude: service.longitude.toString(),
            rating: service.rating.toString(),
        });
        setEditingId(service.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this service?')) {
            const success = await deleteService(id);
            if (success) {
                showToast('Service deleted successfully', 'success');
                await reloadServices();
            } else {
                showToast('Failed to delete service', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const serviceData = {
            name: form.name,
            category: form.category,
            address: form.address,
            phone: form.phone,
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
            rating: parseFloat(form.rating),
        };

        if (editingId) {
            const success = await updateService(editingId, serviceData);
            if (success) {
                showToast('Service updated successfully', 'success');
            } else {
                showToast('Failed to update service', 'error');
            }
        } else {
            const result = await addService(serviceData);
            if (result) {
                showToast('Service added successfully', 'success');
            } else {
                showToast('Failed to add service', 'error');
            }
        }

        resetForm();
        await reloadServices();
        setSaving(false);
    };

    const handleReset = async () => {
        if (confirm('This will reset all services to default data. Are you sure?')) {
            setLoading(true);
            const success = await resetServices();
            if (success) {
                showToast('Services reset to defaults', 'success');
            } else {
                showToast('Failed to reset services', 'error');
            }
            await reloadServices();
        }
    };

    const handleSeed = async () => {
        if (confirm('This will populate the database with default services (only if empty). Continue?')) {
            setLoading(true);
            const success = await seedServices();
            if (success) {
                showToast('Database seeded successfully', 'success');
            } else {
                showToast('Failed to seed database', 'error');
            }
            await reloadServices();
        }
    };

    const filteredServices = filterCategory === 'all'
        ? services
        : services.filter((s) => s.category === filterCategory);

    return (
        <div className="max-w-[1400px] mx-auto w-full px-[20px] py-[20px] flex justify-center">
            <div className="w-full">
                {/* Toast notification */}
                {toast && (
                    <div
                        className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${toast.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}
                    >
                        {toast.message}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft size={17} />
                        </Link>
                        <div>
                            <h1 className="font-bold text-gray-900 text-xl">Admin Dashboard</h1>
                            {adminEmail && (
                                <p className="text-xs text-gray-400">{adminEmail}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={15} />
                        Logout
                    </button>
                </div>

                {/* Actions bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5C00] text-white text-sm font-semibold hover:bg-[#e85400] transition-colors"
                        >
                            <Plus size={16} /> Add Service
                        </button>

                        <button
                            onClick={handleSeed}
                            disabled={loading}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            <Database size={15} /> Seed Data
                        </button>

                        <button
                            onClick={() => reloadServices()}
                            disabled={loading}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full sm:w-auto px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30"
                        >
                            <option value="all">All Categories ({services.length})</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat.key} value={cat.key}>
                                    {cat.icon} {cat.label} ({services.filter((s) => s.category === cat.key).length})
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleReset}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center sm:text-right px-2 py-2"
                        >
                            Reset to defaults
                        </button>
                    </div>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="mb-6 p-5 rounded-xl bg-white border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900">
                                {editingId ? 'Edit Service' : 'Add New Service'}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Service Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="+919876543210"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Rating (1-5)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        max="5"
                                        value={form.rating}
                                        onChange={(e) => setForm({ ...form, rating: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={form.latitude}
                                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                                        placeholder="14.2819"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={form.longitude}
                                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                                        placeholder="74.4442"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/30 focus:border-[#FF5C00]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5C00] text-white text-sm font-semibold hover:bg-[#e85400] disabled:opacity-50 transition-colors"
                                >
                                    {saving ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                        <Save size={15} />
                                    )}
                                    {editingId ? 'Update Service' : 'Add Service'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-5 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 size={24} className="animate-spin text-[#FF5C00]" />
                        <p className="text-gray-500 text-sm">Loading services from database…</p>
                    </div>
                )}

                {/* Services table */}
                {!loading && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">Address</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">Phone</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Rating</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredServices.map((service) => {
                                        const cat = CATEGORIES.find((c) => c.key === service.category);
                                        return (
                                            <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium text-gray-900">{service.name}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                        style={{ color: cat?.color, backgroundColor: `${cat?.color}15` }}
                                                    >
                                                        {cat?.icon} {cat?.label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 hidden md:table-cell">{service.address}</td>
                                                <td className="py-3 px-4 text-gray-600 font-mono text-xs hidden sm:table-cell">{service.phone}</td>
                                                <td className="py-3 px-4 text-center text-gray-700">{service.rating}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleEdit(service)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(service.id)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {filteredServices.length === 0 && (
                            <div className="py-12 text-center text-gray-400 text-sm">
                                No services found. Click &quot;Seed Data&quot; to populate the database with default services.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
