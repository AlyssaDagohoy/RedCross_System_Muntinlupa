import { Head, Link } from '@inertiajs/react';

export default function NewsShow({ auth, article }) {
    return (
        <>
            <Head title={`${article.title} - Philippine Red Cross Muntinlupa`} />
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet" />

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'Source Sans 3', sans-serif;
                    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                    background-attachment: fixed;
                }
                .section-box {
                    background: white;
                    border-radius: 24px;
                    padding: 44px 40px;
                    max-width: 900px;
                    margin: 0 auto;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
                    border: 1px solid #f5f5f5;
                }
                .back-link {
                    display: inline-flex; align-items: center; gap: 6px;
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 13px; font-weight: 600; color: #DC2626;
                    text-decoration: none; margin-bottom: 20px;
                }
                .article-body p { margin-bottom: 16px; }
                .video-wrapper {
                    position: relative; width: 100%; padding-top: 56.25%;
                    border-radius: 14px; overflow: hidden; margin: 28px 0;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }
                .video-wrapper iframe {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;
                }
            `}</style>

            <div>
                {/* ── NAVBAR ── */}
                <nav style={{
                    position: 'fixed', top: '16px', left: '24px', right: '24px', zIndex: 100,
                    background: '#DC2626', height: '64px', borderRadius: '100px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 12px 0 24px', boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
                        <div style={{
                            width: '36px', height: '36px', background: 'white', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#DC2626', fontSize: '20px', fontWeight: '900',
                        }}>+</div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'white', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.6px' }}>RIZAL CHAPTER</strong>
                            <span style={{ display: 'block', fontSize: '10.5px', color: 'rgba(255,255,255,0.72)', fontWeight: '300' }}>Muntinlupa City Branch</span>
                        </div>
                    </Link>
                    <Link href="/" style={{
                        background: 'rgba(0,0,0,0.2)', color: 'white', padding: '9px 20px',
                        borderRadius: '6px', fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                    }}>Back to Home</Link>
                </nav>

                {/* ── ARTICLE ── */}
                <section style={{ padding: '120px 24px 60px' }}>
                    <div className="section-box">
                        <Link href="/#latest-news" className="back-link">← Back to Latest News</Link>

                        <div style={{
                            display: 'inline-block', background: '#DC2626', color: 'white',
                            fontSize: '11px', fontWeight: '700', padding: '5px 14px',
                            borderRadius: '100px', letterSpacing: '0.5px', marginBottom: '16px',
                        }}>{article.date}</div>

                        <h1 style={{
                            fontFamily: 'Oswald, sans-serif', fontSize: '32px', color: '#111',
                            fontWeight: '700', lineHeight: '1.2', letterSpacing: '0.3px', marginBottom: '24px',
                        }}>{article.title}</h1>

                        <img
                            src={article.img}
                            alt={article.title}
                            style={{ width: '100%', height: '360px', objectFit: 'cover', borderRadius: '14px', marginBottom: '24px' }}
                        />

                        <div className="article-body" style={{
                            fontFamily: 'Source Sans 3, sans-serif', fontSize: '15px', color: '#444', lineHeight: '1.9', fontWeight: '300',
                        }}>
                            {article.content.split('\n').filter(Boolean).map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                        </div>

                        {article.video && (
                            <div className="video-wrapper">
                                <iframe
                                    src={article.video}
                                    title={article.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}

                        <Link href="/#latest-news" className="back-link" style={{ marginTop: '20px' }}>← Back to Latest News</Link>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer style={{ background: '#0a0a0a', padding: '24px 64px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3px', fontWeight: '300' }}>
                            © 2026 Philippine Red Cross – Muntinlupa City Branch. All rights reserved.
                        </span>
                    </div>
                </footer>
            </div>
        </>
    );
}