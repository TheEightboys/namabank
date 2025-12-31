import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import HTMLFlipBook from 'react-pageflip';
import { getBooks, incrementBookView } from '../services/namaService';
import './BookReaderPage.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const BookReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [pdfDocument, setPdfDocument] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [pdfError, setPdfError] = useState(null);
    const [showOutline, setShowOutline] = useState(false);
    const [outline, setOutline] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);
    const [pageDimensions, setPageDimensions] = useState({ width: 550, height: 733 });

    const flipBookRef = useRef(null);
    const containerRef = useRef(null);

    // Aggressive scroll lock - completely freeze background page
    useEffect(() => {
        // Save current scroll position
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        // Lock the body in place
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = `-${scrollX}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Prevent any scroll events from reaching the body
        const preventBodyScroll = (e) => {
            // Only block if not inside our reader
            if (!e.target.closest('.book-reader-page')) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        document.addEventListener('wheel', preventBodyScroll, { passive: false, capture: true });
        document.addEventListener('touchmove', preventBodyScroll, { passive: false, capture: true });

        return () => {
            // Restore body styles
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.width = '';
            document.body.style.overflow = '';

            // Restore scroll position
            window.scrollTo(scrollX, scrollY);

            document.removeEventListener('wheel', preventBodyScroll, { capture: true });
            document.removeEventListener('touchmove', preventBodyScroll, { capture: true });
        };
    }, []);

    useEffect(() => {
        loadBook();
    }, [id]);

    const loadBook = async () => {
        try {
            const books = await getBooks();
            const found = books.find(b => b.id === id);

            if (found) {
                setBook(found);
                incrementBookView(id);

                // Fetch PDF as blob to bypass CORS
                try {
                    const response = await fetch(found.file_url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    setPdfBlobUrl(blobUrl);
                } catch (pdfErr) {
                    console.error('Error fetching PDF:', pdfErr);
                    setPdfError('Failed to load PDF. Please try again later.');
                }
            } else {
                navigate('/books');
            }
        } catch (err) {
            console.error('Error loading book:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [pdfBlobUrl]);

    const onDocumentLoadSuccess = useCallback(async (pdf) => {
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        try {
            const outlineData = await pdf.getOutline();

            // Recursive helper to flatten nested outline
            const flattenOutline = (items) => {
                let result = [];
                if (!items) return result;
                for (const item of items) {
                    result.push(item);
                    if (item.items && item.items.length > 0) {
                        // Recursively get children
                        result = result.concat(flattenOutline(item.items));
                    }
                }
                return result;
            };

            // Flatten the outline structure first
            const flatRawOutline = flattenOutline(outlineData || []);

            // Process outline to extract page numbers
            const processedOutline = [];
            if (flatRawOutline.length > 0) {
                for (const item of flatRawOutline) {
                    try {
                        let pageNum = 0;
                        if (item.dest) {
                            // Resolve destination to page number
                            const dest = typeof item.dest === 'string'
                                ? await pdf.getDestination(item.dest)
                                : item.dest;

                            if (dest) {
                                const pageRef = dest[0];
                                const pageIndex = await pdf.getPageIndex(pageRef);
                                pageNum = pageIndex; // 0-indexed for flipbook
                            }
                        }
                        processedOutline.push({
                            title: item.title,
                            page: pageNum,
                            // Optional: could keep depth info for indentation later
                        });
                    } catch (err) {
                        console.warn('Could not resolve TOC item:', item.title, err);
                    }
                }
            }

            // Fallback: If no outline found, generate a page list
            if (processedOutline.length === 0) {
                // Try to get outline again with a different method if possible, or just fallback
                // Sometimes outline is empty but there are named destinations
                // For now, just fallback to page numbers
                for (let i = 0; i < pdf.numPages; i++) {
                    processedOutline.push({
                        title: `Page ${i + 1}`,
                        page: i
                    });
                }
            }

            setOutline(processedOutline);

            const firstPage = await pdf.getPage(1);
            const viewport = firstPage.getViewport({ scale: 1 });
            // Set dimensions based on the first page, but ensure it fits 2-page view
            setPageDimensions({ width: viewport.width, height: viewport.height });
        } catch (e) {
            console.error('Error getting PDF metadata:', e);
        }
    }, []);

    const onFlip = useCallback((e) => {
        setCurrentPage(e.data);
    }, []);

    const jumpToPage = (pageNum) => {
        if (flipBookRef.current) {
            // Ensure pageNum is valid
            if (pageNum >= 0 && pageNum < numPages) {
                flipBookRef.current.pageFlip().flip(pageNum);
            }
        }
        setShowOutline(false);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleWheel = (e) => {
        // ALWAYS prevent default to stop any scrolling within the reader
        e.preventDefault();
        e.stopPropagation();

        // Only turn pages - no scrolling at all
        if (!flipBookRef.current) return;
        if (e.deltaY > 0) {
            flipBookRef.current.pageFlip().flipNext();
        } else if (e.deltaY < 0) {
            flipBookRef.current.pageFlip().flipPrev();
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || !pdfDocument) return;

        setIsSearching(true);
        setSearchResults([]);
        setCurrentSearchIndex(-1);

        try {
            const results = [];
            // Search all pages
            for (let i = 1; i <= numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const text = textContent.items.map(item => item.str).join(' ');

                if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
                    results.push(i - 1); // 0-indexed for flipbook
                }
            }
            setSearchResults(results);
            if (results.length > 0) {
                setCurrentSearchIndex(0);
                jumpToPage(results[0]);
            } else {
                // Optional: Show no results message
                // alert('No matches found');
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const nextSearchMatch = () => {
        if (searchResults.length === 0) return;
        const nextIndex = (currentSearchIndex + 1) % searchResults.length;
        setCurrentSearchIndex(nextIndex);
        jumpToPage(searchResults[nextIndex]);
    };

    // Search Highlighting Effect
    useEffect(() => {
        if (!searchQuery) {
            // Clear highlights if search is empty
            const marks = document.querySelectorAll('mark.search-highlight');
            marks.forEach(mark => {
                const parent = mark.parentNode;
                if (parent) {
                    parent.textContent = parent.textContent; // Unwrap
                }
            });
            return;
        }

        const highlightText = () => {
            const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
            textLayers.forEach(layer => {
                const spans = layer.querySelectorAll('span');
                spans.forEach(span => {
                    // Only process if not already highlighted to prevent potential loops usually
                    // But here we might be re-running on fresh render
                    const text = span.textContent;
                    if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
                        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                        if (regex.test(text)) {
                            span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                        }
                    }
                });
            });
        };

        // Run after a slight delay to allow React PDF to render text layer
        const timeoutId = setTimeout(highlightText, 100);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentPage, scale, pdfDocument]);

    if (loading) return <div className="reader-loading"><span className="loader"></span></div>;
    if (!book) return null;

    // Calculate dimensions that fit within the viewport
    const isMobile = window.innerWidth <= 768;
    const toolbarHeight = isMobile ? 100 : 64;
    const padding = isMobile ? 10 : 80;

    const maxWidth = window.innerWidth - padding;
    const maxHeight = window.innerHeight - toolbarHeight - padding;

    // Calculate scaled dimensions while maintaining aspect ratio
    let displayWidth = pageDimensions.width * scale;
    let displayHeight = pageDimensions.height * scale;

    // Fit to viewport if too large
    if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const widthRatio = maxWidth / displayWidth;
        const heightRatio = maxHeight / displayHeight;
        const fitRatio = Math.min(widthRatio, heightRatio);
        displayWidth = displayWidth * fitRatio;
        displayHeight = displayHeight * fitRatio;
    }

    const currentWidth = Math.round(displayWidth);
    const currentHeight = Math.round(displayHeight);

    return (
        <div className="book-reader-page" ref={containerRef} onWheel={handleWheel}>
            {/* Toolbar */}
            <header className="reader-toolbar">
                <div className="toolbar-left">
                    <button className="btn-icon" onClick={() => navigate('/books')} title="Back to Library">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    </button>
                    <button className="btn-icon" onClick={() => setShowOutline(!showOutline)} title="Table of Contents">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    </button>
                </div>

                <div className="book-title-mini">
                    <strong>{book.title}</strong>
                    <span>Page {currentPage + 1} of {numPages}</span>
                </div>

                <div className="toolbar-right">
                    <div className="search-container">
                        <form className="search-box" onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" disabled={isSearching}>
                                {isSearching ? <span className="mini-loader"></span> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
                            </button>
                        </form>
                        {searchResults.length > 0 && (
                            <div className="search-results-nav">
                                <span>{currentSearchIndex + 1}/{searchResults.length}</span>
                                <button onClick={nextSearchMatch} title="Next Match">›</button>
                            </div>
                        )}
                    </div>

                    <div className="zoom-controls">
                        <button className="btn-icon" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </button>
                        <span className="zoom-level">{Math.round(scale * 100)}%</span>
                        <button className="btn-icon" onClick={() => setScale(s => Math.min(2.0, s + 0.1))}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </button>
                    </div>

                    <button className="btn-icon" onClick={toggleFullscreen}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
                    </button>
                </div>
            </header>

            <main className="reader-main">
                {/* TOC Sidebar */}
                {showOutline && (
                    <aside className="outline-sidebar shadow-lg">
                        <div className="sidebar-header">
                            <h3>Contents</h3>
                            <button onClick={() => setShowOutline(false)}>×</button>
                        </div>
                        <div className="outline-list">
                            {outline.length > 0 ? outline.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => jumpToPage(item.page)}
                                    className={currentPage === item.page ? 'active' : ''}
                                >
                                    {item.title}
                                </button>
                            )) : (
                                <p className="no-outline">No table of contents found</p>
                            )}
                        </div>
                    </aside>
                )}

                <div className="flipbook-wrapper">
                    {pdfError ? (
                        <div className="pdf-error">{pdfError}</div>
                    ) : pdfBlobUrl ? (
                        <Document
                            file={pdfBlobUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<div className="loader"></div>}
                        >
                            <HTMLFlipBook
                                width={currentWidth}
                                height={currentHeight}
                                startPage={currentPage}
                                minWidth={315}
                                maxWidth={1000}
                                minHeight={400}
                                maxHeight={1533}
                                maxShadowOpacity={0.5}
                                showCover={true}
                                drawShadow={true}
                                flippingTime={600}
                                usePortrait={false}
                                startZIndex={0}
                                autoSize={false}
                                clickEventForward={false}
                                useMouseEvents={true}
                                swipeDistance={50}
                                showPageCorners={true}
                                disableFlipByClick={false}
                                mobileScrollSupport={true}
                                onFlip={onFlip}
                                className="nama-flipbook"
                                ref={flipBookRef}
                            >
                                {Array.from(new Array(numPages), (el, index) => (
                                    <div key={`page_${index + 1}`} className="page-content">
                                        <Page
                                            pageNumber={index + 1}
                                            width={currentWidth}
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                        />
                                        <div className="page-footer">{index + 1}</div>
                                    </div>
                                ))}
                            </HTMLFlipBook>
                        </Document>
                    ) : (
                        <div className="loader"></div>
                    )}
                </div>

                {/* Navigation Arrows */}
                <button className="nav-btn prev" onClick={() => flipBookRef.current.pageFlip().flipPrev()}>
                    ‹
                </button>
                <button className="nav-btn next" onClick={() => flipBookRef.current.pageFlip().flipNext()}>
                    ›
                </button>
            </main>
        </div>
    );
};

export default BookReaderPage;
