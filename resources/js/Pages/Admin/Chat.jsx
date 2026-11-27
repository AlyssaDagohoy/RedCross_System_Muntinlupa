import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AdminShell from '../../Components/AdminShell';

const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDay = (d) => new Date(d).toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric', month: 'short' });
const dayKey = (d) => new Date(d).toDateString();
const initials = (n) => (n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const IC = {
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
    pin: 'M12 17v5M9 3h6l-1 7 3 3H7l3-3-1-7z',
    archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
    trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
    back: 'M15 18l-6-6 6-6',
    restore: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
    close: 'M18 6 6 18M6 6l12 12', panel: 'M3 5h18v14H3zM15 5v14', inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z', history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2', speaker: 'M3 10v4h4l5 4V6L7 10zM16 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13',
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
/*admin-extra*/
.ch-ud{display:inline-block;width:8px;height:8px;border-radius:50%;background:#CC0000}
.ch-as{display:flex;align-items:center;gap:8px;padding:6px 14px;border-top:1px solid #ebebeb;font-size:12px;color:#777;flex-shrink:0}
.ch-as input{border:1px solid #e5e5e5;border-radius:8px;padding:4px 8px;font-size:12.5px;font-family:inherit;outline:none;width:190px}
.ch-as input:focus{border-color:#CC0000}
.ch-wrap{height:calc((100vh - 70px)/.88)}
.an-wrap.an-wrap{grid-template-columns:minmax(0,296px) minmax(0,1fr);height:calc(100vh - 132px)}
.an-list{display:flex;flex-direction:column;overflow:hidden}
@media (max-width:760px){.ch-wrap{height:calc((100vh - 150px)/.88)}.an-wrap.an-wrap{grid-template-columns:1fr}.an-wrap.an-wrap .ch-fold{display:none}.an-list{padding-left:0!important}}
`;

const threadMessages = (t) => {
    if (Array.isArray(t.messages) && t.messages.length > 0) return t.messages.map((m) => ({ ...m, threadId: t.id }));
    const list = [{ sender_type: 'volunteer', body: t.message, created_at: t.created_at, threadId: t.id }];
    if (t.reply) list.push({ sender_type: 'admin', body: t.reply, created_at: t.replied_at || t.created_at, threadId: t.id });
    return list;
};

const TABS = [['inbox', 'Inbox'], ['pinned', 'Pinned'], ['history', 'History'], ['archive', 'Archive'], ['trash', 'Trash']];
const FOLD = [['inbox', 'Inbox', 'inbox'], ['pinned', 'Pinned', 'pin'], ['history', 'History', 'history'], ['archive', 'Archive', 'archive'], ['trash', 'Trash', 'trash'], ['announcements', 'Announcements', 'speaker']];
const opts = { preserveScroll: true, preserveState: true };

export default function AdminChat({ messages = [], announcements = [], volunteers = [], staff: _oldStaff = [], groupChat = {} }) {
    const staff = [];
    const [tab, setTab] = useState('inbox');
    const [annTitle, setAnnTitle] = useState('');
    const [annBody, setAnnBody] = useState('');
    const [annBusy, setAnnBusy] = useState(false);
    const [annErr, setAnnErr] = useState({});
    const [annOpen, setAnnOpen] = useState(null);
    const [annView, setAnnView] = useState('active');
    const [annEdit, setAnnEdit] = useState(false);
    const [annEt, setAnnEt] = useState('');
    const [annEb, setAnnEb] = useState('');
    const [annMenu, setAnnMenu] = useState(null);
    const [srchOpen, setSrchOpen] = useState(false);
    useEffect(() => { const c = () => setSrchOpen(false); const k = (e) => { if (e.key === 'Escape') setSrchOpen(false); }; window.addEventListener('click', c); window.addEventListener('keydown', k); return () => { window.removeEventListener('click', c); window.removeEventListener('keydown', k); }; }, []);
    const [rowMenu, setRowMenu] = useState(null);
    useEffect(() => { const c = () => setRowMenu(null); const k = (e) => { if (e.key === 'Escape') setRowMenu(null); }; window.addEventListener('click', c); window.addEventListener('keydown', k); return () => { window.removeEventListener('click', c); window.removeEventListener('keydown', k); }; }, []);
    useEffect(() => { const c = () => setAnnMenu(null); window.addEventListener('click', c); return () => window.removeEventListener('click', c); }, []);
    const chLastA = useRef(null); const chClear = () => { chLastA.current = null; try { window.sessionStorage.removeItem('ch-sel-admin'); } catch (e) { } };
    const [selectedId, setSelectedId] = useState(() => { try { return window.sessionStorage.getItem('ch-sel-admin') || null; } catch (e) { return null; } });
    useEffect(() => { try { if (selectedId) { window.sessionStorage.setItem('ch-sel-admin', selectedId); chLastA.current = selectedId; } } catch (e) { } }, [selectedId]);
    const [expanded, setExpanded] = useState(false);
    const [text, setText] = useState('');
    const [q, setQ] = useState('');
    const [sending, setSending] = useState(false);
    const [file, setFile] = useState(null);
    const [filter, setFilter] = useState('all');
    const [info, setInfo] = useState(() => { try { return window.localStorage.getItem('ch-info-admin') === '1'; } catch (e) { return false; } });
    useEffect(() => { try { window.localStorage.setItem('ch-info-admin', info ? '1' : '0'); } catch (e) { } }, [info]);
    const staffPhotos = usePage().props.staffPhotos || {}; const isSuperAdmin = !!usePage().props.isSuperAdmin; const prof = usePage().props.adminProfile; const [asNameState, setAsName] = useState(() => { try { return sessionStorage.getItem('rc_admin_name') || ''; } catch { return ''; } }); const asName = prof || asNameState;
    const changeName = (v) => { setAsName(v); try { sessionStorage.setItem('rc_admin_name', v); } catch {} };
    const scrollRef = useRef(null); const [gOpen, setGOpen] = useState(false); const [gName, setGName] = useState(''); const [gFile, setGFile] = useState(null); const [gSaving, setGSaving] = useState(false);
    const saveGroup = () => { const nm = gName.trim(); if (!nm) { window.alert('Type a group name.'); return; } setGSaving(true); router.post(route('admin.communication.group'), { name: nm, picture: gFile }, { ...opts, forceFormData: true, onSuccess: () => { setGOpen(false); setGFile(null); }, onError: (e) => window.alert(Object.values(e).join(' | ')), onFinish: () => setGSaving(false) }); };
    const [draft, setDraft] = useState(null); const [renaming, setRenaming] = useState(null); const [closedAdm, setClosedAdm] = useState({});
    const fullLabel = (n) => { const nm = (n || '').trim(); return nm ? (/^admin\b/i.test(nm) ? nm : 'Admin ' + nm) : ''; };
    const renameSender = (m) => { setRenaming((r) => (r && r.id === m.id ? null : m)); };
    const pickName = (m, s) => { router.patch(route('admin.communication.relabel', m.id), { admin_label: fullLabel(s).slice(0, 60) }, opts); setRenaming(null); };
    const markedRef = useRef('');
    const today = new Date().toDateString();

    // live-poll: refresh messages every 5 seconds (only while this tab is visible)
    useEffect(() => {
        const id = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            router.reload({ only: ['messages', 'groupChat'], preserveScroll: true, preserveState: true });
        }, 5000);
        return () => clearInterval(id);
    }, []);

    const convsBase = useMemo(() => {
        const byUser = {};
        messages.forEach((t) => {
            if (t.admin_inbox_status === 'purged') return;
            if (!t.chat_key) return;
            (byUser[t.user_id + '|' + (t.chat_key || '')] ||= { id: t.user_id + '|' + (t.chat_key || ''), userId: t.user_id, key: t.chat_key || '', user: t.user, threads: [] }).threads.push(t);
        });
        return Object.values(byUser).map((c) => {
            const msgs = c.threads.flatMap(threadMessages).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const sts = c.threads.map((t) => t.admin_inbox_status);
            const status = sts.includes('active') ? 'active' : sts.includes('archived') ? 'archived' : 'trashed';
            const newest = [...c.threads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            return { ...c, msgs, status, newest, pinned: c.threads.some((t) => t.admin_starred_at), unread: c.threads.some((t) => t.admin_unread), last: msgs[msgs.length - 1] };
        }).sort((a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0));
    }, [messages]);

    // Shared group chat: one chat for everybody (messages come from groupChat.messages)
    const gcAll = useMemo(() => (groupChat?.messages || []).map((m) => ({ ...m, threadId: 'g' })), [groupChat]);
    const myKey = (asName || '').trim();
    const meLabel = 'Admin ' + (myKey || (asName || '').trim());
    const gcReadAt = groupChat?.readAt ? new Date(groupChat.readAt).getTime() : 0;
    const gcUnread = gcAll.some((m) => !(m.sender_type === 'admin' && m.label === meLabel) && dayKey(m.created_at) === today && new Date(m.created_at).getTime() > gcReadAt);
    const convs = useMemo(() => {
        const base = { gc: true, userId: null, key: '', user: { name: groupChat?.name || 'Group chat', email: '' }, threads: [], status: 'active', pinned: false, newest: { id: null, created_at: new Date(0).toISOString(), admin_starred_at: null } };
        const byDay = {};
        gcAll.forEach((m) => { const dk = dayKey(m.created_at); if (dk !== today) (byDay[dk] ||= []).push(m); });
        const days = Object.keys(byDay).map((dk) => ({ ...base, id: '|day|' + dk, day: dk, msgs: byDay[dk], unread: false, last: byDay[dk][byDay[dk].length - 1] })).reverse();
        return [...convsBase, { ...base, id: '|group', msgs: gcAll, unread: gcUnread, last: gcAll[gcAll.length - 1] }, ...days];
    }, [convsBase, gcAll, gcUnread, groupChat]);

    const isToday = (c) => !!c.last && dayKey(c.last.created_at) === today;
    const inToday = (c) => c.status === 'active' && (isToday(c) || c.unread);
    const match = (c) => {
        if (tab === 'inbox' && ((filter === 'unread' && !c.unread) || (filter === 'private' && !c.key) || (filter === 'groups' && !!c.key))) return false;
        const s = ''; // the list no longer filters while typing; search lives in the popup
        if (prof && c.key && c.key.toLowerCase() !== prof.toLowerCase()) return false; return !s || s.split(/\s+/).every((w) => (c.user?.name || '').toLowerCase().includes(w)) || (c.last?.body || '').toLowerCase().includes(s);
    };
    const list = convs.filter((c) => {
        if (!match(c)) return false;
        if (tab === 'inbox') return c.status === 'active' && (c.pinned || inToday(c) || (c.gc && !c.day));
        if (tab === 'pinned') return c.pinned && c.status === 'active';
        if (tab === 'history') return c.status === 'active' && (!!c.day || (!c.gc && !inToday(c) && !c.pinned));
        return c.status === (tab === 'archive' ? 'archived' : 'trashed');
    });
    const pinnedRows = tab === 'inbox' ? list.filter((c) => c.pinned) : [];
    const restRows = tab === 'inbox' ? list.filter((c) => !c.pinned) : list;
    const inboxUnread = convs.filter((c) => inToday(c) && c.unread).length;
    const newPeople = false
        ? volunteers.filter((v) => !convs.some((c) => c.userId === v.id && !c.gc && (c.key || '').toLowerCase() === myKey.toLowerCase()) && q.trim().toLowerCase().split(/\s+/).every((w) => (v.name || '').toLowerCase().includes(w))).slice(0, 20)
        : [];

    const realSel = convs.find((c) => c.id === selectedId) || null;
    const sel = realSel || (draft ? { id: draft.id, draft: true, userId: draft.userId, key: draft.key || '', user: { id: draft.userId, name: draft.name }, threads: [], msgs: [], status: 'active', newest: { id: null, created_at: new Date().toISOString(), admin_starred_at: null }, pinned: false, unread: false, last: null } : null);

    useEffect(() => {
        if (draft && convs.some((c) => c.id === draft.id)) { setSelectedId(draft.id); setDraft(null); }
    }, [convs, draft]);
    useEffect(() => { if (selectedId !== null) setDraft(null); }, [selectedId]);
    const todayMsgs = sel ? sel.msgs.filter((m) => dayKey(m.created_at) === today) : [];
    const showAll = !sel || expanded || (todayMsgs.length === 0 && !sel.gc && sel.last?.sender_type === 'volunteer') || !['inbox', 'pinned'].includes(tab);
    const shown = sel ? (showAll ? sel.msgs : todayMsgs) : [];
    const earlier = sel ? sel.msgs.length - todayMsgs.length : 0;

    const gcMarked = useRef('');
    useEffect(() => {
        if (!sel || !sel.gc || sel.day || !gcUnread) return;
        const k = String(gcAll[gcAll.length - 1]?.id || '');
        if (gcMarked.current === k) return;
        gcMarked.current = k;
        router.post(route('groupchat.read'), {}, opts);
    }, [sel?.id, gcUnread, gcAll.length]);
    useEffect(() => { setExpanded(false); setText(''); }, [selectedId]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [sel?.id, shown.length]);

    useEffect(() => {
        if (!sel || !sel.unread) return;
        const key = sel.id + ':' + (sel.last?.created_at || '');
        if (markedRef.current === key) return;
        markedRef.current = key;
        const ids = sel.threads.filter((t) => t.admin_unread).map((t) => t.id);
        if (ids.length) router.post(route('admin.communication.read'), { ids, read: true }, opts);
    }, [sel?.id, sel?.unread, sel?.last?.created_at]);

    const batch = (name, c) => router.post(route('admin.communication.' + name), { ids: c.threads.map((t) => t.id), box: 'inbox' }, opts);
    const seq = (urls) => {
        if (!urls.length) return;
        const [u, ...rest] = urls;
        router.post(u, {}, { ...opts, onFinish: () => seq(rest) });
    };
    const togglePin = (c) => seq(c.threads.filter((t) => !!t.admin_starred_at === c.pinned).map((t) => route('admin.communication.star', t.id)));
    const leave = (name, c) => { batch(name, c); chClear(); setSelectedId(null); };
    const purge = (c) => { if (window.confirm('Delete this conversation forever?')) leave('purge', c); };
    const popPeople = q.trim() ? volunteers.filter((v) => q.trim().toLowerCase().split(/\s+/).every((w) => (v.name || '').toLowerCase().includes(w))).slice(0, 20) : [];
    const pickPerson = (v) => {
        setSrchOpen(false);
        if (!myKey) { window.alert('Choose your name in "Replying as" first, so the private chat is with the right person.'); return; }
        const ex = convs.find((c) => c.userId === v.id && !c.gc && !c.day && (c.key || '').toLowerCase() === myKey.toLowerCase());
        if (ex) {
            setTab(ex.status === 'archived' ? 'archive' : ex.status === 'trashed' ? 'trash' : 'inbox');
            setSelectedId(ex.id);
        } else {
            setTab('inbox');
            setDraft({ id: v.id + '|' + myKey, userId: v.id, name: v.name, key: myKey });
            setSelectedId(null);
        }
        setQ('');
    };
    const openRowMenu = (e, c) => { if (c.gc || c.draft) return; e.preventDefault(); setRowMenu({ id: c.id, x: e.clientX, y: e.clientY }); };
    const rowAct = (k, c) => {
        setRowMenu(null);
        if (k === 'pin') { togglePin(c); return; }
        if (k === 'purge' && !window.confirm('Delete this conversation forever?')) return;
        batch(k, c);
        if (selectedId === c.id) { chClear(); setSelectedId(null); }
    };
    const rowItems = (c) => (c.status === 'active' ? [[c.pinned ? 'Unpin' : 'Pin', 'pin'], ['Archive', 'archive'], ['Move to trash', 'trash', true]] : c.status === 'archived' ? [['Restore', 'restore'], ['Move to trash', 'trash', true]] : [['Restore', 'restore'], ...(isSuperAdmin ? [['Delete forever', 'purge', true]] : [])]);

    const startPrivate = () => {
        const nm = asName.trim();
        if (!nm) { window.alert('Choose your name in "Replying as" first, so the private chat is with the right person.'); return; }
        const id = sel.userId + '|' + nm;
        if (convs.some((c) => c.id === id)) { setSelectedId(id); return; }
        setDraft({ id, userId: sel.userId, name: sel.user?.name, key: nm });
        setSelectedId(null);
    };

    // ch-vh
    const [recSec, setRecSec] = useState(-1);
    const chVStop = (go) => { chVoice.cancel = !go; if (chVoice.mr && chVoice.mr.state !== 'inactive') chVoice.mr.stop(); else setRecSec(-1); };
    const chVStart = async () => {
        if (recSec >= 0 || sending) return;
        if (sel && sel.draft) { window.alert('Send a text message first to start the conversation. You can send a voice message after.'); return; }
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
    const send = (vf0) => {
        const vf = vf0 instanceof File ? vf0 : null;
        const body = text.trim();
        if ((!body && !file && !vf) || !sel || sending) return;
        if (sel.draft && !body) { window.alert('Type a message to start the conversation. You can attach files after.'); return; }
        const nm = sel.key ? sel.key : (staff.length > 0 ? (staff.find((s) => s.toLowerCase() === asName.trim().toLowerCase()) || '') : asName.trim());
        if (!nm) { window.alert('Choose your name in "Replying as" first, so the volunteer knows who answered.'); return; }
        const label = /^admin\b/i.test(nm) ? nm : 'Admin ' + nm;
        setSending(true);
        router.post(sel.gc ? route('groupchat.send') : sel.draft ? route('admin.communication.start') : route('admin.communication.reply', sel.newest.id), sel.gc ? { body, admin_label: label, attachment: vf || file } : sel.draft ? { user_id: sel.userId, message: body, admin_label: label, chat_key: sel.key || '' } : { reply: body, admin_label: label, attachment: vf || file }, {
            ...opts,
            onSuccess: () => { setText(''); setFile(null); setTab('inbox'); },
            onError: (e) => { console.error(e); window.alert('Hindi na-send: ' + Object.values(e).join(' | ')); },
            onFinish: () => setSending(false),
        });
    };

    const renderRow = (c, mode) => {
        const last = c.last;
        const who = c.gc ? (last ? (last.label || 'Someone') + ': ' : '') : last?.sender_type === 'admin' ? (last.admin_label || last.admin?.name || 'Admin') + ': ' : '';
        return (
            <button onContextMenu={(e) => openRowMenu(e, c)} key={c.id} type="button" onClick={() => setSelectedId(c.id)} className={'ch-row' + (c.id === selectedId ? ' on' : '') + (c.unread ? ' unread' : '')}>
                <div className={'ch-av' + (c.key ? ' pv' : '')}>{!c.key && groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials(c.user?.name)}</div>
                <div className="ch-rt">
                    <div className="ch-rn">{!c.key ? (groupChat?.name || 'Group chat') + (c.day && c.last ? ' \u00b7 ' + fmtDay(c.last.created_at) : '') : (c.user?.name || 'Volunteer') + (mode === 'g' ? '' : ' (private: ' + c.key + ')')}</div>
                    <div className="ch-rp">{['inbox', 'pinned'].includes(tab) && !c.day && !c.unread && !isToday(c) && (c.gc || last?.sender_type !== 'volunteer') ? 'No messages today' : <>{who}{last?.body}</>}</div>
                </div>
                <div className="ch-rm">
                    <span>{last && !(['inbox', 'pinned'].includes(tab) && !c.day && !c.unread && !isToday(c) && (c.gc || last?.sender_type !== 'volunteer')) ? (dayKey(last.created_at) === today ? fmtTime(last.created_at) : fmtDay(last.created_at)) : ''}</span>
                    {c.unread ? <span className="ch-ud" /> : c.pinned ? <Ic n="pin" s={12} /> : null}
                </div>
            </button>
        );
    };

    const attUrl = (m) => (m.threadId === 'g' ? route('groupchat.attachment', m.id) : route('admin.communication.attachment', m.id));
    const atts = sel ? [...sel.msgs].filter((m) => m.attachment_path && m.id != null).reverse() : [];
    const sharedImgs = atts.filter((m) => (m.attachment_mime || '').startsWith('image/'));
    const sharedFiles = atts.filter((m) => !(m.attachment_mime || '').startsWith('image/'));
    const people = sel ? (() => { const seen = {}; sel.msgs.forEach((m) => { const adm = m.sender_type === 'admin'; const n = adm ? (m.label || m.admin_label || m.admin?.name || 'Red Cross Admin') : (m.label || sel.user?.name || 'Volunteer'); if (!seen[n]) seen[n] = adm ? 'Admin' : 'Volunteer'; }); return Object.entries(seen); })() : [];
    const showInfo = info && !!sel;
    const annCount = announcements.filter((a) => !a.deleted_at && !a.archived_at).length;
    const meName = prof ? prof : (asName.trim() ? fullLabel(asName) : 'Red Cross Admin');
    const pickFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const lim = f.type.startsWith('image/') ? 5 : f.type.startsWith('video/') ? 50 : 10; if (f.size / 1048576 > lim) { window.alert('File too large. Limits: pictures 5 MB, videos 50 MB, PDF 10 MB.'); return; } setFile(f); };
    const rail = (
        <div className="ch-fold">
            {FOLD.map(([id, label, icon]) => { const n = id === 'inbox' ? inboxUnread : id === 'announcements' ? annCount : 0; return (
                <button key={id} type="button" title={label} aria-label={label} className={'ch-fb' + (tab === id ? ' on' : '')} onClick={() => { setTab(id); if (id === 'announcements') setSelectedId(null); else if (!selectedId && chLastA.current) setSelectedId(chLastA.current); }}><Ic n={icon} s={17} />{n > 0 ? <em>{n}</em> : null}</button>); })}
        </div>
    );

    let prevDay = '';
    return (
        <AdminShell active="communication" title="Communication">
            <style>{CSS}</style>

            {tab === 'announcements' && (() => {
                const st = (a) => (a.deleted_at ? 'trash' : a.archived_at ? 'arc' : 'active');
                const cnt = (k) => announcements.filter((a) => st(a) === k).length;
                const rows = announcements.filter((a) => st(a) === annView).sort((a, b) => (b.pinned_at ? 1 : 0) - (a.pinned_at ? 1 : 0));
                const cur = announcements.find((a) => a.id === annOpen) || null;
                const R = (n, id) => route('admin.communication.announcement.' + n, id);
                const act = (k, a) => {
                    setAnnMenu(null);
                    const o = { preserveScroll: true };
                    if (k === 'pin') router.post(R('pin', a.id), {}, o);
                    else if (k === 'edit') { setAnnOpen(a.id); setAnnEdit(true); setAnnEt(a.title); setAnnEb(a.body); setAnnErr({}); }
                    else if (k === 'archive') { router.post(R('archive', a.id), {}, o); if (annOpen === a.id) setAnnOpen(null); }
                    else if (k === 'delete') { router.delete(R('delete', a.id), o); if (annOpen === a.id) setAnnOpen(null); }
                    else if (k === 'restore') { router.post(R('restore', a.id), {}, o); if (annOpen === a.id) setAnnOpen(null); }
                    else if (k === 'purge') { if (window.confirm("Delete this announcement forever? This can't be undone.")) { router.delete(R('purge', a.id), o); if (annOpen === a.id) setAnnOpen(null); } }
                };
                const menuFor = (a) => {
                    const s = st(a);
                    if (s === 'active') return [[a.pinned_at ? 'Unpin' : 'Pin', 'pin'], ['Edit', 'edit'], ['Archive', 'archive'], ['Delete', 'delete', true]];
                    if (s === 'arc') return [['Unarchive', 'archive'], ['Delete', 'delete', true]];
                    return [['Restore', 'restore'], ['Delete forever', 'purge', true]];
                };
                const menuAnn = annMenu ? announcements.find((a) => a.id === annMenu.id) : null;
                const back = <button type="button" className="an-back" onClick={() => { setAnnOpen(null); setAnnEdit(false); }}>{'\u2190'} Back</button>;
                const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px' };
                const redBtn = (dis) => ({ padding: '8px 14px', border: 'none', borderRadius: '8px', background: '#CC0000', color: '#fff', fontWeight: 600, fontSize: '12.5px', fontFamily: 'inherit', cursor: 'pointer', opacity: dis ? 0.5 : 1 });
                return (
                    <div className={'an-wrap' + (annOpen !== null ? ' open' : '')}>
                        <style>{`.an-wrap{position:relative;display:grid;grid-template-columns:minmax(0,250px) minmax(0,1fr);border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;background:#fff;height:calc(100vh - 220px);min-height:420px}.an-list{border-right:1px solid #eee;overflow-y:auto}.an-new{display:block;width:calc(100% - 20px);margin:10px;padding:7px 10px;border:none;border-radius:8px;background:#CC0000;color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer}.an-new:hover{background:#b30000}.an-seg{display:flex;gap:12px;padding:0 14px 8px}.an-seg button{border:none;background:none;padding:0 0 3px;font-family:inherit;font-size:12px;color:#999;cursor:pointer;border-bottom:2px solid transparent}.an-seg button.on{color:#222;border-bottom-color:#CC0000}.an-row{display:block;width:100%;text-align:left;background:transparent;border:none;border-top:1px solid #eee;padding:9px 14px;cursor:pointer;font-family:inherit}.an-row:hover{background:#fafafa}.an-row.on{background:#fafafa;box-shadow:inset 3px 0 0 #CC0000}.an-view{padding:20px 24px;overflow-y:auto}.an-empty{display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:13px}.an-back{display:none;margin-bottom:10px;border:none;background:none;color:#CC0000;cursor:pointer;font-family:inherit;font-size:12.5px;padding:0}.an-menu{position:absolute;z-index:5;min-width:160px;background:#fff;border:1px solid #ddd;border-radius:10px;padding:4px;box-shadow:0 6px 18px rgba(0,0,0,.12)}.an-menu button{display:block;width:100%;border:none;background:transparent;border-radius:6px;padding:7px 10px;font-family:inherit;font-size:12.5px;color:#222;cursor:pointer;text-align:left}.an-menu button:hover{background:#f4f4f4}.an-note{font-size:12px;color:#666;background:#f6f6f6;border-radius:8px;padding:8px 10px;margin:0 0 12px}@media(max-width:700px){.an-wrap{grid-template-columns:1fr}.an-back{display:inline-block}.an-wrap.open .an-list{display:none}.an-wrap:not(.open) .an-view{display:none}.an-view{padding:16px}}`}</style>
                        <div className="an-list">
                            {rail}
                            <div className="ch-ttl">Announcements</div>
                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                            <button type="button" className="an-new" onClick={() => { setAnnOpen('new'); setAnnEdit(false); setAnnErr({}); }}>+ New announcement</button>
                            <div className="an-seg">
                                <button type="button" className={annView === 'active' ? 'on' : ''} onClick={() => { setAnnView('active'); setAnnOpen(null); }}>Active</button>
                                <button type="button" className={annView === 'arc' ? 'on' : ''} onClick={() => { setAnnView('arc'); setAnnOpen(null); }}>{'Archived (' + cnt('arc') + ')'}</button>
                                <button type="button" className={annView === 'trash' ? 'on' : ''} onClick={() => { setAnnView('trash'); setAnnOpen(null); }}>{'Trash (' + cnt('trash') + ')'}</button>
                            </div>
                            {rows.length === 0 && <div style={{ padding: '20px 14px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>{annView === 'trash' ? 'Trash is empty.' : annView === 'arc' ? 'Nothing archived.' : 'No announcements.'}</div>}
                            {rows.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    className={'an-row' + (a.id === annOpen ? ' on' : '')}
                                    onClick={() => { setAnnOpen(a.id); setAnnEdit(false); }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        const r = e.currentTarget.closest('.an-wrap').getBoundingClientRect();
                                        setAnnMenu({ id: a.id, x: Math.min(e.clientX - r.left, r.width - 170), y: Math.min(e.clientY - r.top, r.height - 170) });
                                    }}
                                >
                                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#222', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {a.pinned_at && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: '-1px' }}><path d="M12 17v5M9 3h6l-1 6 3 3H7l3-3z" /></svg>}
                                        {a.title}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>{fmtDay(a.created_at)}</div>
                                    <div style={{ fontSize: '11.5px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(a.body || '').replace(/\s+/g, ' ')}</div>
                                </button>
                            ))}
                            </div>
                        </div>
                        <div className="an-view">
                            {annOpen === 'new' ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (annBusy) return;
                                        router.post(route('admin.communication.announce'), { title: annTitle, body: annBody }, {
                                            preserveScroll: true,
                                            onStart: () => { setAnnBusy(true); setAnnErr({}); },
                                            onSuccess: () => { setAnnTitle(''); setAnnBody(''); setAnnOpen(null); },
                                            onError: (er) => setAnnErr(er),
                                            onFinish: () => setAnnBusy(false),
                                        });
                                    }}
                                >
                                    {back}
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#222', marginBottom: '3px' }}>New announcement</div>
                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '14px' }}>Sends a notification and an email to every approved volunteer.</div>
                                    <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title" aria-label="Announcement title" style={{ ...inp, marginBottom: '4px' }} />
                                    {annErr.title && <div style={{ color: '#CC0000', fontSize: '12px', marginBottom: '6px' }}>{annErr.title}</div>}
                                    <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="Write the announcement here." aria-label="Announcement body" rows={9} style={{ ...inp, marginTop: '6px', resize: 'vertical' }} />
                                    {annErr.body && <div style={{ color: '#CC0000', fontSize: '12px', marginTop: '2px' }}>{annErr.body}</div>}
                                    <div style={{ marginTop: '10px' }}>
                                        <button type="submit" disabled={annBusy || !annTitle.trim() || !annBody.trim()} style={redBtn(annBusy || !annTitle.trim() || !annBody.trim())}>{annBusy ? 'Posting...' : 'Post to all volunteers'}</button>
                                    </div>
                                </form>
                            ) : cur && annEdit && st(cur) === 'active' ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        router.patch(R('update', cur.id), { title: annEt, body: annEb }, { preserveScroll: true, onSuccess: () => setAnnEdit(false), onError: (er) => setAnnErr(er) });
                                    }}
                                >
                                    {back}
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#222', marginBottom: '10px' }}>Edit announcement</div>
                                    <div className="an-note">Saving changes the text only. Volunteers are not notified again.</div>
                                    <input value={annEt} onChange={(e) => setAnnEt(e.target.value)} aria-label="Announcement title" style={{ ...inp, marginBottom: '4px' }} />
                                    {annErr.title && <div style={{ color: '#CC0000', fontSize: '12px', marginBottom: '6px' }}>{annErr.title}</div>}
                                    <textarea value={annEb} onChange={(e) => setAnnEb(e.target.value)} aria-label="Announcement body" rows={9} style={{ ...inp, marginTop: '6px', resize: 'vertical' }} />
                                    {annErr.body && <div style={{ color: '#CC0000', fontSize: '12px', marginTop: '2px' }}>{annErr.body}</div>}
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                        <button type="submit" disabled={!annEt.trim() || !annEb.trim()} style={redBtn(!annEt.trim() || !annEb.trim())}>Save changes</button>
                                        <button type="button" onClick={() => setAnnEdit(false)} style={{ padding: '8px 14px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', color: '#333', fontSize: '12.5px', fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                </form>
                            ) : cur ? (
                                <div>
                                    {back}
                                    {st(cur) === 'trash' && <div className="an-note">This announcement is in Trash. Right-click the row to restore it.</div>}
                                    <div style={{ fontSize: '17px', fontWeight: 600, color: '#222', marginBottom: '4px', lineHeight: 1.3 }}>{cur.title}</div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>{fmtDay(cur.created_at)}{cur.admin?.name ? ' \u00b7 ' + cur.admin.name : ''}</div>
                                    <div style={{ borderTop: '1px solid #eee', margin: '14px 0' }} />
                                    <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#222', whiteSpace: 'pre-wrap' }}>{cur.body}</div>
                                </div>
                            ) : (
                                <div className="an-empty">Pick an announcement to read.</div>
                            )}
                        </div>
                        {annMenu && menuAnn && (
                            <div className="an-menu" style={{ left: annMenu.x, top: annMenu.y }} onClick={(e) => e.stopPropagation()}>
                                {menuFor(menuAnn).map(([label, kind, danger]) => (
                                    <button key={kind} type="button" style={danger ? { color: '#CC0000' } : undefined} onClick={() => act(kind, menuAnn)}>{label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
            {rowMenu && (() => { const mc = convs.find((x) => x.id === rowMenu.id); if (!mc) return null; return (
                <div role="menu" onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', zIndex: 50, left: Math.min(rowMenu.x, window.innerWidth - 180), top: Math.min(rowMenu.y, window.innerHeight - 140), minWidth: 160, background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 4, boxShadow: '0 6px 18px rgba(0,0,0,.12)' }}>
                    {rowItems(mc).map(([label, kind, danger]) => (
                        <button key={kind} type="button" role="menuitem" onClick={() => rowAct(kind, mc)} style={{ display: 'block', width: '100%', border: 'none', background: 'transparent', borderRadius: 6, padding: '7px 10px', fontFamily: 'inherit', fontSize: '12.5px', color: danger ? '#CC0000' : '#222', cursor: 'pointer', textAlign: 'left' }}>{label}</button>
                    ))}
                </div>
            ); })()}
            <div className={'ch-wrap' + (showInfo ? ' info' : '')} style={tab === 'announcements' ? { display: 'none' } : undefined}>
                <div className={'ch-list' + (sel ? ' hide-m' : '')}>
                    <div className="ch-me"><div className="ch-me-w"><div className="ch-av">{prof && staffPhotos[prof] ? <img src={'/storage/' + staffPhotos[prof]} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : initials(prof || asName || 'Admin')}</div><span className="ch-dot" title="Online" /></div><div style={{ minWidth: 0 }}><div className="ch-me-n">{meName}</div><div className="ch-me-s">Admin</div></div></div>
                    <div className="ch-ttl">{tab === 'inbox' ? 'Chats' : (FOLD.find((f) => f[0] === tab) || ['', ''])[1]}</div>
                    {rail}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <label className="ch-search"><Ic n="search" s={14} /><input value={q} onChange={(e) => { setQ(e.target.value); setSrchOpen(true); }} onFocus={() => setSrchOpen(true)} placeholder="Search volunteers" aria-label="Search volunteers" /></label>
                        {srchOpen && q.trim() && (
                            <div role="listbox" style={{ position: 'absolute', zIndex: 40, top: '100%', left: 32, right: 10, marginTop: 4, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 3, maxHeight: 220, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,.10)' }}>
                                {popPeople.length === 0 ? (
                                    <div style={{ padding: '10px 12px', fontSize: '12px', color: '#999' }}>No volunteers found</div>
                                ) : popPeople.map((v) => (
                                    <button key={'pp' + v.id} type="button" role="option" className="ch-row" onClick={() => pickPerson(v)} style={{ borderRadius: 9, padding: '5px 8px', gap: 8 }}>
                                        <span className="ch-av" style={{ width: 24, height: 24, minWidth: 24, fontSize: 10 }}>{initials(v.name)}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#222' }}>{v.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {tab === 'inbox' && (<div className="ch-chips">{[['all', 'All'], ['unread', 'Unread'], ['private', 'Private'], ['groups', 'Group']].map(([k, l]) => (<button key={k} type="button" className={'ch-chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>))}</div>)}
                    <div className="ch-ls">
                    {newPeople.length > 0 && (
                        <>
                            <div className="ch-sec">Start a new conversation</div>
                            {newPeople.map((v) => (
                                <button key={'new' + v.id} type="button" className={'ch-row' + (draft && draft.id === v.id + '|' + myKey ? ' on' : '')} onClick={() => { if (!myKey) { window.alert('Choose your name in "Replying as" first, so the private chat is with the right person.'); return; } setDraft({ id: v.id + '|' + myKey, userId: v.id, name: v.name, key: myKey }); setSelectedId(null); }}>
                                    <span className="ch-av">{initials(v.name)}</span>
                                    <span className="ch-rt"><span className="ch-rn" style={{ display: 'block' }}>{v.name}</span><span className="ch-rp" style={{ display: 'block' }}>No messages yet</span></span>
                                </button>
                            ))}
                        </>
                    )}
                    {list.length === 0 && newPeople.length === 0 && (
                        <div className="ch-empty">{tab === 'inbox' ? 'No messages today. Older conversations are in History.' : 'Nothing here yet.'}</div>
                    )}
                    {pinnedRows.length > 0 && <div className="ch-sec">Pinned</div>}
                    {pinnedRows.map(renderRow)}
                    {restRows.some((c) => !c.key) && <><div className="ch-sec" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span>Group</span><button type="button" onClick={() => { setGName(groupChat?.name || ''); setGFile(null); setGOpen((o) => !o); }} style={{ border: 'none', background: 'none', color: '#CC0000', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', padding: 0 }}>Edit group</button></div>{gOpen && (<div style={{ margin: '4px 12px 10px', padding: '10px', border: '1px solid #e5e5e5', borderRadius: '10px', background: '#fff' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div className="ch-av" style={{ width: '44px', height: '44px', overflow: 'hidden' }}>{(gFile || groupChat?.picture) ? <img src={gFile ? URL.createObjectURL(gFile) : groupChat.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'RC'}</div><label style={{ fontSize: '12px', color: '#CC0000', cursor: 'pointer' }}>Change picture<input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (f.size > 5 * 1024 * 1024) { window.alert('Picture is too big. Max 5 MB.'); return; } setGFile(f); }} /></label></div><input value={gName} onChange={(e) => setGName(e.target.value)} maxLength={60} placeholder="Group name" aria-label="Group name" style={{ width: '100%', boxSizing: 'border-box', margin: '8px 0', padding: '7px 10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', fontSize: '12.5px' }} /><div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}><button type="button" onClick={() => setGOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: '#888' }}>Cancel</button><button type="button" onClick={saveGroup} disabled={gSaving} style={{ border: 'none', background: '#CC0000', color: '#fff', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px' }}>{gSaving ? 'Saving...' : 'Save'}</button></div></div>)}</>}{restRows.filter((c) => !c.key).map(renderRow)}
                    {restRows.some((c) => c.key) && <div className="ch-sec">Private chats</div>}{(() => { const g = {}; restRows.filter((c) => c.key).forEach((c) => { (g[c.key] = g[c.key] || []).push(c); }); const ts = (c) => new Date(c.last?.created_at || 0).getTime(); return Object.keys(g).map((k) => { g[k].sort((a, b) => ts(b) - ts(a)); return [k, g[k]]; }).sort((a, b) => ts(b[1][0]) - ts(a[1][0])).map(([k, rows]) => { const shut = !!closedAdm[k]; const anyUnread = rows.some((c) => c.unread); return (<div key={'adm' + k}><button type="button" onClick={() => setClosedAdm((s) => ({ ...s, [k]: !s[k] }))} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'calc(100% - 16px)', margin: '6px 8px 2px', padding: '6px 10px', border: 'none', borderRadius: '8px', background: '#f5f5f5', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', color: '#333', textAlign: 'left' }}><span>{shut ? '\u25B8' : '\u25BE'}</span><span style={{ fontWeight: 600 }}>{'Admin ' + k}</span><span style={{ fontSize: '11px', color: '#777', background: '#fff', borderRadius: '10px', padding: '0 7px' }}>{rows.length}</span>{anyUnread && <span style={{ marginLeft: 'auto', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#CC0000' }} />}</button>{!shut && rows.map((c) => renderRow(c, 'g'))}</div>); }); })()}
                    </div>
                </div>

                <div className={'ch-chat' + (sel ? '' : ' hide-m')}>
                    {!sel ? (
                        <div className="ch-empty">Pick a conversation to read and reply.</div>
                    ) : (
                        <>
                            <div className="ch-head">
                                <button type="button" className="ch-ib ch-back" aria-label="Back" onClick={() => { chClear(); setSelectedId(null); }}><Ic n="back" s={18} /></button>
                                <div className={'ch-av' + (sel.key ? ' pv' : '')}>{!sel.key && groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials(sel.user?.name)}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{!sel.key ? (groupChat?.name || 'Group chat') + (sel.day && sel.last ? ' \u00b7 ' + fmtDay(sel.last.created_at) : '') : (sel.user?.name || 'Volunteer')}</div>
                                    <div style={{ fontSize: '12px', color: '#777' }}>{sel.key ? 'Admin ' + sel.key + '\u2019s private chat with this volunteer \u00b7 ' + (sel.user?.email || 'Volunteer') : (sel.day ? 'Messages from this day' : 'Team chat')}</div>
                                </div>
                                {sel.status === 'active' && !sel.gc && <button type="button" className={'ch-ib' + (sel.pinned ? ' on' : '')} aria-label={sel.pinned ? 'Unpin' : 'Pin'} title={sel.pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(sel)}><Ic n="pin" /></button>}
                                {sel.status === 'active' && !sel.gc && <button type="button" className="ch-ib" aria-label="Archive" title="Archive" onClick={() => leave('archive', sel)}><Ic n="archive" /></button>}
                                {sel.status !== 'active' && <button type="button" className="ch-ib" aria-label="Restore" title="Restore" onClick={() => leave('restore', sel)}><Ic n="restore" /></button>}
                                {sel.status !== 'trashed' && !sel.gc && <button type="button" className="ch-ib" aria-label="Move to trash" title="Move to trash" onClick={() => leave('trash', sel)}><Ic n="trash" /></button>}
                                {sel.status === 'trashed' && <button type="button" className="ch-ib" aria-label="Delete forever" title="Delete forever" onClick={() => purge(sel)}><Ic n="trash" /></button>}
                                <button type="button" className={'ch-ib' + (info ? ' on' : '')} aria-label="Chat details" title="Chat details" onClick={() => setInfo((v) => !v)}><Ic n="panel" /></button>
                            </div>

                            <div className="ch-scroll" ref={scrollRef}>
                                {!showAll && earlier > 0 && !sel.gc && (
                                    <button type="button" className="ch-more" onClick={() => setExpanded(true)}>Show earlier messages ({earlier})</button>
                                )}
                                {shown.length === 0 && sel.gc && !sel.day && <div className="ch-empty">No messages today. Earlier messages are in History.</div>}
                                {shown.map((m, i) => {
                                    const dk = dayKey(m.created_at);
                                    const showDay = dk !== prevDay;
                                    prevDay = dk;
                                    const admin = m.sender_type === 'admin';
                                    const nmOf = (x) => (x.sender_type === 'admin' ? (x.admin_label || x.admin?.name || 'Red Cross Admin') : (sel.gc ? (x.label || 'Volunteer') : (sel.user?.name || 'Volunteer')));
                                    const sk = (x, j) => (x.sender_type === 'admin' ? 'a:' + j : 'v:' + nmOf(x));
                                    const pv = shown[i - 1]; const nx = shown[i + 1];
                                    const isFirst = showDay || !pv || sk(pv, i - 1) !== sk(m, i);
                                    const isLast = !nx || dayKey(nx.created_at) !== dk || sk(nx, i + 1) !== sk(m, i);
                                    return (
                                        <div key={m.threadId + '-' + (m.id ?? i)} style={{ display: 'contents' }}>
                                            {showDay && <div className="ch-day"><span>{dk === today ? 'Today' : fmtDay(m.created_at)}</span></div>}
                                            <div className={'ch-msg ' + (admin ? 'me' : 'them') + (isFirst ? ' f' : '') + (isLast ? ' l' : '')}>
                                                {!admin && isFirst && (<><div className="ch-who">{nmOf(m)}</div><div className="ch-mav">{initials(nmOf(m))}</div></>)}
                                                {admin && <div className="ch-who">{m.admin_label || m.admin?.name || 'Red Cross Admin'}{m.id && !sel.key && !sel.gc ? <> &middot; <button type="button" onClick={() => renameSender(m)} style={{ border: 'none', background: 'none', color: '#CC0000', cursor: 'pointer', fontSize: '11px', padding: 0, fontFamily: 'inherit' }}>Edit name</button></> : null}</div>}{renaming && renaming.id === m.id && (<div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '4px', margin: '4px 0', width: '170px' }}><div style={{ padding: '4px 8px', color: '#888', fontSize: '11px' }}>Show this message as</div>{staff.map((s) => (<button key={s} type="button" onClick={() => pickName(m, s)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: m.admin_label === fullLabel(s) ? '#e6f1fb' : 'transparent', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px' }}>{fullLabel(s)}</button>))}<button type="button" onClick={() => setRenaming(null)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '6px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: '#888' }}>Cancel</button></div>)}
                                                {m.body && <div className="ch-bub">{m.body}</div>}
                                                {m.attachment_path && (() => { const u = attUrl(m); const mt = m.attachment_mime || ''; return (
                                                    <div className="ch-att">
                                                        {mt.startsWith('image/') ? <a href={u} target="_blank" rel="noreferrer"><img src={u} alt={m.attachment_name || 'Picture'} /></a>
                                                        : (mt.startsWith('audio/') || /^voice-message-/.test(m.attachment_name || '')) ? <ChVoicePlayer src={u} />
                                                        : mt.startsWith('video/') ? <video src={u} controls preload="metadata" />
                                                        : <a className="ch-doc" href={u} target="_blank" rel="noreferrer"><ChFileIcon m={m} sm /><span className="ch-doc-n">{m.attachment_name || 'Open file'}</span></a>}
                                                    </div>); })()}
                                                {isLast && <div className="ch-time">{fmtTime(m.created_at)}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {file && (<div className="ch-file"><div className="ch-fchip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg><span>{file.name}</span><button type="button" aria-label="Remove file" title="Remove" onClick={() => setFile(null)}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div></div>)}
                            <div className="ch-as" style={sel.day ? { display: 'none' } : undefined}>
                                <span>Replying as</span>
                                {sel.key ? <b>Admin {sel.key}</b> : prof ? <b>Admin {prof}</b> : staff.length > 0 ? (<select value={staff.find((s) => s.toLowerCase() === asName.trim().toLowerCase()) || ''} onChange={(e) => changeName(e.target.value)} aria-label="Replying as" style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '4px 8px', fontSize: '12.5px', fontFamily: 'inherit' }}><option value="">Choose your name</option>{staff.map((s) => <option key={s} value={s}>{s}</option>)}</select>) : (<input value={asName} onChange={(e) => changeName(e.target.value)} placeholder="Your name (e.g. Maria)" aria-label="Replying as" maxLength={40} />)}
                            </div>
                            <div className={'ch-comp' + (recSec >= 0 ? ' rec' : '')} style={sel.day ? { display: 'none' } : undefined}>
                                <button type="button" className="ch-clip" aria-label="Record a voice message" title="Record a voice message" onClick={chVStart}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></button>
                                <label className="ch-clip" aria-label="Attach a picture or video" title="Attach a picture or video">
                                    <input type="file" hidden accept="image/*,video/*" onChange={pickFile} />
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 9" /></svg>
                                </label>
                                <label className="ch-clip" aria-label="Attach a file" title="Attach a picture, video or PDF">
                                    <input type="file" hidden accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={pickFile} />
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                </label>
                                {/*ch-rec*/}{recSec >= 0 && (<div className="ch-rec"><button type="button" className="ch-rec-x" aria-label="Cancel recording" title="Cancel" onClick={() => chVStop(false)}><Ic n="trash" s={18} /></button><span className="ch-rec-dot" /><span className="ch-rec-t">{Math.floor(recSec / 60)}:{String(recSec % 60).padStart(2, '0')}</span><span className="ch-rec-w">{Array.from({ length: 24 }).map((_, i) => (<i key={i} />))}</span></div>)}{/*ch-rec-end*/}<div className="ch-fld">
                                    <textarea
                                        rows={1}
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                        placeholder="Type your reply"
                                        aria-label="Reply"
                                    />
                                </div>
                                {/*ch-mic*/}{recSec >= 0 ? (<button type="button" className="ch-send" aria-label="Send voice message" title="Send" onClick={() => chVStop(true)}><Ic n="send" /></button>) : (<button type="button" className={'ch-send' + ((!text.trim() && !file) ? ' idle' : '')} aria-label="Send" title="Send" onClick={send}><Ic n="send" /></button>)}{/*ch-mic-end*/}
                            </div>
                        </>
                    )}
                </div>
                {showInfo && (
                    <aside className="ch-info">
                        <div className="ch-info-x"><button type="button" className="ch-ib" aria-label="Close details" onClick={() => setInfo(false)}><Ic n="close" s={16} /></button></div>
                        <div className="ch-info-pr">
                            <div className={'ch-av big' + (sel.key ? ' pv' : '')}>{!sel.key && groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials(sel.user?.name)}</div>
                            <b>{!sel.key ? (groupChat?.name || 'Group chat') + (sel.day && sel.last ? ' \u00b7 ' + fmtDay(sel.last.created_at) : '') : (sel.user?.name || 'Volunteer')}</b>
                            <span>{sel.key ? 'Private chat \u00b7 Admin ' + sel.key : (sel.day ? 'Messages from this day' : 'Group chat')}</span>
                            {sel.status === 'active' && !sel.gc && !sel.draft && (
                                <div className="ch-acts">
                                    <button type="button" onClick={() => togglePin(sel)} style={{ color: sel.pinned ? '#CC0000' : undefined }}><span className="ch-acts-i"><Ic n="pin" s={16} /></span>{sel.pinned ? 'Unpin' : 'Pin'}</button>
                                    <button type="button" onClick={() => leave('archive', sel)}><span className="ch-acts-i"><Ic n="archive" s={16} /></span>Archive</button>
                                    <button type="button" onClick={() => leave('trash', sel)}><span className="ch-acts-i"><Ic n="trash" s={16} /></span>Delete</button>
                                </div>
                            )}
                        </div>
                        <div className="ch-info-h">People<small>{people.length}</small></div>
                        {people.length === 0 ? <div className="ch-info-e">No messages yet.</div> : people.map(([n, r]) => (<div key={n} className="ch-pp"><div className={'ch-av sm' + (r === 'Admin' ? '' : ' pv')}>{initials(n)}</div><div><div>{n}</div><small>{r}</small></div></div>))}
                        <div className="ch-info-h">Shared files{sharedFiles.length > 0 ? <small>{sharedFiles.length}</small> : null}</div>
                        {sharedFiles.length === 0 ? <div className="ch-info-e">No files shared yet.</div> : sharedFiles.map((m) => (<a key={m.threadId + '-' + m.id} className="ch-sf" href={attUrl(m)} target="_blank" rel="noreferrer"><ChFileIcon m={m} /><span className="ch-sf-t"><span className="ch-sf-n">{m.attachment_name || 'File'}</span><small>{fmtDay(m.created_at)}</small></span></a>))}
                        <div className="ch-info-h">Shared pictures{sharedImgs.length > 0 ? <small>{sharedImgs.length}</small> : null}</div>
                        {sharedImgs.length === 0 ? <div className="ch-info-e">No pictures shared yet.</div> : (<div className="ch-grid">{sharedImgs.map((m) => (<a key={m.threadId + '-' + m.id} href={attUrl(m)} target="_blank" rel="noreferrer"><img src={attUrl(m)} alt={m.attachment_name || 'Picture'} /></a>))}</div>)}
                    </aside>
                )}
            </div>
        </AdminShell>
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