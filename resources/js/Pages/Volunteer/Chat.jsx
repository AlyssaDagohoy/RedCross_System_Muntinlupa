import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import VolunteerShell from '../../Components/VolunteerShell';

const ADMIN_EMAIL = 'rizalmuntinlupa@redcross.org.ph';

const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDay = (d) => new Date(d).toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric', month: 'short' });
const dayKey = (d) => new Date(d).toDateString();
const initials = (n) => (n || '?').replace(/^Admin\s+/i, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const IC = {
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
    back: 'M15 18l-6-6 6-6',
    archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
    trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
    restore: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
    pin: 'M12 17v5M9 3h6l-1 7 3 3H7l3-3z', close: 'M18 6 6 18M6 6l12 12', file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5', panel: 'M3 5h18v14H3zM15 5v14', inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z', history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2', speaker: 'M3 10v4h4l5 4V6L7 10zM16 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13', edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
};
const Ic = ({ n, s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IC[n]} /></svg>
);

const CSS = `
.ch-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:0;padding-left:2px}
.ch-tab{position:relative;display:inline-flex;align-items:center;gap:4px;padding:8px 16px;margin-bottom:-1px;border-radius:8px 8px 0 0;border:1px solid transparent;background:transparent;color:#999;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer;font-family:inherit}
.ch-tab.on{z-index:2;background:#fff;border-color:#ebebeb;border-bottom-color:#fff;color:#111}
.ch-n{font-weight:600;font-size:inherit;color:inherit}
.ch-n::before{content:"("}
.ch-n::after{content:")"}
.ch-wrap{display:grid;grid-template-columns:320px minmax(0,1fr);grid-template-rows:minmax(0,1fr);background:#fff;border:1px solid #ebebeb;border-radius:0 14px 14px 14px;overflow:hidden;height:calc(100vh - 260px);min-height:440px}
.ch-list{border-right:1px solid #ebebeb;overflow-y:auto;min-width:0}
.ch-chat{display:flex;flex-direction:column;min-width:0;min-height:0}
.ch-search{display:flex;align-items:center;gap:8px;margin:10px 12px;padding:7px 12px;border-radius:999px;background:#f3f3f4;color:#888}
.ch-search input{border:none;background:transparent;outline:none;font-size:12.5px;flex:1;font-family:inherit;min-width:0}
.ch-sec{padding:8px 14px 4px;font-size:11px;color:#999}
.ch-row{display:flex;gap:10px;align-items:center;padding:10px 14px;cursor:pointer;border:none;background:transparent;width:100%;text-align:left;font-family:inherit}
.ch-row:hover{background:#f7f7f8}
.ch-row.on{background:#fdf1f1}
.ch-av{width:36px;height:36px;border-radius:50%;background:#fbeaea;color:#CC0000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex:none}
.ch-av.pv{background:#e6f1fb;color:#0c447c}
.ch-rt{min-width:0;flex:1}
.ch-rn{font-size:13px;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-rp{font-size:12px;color:#777;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-row.unread .ch-rn,.ch-row.unread .ch-rp{font-weight:600;color:#111}
.ch-rm{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:11px;color:#999}
.ch-dot{width:8px;height:8px;border-radius:50%;background:#CC0000}
.ch-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #ebebeb;flex-shrink:0}
.ch-note{padding:6px 14px;font-size:12px;color:#777;background:#fafafa;border-bottom:1px solid #ebebeb;flex-shrink:0}
.ch-back{display:none}
.ch-ib{border:none;background:transparent;color:#666;width:32px;height:32px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.ch-ib:hover{background:#f3f3f4}
.ch-scroll{flex:1;min-height:0;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px;background:#fff}
.ch-day{text-align:center;margin:6px 0}
.ch-day span{font-size:11px;color:#888;background:#f3f3f4;padding:3px 10px;border-radius:999px}
.ch-msg{max-width:78%;display:flex;flex-direction:column}
.ch-msg.me{align-self:flex-end;align-items:flex-end}
.ch-msg.them{align-self:flex-start;align-items:flex-start}
.ch-who{font-size:11px;color:#777;margin:0 6px 2px}
.ch-bub{padding:8px 13px;border-radius:16px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.me .ch-bub{background:#CC0000;color:#fff;border-bottom-right-radius:4px}
.them .ch-bub{background:#f1f1f2;color:#222;border-bottom-left-radius:4px}
.ch-time{font-size:10.5px;color:#999;margin:2px 6px 0}
.ch-more{align-self:center;border:1px solid #e5e5e5;background:#fff;color:#555;border-radius:999px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:inherit}
.ch-comp{display:flex;gap:8px;align-items:flex-end;padding:10px 14px;border-top:1px solid #ebebeb;background:#fff;flex-shrink:0}
.ch-comp textarea{flex:1;resize:none;border:1px solid #e5e5e5;border-radius:18px;padding:9px 14px;font-size:13.5px;font-family:inherit;outline:none;background:#fafafa;max-height:110px}
.ch-comp textarea:focus{border-color:#CC0000}
.ch-clip{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;cursor:pointer;color:#777;flex-shrink:0}
.ch-clip:hover{background:#f1f1f2;color:#CC0000}
.ch-file{display:flex;align-items:center;gap:10px;padding:6px 14px;border-top:1px solid #ebebeb;font-size:12px;color:#555;background:#fafafa;flex-shrink:0}
.ch-file span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-file button{border:none;background:none;color:#CC0000;cursor:pointer;font-size:12px}
.ch-file{background:#fff;border-top:none;padding:8px 14px 0}
.ch-file .ch-fchip{display:inline-flex;align-items:center;gap:8px;max-width:100%;padding:5px 6px 5px 10px;border:1px solid #ebebeb;border-radius:999px;background:#fafafa;color:#333;font-size:12.5px}
.ch-file .ch-fchip svg{color:#CC0000;flex:none}
.ch-file .ch-fchip span{flex:0 1 auto;min-width:0;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-file .ch-fchip button{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:none;border-radius:50%;background:#e9e9ea;color:#666;cursor:pointer;flex:none}
.ch-file .ch-fchip button:hover{background:#ddd;color:#222}
.ch-att{margin-top:4px}
.ch-att img{display:block;max-width:220px;max-height:220px;border-radius:12px}
.ch-att video{display:block;max-width:240px;max-height:260px;border-radius:12px;background:#000}
.ch-att .ch-doc{display:inline-block;padding:8px 13px;border-radius:12px;background:#f1f1f2;color:#222;font-size:13px;text-decoration:underline;word-break:break-all}
.ch-send{width:38px;height:38px;border-radius:50%;border:none;background:#CC0000;color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
.ch-empty{margin:auto;text-align:center;color:#888;font-size:13px;padding:24px}
.ch-card{margin:10px 14px;padding:12px 14px;border:1px solid #ebebeb;border-radius:12px;text-align:left}
.ch-chips{display:flex;gap:6px;padding:0 12px 8px}
.ch-chip{border:1px solid #ebebeb;background:#fff;color:#666;border-radius:999px;padding:3px 11px;font-size:11px;cursor:pointer;font-family:inherit}
.ch-chip.on{background:#111;border-color:#111;color:#fff}
.ch-row.on{background:#f5f5f6}
.ch-msg.them{position:relative;padding-left:34px}
.ch-mav{position:absolute;left:0;top:15px;width:26px;height:26px;border-radius:50%;background:#e6f1fb;color:#0c447c;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600}
.ch-att .ch-doc{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #ebebeb;border-radius:12px;background:#fff;color:#222;text-decoration:none;font-size:12.5px;word-break:break-all}
.ch-att .ch-doc svg{color:#CC0000;flex:none}
.ch-msg:not(.l){margin-bottom:-6px}
.ch-msg.me:not(.f) .ch-bub{border-top-right-radius:6px}
.ch-msg.me:not(.l) .ch-bub{border-bottom-right-radius:6px}
.ch-msg.them:not(.f) .ch-bub{border-top-left-radius:6px}
.ch-msg.them:not(.l) .ch-bub{border-bottom-left-radius:6px}
.ch-bub{font-size:13px}
.ch-row{width:calc(100% - 12px);margin:0 6px;padding:10px;border-radius:10px}
.ch-comp{margin:10px 14px 12px;padding:4px 4px 4px 8px;border:1px solid #e5e5e5;border-radius:24px;align-items:center}
.ch-comp:focus-within{border-color:#CC0000}
.ch-comp textarea{border:none;background:transparent;border-radius:0;padding:8px 4px}
.ch-comp textarea:focus{border-color:transparent}
.ch-wrap{grid-template-columns:260px minmax(0,1fr);border-radius:14px;height:calc(100vh - 210px)}
.ch-list{display:flex;flex-direction:column;overflow:hidden;background:#fff}
.ch-ls{flex:1;min-height:0;overflow-y:auto;padding-bottom:6px}
.ch-me{display:flex;align-items:center;gap:10px;margin:12px 12px 6px;padding:9px 11px;background:#F3F4F6;border:1px solid #E6E8EC;border-radius:12px}
.ch-me-n{font-size:12.5px;font-weight:600;color:#1D2A44;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-me-s{font-size:11px;color:#6B7385}.ch-me .ch-av{background:#fff;border:1px solid #DFE2E8;color:#3A4A73}.ch-me .ch-dot{border-color:#F3F4F6}
.ch-ttl{font-size:16px;font-weight:600;color:#111;margin:10px 14px 6px}
.ch-fold{display:flex;gap:2px;margin:0 10px 6px}
.ch-fb{position:relative;flex:1;height:32px;border:none;background:transparent;color:#888;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.ch-fb:hover{background:#f3f3f4}
.ch-fb.on{background:#fdf1f1;color:#CC0000}
.ch-fb em{position:absolute;top:1px;right:1px;min-width:15px;height:15px;padding:0 4px;border-radius:999px;background:#CC0000;color:#fff;font-size:9px;font-style:normal;font-weight:600;display:flex;align-items:center;justify-content:center}
.ch-search{border:1px solid #ebebeb;background:#fff;border-radius:10px}
.ch-chips{flex-wrap:wrap}
.ch-chip.on{background:#fdf1f1;border-color:#fdf1f1;color:#CC0000;font-weight:600}
.ch-row.on{background:#fdf1f1}
.me .ch-bub{background:#fbeaea;color:#8c1d1d}
.ch-new{flex:none;margin:8px 12px 12px;border:none;border-radius:12px;background:#CC0000;color:#fff;padding:10px 0;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-family:inherit}
.ch-ann-ic{width:36px;height:36px;border-radius:50%;background:#fbeaea;color:#CC0000;display:flex;align-items:center;justify-content:center;flex:none}
.ch-wrap{grid-template-columns:300px minmax(0,1fr);height:calc(100vh - 130px);min-height:560px}
.ch-ib.ch-back{display:none}
.ch-av{width:42px;height:42px;font-size:13px}
.ch-rn{font-size:14px}
.ch-rp{font-size:12.5px}
.ch-row{padding:12px 10px}
.ch-head{padding:14px 22px}
.ch-scroll{padding:22px 30px;gap:10px}
.ch-bub{font-size:14px}
.ch-comp{margin:12px 22px 18px}
@media (max-width:760px){.ch-ib.ch-back{display:inline-flex}.ch-wrap{height:calc(100vh - 150px);min-height:480px}.ch-head{padding:12px 14px}.ch-scroll{padding:14px 16px}.ch-comp{margin:10px 14px 14px}}
.ch-wrap{position:relative}
.ch-wrap.info{grid-template-columns:280px minmax(0,1fr) 270px}
.ch-ib.on{background:#f5f5f6;color:#111}
.ch-info{display:flex;flex-direction:column;border-left:1px solid #ebebeb;background:#fff;overflow-y:auto;min-width:0}
.ch-info-x{display:flex;justify-content:flex-end;padding:8px 8px 0}
.ch-info-pr{display:flex;flex-direction:column;align-items:center;text-align:center;padding:2px 14px 14px;border-bottom:1px solid #ebebeb}
.ch-info-pr b{font-size:14px;color:#111;margin-top:10px;word-break:break-word}
.ch-info-pr>span{font-size:12px;color:#888;margin-top:2px}
.ch-av.big{width:64px;height:64px;font-size:20px}
.ch-av.sm{width:30px;height:30px;font-size:10px}
.ch-acts{display:flex;gap:14px;margin-top:14px}
.ch-acts button{display:flex;flex-direction:column;align-items:center;gap:4px;border:none;background:transparent;color:#555;font-size:11px;cursor:pointer;font-family:inherit}
.ch-acts-i{width:34px;height:34px;border-radius:10px;background:#f3f3f4;display:flex;align-items:center;justify-content:center}
.ch-info-h{display:flex;justify-content:space-between;align-items:baseline;padding:14px 14px 6px;font-size:13px;font-weight:600;color:#222}
.ch-info-h small{font-size:11px;font-weight:400;color:#999}
.ch-info-e{padding:2px 14px 10px;font-size:12px;color:#999}
.ch-pp{display:flex;gap:10px;align-items:center;padding:5px 14px;font-size:12.5px;color:#222}
.ch-pp small{display:block;font-size:11px;color:#999}
.ch-sf{display:flex;gap:10px;align-items:center;padding:6px 14px;text-decoration:none;color:#222;font-size:12.5px}
.ch-sf:hover{background:#f7f7f8}
.ch-sf-i{width:30px;height:30px;border-radius:9px;background:#fbeaea;color:#CC0000;display:flex;align-items:center;justify-content:center;flex:none}
.ch-sf-t{min-width:0;display:flex;flex-direction:column}
.ch-sf-t span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-sf-t small{font-size:11px;color:#999}
.ch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:0 14px 14px}
.ch-grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}
.ch-an{flex:none;display:flex;gap:9px;align-items:center;margin:8px 12px 0;padding:9px 11px;border:none;border-radius:12px;background:#fdf1f1;cursor:pointer;text-align:left;font-family:inherit}
.ch-an-ic{width:28px;height:28px;border-radius:50%;background:#CC0000;color:#fff;display:flex;align-items:center;justify-content:center;flex:none}
.ch-an-t{display:flex;flex-direction:column;min-width:0}
.ch-an-t b{font-size:12px;color:#8c1d1d}
.ch-an-t small{font-size:11px;color:#a33}
@media (max-width:1180px){.ch-wrap.info{grid-template-columns:280px minmax(0,1fr)}.ch-info{position:absolute;top:0;right:0;bottom:0;width:280px;z-index:6;box-shadow:-8px 0 24px rgba(0,0,0,.1)}}
@media (max-width:760px){.ch-wrap.info{grid-template-columns:1fr}.ch-info{position:fixed;left:0;right:0;top:auto;bottom:0;width:auto;max-height:70vh;border-radius:16px 16px 0 0;border-left:none;box-shadow:0 -8px 30px rgba(0,0,0,.18);z-index:60}}
/*ch-cards*/
/*ch-voice*/
.ch-comp.rec{background:#FDECEC;border-color:#F3B8B8}
.ch-comp.rec .ch-clip,.ch-comp.rec textarea{display:none}
.ch-rec{flex:1;display:flex;align-items:center;gap:10px;min-width:0;padding-left:4px}
.ch-rec-x{width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:#CC0000;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;padding:0}
.ch-rec-x:hover{background:rgba(204,0,0,.1)}
.ch-rec-dot{width:9px;height:9px;border-radius:50%;background:#CC0000;flex:none;animation:chpulse 1.2s ease-in-out infinite}
.ch-rec-t{font-size:14px;font-weight:600;color:#CC0000;min-width:38px;font-variant-numeric:tabular-nums}
.ch-rec-w{flex:1;display:flex;align-items:center;gap:3px;height:24px;min-width:0;overflow:hidden}
.ch-rec-w i{display:block;width:3px;height:22px;border-radius:2px;background:#E35A5A;transform:scaleY(.3);animation:chwave 1s ease-in-out infinite}
.ch-rec-w i:nth-child(2n){animation-delay:.2s}
.ch-rec-w i:nth-child(3n){animation-delay:.45s}
.ch-rec-w i:nth-child(5n){animation-delay:.7s}
@keyframes chpulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes chwave{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.ch-att audio{display:block;width:250px;max-width:100%;height:40px}
/*ch-player*/
.ch-pl{display:flex;align-items:center;gap:10px;width:260px;max-width:100%;padding:4px 2px}
.ch-pl-b{width:38px;height:38px;border-radius:50%;border:0;background:#CC0000;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;padding:0;box-shadow:0 0 0 2px #fff,0 1px 4px rgba(0,0,0,.25)}
.ch-pl-b:hover{background:#B30000}
.ch-pl-w{flex:1;display:flex;align-items:center;gap:2px;height:30px;cursor:pointer;min-width:0}
.ch-pl-w i{flex:1;display:block;min-width:2px;border-radius:2px;background:rgba(120,120,120,.45)}
.ch-pl-w i.on{background:#CC0000}
.ch-pl-t{font-size:12px;font-weight:600;min-width:34px;text-align:right;font-variant-numeric:tabular-nums}
/*ch-player-end*/
/*ch-bar*/
.ch-comp,.ch-comp:focus-within{margin:0;padding:10px 12px;border:none;border-top:1px solid #ebebeb;border-radius:0;gap:4px;align-items:center}
.ch-comp.rec{border-top-color:#F3B8B8}
button.ch-clip{border:none;background:transparent;padding:0;font:inherit}
.ch-comp .ch-clip{width:36px;height:36px;color:#6b6b70}
.ch-comp .ch-clip:hover{background:#f1f1f2;color:#333}
.ch-fld{flex:1;min-width:0;display:flex;align-items:center;gap:2px;background:#f1f1f2;border-radius:999px;padding:0 14px 0 8px;margin-left:4px}
.ch-comp .ch-fld textarea{flex:1;min-width:0;padding:9px 6px}
.ch-comp.rec .ch-fld{display:none}
.ch-send.idle{background:transparent;color:#CC0000}
.ch-send.idle:hover{background:#FDECEC}
/*ch-bar-end*/
/*ch-voice-end*/
/*ch-dot*/
.ch-me-w{position:relative;display:flex;flex:none}
.ch-dot{position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:50%;background:#2E9E5B;border:2px solid #f5f5f6;box-sizing:border-box}
/*ch-dot-end*/
/*ch-fold-v2*/
.ch-fold{gap:4px}
.ch-fold button.ch-fb{position:relative;flex:1 1 0;min-width:0;width:auto;height:auto;padding:6px 2px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:10px;border:1px solid transparent;background:transparent;box-shadow:none;color:#777;cursor:pointer;font-family:inherit}
.ch-fold button.ch-fb:hover{background:#f6f6f6}
.ch-fold button.ch-fb.on,.ch-fold button.ch-fb.on:hover{background:#fff;border-color:#ebebeb;color:#111}
.ch-fold .ch-fl{font-size:10px;font-weight:600;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-fold button.ch-fb em{position:absolute;top:1px;right:4px}
/*ch-fold-v2-end*/
/*ch-fold-v3*/
/*ch-fold-v3b*/
div:has(> .ch-fold):not(.ch-wrap){position:relative;padding-left:46px;box-sizing:border-box}
.ch-fold{position:absolute;left:0;top:0;bottom:0;width:46px;margin:0;padding:8px 0;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;background:#fafafa;border-right:1px solid #ebebeb;box-sizing:border-box;z-index:3}
.ch-fold button.ch-fb{flex:none;width:34px;height:34px;padding:0;border:0;border-radius:10px;background:transparent;flex-direction:row;justify-content:center;color:#777}
.ch-fold button.ch-fb:hover{background:#f0f0f0}
.ch-fold button.ch-fb.on,.ch-fold button.ch-fb.on:hover{background:#ECEDEF;border:0;color:#111}
.ch-fold .ch-fl{display:none}
.ch-fold button.ch-fb em{top:-2px;right:-4px}
/*ch-fold-v3-end*/
/*ch-fs*/
body .ch-rn,body .ch-bub,body .ch-comp textarea,body .ch-search input,body .ch-me-n,body .ch-pp,body .ch-sf,body .ch-att .ch-doc,body .ch-empty,body .ch-new,body .ch-info-h,body .ch-tab{font-size:14px}
body .ch-rp,body .ch-me-s,body .ch-info-e,body .ch-more,body .ch-note,body .ch-file,body .ch-file button,body .ch-an-t b,body .ch-ban-top small{font-size:13px}
body .ch-sec,body .ch-day span,body .ch-who,body .ch-time,body .ch-chip,body .ch-rm,body .ch-acts button,body .ch-pp small,body .ch-sf-t small,body .ch-info-h small,body .ch-an-t small,body .ch-ban-chip,body .ch-info-pr>span{font-size:12px}
/*ch-fs-end*/
/*ch-ft*/
.ch-fi{display:block;flex:none}
.ch-sf-t .ch-sf-n{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal;overflow:hidden;overflow-wrap:anywhere;line-height:1.3}
.ch-att .ch-doc-n{white-space:normal;overflow-wrap:anywhere;line-height:1.3}
/*ch-ft-end*/
.ch-row.on{background:#F3F4F6}
.me .ch-bub{background:#f1f1f2;color:#222}
.ch-fb.on{background:#F3F4F6;color:#111827}
.ch-chip.on{background:#F3F4F6;border-color:#F3F4F6;color:#111827}
.ch-an{display:none}
@media (min-width:761px){
.ch-wrap{background:transparent;border:none;border-radius:0;overflow:visible;gap:10px}
.ch-list,.ch-chat,.ch-info{background:#fff;border:1px solid #ebebeb;border-radius:14px;overflow:hidden}
.ch-info{overflow-y:auto}
}
/*ch-ban-l21*/
.ch-wrap{zoom:.88;height:calc((100vh - 100px)/.88);min-height:300px}
.ch-ban{padding:8px 14px;margin-bottom:8px;background:#fff;border:1px solid #E5E7EB;border-radius:12px}
.ch-ban-top{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}
.ch-ban-top b{font-size:14px;font-weight:600;color:#111827;line-height:1.25}
.ch-ban-top small{font-size:12px;color:#6B7280}
.ch-ban-chips{display:flex;gap:8px;flex-wrap:wrap}
.ch-ban-chip{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;border:1px solid #D1D5DB;background:#fff;border-radius:999px;padding:3px 10px 3px 3px;font-size:12px;color:#1F2937;cursor:pointer;white-space:nowrap}
.ch-ban-chip:hover{background:#F9FAFB}
.ch-ban-chip em{width:20px;height:20px;border-radius:50%;background:#FDF0D8;color:#B45F06;font-size:10px;font-style:normal;font-weight:600;display:flex;align-items:center;justify-content:center}
.ch-ban-chip .nm{font-weight:600}
.ch-ban-chip .tx{color:#6B7280}
.ch-ban-chip i{width:7px;height:7px;border-radius:50%;flex:none}
.ch-ban-chip i.r{background:#CC0000}
.ch-ban-chip i.a{background:#D97706}
.ch-ban-chip i.g{background:#3AA05B}
.ch-ban-chip.ok{cursor:default;padding-left:10px}
.ch-ban-chip.more{padding-left:10px;color:#B45F06;font-weight:600}
@media (max-width:760px){.ch-wrap{height:calc((100vh - 330px)/.88);min-height:360px}.ch-ban{grid-template-columns:1fr}.ch-ban-av{display:none}.ch-ban-l{padding:10px 14px}.ch-ban-l small{grid-column:1/-1}.ch-ban.hide-m{display:none}}
@media (max-width:760px){.ch-wrap{grid-template-columns:1fr;border-radius:12px;margin-top:12px}.ch-tabs{flex-wrap:nowrap;overflow-x:auto;gap:18px;padding-left:0;border-bottom:1px solid #ebebeb;scrollbar-width:none}.ch-tabs::-webkit-scrollbar{display:none}.ch-tab{flex:none;padding:8px 0;border:none;border-bottom:2px solid transparent;border-radius:0}.ch-tab.on{background:transparent;border-color:transparent;border-bottom-color:#CC0000}.hide-m{display:none!important}.ch-back{display:inline-flex}}
`;

const threadMessages = (t) => {
    if (Array.isArray(t.messages) && t.messages.length > 0) return t.messages.map((m) => ({ ...m, threadId: t.id }));
    const list = [{ sender_type: 'volunteer', body: t.message, created_at: t.created_at, threadId: t.id }];
    if (t.reply) list.push({ sender_type: 'admin', body: t.reply, created_at: t.replied_at || t.created_at, threadId: t.id });
    return list;
};
const hasReplyOf = (t) => !!t.reply || (Array.isArray(t.messages) && t.messages.some((m) => m.sender_type === 'admin'));
const stOf = (t) => (hasReplyOf(t) ? t.inbox_status : t.sent_status) || 'active';
const TABS = [['inbox', 'Inbox'], ['pinned', 'Pinned'], ['history', 'History'], ['archive', 'Archive'], ['trash', 'Trash']];
const FOLD = [['inbox', 'Inbox', 'inbox'], ['pinned', 'Pinned', 'pin'], ['history', 'History', 'history'], ['archive', 'Archive', 'archive'], ['trash', 'Trash', 'trash'], ['announcements', 'Announcements', 'speaker']];
const opts = { preserveScroll: true, preserveState: true };

export default function VolunteerChat({ auth, sentEmails, announcements, staff, groupChat = {} }) {
    const [tab, setTab] = useState('inbox');
    const chLast = useRef(null); const [selectedId, setSelectedId] = useState(() => { try { return window.sessionStorage.getItem('ch-sel') || null; } catch (e) { return null; } }); useEffect(() => { try { if (selectedId) { window.sessionStorage.setItem('ch-sel', selectedId); chLast.current = selectedId; } } catch (e) { } }, [selectedId]);
    const [expanded, setExpanded] = useState(false);
    const [openAnn, setOpenAnn] = useState(null);
    const [text, setText] = useState('');
    const [q, setQ] = useState(''); const [draftKey, setDraftKey] = useState(null);
    const [sending, setSending] = useState(false); const [filter, setFilter] = useState('all');
    const [file, setFile] = useState(null); const [showNew, setShowNew] = useState(false); const [info, setInfo] = useState(() => { try { return window.localStorage.getItem('ch-info') === '1'; } catch (e) { return false; } }); useEffect(() => { try { window.localStorage.setItem('ch-info', info ? '1' : '0'); } catch (e) { } }, [info]); /*ch-info-remember*/
    const scrollRef = useRef(null);
    const markedRef = useRef('');
    const today = new Date().toDateString();

    useEffect(() => {
        const id = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            router.reload({ only: ['sentEmails', 'groupChat'], preserveScroll: true, preserveState: true });
        }, 5000);
        return () => clearInterval(id);
    }, []);

    const chatsBase = useMemo(() => {
        const map = {};
        (sentEmails || []).forEach((t) => {
            const st = stOf(t);
            if (st === 'purged') return;
            const key = t.chat_key || ''; if (!key) return;
            const id = key + '|' + st;
            (map[id] ||= { id, key, status: st, threads: [] }).threads.push(t);
        });
        if (!map['|active']) map['|active'] = { id: '|active', key: '', status: 'active', threads: [] }; if (draftKey) { const did = draftKey + '|active'; if (!map[did]) map[did] = { id: did, key: draftKey, status: 'active', threads: [] }; }
        return Object.values(map).map((c) => {
            const msgs = c.threads.flatMap(threadMessages).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return { ...c, msgs, unread: c.threads.some((t) => t.unread), pinned: c.threads.some((t) => !!t.starred_at), last: msgs[msgs.length - 1] };
        });
    }, [sentEmails, draftKey]);

    // Shared group chat: one chat for everybody (messages come from groupChat.messages)
    const gcAll = useMemo(() => (groupChat?.messages || []).map((m) => ({ ...m, threadId: 'g' })), [groupChat]);
    const gcMine = (m) => m.sender_type === 'volunteer' && m.user_id === auth?.user?.id;
    const gcReadAt = groupChat?.readAt ? new Date(groupChat.readAt).getTime() : 0;
    const gcUnread = gcAll.some((m) => !gcMine(m) && dayKey(m.created_at) === today && new Date(m.created_at).getTime() > gcReadAt);
    const chats = useMemo(() => chatsBase.map((c) => (c.key ? c : { ...c, msgs: gcAll, unread: gcUnread, pinned: false, last: gcAll[gcAll.length - 1] })), [chatsBase, gcAll, gcUnread]);
    const nameOf = (c) => (c.key ? 'Admin ' + c.key : (groupChat?.name || 'Group chat'));
    const rowName = (c) => nameOf(c) + (c.day && c.last ? ' \u00b7 ' + fmtDay(c.last.created_at) : '');
    // Group chat: one read-only row per earlier day, shown in History
    const gcDayRows = useMemo(() => {
        const g = chats.find((c) => c.id === '|active');
        if (!g) return [];
        const byDay = {};
        g.msgs.forEach((m) => { const dk = dayKey(m.created_at); if (dk !== today) (byDay[dk] ||= []).push(m); });
        return Object.keys(byDay).map((dk) => ({ id: '|day|' + dk, key: '', status: 'active', day: dk, threads: [], msgs: byDay[dk], unread: false, pinned: false, last: byDay[dk][byDay[dk].length - 1] }));
    }, [chats, today]);
    const isToday = (c) => !!c.last && dayKey(c.last.created_at) === today;
    const inInbox = (c) => c.status === 'active' && (!c.key || isToday(c) || c.threads.length === 0);
    const match = (c) => {
        const s = q.trim().toLowerCase();
        if (tab === 'inbox' && filter === 'unread' && !c.unread) return false; if (tab === 'inbox' && filter === 'groups' && c.key) return false; if (tab === 'inbox' && filter === 'private' && !c.key) return false; return !s || nameOf(c).toLowerCase().includes(s) || (c.last?.body || '').toLowerCase().includes(s);
    };
    const newest = (a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0);
    const list = [...chats, ...(tab === 'history' ? gcDayRows : [])].filter((c) => {
        if (!match(c)) return false;
        if (tab === 'pinned') return c.status === 'active' && c.pinned;
        if (tab === 'inbox') return inInbox(c);
        if (tab === 'history') return c.status === 'active' && (!!c.day || !inInbox(c));
        return c.status === (tab === 'archive' ? 'archived' : 'trashed');
    }).sort(newest);
    const groupRows = list.filter((c) => !c.key);
    const privateRows = list.filter((c) => c.key); const sq = q.trim().toLowerCase(); const suggest = tab === 'inbox' && (sq || showNew) ? (staff || []).filter((s) => ('admin ' + s).toLowerCase().includes(sq) && !chats.some((c) => c.id === s + '|active')) : [];
    const inboxUnread = chats.filter((c) => inInbox(c) && c.unread).length;
    const emptyText = tab === 'pinned' ? 'No pinned chats. Tap the pin on a chat to keep it here.' : tab === 'archive' ? 'Nothing archived.' : tab === 'trash' ? 'Trash is empty.' : tab === 'history' ? 'No earlier chats.' : 'No matches.';

    const sel = [...chats, ...gcDayRows].find((c) => c.id === selectedId) || null;
    const todayMsgs = sel ? sel.msgs.filter((m) => dayKey(m.created_at) === today) : [];
    const showAll = !sel || expanded || (todayMsgs.length === 0 && !!sel.key) || !!sel.day;
    const shown = sel ? (showAll ? sel.msgs : todayMsgs) : [];
    const earlier = sel ? sel.msgs.length - todayMsgs.length : 0;
    const attUrl = (m) => (m.threadId === 'g' ? route('groupchat.attachment', m.id) : route('volunteer.communication.attachment', m.id));
    const atts = sel ? [...sel.msgs].filter((m) => m.attachment_path && m.id != null).reverse() : [];
    const sharedImgs = atts.filter((m) => (m.attachment_mime || '').startsWith('image/'));
    const sharedFiles = atts.filter((m) => !(m.attachment_mime || '').startsWith('image/'));
    const people = sel && !sel.key ? (() => { const seen = {}; sel.msgs.forEach((m) => { if (gcMine(m)) return; const n = m.label || m.admin_label || m.admin?.name || 'Red Cross Admin'; if (!seen[n]) seen[n] = m.sender_type === 'admin' ? 'Admin' : 'Volunteer'; }); return Object.entries(seen); })() : [];
    const showInfo = info && !!sel;
    const newAnn = (announcements || []).filter((a) => Date.now() - new Date(a.created_at).getTime() < 7 * 86400000).length;
    const unreadChats = chats.filter((c) => inInbox(c) && c.unread);
    const firstUnread = [...unreadChats].sort(newest)[0] || null;
    const bannerPeople = (() => { const seen = {}; gcAll.forEach((m) => { if (gcMine(m)) return; const n = m.label || m.admin_label || m.admin?.name || 'Red Cross Admin'; if (!seen[n]) seen[n] = 1; }); return Object.keys(seen); })();
    const ago = (d) => { const t = new Date(d).getTime(); if (!t) return ''; const m = Math.floor((Date.now() - t) / 60000); if (m < 1) return 'Just now'; if (m < 60) return m + ' min'; const h = Math.floor(m / 60); if (h < 24) return h + ' hr'; const dd = Math.floor(h / 24); return dd + (dd === 1 ? ' day' : ' days'); };
    const lastMsgOf = (c) => { const ms = c.messages || c.msgs || []; if (!Array.isArray(ms) || !ms.length) return c.last || c.last_message || null; return ms.reduce((a, b) => (new Date(b.created_at) >= new Date(a.created_at) ? b : a)); };
    const waiting = chats.filter((c) => { if (!c.key || !inInbox(c) || c.unread) return false; const lm = lastMsgOf(c); return !!lm && typeof lm === 'object' && !!lm.created_at && lm.sender_type === 'admin'; }).sort((a, b) => new Date(lastMsgOf(a).created_at) - new Date(lastMsgOf(b).created_at));
    const latestAnn = [...(announcements || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
    const openChat = (c) => { setTab('inbox'); setFilter('all'); setOpenAnn(null); setShowNew(false); setSelectedId(c.id); };
    const waitName = (c) => { const lm = lastMsgOf(c) || {}; return String(lm.admin_label || lm.admin?.name || c.name || c.title || c.label || 'An admin').replace(/^Admin\s+/i, '').split(' ')[0]; };
    const bannerRows = [];
    if (unreadChats.length > 0) bannerRows.push({ k: 'u', c: 'r', t: unreadChats.length + ' unread chat' + (unreadChats.length > 1 ? 's' : ''), m: '', go: () => firstUnread && openChat(firstUnread) });
    if (waiting.length > 0) bannerRows.push({ k: 'w', c: 'a', t: waitName(waiting[0]) + ' is waiting for your reply' + (waiting.length > 1 ? ' (+' + (waiting.length - 1) + ' more)' : ''), m: ago(lastMsgOf(waiting[0]).created_at), go: () => openChat(waiting[0]) });
    if (newAnn > 0) bannerRows.push({ k: 'a', c: 'g', t: newAnn + ' new announcement' + (newAnn > 1 ? 's' : ''), m: ago(latestAnn && latestAnn.created_at), go: () => { setTab('announcements'); setOpenAnn(null); } });
    if (bannerRows.length === 0) bannerRows.push({ k: 'ok', c: 'g', t: "You're all caught up", m: '', go: () => {} });
    const bannerTotal = unreadChats.length + waiting.length + newAnn;

    const gcMarked = useRef('');
    useEffect(() => {
        if (!sel || sel.key || sel.day || !gcUnread) return;
        const k = String(gcAll[gcAll.length - 1]?.id || '');
        if (gcMarked.current === k) return;
        gcMarked.current = k;
        router.post(route('groupchat.read'), {}, opts);
    }, [sel?.id, gcUnread, gcAll.length]);
    useEffect(() => { setExpanded(false); setText(''); setFile(null); }, [selectedId]); useEffect(() => { if (draftKey && (sentEmails || []).some((t) => t.chat_key === draftKey && stOf(t) === 'active')) setDraftKey(null); }, [sentEmails, draftKey]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [sel?.id, shown.length]);

    useEffect(() => {
        if (!sel || !sel.unread) return;
        const key = sel.id + ':' + (sel.last?.created_at || '');
        if (markedRef.current === key) return;
        markedRef.current = key;
        const ids = sel.threads.filter((t) => t.unread).map((t) => t.id);
        if (ids.length) router.post(route('volunteer.communication.read'), { ids, read: true }, opts);
    }, [sel?.id, sel?.unread, sel?.last?.created_at]);

    const move = (name, ts) => {
        const ids = ts.map((t) => t.id);
        if (!ids.length) return;
        router.post(route('volunteer.communication.' + name), { ids, box: 'inbox' }, { ...opts, onSuccess: () => router.post(route('volunteer.communication.' + name), { ids, box: 'sent' }, opts) });
    };
    const leave = (name, c) => { move(name, c.threads); chLast.current = null; try { window.sessionStorage.removeItem('ch-sel'); } catch (e) { } setSelectedId(null); };
    const seqPost = (urls) => { if (!urls.length) return; const [u, ...rest] = urls; router.post(u, {}, { ...opts, onFinish: () => seqPost(rest) }); };
    const togglePin = (c) => seqPost(c.threads.filter((t) => !!t.starred_at === c.pinned).map((t) => route('volunteer.communication.star', t.id))); const startWith = (s) => { setDraftKey(s); setSelectedId(s + '|active'); setQ(''); setShowNew(false); };

    // ch-vh
const [recSec, setRecSec] = useState(-1);
const chVStop = (go) => { chVoice.cancel = !go; if (chVoice.mr && chVoice.mr.state !== 'inactive') chVoice.mr.stop(); else setRecSec(-1); };
const chVStart = async () => {
if (recSec >= 0 || sending) return;
if (!navigator.mediaDevices || !window.MediaRecorder) { window.alert('Voice recording needs a secure (HTTPS) page and a supported browser.'); return; }
let stream;
try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (err) { window.alert('Microphone access was blocked. Allow it in your browser settings and try again.'); return; }
const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const mime = types.find((t) => window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported(t)) || '';
const mr = mime ? new window.MediaRecorder(stream, { mimeType: mime }) : new window.MediaRecorder(stream);
chVoice.chunks = []; chVoice.cancel = false; chVoice.mr = mr; chVoice.t0 = Date.now();
mr.ondataavailable = (e) => { if (e.data && e.data.size) chVoice.chunks.push(e.data); };
mr.onstop = () => {
clearInterval(chVoice.timer);
stream.getTracks().forEach((t) => t.stop());
const type = String(mr.mimeType || mime || 'audio/webm').split(';')[0];
const blob = new Blob(chVoice.chunks, { type });
chVoice.mr = null;
setRecSec(-1);
if (chVoice.cancel) return;
if (blob.size < 800) { window.alert('Recording was too short.'); return; }
const ext = type.indexOf('mp4') >= 0 ? 'm4a' : type.indexOf('ogg') >= 0 ? 'ogg' : 'webm';
send(new File([blob], 'voice-message-' + Date.now() + '.' + ext, { type }));
};
mr.start();
setRecSec(0);
chVoice.timer = setInterval(() => { const s = Math.floor((Date.now() - chVoice.t0) / 1000); setRecSec(s); if (s >= 300) chVStop(true); }, 500);
};
// ch-vh-end
const send = (vf0) => { const vf = vf0 instanceof File ? vf0 : null;
        const body = text.trim();
        if ((!body && !file && !vf) || !sel || sending) return;
        setSending(true);
        const latest = [...sel.threads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const o = { ...opts, onSuccess: () => { setText(''); setFile(null); }, onError: (e) => { console.error(e); window.alert('Hindi na-send: ' + Object.values(e).join(' | ')); }, onFinish: () => setSending(false) };
        if (!sel.key) router.post(route('groupchat.send'), { body, attachment: vf || file }, o);
        else if (latest) router.post(route('volunteer.communication.reply', latest.id), { body, attachment: vf || file }, o);
        else router.post(route('volunteer.communication.send'), { to: ADMIN_EMAIL, subject: (body || 'Attachment').slice(0, 60), message: body, attachment: vf || file, chat_key: sel.key || '' }, o);
    };

    const renderMsgs = (items) => {
        let prev = ''; const adm = (x) => (x.threadId === 'g' ? !gcMine(x) : x.sender_type === 'admin'); const nmOf = (x) => x.label || x.admin_label || x.admin?.name || 'Red Cross Admin';
        return items.map((m, i) => {
            const dk = dayKey(m.created_at);
            const showDay = dk !== prev;
            prev = dk;
            const admin = m.threadId === 'g' ? !gcMine(m) : m.sender_type === 'admin'; const sk = (x) => (adm(x) ? 'a:' + nmOf(x) : 'me'); const pv = items[i - 1]; const nx = items[i + 1]; const isFirst = showDay || !pv || sk(pv) !== sk(m); const isLast = !nx || dayKey(nx.created_at) !== dk || sk(nx) !== sk(m);
            return (
                <div key={m.threadId + '-' + (m.id ?? i)} style={{ display: 'contents' }}>
                    {showDay && <div className="ch-day"><span>{dk === today ? 'Today' : fmtDay(m.created_at)}</span></div>}
                    <div className={'ch-msg ' + (admin ? 'them' : 'me') + (isFirst ? ' f' : '') + (isLast ? ' l' : '')}>
                        {admin && !(i > 0 && !showDay && adm(items[i - 1]) && nmOf(items[i - 1]) === nmOf(m)) && (<><div className="ch-who">{nmOf(m)}</div><div className="ch-mav">{initials(nmOf(m))}</div></>)}
                        {m.body && <div className="ch-bub">{m.body}</div>}
                        {m.attachment_path && (() => { const u = m.threadId === 'g' ? route('groupchat.attachment', m.id) : route('volunteer.communication.attachment', m.id); const mt = m.attachment_mime || ''; return (
                            <div className="ch-att">
                                {mt.startsWith('image/') ? <a href={u} target="_blank" rel="noreferrer"><img src={u} alt={m.attachment_name || 'Picture'} /></a>
                                : (mt.startsWith('audio/') || /^voice-message-/.test(m.attachment_name || '')) /*ch-voice-name*/ ? <ChVoicePlayer src={u} /> : mt.startsWith('video/') ? <video src={u} controls preload="metadata" /> : mt.startsWith('audio/') ? <ChVoicePlayer src={u} />
                                : <a className="ch-doc" href={u} target="_blank" rel="noreferrer"><ChFileIcon m={m} sm /><span className="ch-doc-n">{m.attachment_name || 'Open file'}</span></a>}
                            </div>); })()}
                        {isLast && <div className="ch-time">{fmtTime(m.created_at)}{m.threadId === 'g' && gcMine(m) && (() => { const allSb = Array.isArray(m.seen_by) ? m.seen_by : []; const later = items.slice(i + 1).filter((x) => x.threadId === 'g' && gcMine(x)); const sb = allSb.filter((r) => !later.some((x) => Array.isArray(x.seen_by) && x.seen_by.some((y) => y.name === r.name))); if (allSb.length === 0) return items.map((x) => x.threadId === 'g' && gcMine(x)).lastIndexOf(true) === i ? <span style={{ marginLeft: '6px' }}>&middot; Sent</span> : null; if (sb.length === 0) return null; return (<span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginLeft: '6px' }}>{sb.slice(0, 3).map((r, k) => (<span key={k} title={r.name} style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1.5px solid #fff', marginLeft: k === 0 ? 0 : '-4px', background: '#e8eef7', color: '#1f4e8c', fontSize: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'content-box' }}>{r.photo ? <img src={'/storage/' + r.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : initials(r.name)}</span>))}{sb.length > 3 && <span style={{ marginLeft: '4px', fontSize: '10px' }}>+{sb.length - 3}</span>}</span>); })()}</div>}
                    </div>
                </div>
            );
        });
    };

    const renderRow = (c) => {
        const todays = tab === 'inbox' && !c.key ? c.msgs.filter((m) => dayKey(m.created_at) === today) : null;
        const last = todays ? todays[todays.length - 1] : c.last;
        const who = last ? (c.key ? (last.sender_type === 'admin' ? (last.admin_label || last.admin?.name || 'Red Cross Admin') : 'You') : (gcMine(last) ? 'You' : (last.label || 'Someone'))) + ': ' : '';
        return (
            <button key={c.id} type="button" onClick={() => setSelectedId(c.id)} className={'ch-row' + (c.id === selectedId ? ' on' : '') + (c.unread ? ' unread' : '')}>
                <div className={'ch-av' + (c.key ? ' pv' : '')}>{c.key ? initials('Admin ' + c.key) : (groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : 'RC')}</div>
                <div className="ch-rt">
                    <div className="ch-rn">{rowName(c)}</div>
                    <div className="ch-rp">{last ? who + (last.body || 'Attachment') : (c.msgs.length > 0 ? 'No messages today.' : 'Say hello to the Red Cross team.')}</div>
                </div>
                <div className="ch-rm">
                    <span>{last ? (dayKey(last.created_at) === today ? fmtTime(last.created_at) : fmtDay(last.created_at)) : ''}</span>
                    {c.unread ? <span className="ch-dot" /> : null}
                    {c.threads.length > 0 ? <span role="button" tabIndex={0} title={c.pinned ? 'Unpin chat' : 'Pin chat'} aria-label={c.pinned ? 'Unpin chat' : 'Pin chat'} onClick={(e) => { e.stopPropagation(); togglePin(c); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); togglePin(c); } }} style={{ cursor: 'pointer', display: 'inline-flex', color: c.pinned ? '#CC0000' : '#bbb' }}><Ic n="pin" s={13} /></span> : null}
                </div>
            </button>
        );
    };

    return (
        <VolunteerShell active="communication" title="Messages" notifications={[]}>
            <style>{CSS}</style>
            <div className={'ch-wrap' + (showInfo ? ' info' : '')}>
                    <div className={'ch-list' + (sel || openAnn ? ' hide-m' : '')}>
                        <div className="ch-me"><div className="ch-me-w"><div className="ch-av">{auth?.user?.photo ? <img src={'/storage/' + auth.user.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : initials(auth?.user?.name)}</div><span className="ch-dot" title="Online" /></div><div style={{ minWidth: 0 }}><div className="ch-me-n">{auth?.user?.name || 'Volunteer'}</div><div className="ch-me-s">Volunteer</div></div></div>
                        <div className="ch-ttl">{tab === 'inbox' ? 'Chats' : (FOLD.find((f) => f[0] === tab) || ['', ''])[1]}</div>
                        <div className="ch-fold">
                            {FOLD.map(([id, label, icon]) => { const n = id === 'inbox' ? inboxUnread : id === 'announcements' ? (announcements || []).length : 0; return (
                                <button key={id} type="button" title={label} aria-label={label} className={'ch-fb' + (tab === id ? ' on' : '')} onClick={() => { setTab(id); if (id === 'announcements') setSelectedId(null); else if (!selectedId && chLast.current) setSelectedId(chLast.current); setOpenAnn(null); setShowNew(false); }}><Ic n={icon} s={17} /><span className="ch-fl">{({ announcements: 'News' })[id] || label}</span>{n > 0 ? <em>{n}</em> : null}</button>); })}
                        </div>
                        {tab !== 'announcements' && (<label className="ch-search"><Ic n="search" s={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" /></label>)}
                        {tab === 'inbox' && (<div className="ch-chips">{[['all', 'All'], ['unread', 'Unread'], ['private', 'Private'], ['groups', 'Group']].map(([k, l]) => (<button key={k} type="button" className={'ch-chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>))}</div>)}
                        <div className="ch-ls">
                            {tab === 'announcements' ? (
                                <>
                                    {(announcements || []).length === 0 && <div className="ch-empty">No announcements yet.</div>}
                                    {(announcements || []).map((a) => (
                                        <button key={a.id} type="button" onClick={() => setOpenAnn(a.id)} className={'ch-row' + (openAnn === a.id ? ' on' : '')}>
                                            <div className="ch-ann-ic"><Ic n="speaker" s={16} /></div>
                                            <div className="ch-rt"><div className="ch-rn">{a.title}</div><div className="ch-rp">{(a.body || '').slice(0, 60)}</div></div>
                                            <div className="ch-rm"><span>{fmtDay(a.created_at)}</span></div>
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {suggest.length > 0 && <div className="ch-sec">Start a private chat</div>}{suggest.map((s) => (<button key={'new-' + s} type="button" className="ch-row" onClick={() => startWith(s)}><div className="ch-av pv">{initials('Admin ' + s)}</div><div className="ch-rt"><div className="ch-rn">{'Admin ' + s}</div><div className="ch-rp">Start private chat</div></div></button>))}{list.length === 0 && suggest.length === 0 && <div className="ch-empty">{emptyText}</div>}
                                    {tab === 'inbox' && groupRows.length > 0 && <div className="ch-sec">Group</div>}
                                    {tab === 'inbox' ? groupRows.map(renderRow) : null}
                                    {tab === 'inbox' && privateRows.length > 0 && <div className="ch-sec">Private chats</div>}
                                    {(tab === 'inbox' ? privateRows : list).map(renderRow)}
                                </>
                            )}
                        </div>
                        {tab !== 'announcements' && newAnn > 0 && (<button type="button" className="ch-an" onClick={() => { setTab('announcements'); setSelectedId(null); setOpenAnn(null); setShowNew(false); }}><span className="ch-an-ic"><Ic n="speaker" s={14} /></span><span className="ch-an-t"><b>{newAnn} new announcement{newAnn > 1 ? 's' : ''}</b><small>Tap to read</small></span></button>)}
                    </div>

                    {tab === 'announcements' ? ((() => { const a = (announcements || []).find((x) => x.id === openAnn); return (
                        <div className={'ch-chat' + (a ? '' : ' hide-m')}>
                            {!a ? (<div className="ch-empty">Pick an announcement to read.</div>) : (
                                <>
                                    <div className="ch-head">
                                        <button type="button" className="ch-ib ch-back" aria-label="Back" onClick={() => setOpenAnn(null)}><Ic n="back" s={18} /></button>
                                        <div className="ch-ann-ic"><Ic n="speaker" s={16} /></div>
                                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: '14px', fontWeight: 600 }}>{a.title}</div><div style={{ fontSize: '12px', color: '#777' }}>{fmtDay(a.created_at)}</div></div>
                                    </div>
                                    <div className="ch-scroll"><div style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px', color: '#333', lineHeight: 1.6 }}>{a.body}</div></div>
                                </>
                            )}
                        </div>); })()) : (
                    <div className={'ch-chat' + (sel ? '' : ' hide-m')}>
                        {!sel ? (
                            <div className="ch-empty">Pick a conversation to read and reply.</div>
                        ) : (
                            <>
                                <div className="ch-head">
                                    <button type="button" className="ch-ib ch-back" aria-label="Back" onClick={() => { chLast.current = null; try { window.sessionStorage.removeItem('ch-sel'); } catch (e) { } setSelectedId(null); }}><Ic n="back" s={18} /></button>
                                    <div className={'ch-av' + (sel.key ? ' pv' : '')}>{sel.key ? initials('Admin ' + sel.key) : (groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : 'RC')}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{rowName(sel)}</div>
                                        <div style={{ fontSize: '12px', color: '#777' }}>{sel.day ? 'Messages from this day. To chat, go to Inbox.' : sel.key ? 'Private chat' : 'Muntinlupa Branch \u00b7 everyone can read and reply'}</div>
                                    </div>
                                    {sel.status === 'active' && sel.threads.length > 0 && <button type="button" className="ch-ib" aria-label={sel.pinned ? 'Unpin chat' : 'Pin chat'} title={sel.pinned ? 'Unpin chat' : 'Pin chat'} onClick={() => togglePin(sel)} style={{ color: sel.pinned ? '#CC0000' : undefined }}><Ic n="pin" /></button>}{sel.status === 'active' && sel.threads.length > 0 && <button type="button" className="ch-ib" aria-label="Archive" title="Archive" onClick={() => leave('archive', sel)}><Ic n="archive" /></button>}
                                    {sel.status !== 'active' && <button type="button" className="ch-ib" aria-label="Restore" title="Restore" onClick={() => leave('restore', sel)}><Ic n="restore" /></button>}
                                    {sel.status !== 'trashed' && sel.threads.length > 0 && <button type="button" className="ch-ib" aria-label="Move to trash" title="Move to trash" onClick={() => { if (window.confirm('Move this conversation to Trash? You can restore it later.')) leave('trash', sel); }}><Ic n="trash" /></button>}
                                    {sel.status === 'trashed' && <button type="button" className="ch-ib" aria-label="Delete forever" title="Delete forever" onClick={() => { if (window.confirm('Delete this conversation forever? This cannot be undone.')) leave('purge', sel); }}><Ic n="trash" /></button>}<button type="button" className={'ch-ib' + (info ? ' on' : '')} aria-label="Chat details" title="Chat details" onClick={() => setInfo((v) => !v)}><Ic n="panel" /></button>
                                </div>

                                <div className="ch-scroll" ref={scrollRef}>
                                    {!showAll && earlier > 0 && !!sel.key && (
                                        <button type="button" className="ch-more" onClick={() => setExpanded(true)}>Show earlier messages ({earlier})</button>
                                    )}
                                    {shown.length === 0 && <div className="ch-empty">{sel.status === 'active' ? (earlier > 0 && !sel.key ? 'No messages today. Earlier messages are in History.' : 'No messages yet. Say hello below.') : 'No messages.'}</div>}
                                    {renderMsgs(shown)}
                                </div>

                                {sel.status === 'active' && !sel.day && (
                                    <>
                                        {file && (<div className="ch-file"><div className="ch-fchip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg><span>{file.name}</span><button type="button" aria-label="Remove file" title="Remove" onClick={() => setFile(null)}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div></div>)}
                                        <div className={'ch-comp' + (recSec >= 0 ? ' rec' : '')}>
                                            <button type="button" className="ch-clip" aria-label="Record a voice message" title="Record a voice message" onClick={chVStart}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></button>
<label className="ch-clip" aria-label="Attach a picture or video" title="Attach a picture or video">
                                                <input type="file" hidden accept="image/*,video/*" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const lim = f.type.startsWith('image/') ? 5 : f.type.startsWith('video/') ? 50 : 10; if (f.size / 1048576 > lim) { window.alert('File too large. Limits: pictures 5 MB, videos 50 MB, PDF 10 MB.'); return; } setFile(f); }} />
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 9" /></svg>
                                            </label>
<label className="ch-clip" aria-label="Attach a file" title="Attach a picture, video or PDF">
                                                <input type="file" hidden accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const lim = f.type.startsWith('image/') ? 5 : f.type.startsWith('video/') ? 50 : 10; if (f.size / 1048576 > lim) { window.alert('File too large. Limits: pictures 5 MB, videos 50 MB, PDF 10 MB.'); return; } setFile(f); }} />
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                            </label>
                                            {/*ch-rec*/}{recSec >= 0 && (<div className="ch-rec"><button type="button" className="ch-rec-x" aria-label="Cancel recording" title="Cancel" onClick={() => chVStop(false)}><Ic n="trash" s={18} /></button><span className="ch-rec-dot" /><span className="ch-rec-t">{Math.floor(recSec / 60)}:{String(recSec % 60).padStart(2, '0')}</span><span className="ch-rec-w">{Array.from({ length: 24 }).map((_, i) => (<i key={i} />))}</span></div>)}{/*ch-rec-end*/}<div className="ch-fld">
<textarea
                                                rows={1}
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                                placeholder={sel.key ? 'Message Admin ' + sel.key : 'Message ' + (groupChat?.name || 'Group chat')}
                                                aria-label="Message"
                                            />
</div>
                                            {/*ch-mic*/}{recSec >= 0 ? (<button type="button" className="ch-send" aria-label="Send voice message" title="Send" onClick={() => chVStop(true)}><Ic n="send" /></button>) : (<button type="button" className={'ch-send' + ((!text.trim() && !file) ? ' idle' : '')} aria-label="Send" title="Send" onClick={send}><Ic n="send" /></button>)}{/*ch-mic-end*/}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
                {showInfo && (
                    <aside className="ch-info">
                        <div className="ch-info-x"><button type="button" className="ch-ib" aria-label="Close details" onClick={() => setInfo(false)}><Ic n="close" s={16} /></button></div>
                        <div className="ch-info-pr">
                            <div className={'ch-av big' + (sel.key ? ' pv' : '')}>{sel.key ? initials('Admin ' + sel.key) : (groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : 'RC')}</div>
                            <b>{rowName(sel)}</b>
                            <span>{sel.key ? 'Private chat' : 'Group chat'}</span>
                            {sel.key && sel.status === 'active' && sel.threads.length > 0 && (
                                <div className="ch-acts">
                                    <button type="button" onClick={() => togglePin(sel)} style={{ color: sel.pinned ? '#CC0000' : undefined }}><span className="ch-acts-i"><Ic n="pin" s={16} /></span>{sel.pinned ? 'Unpin' : 'Pin'}</button>
                                    <button type="button" onClick={() => leave('archive', sel)}><span className="ch-acts-i"><Ic n="archive" s={16} /></span>Archive</button>
                                    <button type="button" onClick={() => { if (window.confirm('Move this conversation to Trash? You can restore it later.')) leave('trash', sel); }}><span className="ch-acts-i"><Ic n="trash" s={16} /></span>Delete</button>
                                </div>
                            )}
                        </div>
                        {!sel.key && (
                            <>
                                <div className="ch-info-h">People<small>{people.length + 1}</small></div>
                                {people.map(([n, r]) => (<div key={n} className="ch-pp"><div className="ch-av sm pv">{initials(n)}</div><div><div>{n}</div><small>{r}</small></div></div>))}
                                <div className="ch-pp"><div className="ch-av sm">{auth?.user?.photo ? <img src={'/storage/' + auth.user.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : initials(auth?.user?.name)}</div><div><div>You</div><small>Volunteer</small></div></div>
                            </>
                        )}
                        <div className="ch-info-h">Shared files{sharedFiles.length > 0 ? <small>{sharedFiles.length}</small> : null}</div>
                        {sharedFiles.length === 0 ? <div className="ch-info-e">No files shared yet.</div> : sharedFiles.map((m) => (<a key={m.threadId + '-' + m.id} className="ch-sf" href={attUrl(m)} target="_blank" rel="noreferrer"><ChFileIcon m={m} /><span className="ch-sf-t"><span className="ch-sf-n">{m.attachment_name || 'File'}</span><small>{fmtDay(m.created_at)}</small></span></a>))}
                        <div className="ch-info-h">Shared pictures{sharedImgs.length > 0 ? <small>{sharedImgs.length}</small> : null}</div>
                        {sharedImgs.length === 0 ? <div className="ch-info-e">No pictures shared yet.</div> : (<div className="ch-grid">{sharedImgs.map((m) => (<a key={m.threadId + '-' + m.id} href={attUrl(m)} target="_blank" rel="noreferrer"><img src={attUrl(m)} alt={m.attachment_name || 'Picture'} /></a>))}</div>)}
                    </aside>
                )}
            </div>
        </VolunteerShell>
    );
}

// ch-ft-helper
function chFileKind(m) {
    const n = String((m && m.attachment_name) || '');
    const e = (n.indexOf('.') >= 0 ? n.split('.').pop() : '').toLowerCase();
    const mt = String((m && m.attachment_mime) || '');
    const lbl = (e || 'file').slice(0, 4).toUpperCase();
    if (e === 'pdf' || mt === 'application/pdf') return ['PDF', 'pdf'];
    if (e === 'doc' || e === 'docx') return [lbl, 'doc'];
    if (e === 'xls' || e === 'xlsx' || e === 'csv') return [lbl, 'xls'];
    if (e === 'ppt' || e === 'pptx') return [lbl, 'ppt'];
    if (e === 'zip' || e === 'rar' || e === '7z') return [lbl, 'zip'];
    if (mt.indexOf('video/') === 0) return ['VID', 'oth'];
    if (mt.indexOf('audio/') === 0) return ['AUD', 'oth'];
    return [lbl, 'oth'];
}
// ch-ft-helper-end
// ch-fi
function ChFileIcon({ m, sm }) {
    const k = chFileKind(m);
    const t = k[1];
    const w = sm ? 26 : 34;
    const h = sm ? 30 : 40;
    const page = (<><path d="M6 2h26l12 12v40H6z" fill="#fff" stroke="#B8C0CC" strokeWidth="1.5" strokeLinejoin="round" /><path d="M32 2v12h12" fill="#EEF1F5" stroke="#B8C0CC" strokeWidth="1.5" strokeLinejoin="round" /></>);
    const font = { fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700, fontStyle: 'normal' }; // ch-fi-paths
    let body;
    if (t === 'doc' || t === 'ppt') {
        const c = t === 'doc' ? '#2B579A' : '#D24726';
        body = (<>{page}<path d="M24 20h14M24 26h14M24 32h14M24 38h14M24 44h14" stroke="#9AA5B4" strokeWidth="2" strokeLinecap="round" /><rect x="1" y="16" width="26" height="26" rx="2" fill={c} />{t === 'doc' ? <path d="M6.5 22.5L9.8 35.5L14 26.5L18.2 35.5L21.5 22.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="butt" strokeLinejoin="miter" /> : <path d="M9.5 36.5V22h5.2a4.2 4.2 0 0 1 0 8.4H9.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="butt" strokeLinejoin="miter" />}</>);
    } else if (t === 'xls') {
        body = (<>{page}<rect x="24" y="20" width="20" height="7" fill="#CDEBD8" /><rect x="24" y="34" width="20" height="7" fill="#CDEBD8" /><g stroke="#4FA373" strokeWidth="1.2" fill="none"><path d="M24 20h20M24 27h20M24 34h20M24 41h20M24 48h20" /><path d="M31 16v34M38 16v34" /></g><rect x="1" y="16" width="26" height="26" rx="2" fill="#217346" /><path d="M7.5 22L20.5 36M20.5 22L7.5 36" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="butt" /></>);
    } else {
        const c = t === 'pdf' ? '#D93025' : (t === 'zip' ? '#7C3AED' : '#6B7280');
        const lbl = t === 'pdf' ? 'PDF' : k[0];
        body = (<>{page}<path d="M13 10h14M13 16h14M13 22h20" stroke="#C3CAD4" strokeWidth="2" strokeLinecap="round" /><rect x="1" y="27" width="46" height="18" fill={c} /><text x="24" y="40" textAnchor="middle" fontSize={lbl.length > 3 ? 10 : 13} fill="#fff" style={font}>{lbl}</text></>);
    }
    return (<svg className="ch-fi" width={w} height={h} viewBox="0 0 48 56" aria-hidden="true">{body}</svg>);
}
// ch-fi-end

// ch-voice
const chVoice = { mr: null, chunks: [], timer: null, cancel: false, t0: 0 };
// ch-player
function ChVoicePlayer({ src }) {
  const [a, setA] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const fmt = (s) => { const n = Math.max(0, Math.floor(s || 0)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
  const ok = isFinite(dur) && dur > 0;
  const pct = ok ? Math.min(100, (cur / dur) * 100) : 0;
  const bars = Array.from({ length: 28 }).map((_, i) => 25 + Math.round(Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 75));
  const toggle = () => { if (!a) return; if (a.paused) a.play(); else a.pause(); };
  const seek = (e) => { if (!a || !ok) return; const r = e.currentTarget.getBoundingClientRect(); a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur; };
  return (
    <div className="ch-pl">
      <audio ref={setA} src={src} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setCur(0); }} onTimeUpdate={(e) => setCur(e.target.currentTime)} onLoadedMetadata={(e) => setDur(e.target.duration)} onDurationChange={(e) => setDur(e.target.duration)} />
      <button type="button" className="ch-pl-b" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle}>
        {playing
          ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1" /><rect x="14" y="4" width="5" height="16" rx="1" /></svg>)
          : (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>)}
      </button>
      <div className="ch-pl-w" onClick={seek}>
        {bars.map((h, i) => (<i key={i} className={(i / bars.length) * 100 < pct ? 'on' : ''} style={{ height: h + '%' }} />))}
      </div>
      <span className="ch-pl-t">{playing || cur > 0 ? fmt(cur) : (ok ? fmt(dur) : '0:00')}</span>
    </div>
  );
}
// ch-player-end
// ch-voice-end