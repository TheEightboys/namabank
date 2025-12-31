import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getUserRecentEntries } from '../services/namaService';
import './ReportsPage.css';

const ReportsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [recentEntries, setRecentEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        try {
            const [userStats, entries] = await Promise.all([
                getUserStats(user.id),
                getUserRecentEntries(user.id, 10)
            ]);
            setStats(userStats);
            setRecentEntries(entries);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => num?.toLocaleString() || '0';

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!user) return null;

    return (
        <div className="reports-page page-enter">
            <header className="page-header">
                <div className="container">
                    <Link to="/dashboard" className="back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Dashboard
                    </Link>
                    <h1>My Reports</h1>
                    <p>Your devotion journey in numbers</p>
                </div>
            </header>

            <main className="reports-main">
                <div className="container container-md">
                    {loading ? (
                        <div className="page-loader">
                            <span className="loader"></span>
                            <p>Loading your reports...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Overview */}
                            <section className="report-section">
                                <h2>Consolidated Totals</h2>
                                <div className="stats-grid stats-grid-5">
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.today)}</div>
                                        <div className="stat-label">Today</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.thisWeek)}</div>
                                        <div className="stat-label">This Week</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.thisMonth)}</div>
                                        <div className="stat-label">This Month</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.thisYear)}</div>
                                        <div className="stat-label">This Year</div>
                                    </div>
                                    <div className="stat-card highlight">
                                        <div className="stat-value">{formatNumber(stats?.overall)}</div>
                                        <div className="stat-label">Overall</div>
                                    </div>
                                </div>
                            </section>

                            {/* Recent Entries */}
                            <section className="report-section">
                                <h2>Recent Entries</h2>
                                {recentEntries.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="12" y1="18" x2="12" y2="12" />
                                                <line x1="9" y1="15" x2="15" y2="15" />
                                            </svg>
                                        </div>
                                        <p className="empty-state-title">No entries yet</p>
                                        <p className="empty-state-text">Start your Nama journey by investing some Namas today!</p>
                                        <Link to="/invest" className="btn btn-primary">
                                            Invest Nama
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Entry Date</th>
                                                    <th>Nama Bank</th>
                                                    <th>Count</th>
                                                    <th>Period (Start - End)</th>
                                                    <th>Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentEntries.map(entry => (
                                                    <tr key={entry.id}>
                                                        <td>{formatDate(entry.entry_date)}</td>
                                                        <td>{entry.nama_accounts?.name || '-'}</td>
                                                        <td className="count-cell">{formatNumber(entry.count)}</td>
                                                        <td>
                                                            {entry.start_date || entry.end_date ? (
                                                                <span className="date-range">
                                                                    {entry.start_date ? formatDate(entry.start_date) : '...'} - {entry.end_date ? formatDate(entry.end_date) : '...'}
                                                                </span>
                                                            ) : (
                                                                <span className="date-single">Single Day</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-${entry.source_type === 'audio' ? 'info' : 'success'}`}>
                                                                {entry.source_type}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            {/* Motivational Quote */}
                            <div className="quote-section">
                                <p>"Consistent devotion, however small, moves mountains of karma."</p>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;
