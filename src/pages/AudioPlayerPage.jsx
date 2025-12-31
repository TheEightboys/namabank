import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitNamaEntry } from '../services/namaService';
import { storage, MEDIA_BUCKET_ID } from '../appwriteClient';
import './AudioPlayerPage.css';

const AudioPlayerPage = () => {
    const { user, linkedAccounts } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();
    const audioRef = useRef(null);
    const simulationRef = useRef(null);

    // Audio state
    const [audioFiles, setAudioFiles] = useState([]);
    const [selectedAudio, setSelectedAudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [loopCount, setLoopCount] = useState(0);
    const [maxLoops, setMaxLoops] = useState(0); // 0 means infinite, 4 for NamaJapa
    const [namaCount, setNamaCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Submission state
    const [selectedAccount, setSelectedAccount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('namajapa'); // 'namajapa' or 'normal'

    // Computed: Separated audio files
    const namaJapaAudio = audioFiles.filter(a => a.isNamaJapa);
    const normalAudio = audioFiles.filter(a => !a.isNamaJapa);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (linkedAccounts.length > 0 && !selectedAccount) {
            setSelectedAccount(linkedAccounts[0].id);
        }

        // Fetch audio files from Appwrite Storage
        fetchAudioFiles();
    }, [user, linkedAccounts, navigate, selectedAccount]);

    const fetchAudioFiles = async () => {
        try {
            const response = await storage.listFiles(MEDIA_BUCKET_ID);
            // Filter to only include audio files (by extension)
            const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
            const audioFilesFiltered = response.files.filter(file =>
                audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
            );
            const files = audioFilesFiltered.map((file, index) => {
                const isNamaJapa = file.name.startsWith('NamaJapa_');
                return {
                    id: file.$id,
                    title: file.name.replace(/\.[^/.]+$/, '').replace('NamaJapa_', '').replace(/_/g, ' '),
                    src: storage.getFileView(MEDIA_BUCKET_ID, file.$id),
                    isNamaJapa: isNamaJapa,
                    maxLoops: isNamaJapa ? 4 : 1 // NamaJapa loops 4 times, normal plays once
                };
            });
            setAudioFiles(files);
            if (files.length > 0) {
                setSelectedAudio(files[0]);
            }
        } catch (err) {
            console.error('Error fetching audio files:', err);
            setAudioFiles([]);
        } finally {
            setLoading(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (simulationRef.current) {
                clearInterval(simulationRef.current);
            }
        };
    }, []);

    // Use refs to track current state for event handlers (avoid closure issues)
    const loopCountRef = useRef(0);
    const maxLoopsRef = useRef(1);
    const isPlayingRef = useRef(false);

    // Keep refs in sync
    useEffect(() => {
        loopCountRef.current = loopCount;
    }, [loopCount]);

    useEffect(() => {
        maxLoopsRef.current = selectedAudio?.maxLoops || 1;
    }, [selectedAudio]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Attach ended event listener to audio element
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            console.log('Audio ended - current loop:', loopCountRef.current, 'max:', maxLoopsRef.current);
            const newCount = loopCountRef.current + 1;
            setLoopCount(newCount);
            setNamaCount(prev => prev + 4);

            // Check if we should continue looping
            if (newCount >= maxLoopsRef.current) {
                // Stop after reaching max loops
                console.log('Max loops reached, stopping');
                setIsPlaying(false);
                setIsPaused(false);
            } else {
                // Continue looping if not at max
                if (isPlayingRef.current) {
                    audio.currentTime = 0;
                    audio.play().catch(err => console.log('Replay failed:', err));
                }
            }
        };

        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // Stop simulation
    const stopSimulation = () => {
        if (simulationRef.current) {
            clearInterval(simulationRef.current);
            simulationRef.current = null;
        }
    };

    const handlePlay = (audio) => {
        // Reset if switching audio
        if (selectedAudio?.id !== audio.id) {
            setLoopCount(0);
            setNamaCount(0);
        }

        setSelectedAudio(audio);
        setIsPlaying(true);
        setIsPaused(false);

        // Use setTimeout to ensure state is updated before playing
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.src = audio.src;
                audioRef.current.load(); // Preload audio
                audioRef.current.play().catch(err => {
                    console.error('Audio play failed:', err);
                    // Don't use simulation - it causes double counting
                });
            }
        }, 100);
    };

    const handlePause = () => {
        setIsPlaying(false);
        setIsPaused(true);
        stopSimulation();
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    const handleResume = () => {
        setIsPlaying(true);
        setIsPaused(false);
        if (audioRef.current) {
            audioRef.current.play().catch(() => {
                startSimulation();
            });
        }
    };

    const handleStop = () => {
        setIsPlaying(false);
        setIsPaused(false);
        stopSimulation();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleSubmit = async () => {
        if (!selectedAccount) {
            error('Please select a Nama Bank account.');
            return;
        }

        if (namaCount === 0) {
            error('No Namas to submit. Play audio first.');
            return;
        }

        setSubmitting(true);
        handleStop();

        try {
            await submitNamaEntry(user.id || user.$id, selectedAccount, namaCount, 'audio');
            success(`${namaCount} Namas submitted via Audio! Hari Om 🙏`);
            setLoopCount(0);
            setNamaCount(0);
        } catch (err) {
            error('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="audio-page page-enter">
            <header className="page-header">
                <div className="container">
                    <Link to="/dashboard" className="back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Dashboard
                    </Link>
                    <h1>Nama Audio</h1>
                    <p>Play & Auto Count - Chant along with the audio</p>
                </div>
            </header>

            <main className="audio-main">
                <div className="container">
                    <div className="audio-layout">
                        {/* Audio List with Tabs */}
                        <div className="audio-list-section">
                            <h2>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18V5l12-2v13" />
                                    <circle cx="6" cy="18" r="3" />
                                    <circle cx="18" cy="16" r="3" />
                                </svg>
                                Audio Files
                            </h2>

                            {/* Tabs */}
                            <div className="audio-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    className={`tab-btn ${activeTab === 'namajapa' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('namajapa')}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: activeTab === 'namajapa' ? 'linear-gradient(135deg, #FF9933, #FF6600)' : '#f5f5f5',
                                        color: activeTab === 'namajapa' ? '#fff' : '#666',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    🕉️ Nama Japa ({namaJapaAudio.length})
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'normal' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('normal')}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: activeTab === 'normal' ? 'linear-gradient(135deg, #4CAF50, #2E7D32)' : '#f5f5f5',
                                        color: activeTab === 'normal' ? '#fff' : '#666',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    🎧 Normal ({normalAudio.length})
                                </button>
                            </div>

                            {/* Tab Description */}
                            <div style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                background: activeTab === 'namajapa' ? 'rgba(255,153,51,0.1)' : 'rgba(76,175,80,0.1)',
                                fontSize: '0.85rem',
                                color: '#666'
                            }}>
                                {activeTab === 'namajapa'
                                    ? '🔁 These audio files loop 4 times. Each loop adds +4 to your Nama count.'
                                    : '▶️ These audio files play once. Each play adds +4 to your Nama count.'}
                            </div>

                            <div className="audio-list">
                                {loading ? (
                                    <div className="loading-audio">
                                        <div className="loader-sm"></div>
                                        <p>Loading audio files...</p>
                                    </div>
                                ) : (activeTab === 'namajapa' ? namaJapaAudio : normalAudio).length === 0 ? (
                                    <p className="no-audio">No {activeTab === 'namajapa' ? 'Nama Japa' : 'normal'} audio files available.</p>
                                ) : (
                                    (activeTab === 'namajapa' ? namaJapaAudio : normalAudio).map((audio, index) => (
                                        <div
                                            key={audio.id}
                                            className={`audio-item ${selectedAudio?.id === audio.id ? 'active' : ''} ${selectedAudio?.id === audio.id && isPlaying ? 'playing' : ''}`}
                                        >
                                            <div className="audio-item-info">
                                                <span className="audio-number">{index + 1}</span>
                                                <span className="audio-title">{audio.title}</span>
                                                <span className="audio-type-badge" style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '10px',
                                                    background: audio.isNamaJapa ? 'rgba(255,153,51,0.2)' : 'rgba(76,175,80,0.2)',
                                                    color: audio.isNamaJapa ? '#FF6600' : '#2E7D32',
                                                    marginLeft: '8px'
                                                }}>
                                                    {audio.isNamaJapa ? '🔁 4x Loop' : '▶️ Once'}
                                                </span>
                                            </div>
                                            <div className="audio-item-controls">
                                                {/* Play Button */}
                                                <button
                                                    className={`control-btn play-btn ${selectedAudio?.id === audio.id && isPlaying ? 'disabled' : ''}`}
                                                    onClick={() => {
                                                        if (selectedAudio?.id === audio.id && isPaused) {
                                                            handleResume();
                                                        } else {
                                                            handlePlay(audio);
                                                        }
                                                    }}
                                                    disabled={selectedAudio?.id === audio.id && isPlaying}
                                                    title="Play"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <polygon points="5 3 19 12 5 21 5 3" />
                                                    </svg>
                                                </button>

                                                {/* Pause Button */}
                                                <button
                                                    className={`control-btn pause-btn ${!(selectedAudio?.id === audio.id && isPlaying) ? 'disabled' : ''}`}
                                                    onClick={handlePause}
                                                    disabled={!(selectedAudio?.id === audio.id && isPlaying)}
                                                    title="Pause"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <rect x="6" y="4" width="4" height="16" />
                                                        <rect x="14" y="4" width="4" height="16" />
                                                    </svg>
                                                </button>

                                                {/* Stop Button */}
                                                <button
                                                    className={`control-btn stop-btn ${!(selectedAudio?.id === audio.id && (isPlaying || isPaused)) ? 'disabled' : ''}`}
                                                    onClick={handleStop}
                                                    disabled={!(selectedAudio?.id === audio.id && (isPlaying || isPaused))}
                                                    title="Stop"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <rect x="6" y="6" width="12" height="12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Counter & Submit Section */}
                        <div className="counter-section">
                            {/* Currently Playing */}
                            <div className="now-playing">
                                <span className="now-playing-label">NOW PLAYING</span>
                                <span className="now-playing-title">{selectedAudio?.title || 'Select an audio'}</span>
                                {isPlaying && (
                                    <div className="playing-indicator">
                                        <span className="bar"></span>
                                        <span className="bar"></span>
                                        <span className="bar"></span>
                                        <span className="bar"></span>
                                    </div>
                                )}
                                {isPaused && <span className="paused-badge">PAUSED</span>}
                            </div>

                            {/* Live Counter */}
                            <div className="live-counter">
                                <div className="counter-display">
                                    <div className="counter-value">{namaCount}</div>
                                    <div className="counter-label">Namas Counted</div>
                                </div>
                                <div className="loop-info">
                                    <span className="loop-count">
                                        {selectedAudio?.isNamaJapa
                                            ? `${loopCount} of ${selectedAudio?.maxLoops} loops`
                                            : `${loopCount} time(s) played`
                                        }
                                    </span>
                                    <span className="loop-note">
                                        {selectedAudio?.isNamaJapa
                                            ? '+4 Namas per loop • Loops 4x'
                                            : '+4 Namas • Plays once'
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Account Selector */}
                            <div className="account-selector">
                                <label className="form-label">Select Nama Bank Account</label>
                                <select
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className="form-input form-select"
                                >
                                    {linkedAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Submit Button */}
                            <button
                                className="btn btn-primary btn-lg w-full"
                                onClick={handleSubmit}
                                disabled={submitting || namaCount === 0}
                            >
                                {submitting ? (
                                    <>
                                        <span className="loader loader-sm"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Submit {namaCount} Namas
                                    </>
                                )}
                            </button>

                            {/* Info Note */}
                            <div className="audio-info">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <p>Audio loops continuously. Each loop adds <strong>+4</strong> to your count. Stop when done and submit!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                loop={false}
                crossOrigin="anonymous"
                preload="auto"
            />
        </div>
    );
};

export default AudioPlayerPage;
