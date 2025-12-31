import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const ExcelUpload = ({ onUpload, onClose, accounts }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDefaultAccounts, setSelectedDefaultAccounts] = useState([]);
    const fileInputRef = useRef(null);

    const requiredColumns = ['name', 'whatsapp', 'password'];
    const optionalColumns = ['city', 'state', 'country'];

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
            setErrors(['Please upload an Excel file (.xlsx, .xls) or CSV file']);
            return;
        }

        setFile(selectedFile);
        parseFile(selectedFile);
    };

    const parseFile = (file) => {
        setLoading(true);
        setErrors([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                if (jsonData.length === 0) {
                    setErrors(['The file is empty or has no valid data rows']);
                    setLoading(false);
                    return;
                }

                // Normalize column names (lowercase, trim)
                const normalizedData = jsonData.map(row => {
                    const normalized = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
                        normalized[normalizedKey] = String(row[key]).trim();
                    });
                    return normalized;
                });

                // Validate columns
                const firstRow = normalizedData[0];
                const missingCols = requiredColumns.filter(col => !(col in firstRow));
                if (missingCols.length > 0) {
                    setErrors([`Missing required columns: ${missingCols.join(', ')}`]);
                    setLoading(false);
                    return;
                }

                // Validate data
                const validationErrors = [];
                normalizedData.forEach((row, index) => {
                    const rowNum = index + 2; // Account for header row
                    if (!row.name || row.name.length < 2) {
                        validationErrors.push(`Row ${rowNum}: Name is required (min 2 characters)`);
                    }
                    if (!row.whatsapp || row.whatsapp.length < 10) {
                        validationErrors.push(`Row ${rowNum}: Valid WhatsApp number is required`);
                    }
                    if (!row.password || row.password.length < 4) {
                        validationErrors.push(`Row ${rowNum}: Password is required (min 4 characters)`);
                    }
                });

                if (validationErrors.length > 0) {
                    setErrors(validationErrors.slice(0, 10)); // Show first 10 errors
                    if (validationErrors.length > 10) {
                        setErrors(prev => [...prev, `...and ${validationErrors.length - 10} more errors`]);
                    }
                }

                setPreviewData(normalizedData);
            } catch (err) {
                setErrors(['Failed to parse the file. Please ensure it is a valid Excel/CSV file.']);
                console.error('Parse error:', err);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = () => {
        if (previewData.length === 0 || errors.length > 0) return;

        // Prepare data for upload
        const users = previewData.map(row => ({
            name: row.name,
            whatsapp: row.whatsapp,
            password: row.password,
            city: row.city || null,
            state: row.state || null,
            country: row.country || null,
            accountIds: selectedDefaultAccounts
        }));

        onUpload(users);
    };

    const toggleAccountSelection = (accountId) => {
        setSelectedDefaultAccounts(prev =>
            prev.includes(accountId)
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId]
        );
    };

    const downloadTemplate = () => {
        const templateData = [{
            Name: 'Example User',
            WhatsApp: '+919876543210',
            Password: 'password123',
            City: 'Chennai',
            State: 'Tamil Nadu',
            Country: 'India'
        }];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Devotees');
        XLSX.writeFile(wb, 'devotees_template.xlsx');
    };

    return (
        <div className="excel-upload">
            <div className="upload-header">
                <h3>Bulk Upload Devotees</h3>
                <p>Upload an Excel file with devotee information</p>
            </div>

            <div className="upload-actions">
                <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Template
                </button>
            </div>

            <div className="upload-area">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                    hidden
                />
                <button
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>{file ? file.name : 'Click to select file'}</span>
                    <small>.xlsx, .xls, or .csv</small>
                </button>
            </div>

            {loading && (
                <div className="upload-loading">
                    <span className="loader loader-sm"></span>
                    <span>Processing file...</span>
                </div>
            )}

            {errors.length > 0 && (
                <div className="upload-errors">
                    <h4>Validation Errors:</h4>
                    <ul>
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {previewData.length > 0 && errors.length === 0 && (
                <>
                    <div className="preview-section">
                        <h4>Preview ({previewData.length} devotees)</h4>
                        <div className="preview-table-wrapper">
                            <table className="preview-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>WhatsApp</th>
                                        <th>City</th>
                                        <th>State</th>
                                        <th>Country</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 5).map((row, i) => (
                                        <tr key={i}>
                                            <td>{row.name}</td>
                                            <td>{row.whatsapp}</td>
                                            <td>{row.city || '-'}</td>
                                            <td>{row.state || '-'}</td>
                                            <td>{row.country || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 5 && (
                                <p className="preview-more">...and {previewData.length - 5} more</p>
                            )}
                        </div>
                    </div>

                    <div className="default-accounts-section">
                        <h4>Assign to Nama Banks (optional)</h4>
                        <div className="checkbox-group">
                            {accounts.filter(acc => acc.is_active).map(account => (
                                <label key={account.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedDefaultAccounts.includes(account.id)}
                                        onChange={() => toggleAccountSelection(account.id)}
                                    />
                                    <span>{account.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="upload-footer">
                <button className="btn btn-ghost" onClick={onClose}>
                    Cancel
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={previewData.length === 0 || errors.length > 0 || loading}
                >
                    Upload {previewData.length > 0 ? `${previewData.length} Devotees` : ''}
                </button>
            </div>
        </div>
    );
};

export default ExcelUpload;
