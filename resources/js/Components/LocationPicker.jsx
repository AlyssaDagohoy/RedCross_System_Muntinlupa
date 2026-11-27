import { useEffect, useRef, useState } from 'react';

const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';

const PIN_HTML = '<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27C30 6.7 23.3 0 15 0z" fill="#B71C1C"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>';

function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (window.__leafletLoading) return window.__leafletLoading;
    window.__leafletLoading = new Promise((resolve, reject) => {
        if (!document.querySelector('link[data-leaflet]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = LEAFLET_CSS;
            link.setAttribute('data-leaflet', '1');
            document.head.appendChild(link);
        }
        const s = document.createElement('script');
        s.src = LEAFLET_JS;
        s.async = true;
        s.onload = () => resolve(window.L);
        s.onerror = () => { window.__leafletLoading = null; reject(new Error('Leaflet failed to load')); };
        document.head.appendChild(s);
    });
    return window.__leafletLoading;
}

/**
 * Draggable-pin map. Click the map or drag the pin and onPick(lat, lon) is called.
 * The parent owns the coordinates and passes them back in as latitude / longitude.
 */
export default function LocationPicker({ latitude, longitude, onPick, height = 380, center = [14.4180, 121.0390] }) {
    const elRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const LRef = useRef(null);
    const onPickRef = useRef(onPick);
    const syncRef = useRef(null);
    const [failed, setFailed] = useState(false);
    onPickRef.current = onPick;

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const hasPoint = !isNaN(lat) && !isNaN(lon);

    syncRef.current = () => {
        const L = LRef.current;
        const map = mapRef.current;
        if (!L || !map) return;
        if (!hasPoint) {
            if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
            return;
        }
        if (!markerRef.current) {
            const icon = L.divIcon({ html: PIN_HTML, className: 'loc-pin', iconSize: [30, 42], iconAnchor: [15, 42] });
            const marker = L.marker([lat, lon], { draggable: true, icon }).addTo(map);
            marker.on('dragend', () => {
                const p = marker.getLatLng();
                if (onPickRef.current) onPickRef.current(p.lat, p.lng);
            });
            markerRef.current = marker;
        } else {
            markerRef.current.setLatLng([lat, lon]);
        }
        if (!map.getBounds().contains([lat, lon])) {
            map.setView([lat, lon], Math.max(map.getZoom(), 17));
        }
    };

    useEffect(() => {
        let cancelled = false;
        loadLeaflet()
            .then((L) => {
                if (cancelled || !elRef.current || mapRef.current) return;
                LRef.current = L;
                const start = hasPoint ? [lat, lon] : center;
                const map = L.map(elRef.current).setView(start, hasPoint ? 17 : 14);
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap contributors',
                }).addTo(map);
                map.on('click', (e) => {
                    if (onPickRef.current) onPickRef.current(e.latlng.lat, e.latlng.lng);
                });
                mapRef.current = map;
                if (syncRef.current) syncRef.current();
                setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 250);
            })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => {
            cancelled = true;
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
        };
    }, []);

    useEffect(() => {
        if (syncRef.current) syncRef.current();
    }, [lat, lon]);

    return (
        <div style={{ marginTop: '14px' }}>
            <div
                ref={elRef}
                style={{ height: `${height}px`, width: '100%', border: '1px solid #ebebeb', borderRadius: '10px', background: '#f3f3f4', position: 'relative', isolation: 'isolate' }}
            />
            <div style={{ marginTop: '6px', fontSize: '11.5px', color: failed ? '#991b1b' : '#888' }}>
                {failed ? 'The map could not load. Check your connection and refresh.' : 'Drag the pin or click the map to set the exact spot.'}
            </div>
        </div>
    );
}