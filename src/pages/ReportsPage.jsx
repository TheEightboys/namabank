import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getUserRecentEntries, getUserEntriesByDateRange } from '../services/namaService';
import * as XLSX from 'xlsx';
import './ReportsPage.css';

const ReportsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [recentEntries, setRecentEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    // Date range filter state
    const [dateRangeStart, setDateRangeStart] = useState('');
    const [dateRangeEnd, setDateRangeEnd] = useState('');
    const [dateRangeTotal, setDateRangeTotal] = useState(null);
    const [dateRangeLoading, setDateRangeLoading] = useState(false);

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
                getUserStats(user.$id),
                getUserRecentEntries(user.$id, 10)
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

    // Date range calculation handler
    const handleDateRangeSearch = async () => {
        if (!dateRangeStart || !dateRangeEnd) return;

        setDateRangeLoading(true);
        try {
            const result = await getUserEntriesByDateRange(user.$id, dateRangeStart, dateRangeEnd);
            setDateRangeTotal(result.total);
        } catch (err) {
            console.error('Error fetching date range:', err);
            setDateRangeTotal(0);
        } finally {
            setDateRangeLoading(false);
        }
    };

    // Quick date range setters
    const setQuickRange = (type) => {
        const now = new Date();
        let start, end;

        switch (type) {
            case 'week':
                const dayOfWeek = now.getDay();
                start = new Date(now);
                start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'last7':
                end = new Date(now);
                start = new Date(now);
                start.setDate(now.getDate() - 6);
                break;
            case 'last30':
                end = new Date(now);
                start = new Date(now);
                start.setDate(now.getDate() - 29);
                break;
            default:
                return;
        }

        setDateRangeStart(start.toISOString().split('T')[0]);
        setDateRangeEnd(end.toISOString().split('T')[0]);
        setDateRangeTotal(null);
    };

    const exportToExcel = () => {
        if (recentEntries.length === 0) return;

        // Prepare data for export
        const exportData = recentEntries.map(entry => ({
            'Entry Date': formatDate(entry.entry_date),
            'Sankalpa': entry.nama_accounts?.name || '-',
            'Count': entry.count,
            'Start Date': entry.start_date ? formatDate(entry.start_date) : '-',
            'End Date': entry.end_date ? formatDate(entry.end_date) : '-',
            'Type': entry.source_type
        }));

        // Add summary row
        exportData.push({});
        exportData.push({
            'Entry Date': 'SUMMARY',
            'Sankalpa': '',
            'Count': '',
            'Start Date': '',
            'End Date': '',
            'Type': ''
        });
        exportData.push({
            'Entry Date': 'Today',
            'Sankalpa': stats?.today || 0,
            'Count': '',
            'Start Date': 'This Week',
            'End Date': stats?.thisWeek || 0,
            'Type': ''
        });
        exportData.push({
            'Entry Date': 'This Month',
            'Sankalpa': stats?.thisMonth || 0,
            'Count': '',
            'Start Date': 'This Year',
            'End Date': stats?.thisYear || 0,
            'Type': ''
        });
        exportData.push({
            'Entry Date': 'Overall Total',
            'Sankalpa': stats?.overall || 0,
            'Count': '',
            'Start Date': '',
            'End Date': '',
            'Type': ''
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'My Nama Report');

        // Generate filename with date
        const fileName = `NamaReport_${user.name?.replace(/\s+/g, '_') || 'User'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
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
                                <div className="stats-grid stats-grid-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.today)}</div>
                                        <div className="stat-label">Today</div>
                                        <div className="stat-date" style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                                            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.currentWeek)}</div>
                                        <div className="stat-label">Current Week</div>
                                        <div className="stat-date" style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                                            {(() => {
                                                const now = new Date();
                                                const day = now.getDay();
                                                const monday = new Date(now);
                                                monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
                                                const sunday = new Date(monday);
                                                sunday.setDate(monday.getDate() + 6);
                                                return `${monday.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })} - ${sunday.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })}`;
                                            })()}
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.currentMonth)}</div>
                                        <div className="stat-label">Current Month</div>
                                        <div className="stat-date" style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                                            {new Date().toLocaleDateString('en-IN', { month: 'long' })}
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.currentYear)}</div>
                                        <div className="stat-label">Current Year</div>
                                        <div className="stat-date" style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                                            {new Date().getFullYear()}
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{formatNumber(stats?.previousYear)}</div>
                                        <div className="stat-label">Previous Year</div>
                                        <div className="stat-date" style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                                            {new Date().getFullYear() - 1}
                                        </div>
                                    </div>
                                    <div className="stat-card highlight">
                                        <div className="stat-value">{formatNumber(stats?.overall)}</div>
                                        <div className="stat-label">Overall</div>
                                    </div>
                                </div>
                            </section>

                            {/* Date Range Calculator */}
                            <section className="report-section" style={{ background: 'var(--cream-light, #fdf8f3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                                <h2 style={{ marginBottom: '1rem' }}>📅 Custom Date Range</h2>
                                <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    Select a date range to see your total Nama contributions
                                </p>

                                {/* Quick Range Buttons */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setQuickRange('last7')}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        Last 7 Days
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setQuickRange('last30')}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        Last 30 Days
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setQuickRange('week')}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        This Week
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setQuickRange('month')}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        This Month
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setQuickRange('year')}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        This Year
                                    </button>
                                </div>

                                {/* Custom Date Inputs */}
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '140px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>From Date</label>
                                        <input
                                            type="date"
                                            value={dateRangeStart}
                                            onChange={(e) => { setDateRangeStart(e.target.value); setDateRangeTotal(null); }}
                                            className="form-input"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '140px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>To Date</label>
                                        <input
                                            type="date"
                                            value={dateRangeEnd}
                                            onChange={(e) => { setDateRangeEnd(e.target.value); setDateRangeTotal(null); }}
                                            className="form-input"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleDateRangeSearch}
                                        disabled={!dateRangeStart || !dateRangeEnd || dateRangeLoading}
                                        style={{ minWidth: '100px' }}
                                    >
                                        {dateRangeLoading ? 'Loading...' : 'Calculate'}
                                    </button>
                                </div>

                                {/* Results */}
                                {dateRangeTotal !== null && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1.5rem',
                                        background: 'linear-gradient(135deg, #FF9933 0%, #FF6600 100%)',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        color: 'white'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '4px' }}>
                                            {formatDate(dateRangeStart)} — {formatDate(dateRangeEnd)}
                                        </div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            {formatNumber(dateRangeTotal)}
                                        </div>
                                        <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                                            Total Namas
                                        </div>
                                    </div>
                                )}
                            </section>
                            <section className="report-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ margin: 0 }}>Recent Entries</h2>
                                    {recentEntries.length > 0 && (
                                        <button
                                            onClick={exportToExcel}
                                            className="btn btn-secondary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Export Excel
                                        </button>
                                    )}
                                </div>
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
                                                    <th>Sankalpa</th>
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
