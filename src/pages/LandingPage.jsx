import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databases, Query, DATABASE_ID, COLLECTIONS } from '../appwriteClient';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const { user, loading: authLoading } = useAuth();
    const [liveStats, setLiveStats] = useState({
        totalUsers: 0,
        totalNamaCount: 0,
        activeAccounts: 0,
        totalBooks: 0,
        totalPrayers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    [Query.limit(1)]
                );
                const userCount = usersResponse.total;

                const namaResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.NAMA_ENTRIES,
                    [Query.limit(10000)]
                );

                const totalNama = namaResponse.documents?.reduce((sum, entry) => sum + (entry.count || 0), 0) || 0;
                const activeAccountIds = new Set(namaResponse.documents?.map(entry => entry.account_id).filter(Boolean));
                const accountCount = activeAccountIds.size;

                const booksResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.BOOKS,
                    [Query.limit(1)]
                );
                const bookCount = booksResponse.total;

                const prayersResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.PRAYERS,
                    [Query.limit(1)]
                );
                const prayerCount = prayersResponse.total;

                setLiveStats({
                    totalUsers: userCount || 0,
                    totalNamaCount: totalNama,
                    activeAccounts: accountCount || 0,
                    totalBooks: bookCount || 0,
                    totalPrayers: prayerCount || 0
                });

            } catch (err) {
                console.error('Error fetching landing data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
        if (num >= 100000) return (num / 100000).toFixed(2) + ' Lacs';
        if (num >= 1000) return num.toLocaleString('en-IN');
        return num.toString();
    };

    return (
        <div className="landing-page">
            {/* Animated Background */}
            <div className="animated-bg">
                <div className="floating-om om-1">ॐ</div>
                <div className="floating-om om-2">ॐ</div>
            </div>

            <div className="landing-container">
                {/* Hero Section - Compact */}
                <header className="hero-section">
                    <div className="om-symbol">ॐ</div>
                    <h1 className="hero-title">
                        <span className="title-tamil">நாமவிருட்சம்</span>
                        <span className="title-english">Namavruksha</span>
                    </h1>
                    <p className="hero-tagline">The Divine Tree of the Holy Name</p>
                    <p className="hero-meaning">
                        Just as a tree grows silently yet sustains life, <strong>Nama grows within us and sustains the soul beyond this life.</strong>
                    </p>
                    <div className="greeting-text">🙏 Yogi Ramsuratkumar Jaya Guru Raya! 🙏</div>
                </header>

                {/* Live Stats - Inline */}
                <section className="stats-inline">
                    <div className="stat-item">
                        <span className="stat-num">{formatNumber(liveStats.totalUsers)}</span>
                        <span className="stat-lbl">Devotees</span>
                    </div>
                    <div className="stat-divider">•</div>
                    <div className="stat-item highlight">
                        <span className="stat-num">{formatNumber(liveStats.totalNamaCount)}</span>
                        <span className="stat-lbl">Nama Offered</span>
                    </div>
                    <div className="stat-divider">•</div>
                    <div className="stat-item">
                        <span className="stat-num">{liveStats.activeAccounts}</span>
                        <span className="stat-lbl">Sankalpas</span>
                    </div>
                </section>

                {/* Key Teachings - Compact Grid */}
                <section className="teachings-compact">
                    <div className="teaching-item">
                        <span className="teach-icon">🌱</span>
                        <div>
                            <strong>Why Chant?</strong>
                            <p>Nama purifies the mind and prepares the soul for its journey. Only the Name remains when everything else falls away.</p>
                        </div>
                    </div>
                    <div className="teaching-item">
                        <span className="teach-icon">🌿</span>
                        <div>
                            <strong>Why Count?</strong>
                            <p>Not for comparison—but for discipline, continuity, and remembrance with awareness. Counting helps Nama take root.</p>
                        </div>
                    </div>
                    <div className="teaching-item">
                        <span className="teach-icon">🌳</span>
                        <div>
                            <strong>Why Collectively?</strong>
                            <p>A single leaf is small, but together they become a tree. When Nama is offered collectively, it uplifts all.</p>
                        </div>
                    </div>
                </section>

                {/* Living Metaphor - Inline */}
                <section className="metaphor-inline">
                    <div className="metaphor-item"><span>🌱</span> Nama = Seed</div>
                    <div className="metaphor-item"><span>💧</span> Chanting = Watering</div>
                    <div className="metaphor-item"><span>🏔️</span> Faith = Soil</div>
                    <div className="metaphor-item"><span>🌿</span> Discipline = Root</div>
                    <div className="metaphor-item"><span>🍎</span> Grace = Fruit</div>
                </section>

                {/* Action Cards */}
                <section className="action-section">
                    <div className="action-cards">
                        <Link to="/register" className="action-card">
                            <span className="action-icon">🌱</span>
                            <h3>Join Sankalpa</h3>
                            <p>Begin your Nama journey</p>
                        </Link>

                        {authLoading ? (
                            <div className="action-card loading">
                                <span className="action-icon">⏳</span>
                                <h3>Loading...</h3>
                            </div>
                        ) : user ? (
                            <Link to="/dashboard" className="action-card highlight">
                                <span className="action-icon">🏠</span>
                                <h3>Dashboard</h3>
                                <p>Welcome, {user.name?.split(' ')[0]}</p>
                            </Link>
                        ) : (
                            <Link to="/login" className="action-card">
                                <span className="action-icon">🔑</span>
                                <h3>Login</h3>
                                <p>Continue your offering</p>
                            </Link>
                        )}

                        <Link to="/reports/public" className="action-card">
                            <span className="action-icon">📊</span>
                            <h3>Reports</h3>
                            <p>Community stats</p>
                        </Link>
                    </div>
                </section>

                {/* Media Links - Compact */}
                <section className="media-compact">
                    <Link to="/gallery" className="media-link">📷 Gallery</Link>
                    <Link to="/audios" className="media-link">🎵 Audio</Link>
                    <Link to="/books" className="media-link">📚 Library</Link>
                    <Link to="/prayers" className="media-link">🙏 Prayers</Link>
                </section>

                {/* Quote & Footer */}
                <footer className="landing-footer">
                    <div className="footer-quote">
                        🌳 <strong>Namavruksha</strong> — Rooted in Nama. Growing in Faith. Bearing Fruits Beyond Life.
                    </div>
                    <div className="admin-links">
                        <Link to="/moderator/login">Moderator</Link>
                        <span>•</span>
                        <Link to="/admin/login">Admin</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
