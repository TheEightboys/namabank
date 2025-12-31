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
                <div className="floating-om om-3">ॐ</div>
            </div>

            <div className="landing-container">
                {/* Hero Section */}
                <header className="hero-section">
                    <div className="om-symbol">ॐ</div>
                    <h1 className="hero-title">
                        <span className="title-tamil">நாமவிருட்சம்</span>
                        <span className="title-english">Namavruksha</span>
                    </h1>
                    <p className="hero-tagline">The Divine Tree of the Holy Name</p>
                    <p className="hero-meaning">
                        <em>Namavruksha means "The Tree of the Divine Name."</em><br />
                        Just as a tree grows silently yet sustains life,<br />
                        <strong>Nama grows within us and sustains the soul beyond this life.</strong>
                    </p>
                    <div className="greeting-text">🙏 Yogi Ramsuratkumar Jaya Guru Raya! 🙏</div>
                </header>

                {/* Introduction */}
                <section className="intro-section">
                    <p className="intro-text">
                        Namavruksha is a humble digital space for devotees to nurture the Tree of Nama—
                        by chanting, counting with sincerity, and offering Nama as a collective spiritual sankalpa.
                    </p>
                </section>

                {/* Live Stats */}
                <section className="stats-inline">
                    <div className="stat-item">
                        <span className="stat-num">{loading ? '...' : formatNumber(liveStats.totalUsers)}</span>
                        <span className="stat-lbl">Devotees</span>
                    </div>
                    <div className="stat-divider">•</div>
                    <div className="stat-item highlight">
                        <span className="stat-num">{loading ? '...' : formatNumber(liveStats.totalNamaCount)}</span>
                        <span className="stat-lbl">Nama Offered</span>
                    </div>
                    <div className="stat-divider">•</div>
                    <div className="stat-item">
                        <span className="stat-num">{loading ? '...' : liveStats.activeAccounts}</span>
                        <span className="stat-lbl">Sankalpas</span>
                    </div>
                </section>

                {/* Teachings with Quotes */}
                <section className="teachings-section">
                    <div className="teaching-card">
                        <span className="teach-icon">🌱</span>
                        <h3>Why Chant the Divine Name?</h3>
                        <p className="teaching-content">
                            The Divine Name is not merely sound—it is living presence.
                            Chanting Nama purifies the mind, softens the heart, and prepares the soul for its onward journey.
                        </p>
                        <div className="quote-box">
                            <p className="quote-text">
                                "Only the Name remains when everything else falls away. Nama is the simplest and highest refuge."
                            </p>
                            <p className="quote-author">— Yogi Ramsuratkumar</p>
                        </div>
                    </div>

                    <div className="teaching-card">
                        <span className="teach-icon">🌿</span>
                        <h3>Why Count Nama?</h3>
                        <p className="teaching-content">
                            Counting Nama is not for comparison. It is for discipline of the mind, continuity in practice, and remembrance with awareness.
                        </p>
                        <div className="quote-box">
                            <p className="quote-text">
                                "Nama Japa gains strength through nishta (steadfastness) and regularity. Counting helps Nama take root."
                            </p>
                            <p className="quote-author">— Sri Vittaldas Jayakrishna Deekshitar</p>
                        </div>
                    </div>

                    <div className="teaching-card">
                        <span className="teach-icon">🌳</span>
                        <h3>Why Offer Nama Collectively?</h3>
                        <p className="teaching-content">
                            A single leaf is small, but together they become a tree that gives shade to many.
                            When Nama is offered towards a shared goal, even a small effort becomes part of a greater spiritual offering.
                        </p>
                        <div className="quote-box">
                            <p className="quote-text">
                                "When devotion is offered selflessly, it expands and uplifts all."
                            </p>
                            <p className="quote-author">— Sri Krishnapremi Swamigal</p>
                        </div>
                    </div>
                </section>

                {/* Living Metaphor */}
                <section className="metaphor-section">
                    <h3 className="metaphor-title">🌸 Namavruksha — The Living Metaphor</h3>
                    <div className="quote-box featured">
                        <p className="quote-text">
                            "Nama itself is the seed, the path, and the fruit."
                        </p>
                        <p className="quote-author">— Guruji Sri Muralidhara Swamigal</p>
                    </div>
                    <div className="metaphor-inline">
                        <div className="metaphor-item"><span>🌱</span> Nama = Seed</div>
                        <div className="metaphor-item"><span>💧</span> Chanting = Watering</div>
                        <div className="metaphor-item"><span>🏔️</span> Faith = Soil</div>
                        <div className="metaphor-item"><span>🌿</span> Discipline = Root</div>
                        <div className="metaphor-item"><span>🍎</span> Grace = Fruit</div>
                    </div>
                    <p className="metaphor-wisdom">The tree grows silently—yet its fruits follow the soul.</p>
                </section>

                {/* Nama-Nishta Section */}
                <section className="nishta-section">
                    <h3>🕉️ Nama-Nishta — The Only Abiding Wealth</h3>
                    <div className="quote-box">
                        <p className="quote-text">
                            "When the mind becomes firmly established in Nama (Nama-nishta),
                            it naturally withdraws from all that is transient and rests in the Eternal.
                            All possessions remain here. All identities dissolve.
                            Only a life rooted in Nama accompanies us beyond."
                        </p>
                        <p className="quote-author">— Sri Ramanacharanatirtha Nochur Venkataraman</p>
                    </div>
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
                    <div className="footer-quote">
                        🌳 <strong>Namavruksha</strong><br />
                        Rooted in Nama. Growing in Faith. Bearing Fruits Beyond Life.
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
