import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase.js";

const GROUPS = {
  A: ["MEX","RSA","KOR","CZE"],
  B: ["CAN","BIH","QAT","SUI"],
  C: ["BRA","MAR","HAI","SCO"],
  D: ["USA","PAR","AUS","TUR"],
  E: ["GER","CUW","CIV","ECU"],
  F: ["NED","JPN","SWE","TUN"],
  G: ["BEL","EGY","IRN","NZL"],
  H: ["ESP","CPV","KSA","URU"],
  I: ["FRA","SEN","IRQ","NOR"],
  J: ["ARG","ALG","AUT","JOR"],
  K: ["POR","COD","UZB","COL"],
  L: ["ENG","CRO","GHA","PAN"],
};

const TEAM_NAMES = {
  MEX:"México", RSA:"Sudáfrica", KOR:"Corea del Sur", CZE:"Chequia",
  CAN:"Canadá", BIH:"Bosnia-Herzegovina", QAT:"Catar", SUI:"Suiza",
  BRA:"Brasil", MAR:"Marruecos", HAI:"Haití", SCO:"Escocia",
  USA:"EE.UU.", PAR:"Paraguay", AUS:"Australia", TUR:"Turquía",
  GER:"Alemania", CUW:"Curazao", CIV:"Costa de Marfil", ECU:"Ecuador",
  NED:"Países Bajos", JPN:"Japón", SWE:"Suecia", TUN:"Túnez",
  BEL:"Bélgica", EGY:"Egipto", IRN:"Irán", NZL:"Nueva Zelanda",
  ESP:"España", CPV:"Cabo Verde", KSA:"Arabia Saudita", URU:"Uruguay",
  FRA:"Francia", SEN:"Senegal", IRQ:"Irak", NOR:"Noruega",
  ARG:"Argentina", ALG:"Argelia", AUT:"Austria", JOR:"Jordania",
  POR:"Portugal", COD:"RD Congo", UZB:"Uzbekistán", COL:"Colombia",
  ENG:"Inglaterra", CRO:"Croacia", GHA:"Ghana", PAN:"Panamá",
};

const TEAM_FLAGS = {
  MEX:"🇲🇽", RSA:"🇿🇦", KOR:"🇰🇷", CZE:"🇨🇿",
  CAN:"🇨🇦", BIH:"🇧🇦", QAT:"🇶🇦", SUI:"🇨🇭",
  BRA:"🇧🇷", MAR:"🇲🇦", HAI:"🇭🇹", SCO:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  USA:"🇺🇸", PAR:"🇵🇾", AUS:"🇦🇺", TUR:"🇹🇷",
  GER:"🇩🇪", CUW:"🇨🇼", CIV:"🇨🇮", ECU:"🇪🇨",
  NED:"🇳🇱", JPN:"🇯🇵", SWE:"🇸🇪", TUN:"🇹🇳",
  BEL:"🇧🇪", EGY:"🇪🇬", IRN:"🇮🇷", NZL:"🇳🇿",
  ESP:"🇪🇸", CPV:"🇨🇻", KSA:"🇸🇦", URU:"🇺🇾",
  FRA:"🇫🇷", SEN:"🇸🇳", IRQ:"🇮🇶", NOR:"🇳🇴",
  ARG:"🇦🇷", ALG:"🇩🇿", AUT:"🇦🇹", JOR:"🇯🇴",
  POR:"🇵🇹", COD:"🇨🇩", UZB:"🇺🇿", COL:"🇨🇴",
  ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", CRO:"🇭🇷", GHA:"🇬🇭", PAN:"🇵🇦",
};

const GROUP_COLORS = {
  A:"#ef4444", B:"#f97316", C:"#eab308", D:"#22c55e",
  E:"#14b8a6", F:"#3b82f6", G:"#8b5cf6", H:"#ec4899",
  I:"#f43f5e", J:"#06b6d4", K:"#84cc16", L:"#a78bfa",
  FWC:"#f59e0b", CC:"#dc2626",
};

// Nomenclatura XXX##
// 01=escudo, 02-12=jugadores 1-11, 13=foto equipo, 14-20=jugadores 12-18
function buildStickers() {
  const all = [];
  for (let i = 0; i <= 19; i++) {
    const num = String(i).padStart(2, "0");
    all.push({ id: `FWC${num}`, group: "FWC", team: "FWC",
      label: i === 0 ? "Portada" : `Especial ${i}`, type: i === 0 ? "portada" : "especial" });
  }
  for (const [grp, teams] of Object.entries(GROUPS)) {
    for (const team of teams) {
      all.push({ id: `${team}01`, group: grp, team, label: "Escudo", type: "escudo" });
      for (let j = 2; j <= 12; j++) {
        const num = String(j).padStart(2, "0");
        all.push({ id: `${team}${num}`, group: grp, team, label: "Jugador", type: "jugador" });
      }
      all.push({ id: `${team}13`, group: grp, team, label: "Foto equipo", type: "equipo" });
      for (let j = 14; j <= 20; j++) {
        const num = String(j).padStart(2, "0");
        all.push({ id: `${team}${num}`, group: grp, team, label: "Jugador", type: "jugador" });
      }
    }
  }
  for (let i = 1; i <= 14; i++) {
    const num = String(i).padStart(2, "0");
    all.push({ id: `CC${num}`, group: "CC", team: "CC", label: `Coca-Cola ${i}`, type: "coca" });
  }
  return all;
}

const ALL_STICKERS = buildStickers();
const STICKER_MAP = Object.fromEntries(ALL_STICKERS.map(s => [s.id, s]));

const USERS = [
  { id: "nico", name: "Nicolás", emoji: "🎓", color: "#f97316" },
  { id: "papa", name: "Papá", emoji: "⭐", color: "#3b82f6" },
];

function getStats(owned) {
  let have = 0, repeated = 0;
  for (const s of ALL_STICKERS) {
    const c = owned[s.id] || 0;
    if (c >= 1) have++;
    if (c > 1) repeated += c - 1;
  }
  return { have, total: ALL_STICKERS.length, missing: ALL_STICKERS.length - have, repeated, pct: Math.round((have / ALL_STICKERS.length) * 100) };
}

function getTeamStats(team, owned) {
  const stickers = ALL_STICKERS.filter(s => s.team === team);
  const have = stickers.filter(s => (owned[s.id] || 0) >= 1).length;
  return { have, total: stickers.length, pct: Math.round((have / stickers.length) * 100) };
}

function buildWhatsAppMessage(owned, waTypeFilter) {
  const lines = ["📋 *Láminas que me faltan - Panini 2026*\n"];
  for (const [, teams] of Object.entries(GROUPS)) {
    for (const team of teams) {
      const flag = TEAM_FLAGS[team] || "";
      const name = TEAM_NAMES[team] || team;
      let missing;
      if (waTypeFilter === "escudos") {
        const s = ALL_STICKERS.find(x => x.team === team && x.type === "escudo");
        missing = s && !(owned[s.id] >= 1) ? [`${team}01`] : [];
      } else if (waTypeFilter === "fotos") {
        const s = ALL_STICKERS.find(x => x.team === team && x.type === "equipo");
        missing = s && !(owned[s.id] >= 1) ? [`${team}13`] : [];
      } else {
        missing = ALL_STICKERS.filter(s => s.team === team && !(owned[s.id] >= 1)).map(s => s.id);
      }
      if (missing.length > 0) {
        lines.push(`${flag} *${name}*: ${missing.join(", ")}`);
      }
    }
  }
  if (waTypeFilter === "all") {
    const fwcMissing = ALL_STICKERS.filter(s => s.team === "FWC" && !(owned[s.id] >= 1)).map(s => s.id);
    if (fwcMissing.length > 0) lines.push(`⭐ *FWC Especiales*: ${fwcMissing.join(", ")}`);
    const ccMissing = ALL_STICKERS.filter(s => s.team === "CC" && !(owned[s.id] >= 1)).map(s => s.id);
    if (ccMissing.length > 0) lines.push(`🥤 *Coca-Cola*: ${ccMissing.join(", ")}`);
  }
  return lines.join("\n");
}

function ProgressBar({ pct, color = "#22c55e", height = 5 }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{ background: color, height: "100%", width: `${pct}%`, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );
}

// Chip grande y optimizado para móvil
// Muestra solo el número en negrita, y etiqueta ESC / FOT solo para esas dos láminas
// Con lámina: chip + botón − grande y separado para no confundir toques
function Chip({ sticker, count, onAdd, onRemove }) {
  const has = count >= 1;
  const rep = count > 1;
  const color = GROUP_COLORS[sticker.group] || "#64748b";
  const num = sticker.id.replace(sticker.team, "");
  const subLabel = sticker.type === "escudo" ? "ESC"
    : sticker.type === "equipo" ? "FOT"
    : sticker.type === "portada" ? "PRT"
    : sticker.type === "coca" ? "CC"
    : sticker.type === "especial" ? "★"
    : null;

  if (!has) {
    return (
      <button onClick={onAdd} title={`${sticker.id}${subLabel ? " — " + sticker.label : ""}`} style={{
        width: 54, height: 54, borderRadius: 12,
        border: "1.5px dashed #334155", background: "#0f172a", color: "#475569",
        cursor: "pointer", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2, fontFamily: "inherit",
      }}>
        <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, color: "#475569" }}>{num}</span>
        {subLabel && <span style={{ fontSize: 9, lineHeight: 1, color: "#334155", fontWeight: 700, letterSpacing: 0.5 }}>{subLabel}</span>}
      </button>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "stretch", position: "relative" }}>
      <button onClick={onAdd} title={`${sticker.id} · tienes ${count} · toca para +1`} style={{
        width: 46, height: 54, borderRadius: "12px 0 0 12px",
        border: rep ? "2.5px solid #f59e0b" : "2.5px solid #22c55e",
        borderRight: "none",
        background: rep ? "#422006" : "#052e16",
        color: rep ? "#fbbf24" : "#4ade80",
        cursor: "pointer", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
        fontFamily: "inherit", position: "relative",
        boxShadow: `0 0 10px ${color}20`,
      }}>
        {rep && (
          <span style={{
            position: "absolute", top: -8, left: -5,
            background: "#f59e0b", color: "#000", borderRadius: "50%",
            width: 18, height: 18, fontSize: 9, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×{count}</span>
        )}
        <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{num}</span>
        {subLabel && <span style={{ fontSize: 9, lineHeight: 1, opacity: 0.85, fontWeight: 700, letterSpacing: 0.5 }}>{subLabel}</span>}
      </button>
      <button onClick={onRemove} title="Quitar una" style={{
        width: 28, height: 54, borderRadius: "0 12px 12px 0",
        border: rep ? "2.5px solid #f59e0b" : "2.5px solid #22c55e",
        borderLeft: `1px solid ${rep ? "#78350f" : "#14532d"}`,
        background: rep ? "#3d1f02" : "#041f0e",
        color: rep ? "#fcd34d" : "#86efac",
        fontSize: 22, fontWeight: 900, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", lineHeight: 1,
      }}>−</button>
    </div>
  );
}

function Notification({ msg, type }) {
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 9999,
      background: type === "err" ? "#7f1d1d" : type === "info" ? "#1e3a5f" : "#14532d",
      color: "#fff", padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 32px #0009", maxWidth: 320, lineHeight: 1.5,
      animation: "slideIn 0.2s ease",
    }}>{msg}</div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem("panini-user"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [owned, setOwned] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState("album");
  const [groupFilter, setGroupFilter] = useState("all");
  const [showFilter, setShowFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [addInput, setAddInput] = useState("");
  const [notification, setNotification] = useState(null);
  const [waTypeFilter, setWaTypeFilter] = useState("all");
  const [waCopied, setWaCopied] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [missingTypeFilter, setMissingTypeFilter] = useState("all");
  const notifTimer = useRef(null);

  const toggleTeam = (team) => setExpandedTeams(prev => ({ ...prev, [team]: !prev[team] }));
  const expandAll = () => {
    const keys = [...new Set(ALL_STICKERS.map(s => s.team))];
    const all = {};
    keys.forEach(t => { all[t] = true; });
    setExpandedTeams(all);
  };
  const collapseAll = () => setExpandedTeams({});

  const notify = (msg, type = "ok") => {
    clearTimeout(notifTimer.current);
    setNotification({ msg, type });
    notifTimer.current = setTimeout(() => setNotification(null), 2500);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from("collection").select("id, count")
      .then(({ data, error }) => {
        if (error) { notify("❌ Error al cargar", "err"); return; }
        const map = {};
        (data || []).forEach(row => { map[row.id] = row.count; });
        setOwned(map);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("collection-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "collection" }, payload => {
        if (payload.eventType === "DELETE") {
          setOwned(prev => { const n = { ...prev }; delete n[payload.old.id]; return n; });
        } else {
          const { id, count } = payload.new;
          setOwned(prev => ({ ...prev, [id]: count }));
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const upsertSticker = useCallback(async (id, newCount, userId) => {
    setSyncing(true);
    if (newCount <= 0) {
      await supabase.from("collection").delete().eq("id", id);
    } else {
      await supabase.from("collection").upsert(
        { id, count: newCount, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: "id" }
      );
    }
    setSyncing(false);
  }, []);

  const addSticker = useCallback(async (id) => {
    const upper = id.toUpperCase().trim();
    if (!STICKER_MAP[upper]) return false;
    const newCount = (owned[upper] || 0) + 1;
    setOwned(prev => ({ ...prev, [upper]: newCount }));
    await upsertSticker(upper, newCount, user?.id);
    return true;
  }, [owned, upsertSticker, user]);

  const removeSticker = useCallback(async (id) => {
    const cur = owned[id] || 0;
    if (cur === 0) return;
    const newCount = cur - 1;
    setOwned(prev => {
      const n = { ...prev };
      if (newCount === 0) delete n[id]; else n[id] = newCount;
      return n;
    });
    await upsertSticker(id, newCount, user?.id);
  }, [owned, upsertSticker, user]);

  const handleBulkAdd = async () => {
    const ids = addInput.trim().toUpperCase().split(/[\s,;]+/).filter(Boolean);
    let added = 0; const notFound = [];
    for (const id of ids) {
      const ok = await addSticker(id);
      if (ok) added++; else notFound.push(id);
    }
    setAddInput("");
    if (added > 0) notify(`✅ +${added} lámina${added > 1 ? "s" : ""} agregada${added > 1 ? "s" : ""}`, "ok");
    if (notFound.length > 0) notify(`❌ No encontradas: ${notFound.join(", ")}`, "err");
  };

  const visibleStickers = ALL_STICKERS.filter(s => {
    if (groupFilter !== "all" && s.group !== groupFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (TEAM_NAMES[s.team] || s.team).toLowerCase();
      if (!s.id.toLowerCase().includes(q) && !name.includes(q)) return false;
    }
    const c = owned[s.id] || 0;
    if (showFilter === "have" && c < 1) return false;
    if (showFilter === "missing" && c >= 1) return false;
    if (showFilter === "repeated" && c < 2) return false;
    if (showFilter === "escudos" && s.type !== "escudo") return false;
    if (showFilter === "fotos" && s.type !== "equipo") return false;
    return true;
  });

  const stats = getStats(owned);

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh", background: "#020617",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Bebas Neue', sans-serif", gap: 40, padding: 24,
        backgroundImage: "radial-gradient(ellipse at 50% 0%, #1e3a1a 0%, #020617 70%)",
      }}>
        <style>{`
          @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          *{box-sizing:border-box}
          ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f172a}::-webkit-scrollbar-thumb{background:#334155;border-radius:99px}
        `}</style>
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
          <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 12 }}>⚽</div>
          <h1 style={{ color: "#fff", fontSize: 52, letterSpacing: 6, margin: 0, lineHeight: 1 }}>PANINI 2026</h1>
          <p style={{ color: "#4ade80", fontFamily: "'DM Sans', sans-serif", fontSize: 13, letterSpacing: 3, marginTop: 8, textTransform: "uppercase" }}>
            FIFA World Cup · Álbum Familiar
          </p>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.5s 0.1s ease both" }}>
          {USERS.map(u => (
            <button key={u.id} onClick={() => { setUser(u); localStorage.setItem("panini-user", JSON.stringify(u)); }} style={{
              background: "#0f172a", border: `2px solid ${u.color}`,
              borderRadius: 20, padding: "28px 48px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 16px 48px ${u.color}50`; }}
              onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
            >
              <span style={{ fontSize: 48 }}>{u.emoji}</span>
              <span style={{ color: "#fff", fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 4 }}>{u.name}</span>
              <span style={{ color: u.color, fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}>Entrar como {u.name}</span>
            </button>
          ))}
        </div>
        <p style={{ color: "#334155", fontSize: 12, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
          Colección compartida · sincronización en tiempo real
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "album", label: "📗 Álbum" },
    { id: "missing", label: "❌ Faltan" },
    { id: "repeated", label: "🔄 Repetidas" },
    { id: "whatsapp", label: "📤 Compartir" },
    { id: "add", label: "➕ Agregar" },
    { id: "stats", label: "📊 Stats" },
  ];

  const groupOpts = [
    { value: "all", label: "Todos" },
    { value: "FWC", label: "⭐ FWC" },
    ...Object.keys(GROUPS).map(g => ({ value: g, label: `Grupo ${g}` })),
    { value: "CC", label: "🥤 Coca-Cola" },
  ];

  const stickersByTeam = {};
  visibleStickers.forEach(s => {
    if (!stickersByTeam[s.team]) stickersByTeam[s.team] = [];
    stickersByTeam[s.team].push(s);
  });

  return (
    <div style={{ minHeight: "100vh", background: "#020617", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f172a}::-webkit-scrollbar-thumb{background:#334155;border-radius:99px}
        input,select,button{font-family:inherit}
        input::placeholder{color:#475569}
      `}</style>

      {notification && <Notification {...notification} />}

      <header style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 4, color: "#f97316" }}>⚽ PANINI 2026</span>
              {syncing && <span style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>sync…</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ProgressBar pct={stats.pct} color="#22c55e" height={5} />
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{stats.have}/{stats.total} · {stats.pct}%</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{user.emoji}</span>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{user.name}</span>
            <button onClick={() => { setUser(null); localStorage.removeItem("panini-user"); }} style={{
              background: "transparent", border: "1px solid #1e293b", borderRadius: 8,
              color: "#64748b", padding: "4px 10px", fontSize: 11, cursor: "pointer",
            }}>cambiar</button>
          </div>
        </div>
      </header>

      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex" }}>
          {[
            { label: "Tengo", val: stats.have, color: "#22c55e" },
            { label: "Faltan", val: stats.missing, color: "#f43f5e" },
            { label: "Repetidas", val: stats.repeated, color: "#f59e0b" },
            { label: "Total", val: stats.total, color: "#475569" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "8px 0", textAlign: "center", borderRight: i < 3 ? "1px solid #1e293b" : "none" }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", overflowX: "auto" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "transparent", border: "none",
              borderBottom: tab === t.id ? "2px solid #f97316" : "2px solid transparent",
              color: tab === t.id ? "#fff" : "#64748b",
              padding: "11px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 48, color: "#475569" }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 4 }}>CARGANDO ÁLBUM…</div>
        </div>
      )}

      {!loading && (
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "16px 12px 80px" }}>

          {/* ÁLBUM */}
          {tab === "album" && (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={{
                  background: "#1e293b", border: "1px solid #334155", borderRadius: 9, color: "#fff", padding: "9px 10px", fontSize: 12,
                }}>
                  {groupOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={showFilter} onChange={e => setShowFilter(e.target.value)} style={{
                  background: "#1e293b", border: "1px solid #334155", borderRadius: 9, color: "#fff", padding: "9px 10px", fontSize: 12,
                }}>
                  <option value="all">Todas</option>
                  <option value="have">Tengo</option>
                  <option value="missing">Faltan</option>
                  <option value="repeated">Repetidas</option>
                  <option value="escudos">🛡 Solo escudos</option>
                  <option value="fotos">📸 Solo fotos equipo</option>
                </select>
                <input placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{
                  flex: 1, minWidth: 120, background: "#1e293b", border: "1px solid #334155",
                  borderRadius: 9, color: "#fff", padding: "9px 12px", fontSize: 12,
                }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#475569" }}>
                  Toca el número para <strong style={{ color: "#4ade80" }}>agregar</strong> · <strong style={{ color: "#4ade80" }}>−</strong> para quitar
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button onClick={expandAll} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#94a3b8", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                    Expandir todo
                  </button>
                  <button onClick={collapseAll} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#94a3b8", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                    Colapsar todo
                  </button>
                </div>
              </div>
              {Object.keys(stickersByTeam).length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "#475569" }}>Sin resultados</div>
              )}
              {Object.entries(stickersByTeam).map(([team, stickers]) => {
                const ts = getTeamStats(team, owned);
                const grp = stickers[0].group;
                const grpColor = GROUP_COLORS[grp] || "#64748b";
                const isSpecial = team === "FWC" || team === "CC";
                const flag = TEAM_FLAGS[team] || "";
                const teamLabel = isSpecial
                  ? (team === "FWC" ? "⭐ FWC — Especiales" : "🥤 Coca-Cola")
                  : `${flag} ${TEAM_NAMES[team] || team}`;
                const isOpen = !!expandedTeams[team];
                return (
                  <div key={team} style={{ marginBottom: 8, background: "#0f172a", borderRadius: 14, overflow: "hidden", border: "1px solid #1e293b" }}>
                    {/* Cabecera — siempre visible, toca para abrir/cerrar */}
                    <button onClick={() => toggleTeam(team)} style={{
                      width: "100%", padding: "11px 14px", display: "flex", alignItems: "center", gap: 10,
                      background: `linear-gradient(90deg, ${grpColor}18 0%, #0f172a 100%)`,
                      borderLeft: `3px solid ${grpColor}`,
                      border: "none", borderBottom: isOpen ? "1px solid #1e293b" : "none",
                      cursor: "pointer", textAlign: "left",
                    }}>
                      <span style={{ color: "#64748b", fontSize: 14, lineHeight: 1, minWidth: 16 }}>{isOpen ? "▾" : "▸"}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 2, color: "#fff" }}>{teamLabel}</span>
                        {!isSpecial && <span style={{ marginLeft: 8, fontSize: 11, color: grpColor, fontWeight: 600 }}>Grupo {grp} · {team}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: ts.pct === 100 ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>{ts.have}/{ts.total}</span>
                        <div style={{ width: 56 }}><ProgressBar pct={ts.pct} color={ts.pct === 100 ? "#22c55e" : grpColor} /></div>
                        {ts.pct === 100 && <span>✅</span>}
                      </div>
                    </button>
                    {/* Chips — solo visibles si está expandido */}
                    {isOpen && (
                      <div style={{ padding: "10px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {stickers.map(s => (
                          <Chip key={s.id} sticker={s} count={owned[s.id] || 0}
                            onAdd={() => { addSticker(s.id); notify(`✅ ${s.id} +1`, "ok"); }}
                            onRemove={() => { removeSticker(s.id); notify(`🗑 ${s.id} -1`, "info"); }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* FALTAN */}
          {tab === "missing" && (
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, color: "#f43f5e", marginTop: 0 }}>
                ❌ FALTANTES — {stats.missing}
              </h2>
              {stats.missing === 0 ? (
                <div style={{ textAlign: "center", padding: 48 }}>
                  <div style={{ fontSize: 48 }}>🏆</div>
                  <p style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 4, color: "#22c55e" }}>¡ÁLBUM COMPLETO!</p>
                </div>
              ) : (
                <>
                  {/* Filtros de tipo */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {[
                      { value: "all", label: "📋 Todas" },
                      { value: "escudos", label: "🛡 Escudos" },
                      { value: "fotos", label: "📸 Fotos equipo" },
                    ].map(o => (
                      <button key={o.value} onClick={() => setMissingTypeFilter(o.value)} style={{
                        background: missingTypeFilter === o.value ? "#1e3a2e" : "#1e293b",
                        border: `1px solid ${missingTypeFilter === o.value ? "#22c55e" : "#334155"}`,
                        borderRadius: 9, color: missingTypeFilter === o.value ? "#22c55e" : "#94a3b8",
                        padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                      }}>{o.label}</button>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>
                    Toca cualquier chip para marcarlo como conseguido
                  </p>
                  {/* Chips uniformes del mismo tamaño que el álbum, agrupados por equipo */}
                  {Object.entries(
                    ALL_STICKERS
                      .filter(s => {
                        if (owned[s.id] >= 1) return false;
                        if (missingTypeFilter === "escudos" && s.type !== "escudo") return false;
                        if (missingTypeFilter === "fotos" && s.type !== "equipo") return false;
                        return true;
                      })
                      .reduce((acc, s) => {
                        if (!acc[s.team]) acc[s.team] = [];
                        acc[s.team].push(s);
                        return acc;
                      }, {})
                  ).map(([team, stickers]) => {
                    const grp = stickers[0].group;
                    const grpColor = GROUP_COLORS[grp] || "#64748b";
                    const flag = TEAM_FLAGS[team] || "";
                    return (
                      <div key={team} style={{ marginBottom: 10, background: "#0f172a", borderRadius: 12, overflow: "hidden", border: "1px solid #1e293b" }}>
                        <div style={{ padding: "8px 12px", background: `${grpColor}18`, borderLeft: `3px solid ${grpColor}`, borderBottom: "1px solid #1e293b" }}>
                          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2, color: "#fff" }}>
                            {flag} {TEAM_NAMES[team] || team}
                            <span style={{ color: grpColor, fontSize: 11, marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>
                              {stickers.length} faltante{stickers.length !== 1 ? "s" : ""}
                            </span>
                          </span>
                        </div>
                        <div style={{ padding: "10px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {stickers.map(s => {
                            const num = s.id.replace(s.team, "");
                            const subLabel = s.type === "escudo" ? "ESC"
                              : s.type === "equipo" ? "FOT"
                              : s.type === "portada" ? "PRT"
                              : s.type === "coca" ? "CC"
                              : s.type === "especial" ? "★"
                              : null;
                            return (
                              <button key={s.id}
                                onClick={() => { addSticker(s.id); notify(`✅ ${s.id} conseguida`, "ok"); }}
                                title={`${s.id}${subLabel ? " — " + s.label : ""}`}
                                style={{
                                  width: 54, height: 54, borderRadius: 12,
                                  border: "1.5px dashed #f43f5e44",
                                  background: "#150a0a",
                                  color: "#f87171",
                                  cursor: "pointer",
                                  display: "flex", flexDirection: "column",
                                  alignItems: "center", justifyContent: "center",
                                  gap: 2, fontFamily: "inherit",
                                  transition: "all 0.12s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background="#052e16"; e.currentTarget.style.borderColor="#22c55e"; e.currentTarget.style.color="#4ade80"; }}
                                onMouseLeave={e => { e.currentTarget.style.background="#150a0a"; e.currentTarget.style.borderColor="#f43f5e44"; e.currentTarget.style.color="#f87171"; }}
                              >
                                <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{num}</span>
                                {subLabel && <span style={{ fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 0.5 }}>{subLabel}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* REPETIDAS */}
          {tab === "repeated" && (
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, color: "#f59e0b", marginTop: 0 }}>
                🔄 REPETIDAS — {stats.repeated} copias extra
              </h2>
              {stats.repeated === 0 ? (
                <p style={{ color: "#475569" }}>Aún no hay repetidas.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ALL_STICKERS.filter(s => (owned[s.id] || 0) > 1)
                    .sort((a, b) => (owned[b.id] || 0) - (owned[a.id] || 0))
                    .map(s => {
                      const cnt = owned[s.id];
                      const grpColor = GROUP_COLORS[s.group] || "#64748b";
                      return (
                        <div key={s.id} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          background: "#0f172a", borderRadius: 12, padding: "10px 14px",
                          border: "1px solid #f59e0b33", borderLeft: `3px solid ${grpColor}`,
                        }}>
                          <span style={{ background: "#f59e0b", color: "#000", borderRadius: 8, padding: "2px 10px", fontSize: 13, fontWeight: 900, minWidth: 36, textAlign: "center" }}>×{cnt}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{s.id}</span>
                            <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{TEAM_FLAGS[s.team]||""} {TEAM_NAMES[s.team] || s.team} · {s.label}</span>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => { addSticker(s.id); notify(`✅ ${s.id} +1`, "ok"); }} style={{
                              background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
                              color: "#22c55e", width: 36, height: 36, cursor: "pointer", fontSize: 20, fontWeight: 900,
                            }}>+</button>
                            <button onClick={() => { removeSticker(s.id); notify(`🗑 ${s.id} -1`, "info"); }} style={{
                              background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
                              color: "#f43f5e", width: 36, height: 36, cursor: "pointer", fontSize: 20, fontWeight: 900,
                            }}>−</button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* COMPARTIR WHATSAPP */}
          {tab === "whatsapp" && (() => {
            const msg = buildWhatsAppMessage(owned, waTypeFilter);
            const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            return (
              <div style={{ maxWidth: 560 }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, color: "#25d366", marginTop: 0 }}>
                  📤 COMPARTIR FALTANTES
                </h2>
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
                  Genera un mensaje con tus láminas faltantes para enviar por WhatsApp u otro medio.
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[
                    { value: "all", label: "📋 Todas las faltantes" },
                    { value: "escudos", label: "🛡 Solo escudos" },
                    { value: "fotos", label: "📸 Solo fotos equipo" },
                  ].map(o => (
                    <button key={o.value} onClick={() => setWaTypeFilter(o.value)} style={{
                      background: waTypeFilter === o.value ? "#1e3a2e" : "#1e293b",
                      border: `1px solid ${waTypeFilter === o.value ? "#25d366" : "#334155"}`,
                      borderRadius: 9, color: waTypeFilter === o.value ? "#25d366" : "#94a3b8",
                      padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}>{o.label}</button>
                  ))}
                </div>
                <div style={{
                  background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14,
                  padding: 16, marginBottom: 16, maxHeight: 340, overflowY: "auto",
                  fontSize: 12, lineHeight: 2, color: "#94a3b8",
                  whiteSpace: "pre-wrap", fontFamily: "monospace",
                }}>{msg}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => {
                    navigator.clipboard.writeText(msg).then(() => {
                      setWaCopied(true);
                      setTimeout(() => setWaCopied(false), 2500);
                    });
                  }} style={{
                    flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 10,
                    color: waCopied ? "#22c55e" : "#fff", padding: "13px 16px",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>
                    {waCopied ? "✅ ¡Copiado!" : "📋 Copiar texto"}
                  </button>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, background: "#25d366", borderRadius: 10,
                    color: "#fff", padding: "13px 16px", fontSize: 14, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    textDecoration: "none",
                  }}>📱 Abrir WhatsApp</a>
                </div>
              </div>
            );
          })()}

          {/* AGREGAR */}
          {tab === "add" && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, color: "#f97316", marginTop: 0 }}>➕ AGREGAR LÁMINAS</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
                Escribe uno o varios IDs separados por espacios o comas y presiona <strong style={{ color: "#fff" }}>Agregar</strong>.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={addInput} onChange={e => setAddInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleBulkAdd()}
                  placeholder="COL01 COL05 FWC03 CC07..." style={{
                    flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 10,
                    color: "#fff", padding: "12px 16px", fontSize: 14,
                  }} />
                <button onClick={handleBulkAdd} style={{
                  background: "#f97316", border: "none", borderRadius: 10, color: "#fff",
                  padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>AGREGAR</button>
              </div>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 20, marginTop: 24 }}>
                <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 2, margin: "0 0 14px", color: "#f97316" }}>FORMATO DE IDs</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                  {[
                    ["COL01","Escudo Colombia"],["COL02–COL12","Jugadores 1–11"],
                    ["COL13","Foto de equipo"],["COL14–COL20","Jugadores 12–18"],
                    ["FWC00–FWC19","Especiales álbum"],["CC01–CC14","Coca-Cola"],
                  ].map(([code, desc]) => (
                    <div key={code} style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ color: "#f97316", fontWeight: 700, marginBottom: 2, fontSize: 11 }}>{code}</div>
                      <div style={{ color: "#64748b", fontSize: 11 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 20, marginTop: 12 }}>
                <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 2, margin: "0 0 12px", color: "#94a3b8" }}>CÓDIGOS DE EQUIPOS</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {Object.entries(TEAM_NAMES).map(([code, name]) => (
                    <span key={code} style={{ background: "#1e293b", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#94a3b8" }}>
                      <strong style={{ color: "#f97316" }}>{code}</strong> {TEAM_FLAGS[code]||""} {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATS */}
          {tab === "stats" && (
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, marginTop: 0 }}>📊 ESTADÍSTICAS</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
                {[
                  { label: "Progreso", val: `${stats.pct}%`, sub: `${stats.have} de ${stats.total}`, color: "#22c55e" },
                  { label: "Faltan", val: stats.missing, sub: "láminas", color: "#f43f5e" },
                  { label: "Repetidas", val: stats.repeated, sub: "copias extra", color: "#f59e0b" },
                  { label: "Equipos completos", val: Object.values(GROUPS).flat().filter(t => getTeamStats(t, owned).pct === 100).length, sub: `de ${Object.values(GROUPS).flat().length}`, color: "#a78bfa" },
                ].map((c, i) => (
                  <div key={i} style={{ background: "#0f172a", border: `1px solid ${c.color}30`, borderRadius: 14, padding: "16px 18px", borderLeft: `3px solid ${c.color}` }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: c.color, lineHeight: 1 }}>{c.val}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{c.sub}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 3, color: "#94a3b8", marginBottom: 12 }}>PROGRESO POR GRUPO</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
                {Object.entries(GROUPS).map(([grp, teams]) => {
                  const total = teams.length * 20;
                  const have = teams.reduce((acc, t) => acc + ALL_STICKERS.filter(s => s.team === t && (owned[s.id] || 0) >= 1).length, 0);
                  const pct = Math.round((have / total) * 100);
                  const color = GROUP_COLORS[grp];
                  return (
                    <div key={grp} style={{ display: "flex", alignItems: "center", gap: 12, background: "#0f172a", borderRadius: 10, padding: "10px 14px", border: "1px solid #1e293b", borderLeft: `3px solid ${color}` }}>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color, width: 22, textAlign: "center" }}>{grp}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{teams.map(t => `${TEAM_FLAGS[t]||""}${TEAM_NAMES[t]}`).join(" · ")}</span>
                          <span style={{ fontSize: 11, color: pct === 100 ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>{have}/{total}</span>
                        </div>
                        <ProgressBar pct={pct} color={pct === 100 ? "#22c55e" : color} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? "#22c55e" : "#fff", width: 38, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 3, color: "#94a3b8", marginBottom: 12 }}>TOP REPETIDAS</h3>
              {Object.entries(owned).filter(([,v]) => v > 1).length === 0 ? (
                <p style={{ color: "#475569", fontSize: 13 }}>Aún no hay repetidas.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(owned).filter(([,v]) => v > 1).sort((a,b) => b[1]-a[1]).slice(0,15).map(([id, cnt]) => {
                    const s = STICKER_MAP[id]; if (!s) return null;
                    const color = GROUP_COLORS[s.group] || "#64748b";
                    return (
                      <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#0f172a", borderRadius: 10, border: "1px solid #1e293b" }}>
                        <span style={{ background: "#f59e0b", color: "#000", borderRadius: 6, padding: "1px 10px", fontSize: 12, fontWeight: 900 }}>×{cnt}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{id}</span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{TEAM_FLAGS[s.team]||""} {TEAM_NAMES[s.team] || s.team} · {s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
