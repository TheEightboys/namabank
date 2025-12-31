import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databases, Query, DATABASE_ID, COLLECTIONS } from '../appwriteClient';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/namavruksha-logo.png';
import './LandingPage.css';

const LandingPage = () => {
    const { user, loading: authLoading } = useAuth();
    const [liveStats, setLiveStats] = useState({
        totalUsers: 0,
        totalNamaCount: 0,
        activeAccounts: 0
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

                setLiveStats({
                    totalUsers: userCount || 0,
                    totalNamaCount: totalNama,
                    activeAccounts: accountCount || 0
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
                <div className="floating-om om-3">ॐ</div>
            </div>

            <div className="landing-container">
                {/* Hero Section */}
                <header className="hero-section fade-in">
                    <div className="logo-container">
                        <img src={logoImage} alt="Namavruksha - The Divine Tree" className="logo-image" />
                    </div>
                    <h1 className="hero-title">Namavruksha</h1>
                    <p className="hero-tagline">The Divine Tree of the Holy Name</p>
                    <p className="hero-description">
                        <span className="highlight-text">Namavruksha</span> is a humble digital space for devotees to chant and count Nama with sincerity,
                        and offer it together as a collective spiritual <span className="highlight-text">sankalpa</span>.
                    </p>
                    <div className="greeting-text">🙏 Yogi Ramsuratkumar Jaya Guru Raya! 🙏</div>
                </header>

                {/* Live Stats */}
                <section className="stats-inline fade-in-delay-1">
                    <div className="stat-item">
                        <span className="stat-num">{loading ? '...' : formatNumber(liveStats.totalUsers)}</span>
                        <span className="stat-lbl">Devotees</span>
                    </div>
                    <div className="stat-item highlight">
                        <span className="stat-num">{loading ? '...' : formatNumber(liveStats.totalNamaCount)}</span>
                        <span className="stat-lbl">Nama Offered</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-num">{loading ? '...' : liveStats.activeAccounts}</span>
                        <span className="stat-lbl">Sankalpas</span>
                    </div>
                </section>

                {/* Action Cards */}
                <section className="action-section fade-in-delay-2">
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
                            <Link to="/login" className="action-card highlight">
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

                {/* Humble Invitation */}
                <section className="invitation-section">
                    <h3>🌼 A Humble Invitation</h3>
                    <p>
                        Namavruksha does not compel practice.<br />
                        It simply offers a space to record, remember, and offer Nama with sincerity.<br />
                        <strong>If it resonates with you, come and water the Tree of Nama—one chant at a time.</strong>
                    </p>
                </section>

                {/* Media Links */}
                <section className="media-compact">
                    <Link to="/gallery" className="media-link">📷 Gallery</Link>
                    <Link to="/audios" className="media-link">🎵 Audio</Link>
                    <Link to="/books" className="media-link">📚 Library</Link>
                    <Link to="/prayers" className="media-link">🙏 Prayers</Link>
                </section>

                {/* Footer */}
                <footer className="landing-footer">
                    <div className="footer-logo">
                        🌳 <strong>Namavruksha</strong>
                    </div>
                    <p className="footer-tagline">Rooted in Nama. Growing in Faith. Bearing Fruits Beyond Life.</p>

                    {/* Teachings Links - Side by Side */}
                    <div className="teachings-links">
                        <span className="teaching-link">Why Chant the Divine Name?</span>
                        <span className="teaching-divider">|</span>
                        <span className="teaching-link">Why Count Nama?</span>
                        <span className="teaching-divider">|</span>
                        <span className="teaching-link">Why Offer Nama Collectively?</span>
                    </div>

                    <div className="admin-links">
                        <Link to="/moderator/login">Moderator</Link>
                        <Link to="/admin/login">Admin</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
