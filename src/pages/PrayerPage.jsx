import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getApprovedPrayers, submitPrayer, incrementPrayerCount } from '../services/namaService';
import './PrayerPage.css';

const PrayerPage = () => {
    const { success, error } = useToast();

    const [prayers, setPrayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [prayedPrayers, setPrayedPrayers] = useState(new Set()); // Track which prayers user clicked

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        privacy: 'public',
        prayer_text: '',
        email_notifications: false
    });

    useEffect(() => {
        loadPrayers();
        // Load prayed prayers from localStorage
        const stored = localStorage.getItem('prayedPrayers');
        if (stored) {
            setPrayedPrayers(new Set(JSON.parse(stored)));
        }
    }, []);

    const loadPrayers = async () => {
        try {
            const data = await getApprovedPrayers();
            setPrayers(data);
        } catch (err) {
            console.error('Error loading prayers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.email.trim() || !formData.prayer_text.trim()) {
            error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await submitPrayer(formData);
            success('Your prayer request has been submitted for approval!');
            setFormData({
                name: '',
                email: '',
                phone: '',
                privacy: 'public',
                prayer_text: '',
                email_notifications: false
            });
            setShowSubmitModal(false);
        } catch (err) {
            console.error('Submit error:', err);
            error('Failed to submit prayer. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrayedForThis = async (prayerId) => {
        if (prayedPrayers.has(prayerId)) return; // Already prayed

        try {
            const updated = await incrementPrayerCount(prayerId);
            setPrayers(prev => prev.map(p =>
                p.id === prayerId ? { ...p, prayer_count: updated.prayer_count } : p
            ));

            // Mark as prayed in state and localStorage
            const newSet = new Set([...prayedPrayers, prayerId]);
            setPrayedPrayers(newSet);
            localStorage.setItem('prayedPrayers', JSON.stringify([...newSet]));

            success('Thank you for praying!');
        } catch (err) {
            console.error('Error incrementing prayer count:', err);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="prayer-page page-enter">
            <header className="prayer-header">
                <div className="container">
                    <Link to="/" className="back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </Link>
                    <div className="header-content">
                        <div className="header-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 11v-1a5 5 0 0 1 10 0v1" />
                                <path d="M5.5 13H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1.5a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z" />
                                <path d="M18.5 13H20a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5z" />
                                <path d="M12 18v2" />
                                <path d="M8 22h8" />
                            </svg>
                        </div>
                        <h1>Prayer Community</h1>
                        <p className="subtitle">Share your prayers and support others in faith</p>
                    </div>
                    <button
                        className="btn btn-primary share-prayer-btn"
                        onClick={() => setShowSubmitModal(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Share Your Prayer
                    </button>
                </div>
            </header>

            <main className="prayer-main">
                <div className="container">
                    {loading ? (
                        <div className="loading-state">
                            <span className="loader"></span>
                            <p>Loading prayers...</p>
                        </div>
                    ) : prayers.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 19c-2-1-5-2-5-5V7a2 2 0 0 1 2-2h1c.28 0 .55.11.76.29L12 6.5l1.24-1.21c.21-.18.48-.29.76-.29h1a2 2 0 0 1 2 2v7c0 3-3 4-5 5z" />
                                    <path d="M12 11v3" />
                                    <path d="M10 9h4" />
                                </svg>
                            </div>
                            <h3>No Prayers Yet</h3>
                            <p>Be the first to share your prayer request with the community.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowSubmitModal(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Share Your Prayer
                            </button>
                        </div>
                    ) : (
                        <div className="prayer-wall">
                            {prayers.map(prayer => (
                                <div key={prayer.id} className="prayer-card">
                                    <div className="prayer-card-header">
                                        <span className="prayer-author">
                                            {prayer.privacy === 'anonymous' ? 'Anonymous' : prayer.name}
                                        </span>
                                        <span className="prayer-date">
                                            Received: {formatDate(prayer.approved_at || prayer.created_at)}
                                        </span>
                                    </div>
                                    <p className="prayer-text">{prayer.prayer_text}</p>
                                    <div className="prayer-card-footer">
                                        <span className="prayer-count">
                                            Prayed for {prayer.prayer_count || 0} times
                                        </span>
                                        <button
                                            className={`pray-btn ${prayedPrayers.has(prayer.id) ? 'prayed' : ''}`}
                                            onClick={() => handlePrayedForThis(prayer.id)}
                                            disabled={prayedPrayers.has(prayer.id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                            </svg>
                                            {prayedPrayers.has(prayer.id) ? 'PRAYED' : 'I PRAYED FOR THIS'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Submit Prayer Modal */}
            {showSubmitModal && (
                <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Share Your Prayer Request</h2>
                            <button className="modal-close" onClick={() => setShowSubmitModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Your Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="form-input"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Your Email <span className="required">*</span></label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="form-input"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Your Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="form-input"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Privacy <span className="required">*</span></label>
                                    <select
                                        value={formData.privacy}
                                        onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value }))}
                                        className="form-input"
                                    >
                                        <option value="public">Share This (with my name)</option>
                                        <option value="anonymous">Share This Anonymously</option>
                                        <option value="private">DO NOT Share This (private)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Your Prayer Request <span className="required">*</span></label>
                                    <textarea
                                        value={formData.prayer_text}
                                        onChange={(e) => setFormData(prev => ({ ...prev, prayer_text: e.target.value }))}
                                        className="form-input"
                                        rows={4}
                                        maxLength={500}
                                        placeholder="Share your prayer request here..."
                                    />
                                    <small className="char-count">{formData.prayer_text.length}/500</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowSubmitModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default PrayerPage;
