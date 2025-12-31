import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserStats } from '../services/namaService';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user, linkedAccounts, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadStats();
    }, [user, navigate]);

    const loadStats = async () => {
        if (!user) return;
        try {
            const userStats = await getUserStats(user.id);
            setStats(userStats);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    };

    if (!user) return null;

    return (
        <div className="dashboard-page page-enter">
            <header className="dashboard-header">
                <div className="container">
                    <div className="header-content">
                        <Link to="/" className="header-left" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <span className="om-symbol-small">ॐ</span>
                            <h1>Namavruksha</h1>
                        </Link>
                        <div className="header-right">
                            <Link to="/" className="btn btn-ghost btn-sm" style={{ marginRight: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Back to Home
                            </Link>
                            <span className="user-name">{user.name}</span>
                            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container">
                    {/* Welcome Section */}
                    <section className="welcome-section">
                        <h2>Hari Om, {user.name.split(' ')[0]}!</h2>
                        <p>Continue your spiritual journey with sincere devotion.</p>
                    </section>

                    {/* Quick Stats */}
                    <section className="stats-section">
                        <h3>Your Nama Journey</h3>
                        {loading ? (
                            <div className="stats-loading">
                                <span className="loader"></span>
                            </div>
                        ) : stats ? (
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{formatNumber(stats.today)}</div>
                                    <div className="stat-label">Today</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{formatNumber(stats.thisWeek)}</div>
                                    <div className="stat-label">This Week</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{formatNumber(stats.thisMonth)}</div>
                                    <div className="stat-label">This Month</div>
                                </div>
                                <div className="stat-card highlight">
                                    <div className="stat-value">{formatNumber(stats.overall)}</div>
                                    <div className="stat-label">Overall</div>
                                </div>
                            </div>
                        ) : (
                            <p className="no-stats">Start your Nama journey today!</p>
                        )}
                    </section>

                    {/* Linked Accounts */}
                    {linkedAccounts.length > 0 && (
                        <section className="accounts-section">
                            <h3>Your Linked Sankalpas</h3>
                            <div className="accounts-list">
                                {linkedAccounts.map(account => (
                                    <div key={account.id} className="account-chip">
                                        <span className="status-dot active"></span>
                                        {account.name}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Action Cards */}
                    <section className="actions-section">
                        <h3>What would you like to do?</h3>
                        <div className="action-cards">
                            <Link to="/invest" className="action-card hover-lift">
                                <div className="action-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </div>
                                <h4>Invest Nama</h4>
                                <p>Submit your daily Nama count</p>
                            </Link>

                            <Link to="/audio" className="action-card hover-lift">
                                <div className="action-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                    </svg>
                                </div>
                                <h4>Nama Audio</h4>
                                <p>Play audio and auto-count</p>
                            </Link>

                            <Link to="/prayers" className="action-card hover-lift">
                                <div className="action-icon" style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                                    ॐ
                                </div>
                                <h4>Prayers</h4>
                                <p>Request & offer prayers</p>
                            </Link>

                            <Link to="/reports" className="action-card hover-lift">
                                <div className="action-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10" />
                                        <line x1="12" y1="20" x2="12" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                </div>
                                <h4>My Reports</h4>
                                <p>View your devotion summary</p>
                            </Link>

                            <Link to="/books" className="action-card hover-lift">
                                <div className="action-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                                <h4>Book Shelf</h4>
                                <p>Read monthly editions</p>
                            </Link>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="dashboard-footer">
                <div className="container">
                    <p>"Every Nama takes you closer to the Divine"</p>
                </div>
            </footer>
        </div>
    );
};

export default DashboardPage;
