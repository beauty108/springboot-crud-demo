import { useEffect, useState } from 'react';

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const handleKey = (event) => {
            if (event.key === 'Escape' && !busy) onCancel();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [busy, onCancel]);

    const handleConfirm = async () => {
        setBusy(true);
        setError('');
        try {
            await onConfirm();
        } catch (err) {
            setError(
                err instanceof TypeError
                    ? 'Cannot reach the server. Is the backend running on port 8080?'
                    : err.message
            );
            setBusy(false);
        }
    };

    return (

        <div className="dialog-backdrop" onClick={() => !busy && onCancel()}>
            <div
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                onClick={(event) => event.stopPropagation()} // clicks inside the box don't close it
            >
                <h2 id="dialog-title">{title}</h2>
                <p>{message}</p>
                {error && <p className="form-error">{error}</p>}
                <div className="form-actions">
                    { }
                    <button type="button" onClick={onCancel} disabled={busy} autoFocus>
                        Cancel
                    </button>
                    <button type="button" className="danger" onClick={handleConfirm} disabled={busy}>
                        {busy ? 'Deleting...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
