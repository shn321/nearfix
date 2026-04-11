export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-16 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-[#FF5C00] rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Loading…</p>
            </div>
        </div>
    );
}
