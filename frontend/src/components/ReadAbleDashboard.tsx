import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  Headphones,
  Bookmark,
  History,
  StickyNote,
  Settings,
  Search,
  SlidersHorizontal,
  Type,
  Contrast,
  Play,
  Pause,
  FileText,
  Flame,
  Target,
  Quote,
  File,
  MoreVertical,
  Book,
  Pencil,
  Download,
  Trash2,
  SkipBack,
  SkipForward,
  Menu,
  Bell,
  Maximize2,
  Crown,
  Minus,
  Plus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "My Library", icon: BookOpen },
  { name: "Upload Document", icon: Upload },
  { name: "Read Aloud", icon: Headphones },
  { name: "Bookmarks", icon: Bookmark },
  { name: "Reading History", icon: History },
  { name: "Notes", icon: StickyNote },
  { name: "Settings", icon: Settings },
];

const DOCS = [
  {
    icon: File,
    title: "The Psychology of Money.pdf",
    sub: "PDF · 1.4 MB · Last read 2h ago",
    pct: 75,
  },
  {
    icon: FileText,
    title: "Atomic Habits.txt",
    sub: "TXT · 320 KB · Last read 1d ago",
    pct: 40,
  },
  {
    icon: File,
    title: "Deep Work: Rules for Focus.pdf",
    sub: "PDF · 2.1 MB · Last read 3d ago",
    pct: 60,
  },
  {
    icon: File,
    title: "The 5 AM Club.pdf",
    sub: "PDF · 1.8 MB · Last read 5d ago",
    pct: 20,
  },
];

const NOTIFICATIONS = [
  { t: "New chapter recommendation", s: 'Based on "The Night Circus"' },
  { t: "Streak reminder", s: "Read 18 more minutes to keep your streak" },
  { t: "Upload complete", s: '"Deep Work" is ready to read' },
];

const ZOOM_STEPS = [100, 115, 130];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReadAbleDashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openDocMenu, setOpenDocMenu] = useState<number | null>(null);

  const [fontSize, setFontSize] = useState(18);
  const [font, setFont] = useState("OpenDyslexic");
  const [contrast, setContrast] = useState("Standard");
  const [aloudOn, setAloudOn] = useState(false);

  const [playing, setPlaying] = useState(false);

  const [goalMinutes, setGoalMinutes] = useState(50);
  const goalDone = 32;

  const [zoomIndex, setZoomIndex] = useState(0);

  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // -- helpers ---------------------------------------------------------

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 2200);
  }, []);

  const selectNav = (name: string) => {
    setActiveNav(name);
    setSidebarOpen(false);
    toast(name === "Dashboard" ? "Dashboard" : name + " — build this screen next");
  };

  const changeFont = (dir: number) => {
    setFontSize((v) => Math.min(28, Math.max(14, v + dir)));
  };

  const toggleAloud = () => setAloudOn((v) => !v);
  const togglePlay = () => setPlaying((v) => !v);

  const editGoal = () => {
    const input = window.prompt("Set your daily reading goal (minutes):", String(goalMinutes));
    if (input && !isNaN(Number(input))) {
      setGoalMinutes(parseInt(input, 10));
    }
  };

  const increaseSize = useCallback(() => {
    setZoomIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % ZOOM_STEPS.length;
      const pct = ZOOM_STEPS[nextIndex];
      toast(pct === 100 ? "Dashboard text size reset" : "Dashboard text size increased to " + pct + "%");
      return nextIndex;
    });
  }, [toast]);

  const toggleDropdown = (which: "notif" | "profile") => {
    if (which === "notif") {
      setProfileOpen(false);
      setOpenDocMenu(null);
      setNotifOpen((v) => !v);
    } else if (which === "profile") {
      setNotifOpen(false);
      setOpenDocMenu(null);
      setProfileOpen((v) => !v);
    }
  };

  const toggleDocMenu = (i: number) => {
    setNotifOpen(false);
    setProfileOpen(false);
    setOpenDocMenu((cur) => (cur === i ? null : i));
  };

  // -- close dropdowns / sidebar on outside click -----------------------

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest(".rel") && !target.closest(".doc-more")) {
        setNotifOpen(false);
        setProfileOpen(false);
        setOpenDocMenu(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        increaseSize();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [increaseSize]);

  // -- preview box styling ----------------------------------------------

  const previewStyle: React.CSSProperties = { fontSize: fontSize + "px" };
  if (font === "Standard sans") {
    previewStyle.fontFamily = "'Lexend',sans-serif";
  } else if (font === "OpenDyslexic") {
    previewStyle.fontFamily = "'Comic Sans MS','Lexend',sans-serif";
  } else {
    previewStyle.fontFamily = "'Lexend',sans-serif";
  }
  if (contrast === "High contrast") {
    previewStyle.background = "#000";
    previewStyle.color = "#FFF";
    previewStyle.padding = "12px";
    previewStyle.borderRadius = "8px";
  } else if (contrast === "Cream background") {
    previewStyle.background = "#FBF3DD";
    previewStyle.color = "#33301F";
    previewStyle.padding = "12px";
    previewStyle.borderRadius = "8px";
  } else {
    previewStyle.background = "transparent";
    previewStyle.color = "var(--text-2)";
    previewStyle.padding = "0";
  }

  const goalPct = Math.min(100, Math.round((goalDone / goalMinutes) * 100) || 0);
  const zoomPct = ZOOM_STEPS[zoomIndex];

  return (
    <div
      ref={containerRef}
      className="readable-root"
      data-theme={theme}
      style={{ fontSize: (16 * zoomPct) / 100 + "px" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap');

        .readable-root{
          --bg:#F7FBFA; --card:#FFFFFF; --card-soft:#EAF7F1;
          --accent:#005B4D; --accent-dark:#003D33; --accent-tint:#BAEBDA;
          --success:var(--accent); --success-tint:#D6F3E9;
          --warning:#E08A2B; --warning-tint:#FCEEDC;
          --text-1:#122620; --text-2:#5B6E68; --text-3:#8FA39C;
          --border:#DDEFE8; --shadow:0 1px 2px rgba(18,38,32,0.05);
          --radius:14px;
          font-family:'Lexend',sans-serif;background:var(--bg);color:var(--text-1);
          transition:background .2s,color .2s;
          min-height:100vh;
        }
        .readable-root[data-theme="dark"]{
          --bg:#0E1815; --card:#152420; --card-soft:#1C332C;
          --accent:#3DD9AE; --accent-dark:#005B4D; --accent-tint:#1E3A32;
          --success:var(--accent); --success-tint:#1E332B;
          --warning:#F0A94E; --warning-tint:#3A2A14;
          --text-1:#EAF7F1; --text-2:#A9C4BB; --text-3:#6E8A81;
          --border:#22392F; --shadow:0 1px 2px rgba(0,0,0,0.3);
        }
        .readable-root *{box-sizing:border-box;}
        .readable-root button,.readable-root select,.readable-root input{font-family:inherit;}
        .readable-root a{text-decoration:none;color:inherit;}
        .app{display:grid;grid-template-columns:260px 1fr 300px;min-height:100vh;}
        @media (max-width:1100px){.app{grid-template-columns:220px 1fr;}.right-col{display:none;}}

        .backdrop{position:fixed;inset:0;background:rgba(15,12,30,0.45);z-index:55;opacity:0;pointer-events:none;transition:opacity .2s;}
        .backdrop.show{opacity:1;pointer-events:auto;}

        @media (max-width:900px){
          .app{grid-template-columns:1fr;}
          .sidebar{position:fixed;top:0;left:0;bottom:0;width:250px;z-index:60;transform:translateX(-100%);transition:transform .25s ease;box-shadow:0 10px 40px rgba(15,12,30,0.25);}
          .sidebar.open{transform:translateX(0);}
          .main{padding:16px;}
          .topbar{gap:8px;}
          .search{order:0;flex:1 1 80px;padding:10px 12px;}
          .resize-btn .label-text{display:none;}
          .resize-btn{padding:9px 12px;}
          .settings-grid{grid-template-columns:1fr 1fr;}
          .actions-grid{grid-template-columns:1fr 1fr;}
          h2.greet{font-size:1.25rem;}
        }
        @media (max-width:560px){
          .kbd-hint{display:none;}
          .settings-grid{grid-template-columns:1fr;}
          .actions-grid{grid-template-columns:1fr;}
          .continue-card{flex-wrap:wrap;}
          .continue-info{flex-basis:100%;order:2;}
          .resume-btn{order:3;width:100%;justify-content:center;}
          .doc-row{flex-wrap:wrap;row-gap:6px;}
          .doc-progress{order:4;width:100%;}
          .doc-pct{order:3;}
          .topbar-right{gap:8px;}
          .darkmode-toggle span{display:none;}
        }

        .sidebar{background:var(--card);border-right:1px solid var(--border);padding:24px 16px;display:flex;flex-direction:column;}
        .brand{display:flex;align-items:center;gap:10px;padding:0 8px 20px;}
        .brand-mark{width:34px;height:34px;border-radius:9px;background:#0A0A0A;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .brand h1{font-size:1.125rem;margin:0;font-weight:600;}
        .brand p{font-size:0.75rem;color:var(--text-3);margin:0;}
        .nav{display:flex;flex-direction:column;gap:2px;margin-top:8px;}
        .nav button{display:flex;align-items:center;gap:12px;padding:10px 12px;border:none;background:none;border-radius:10px;font-size:0.875rem;color:var(--text-2);cursor:pointer;text-align:left;width:100%;}
        .nav button svg{flex-shrink:0;}
        .nav button:hover{background:var(--card-soft);}
        .nav button.active{background:var(--accent-tint);color:var(--accent);font-weight:600;}
        .premium{margin-top:auto;background:linear-gradient(135deg,var(--accent-tint),var(--card-soft));border-radius:var(--radius);padding:16px;font-size:0.8125rem;}
        .premium p{margin:6px 0 12px;color:var(--text-2);line-height:1.5;}
        .premium .title{font-weight:600;display:flex;align-items:center;gap:6px;color:var(--text-1);}
        .premium button{width:100%;background:var(--accent);color:#fff;border:none;padding:10px;border-radius:10px;font-weight:500;cursor:pointer;font-size:0.8125rem;}
        .premium button:hover{background:var(--accent-dark);}
        .profile{display:flex;align-items:center;gap:10px;padding:14px 8px 0;margin-top:16px;border-top:1px solid var(--border);position:relative;}
        .avatar{width:34px;height:34px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.8125rem;flex-shrink:0;}
        .profile .name{font-size:0.8125rem;font-weight:500;}
        .profile .email{font-size:0.6875rem;color:var(--text-3);}

        .main{padding:24px 28px;}
        .topbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:24px;flex-wrap:nowrap;}
        .search{flex:1 1 120px;min-width:0;max-width:420px;display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:999px;padding:10px 16px;color:var(--text-3);}
        .search input{min-width:0;}
        .search input{border:none;outline:none;background:none;width:100%;font-size:0.875rem;color:var(--text-1);}
        .topbar-right{display:flex;align-items:center;gap:14px;}
        .darkmode-toggle{display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:999px;padding:6px 12px;font-size:0.8125rem;cursor:pointer;}
        .switch{width:36px;height:20px;border-radius:999px;background:var(--border);position:relative;transition:.2s;}
        .switch::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.2s;}
        .readable-root[data-theme="dark"] .switch{background:var(--accent);}
        .readable-root[data-theme="dark"] .switch::after{left:18px;}
        .icon-btn{position:relative;width:38px;height:38px;border-radius:50%;border:1px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;color:var(--text-2);}
        .hamburger-btn{width:38px;height:38px;border-radius:10px;border:1px solid var(--border);background:var(--card);display:none;align-items:center;justify-content:center;cursor:pointer;color:var(--text-2);flex-shrink:0;}
        @media (max-width:900px){.hamburger-btn{display:flex;}}
        .kbd-hint{font-size:0.6875rem;color:var(--text-3);border:1px solid var(--border);border-radius:6px;padding:2px 6px;flex-shrink:0;}
        .resize-wrap{position:relative;}
        .resize-btn{display:flex;align-items:center;gap:8px;border:1px solid var(--border);background:var(--card);border-radius:999px;padding:9px 16px;font-size:0.8125rem;font-weight:500;cursor:pointer;color:var(--text-1);white-space:nowrap;}
        .resize-btn:hover,.resize-btn.active-ring{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-tint);}
        .resize-tip{position:absolute;top:46px;left:50%;transform:translateX(-50%);background:var(--text-1);color:var(--bg);font-size:0.75rem;padding:6px 12px;border-radius:8px;white-space:nowrap;opacity:0;pointer-events:none;transition:.15s;}
        .resize-wrap:hover .resize-tip{opacity:1;}
        .badge{position:absolute;top:-4px;right:-4px;background:var(--accent);color:#fff;font-size:0.625rem;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
        .dropdown{position:absolute;top:46px;right:0;background:var(--card);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 24px rgba(20,15,50,0.12);width:260px;padding:8px;display:none;z-index:20;}
        .dropdown.open{display:block;}
        .dropdown .item{padding:10px 12px;border-radius:8px;font-size:0.8125rem;cursor:pointer;}
        .dropdown .item:hover{background:var(--card-soft);}
        .dropdown .item .t{font-weight:500;}
        .dropdown .item .s{color:var(--text-3);font-size:0.75rem;}
        .rel{position:relative;}

        h2.greet{font-size:1.375rem;margin:0 0 2px;font-weight:600;}
        .sub{color:var(--text-2);font-size:0.875rem;margin:0 0 20px;}

        .card{background:var(--card);border-radius:var(--radius);border:1px solid var(--border);padding:18px 20px;box-shadow:var(--shadow);}
        .card-title{display:flex;align-items:center;gap:8px;font-weight:600;font-size:0.875rem;margin-bottom:14px;}
        .card-title svg{color:var(--accent);}

        .settings-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        @media(max-width:900px){.settings-grid{grid-template-columns:repeat(2,1fr);}}
        .setting-box{border:1px solid var(--border);border-radius:10px;padding:10px 12px;background:var(--bg);}
        .setting-box .label{font-size:0.6875rem;color:var(--text-3);display:flex;align-items:center;gap:5px;margin-bottom:8px;}
        .stepper{display:flex;align-items:center;gap:8px;}
        .stepper button{width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:0.75rem;color:var(--text-1);display:flex;align-items:center;justify-content:center;}
        .stepper span{font-weight:600;font-size:0.8125rem;min-width:32px;text-align:center;}
        select.setting-select{width:100%;border:1px solid var(--border);border-radius:8px;padding:7px 8px;font-size:0.8125rem;background:var(--card);color:var(--text-1);}
        .enable-btn{width:100%;border:1px solid var(--border);border-radius:8px;padding:7px 8px;font-size:0.8125rem;background:var(--card);color:var(--text-1);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;}
        .enable-btn.active{background:var(--success-tint);color:var(--success);border-color:var(--success);}

        .preview-box{margin-top:14px;border-top:1px dashed var(--border);padding-top:14px;color:var(--text-2);line-height:1.7;transition:font-size .15s;}

        .continue-card{display:flex;align-items:center;gap:16px;}
        .cover{width:50px;height:66px;border-radius:6px;background:linear-gradient(135deg,var(--accent),var(--accent-dark));flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.25rem;}
        .continue-info{flex:1;min-width:0;}
        .continue-info .book-title{font-weight:600;font-size:0.9375rem;margin:0;}
        .continue-info .book-sub{font-size:0.75rem;color:var(--text-3);margin:2px 0 8px;}
        .progress-row{display:flex;align-items:center;gap:10px;}
        .progress-track{flex:1;height:6px;background:var(--border);border-radius:4px;overflow:hidden;}
        .progress-fill{height:100%;background:var(--accent);}
        .progress-pct{font-size:0.75rem;font-weight:600;color:var(--text-2);}
        .resume-btn{border:none;background:var(--accent);color:#fff;padding:9px 16px;border-radius:9px;font-size:0.8125rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;}
        .resume-btn:hover{background:var(--accent-dark);}

        .actions-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0;}
        @media(max-width:900px){.actions-grid{grid-template-columns:repeat(2,1fr);}}
        .action-tile{border-radius:var(--radius);padding:16px;cursor:pointer;border:1px solid var(--border);transition:transform .1s;background:var(--accent-tint);}
        .action-tile:hover{transform:translateY(-2px);}
        .action-tile .a-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;background:var(--accent);color:#fff;}
        .action-tile .a-title{font-weight:600;font-size:0.875rem;margin:0 0 3px;}
        .action-tile .a-sub{font-size:0.75rem;color:var(--text-3);margin:0;}

        .doc-list .doc-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
        .doc-list .doc-row:last-child{border-bottom:none;}
        .doc-icon{width:34px;height:34px;border-radius:8px;background:var(--card-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0;}
        .doc-info{flex:1;min-width:0;}
        .doc-info .d-title{font-size:0.8125rem;font-weight:500;margin:0;}
        .doc-info .d-sub{font-size:0.6875rem;color:var(--text-3);margin:2px 0 0;}
        .doc-progress{width:110px;height:5px;background:var(--border);border-radius:4px;overflow:hidden;}
        .doc-progress-fill{height:100%;background:var(--accent);}
        .doc-pct{font-size:0.75rem;font-weight:600;width:34px;text-align:right;}
        .doc-more{position:relative;}
        .doc-more button{border:none;background:none;color:var(--text-3);cursor:pointer;font-size:1rem;padding:4px;display:flex;}
        .doc-menu{position:absolute;right:0;top:28px;background:var(--card);border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(20,15,50,0.12);width:150px;display:none;z-index:15;}
        .doc-menu.open{display:block;}
        .doc-menu .item{padding:9px 12px;font-size:0.8125rem;cursor:pointer;display:flex;align-items:center;gap:8px;}
        .doc-menu .item:hover{background:var(--card-soft);}

        .right-col{padding:24px 20px;display:flex;flex-direction:column;gap:16px;}
        .streak-card{text-align:center;}
        .streak-num{font-size:2rem;font-weight:700;color:var(--accent);margin:6px 0 2px;}
        .streak-days{display:flex;justify-content:space-between;margin-top:14px;}
        .streak-days span{width:26px;height:26px;border-radius:50%;background:var(--success-tint);color:var(--success);font-size:0.6875rem;display:flex;align-items:center;justify-content:center;}
        .streak-days span.today{background:var(--accent);color:#fff;}
        .goal-row{display:flex;align-items:center;gap:14px;}
        .ring{width:74px;height:74px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
        .ring-inner{width:56px;height:56px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;}
        .edit-goal-btn{width:100%;margin-top:12px;border:none;background:var(--accent);color:#fff;padding:9px;border-radius:9px;font-size:0.8125rem;cursor:pointer;}
        .edit-goal-btn:hover{background:var(--accent-dark);}
        .quote-card{background:linear-gradient(135deg,var(--accent-dark),var(--accent));color:#fff;border:none;}
        .quote-card svg{opacity:.6;}
        .quote-card p{font-family:'Lexend',serif;line-height:1.6;font-size:0.875rem;margin:10px 0;}
        .quote-card .author{font-size:0.75rem;opacity:.85;}
        .mini-player{display:flex;align-items:center;gap:10px;}
        .mini-cover{width:38px;height:38px;border-radius:8px;background:var(--accent);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;}
        .mini-info .t{font-size:0.8125rem;font-weight:600;margin:0;}
        .mini-info .s{font-size:0.6875rem;color:var(--text-3);margin:0;}
        .mini-controls{margin-left:auto;display:flex;align-items:center;gap:6px;}
        .mini-controls button{border:none;background:none;font-size:1rem;color:var(--text-2);cursor:pointer;display:flex;}
        .mini-controls .play{width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;}

        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--text-1);color:var(--bg);padding:12px 20px;border-radius:10px;font-size:0.8125rem;opacity:0;transition:.25s;pointer-events:none;z-index:50;}
        .toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
      `}</style>

      <div className={"backdrop" + (sidebarOpen ? " show" : "")} onClick={() => setSidebarOpen(false)} />

      <div className="app">
        {/* Sidebar */}
        <aside className={"sidebar" + (sidebarOpen ? " open" : "")}>
          <div className="brand">
            <div className="brand-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="8.6" y="1.8" width="1.7" height="7.6" rx="0.6" />
                <rect x="11.4" y="4" width="1.7" height="5.4" rx="0.6" />
                <rect x="14.2" y="5.8" width="1.7" height="3.6" rx="0.6" />
                <path d="M3 10.2c2.6 0 4.7 0.9 6.2 2.3v7.6c-1.5 -1.2 -3.6 -1.9 -6.2 -1.9v-8z" />
                <path d="M21 10.2c-2.6 0 -4.7 0.9 -6.2 2.3v7.6c1.5 -1.2 3.6 -1.9 6.2 -1.9v-8z" />
              </svg>
            </div>
            <div>
              <h1>ReadAble</h1>
              <p>Read easily, learn freely.</p>
            </div>
          </div>

          <nav className="nav">
            {NAV_ITEMS.map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={activeNav === name ? "active" : ""}
                onClick={() => selectNav(name)}
              >
                <Icon size={18} />
                <span className="nav-label">{name}</span>
              </button>
            ))}
          </nav>

          <div className="premium">
            <div className="title">
              <Crown size={16} /> Go Premium
            </div>
            <p>Unlock unlimited uploads, premium voices and advanced features.</p>
            <button onClick={() => toast("Upgrade flow goes here")}>Upgrade now</button>
          </div>

          <div className="profile">
            <div className="avatar">R</div>
            <div>
              <div className="name">Raghav Agarwal</div>
              <div className="email">raghav@example.com</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="topbar">
            <button className="hamburger-btn" onClick={() => setSidebarOpen((v) => !v)} title="Menu">
              <Menu size={18} />
            </button>

            <div className="search">
              <Search size={16} />
              <input placeholder="Search documents, notes, books..." />
              <span className="kbd-hint">Ctrl + K</span>
            </div>

            <div className="resize-wrap">
              <button className={"resize-btn" + (zoomPct !== 100 ? " active-ring" : "")} onClick={increaseSize}>
                <Maximize2 size={16} />
                <span className="label-text">Increase dashboard text</span>
              </button>
              <div className="resize-tip">Increase size (Ctrl + Plus)</div>
            </div>

            <div className="topbar-right">
              <div className="darkmode-toggle" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
                <span>Dark mode</span>
                <div className="switch" />
              </div>

              <div className="rel">
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown("notif");
                  }}
                >
                  <Bell size={18} />
                  <span className="badge">3</span>
                </button>
                <div className={"dropdown" + (notifOpen ? " open" : "")}>
                  {NOTIFICATIONS.map((n, i) => (
                    <div className="item" key={i}>
                      <div className="t">{n.t}</div>
                      <div className="s">{n.s}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rel">
                <div
                  className="avatar"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown("profile");
                  }}
                >
                  R
                </div>
                <div className={"dropdown" + (profileOpen ? " open" : "")} style={{ width: 180 }}>
                  <div className="item" onClick={() => toast("Opening profile")}>
                    Profile
                  </div>
                  <div className="item" onClick={() => toast("Opening settings")}>
                    Settings
                  </div>
                  <div className="item" onClick={() => toast("Signed out")}>
                    Sign out
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="greet">Good morning, Raghav 👋</h2>
          <p className="sub">Let's continue your reading journey.</p>

          {/* Reading settings */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-title">
              <SlidersHorizontal size={17} />
              Reading settings
            </div>
            <div className="settings-grid">
              <div className="setting-box">
                <div className="label">
                  <Type size={14} />
                  Text size
                </div>
                <div className="stepper">
                  <button onClick={() => changeFont(-1)}>
                    <Minus size={12} />
                  </button>
                  <span>{fontSize}px</span>
                  <button onClick={() => changeFont(1)}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              <div className="setting-box">
                <div className="label">
                  <Type size={14} />
                  Font
                </div>
                <select className="setting-select" value={font} onChange={(e) => setFont(e.target.value)}>
                  <option>OpenDyslexic</option>
                  <option>Lexend</option>
                  <option>Standard sans</option>
                </select>
              </div>

              <div className="setting-box">
                <div className="label">
                  <Contrast size={14} />
                  Contrast
                </div>
                <select className="setting-select" value={contrast} onChange={(e) => setContrast(e.target.value)}>
                  <option>Standard</option>
                  <option>High contrast</option>
                  <option>Cream background</option>
                </select>
              </div>

              <div className="setting-box">
                <div className="label">
                  <Headphones size={14} />
                  Read aloud
                </div>
                <button className={"enable-btn" + (aloudOn ? " active" : "")} onClick={toggleAloud}>
                  {aloudOn ? <Pause size={14} /> : <Play size={14} />}
                  <span>{aloudOn ? "Reading…" : "Enable"}</span>
                </button>
              </div>
            </div>

            <div className="preview-box" style={previewStyle}>
              This is a live preview. Try changing the text size, font, or contrast above to see how a page will
              look while you're reading.
            </div>
          </div>

          {/* Continue reading */}
          <div className="card continue-card" style={{ marginBottom: 18 }}>
            <div className="cover">
              <BookOpen size={20} />
            </div>
            <div className="continue-info">
              <p className="book-title">The Night Circus</p>
              <p className="book-sub">Chapter 6 of 21</p>
              <div className="progress-row">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: "28%" }} />
                </div>
                <span className="progress-pct">28%</span>
              </div>
            </div>
            <button className="resume-btn" onClick={() => toast("Opening reader view")}>
              <Play size={14} />
              Resume
            </button>
          </div>

          {/* Quick actions */}
          <div className="actions-grid">
            <div className="action-tile" onClick={() => toast("Opening upload dialog")}>
              <div className="a-icon">
                <Upload size={18} />
              </div>
              <p className="a-title">Upload document</p>
              <p className="a-sub">PDF, TXT or image</p>
            </div>
            <div className="action-tile" onClick={() => selectNav("My Library")}>
              <div className="a-icon">
                <BookOpen size={18} />
              </div>
              <p className="a-title">My library</p>
              <p className="a-sub">View and manage</p>
            </div>
            <div className="action-tile" onClick={() => selectNav("Read Aloud")}>
              <div className="a-icon">
                <Headphones size={18} />
              </div>
              <p className="a-title">Read aloud</p>
              <p className="a-sub">Natural voices</p>
            </div>
            <div className="action-tile" onClick={() => selectNav("Bookmarks")}>
              <div className="a-icon">
                <Bookmark size={18} />
              </div>
              <p className="a-title">Bookmarks</p>
              <p className="a-sub">4 saved spots</p>
            </div>
          </div>

          {/* Recent documents */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="card-title" style={{ margin: 0 }}>
                <FileText size={17} />
                Recent documents
              </div>
              <a
                href="#"
                style={{ color: "var(--accent)", fontSize: 13, fontWeight: 500 }}
                onClick={(e) => {
                  e.preventDefault();
                  selectNav("My Library");
                }}
              >
                View all
              </a>
            </div>
            <div className="doc-list">
              {DOCS.map((d, i) => {
                const Icon = d.icon;
                return (
                  <div className="doc-row" key={i}>
                    <div className="doc-icon">
                      <Icon size={16} />
                    </div>
                    <div className="doc-info">
                      <p className="d-title">{d.title}</p>
                      <p className="d-sub">{d.sub}</p>
                    </div>
                    <div className="doc-progress">
                      <div className="doc-progress-fill" style={{ width: d.pct + "%" }} />
                    </div>
                    <div className="doc-pct">{d.pct}%</div>
                    <div className="doc-more">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDocMenu(i);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      <div className={"doc-menu" + (openDocMenu === i ? " open" : "")}>
                        <div className="item" onClick={() => toast("Opening " + d.title)}>
                          <Book size={14} />
                          Open
                        </div>
                        <div className="item" onClick={() => toast("Renaming")}>
                          <Pencil size={14} />
                          Rename
                        </div>
                        <div className="item" onClick={() => toast("Downloaded")}>
                          <Download size={14} />
                          Download
                        </div>
                        <div className="item" onClick={() => toast("Deleted")} style={{ color: "#d64545" }}>
                          <Trash2 size={14} />
                          Delete
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right column */}
        <aside className="right-col">
          <div className="card streak-card">
            <div className="card-title" style={{ justifyContent: "center" }}>
              <Flame size={17} />
              Reading streak
            </div>
            <div className="streak-num">7</div>
            <div style={{ color: "var(--text-3)", fontSize: 12 }}>days — keep it up!</div>
            <div className="streak-days">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span className="today">S</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <Target size={17} />
              Today's goal
            </div>
            <div className="goal-row">
              <div
                className="ring"
                style={{ background: `conic-gradient(var(--accent) ${goalPct}%, var(--border) 0)` }}
              >
                <div className="ring-inner">{goalPct}%</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {goalDone} of {goalMinutes} minutes
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Daily goal</div>
              </div>
            </div>
            <button className="edit-goal-btn" onClick={editGoal}>
              Edit goal
            </button>
          </div>

          <div className="card quote-card">
            <Quote size={20} />
            <p>A reader lives a thousand lives before he dies. The man who never reads lives only one.</p>
            <div className="author">— George R.R. Martin</div>
          </div>

          <div className="card mini-player">
            <div className="mini-cover">
              <BookOpen size={16} />
            </div>
            <div className="mini-info">
              <p className="t">The Night Circus</p>
              <p className="s">Chapter 6</p>
            </div>
            <div className="mini-controls">
              <button>
                <SkipBack size={16} />
              </button>
              <button className="play" onClick={togglePlay}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button>
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className={"toast" + (toastShow ? " show" : "")}>{toastMsg}</div>
    </div>
  );
}
