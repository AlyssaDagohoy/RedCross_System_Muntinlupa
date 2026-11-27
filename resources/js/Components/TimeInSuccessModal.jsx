import { useEffect, useRef, useState } from 'react';

const css = `
.tis-wrap{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none}
.tis-dim{position:absolute;inset:0;background:rgba(40,40,40,.12);opacity:0;transition:opacity .5s ease}
.tis-dim.show{opacity:1}
.tis-pop{position:relative;background:#fff;border-radius:22px;padding:24px 40px 22px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.10);opacity:0;transform:translateY(10px) scale(.94);transition:opacity .5s ease,transform .6s cubic-bezier(.22,1.2,.36,1)}
.tis-pop.show{opacity:1;transform:none}
.tis-ic{width:52px;height:52px;border-radius:50%;background:#eaf7ef;color:#2f9e5b;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;transform:scale(.6);transition:transform .6s cubic-bezier(.22,1.4,.36,1) .12s}
.tis-pop.show .tis-ic{transform:scale(1)}
.tis-text{margin:0;font-size:15px;font-weight:500;color:#3a3a3a}
@media (prefers-reduced-motion:reduce){.tis-pop,.tis-dim,.tis-ic{transition:opacity .2s}}
`;

export default function TimeInSuccessModal({
    open,
    onClose,
    type = 'in',
    duration = 2000,
}) {
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        setMounted(true);
        setShow(false);
        const raf = requestAnimationFrame(() =>
            requestAnimationFrame(() => setShow(true))
        );
        const t1 = setTimeout(() => setShow(false), duration);
        const t2 = setTimeout(() => {
            setMounted(false);
            closeRef.current && closeRef.current();
        }, duration + 600);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [open, duration]);

    if (!mounted) return null;

    const label = type === 'out' ? 'Time out successful' : 'Time in successful';

    return (
        <>
            <style>{css}</style>
            <div className="tis-wrap">
                <div className={'tis-dim' + (show ? ' show' : '')} />
                <div
                    className={'tis-pop' + (show ? ' show' : '')}
                    role="status"
                    aria-live="polite"
                >
                    <div className="tis-ic">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                    </div>
                    <p className="tis-text">{label}</p>
                </div>
            </div>
        </>
    );
}