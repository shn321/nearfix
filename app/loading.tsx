export default function Loading() {
    return (
        <div className="nf-page-loading">
            <div className="nf-skeleton-hero">
                <div className="nf-skeleton nf-skeleton-circle" />
                <div className="nf-skeleton nf-skeleton-title" />
                <div className="nf-skeleton nf-skeleton-text" />
            </div>
            <div className="nf-skeleton-card">
                <div className="nf-skeleton nf-skeleton-block" />
            </div>
            <div className="nf-skeleton-grid">
                <div className="nf-skeleton nf-skeleton-card-item" />
                <div className="nf-skeleton nf-skeleton-card-item" />
                <div className="nf-skeleton nf-skeleton-card-item" />
            </div>
        </div>
    );
}
