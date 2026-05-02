import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase.js";

// ─── DATOS BASE ───────────────────────────────────────────────────────────────

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

const GROUP_COLORS = {
  A:"#ef4444", B:"#f97316", C:"#eab308", D:"#22c55e",
  E:"#14b8a6", F:"#3b82f6", G:"#8b5cf6", H:"#ec4899",
  I:"#f43f5e", J:"#06b6d4", K:"#84cc16", L:"#a78bfa",
  FWC:"#f59e0b", CC:"#dc2626",
};

function buildStickers() {
  const all = [];
  for (let i = 0; i <= 19; i++) {
    const num = String(i).padStart(2, "0");
    all.push({ id: `FWC-${num}`, group: "FWC", team: "FWC",
      label: i === 0 ? "Portada" : `Especial ${i}`, type: i === 0 ? "portada" : "especial" });
  }
  for (const [grp, teams] of Object.entries(GROUPS)) {
    for (const team of teams) {
      all.push({ id: `${team}-1`, group: grp, team, label: "Escudo", type: "escudo" });
      all.push({ id: `${team}-2`, group: grp, team, label: "Equipo", type: "equipo" });
      for (let j = 3; j <= 20; j++) {
        all.push({ id: `${team}-${j}`, group: grp, team, label: `Jugador ${j - 2}`, type: "jugador" });
      }
    }
  }
  for (let i = 1; i <= 14; i++) {
    all.push({ id: `CC-${i}`, group: "CC", team: "CC", label: `Coca-Cola ${i}`, type: "coca" });
  }
  return all;
}

const ALL_STICKERS = buildStickers();
const STICKER_MAP = Object.fromEntries(ALL_STICKERS.map(s => [s.id, s]));

const USERS = [
  { id: "nico", name: "Nicolás", emoji: "🎓", color: "#f97316" },
  { id: "papa", name: "Papá", emoji: "⭐", color: "#3b82f6" },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────

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

// ─── COMPONENTES PEQUEÑOS ─────────────────────────────────────────────────────

function ProgressBar({ pct, color = "#22c55e", height = 5 }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{ background: color, height: "100%", width: `${pct}%`, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Chip({ sticker, count, onAdd, onRemove }) {
  const has = count >= 1;
  const rep = count > 1;
  const color = GROUP_COLORS[sticker.group] || "#64748b";
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={onAdd}
        onContextMenu={e => { e.preventDefault(); onRemove(); }}
        title={`${sticker.id} — ${sticker.label}\nClic: +1 | Clic derecho: -1${count > 0 ? `\nTienes: ${count}` : ""}`}
        style={{
          width: 44, height: 44, borderRadius: 10,
          border: rep ? `2.5px solid #f59e0b` : has ? `2.5px solid #22c55e` : `1.5px dashed #334155`,
          background: rep ? "#422006" : has ? "#052e16" : "#0f172a",
          color: rep ? "#fbbf24" : has ? "#4ade80" : "#475569",
          fontSize: 9, fontWeight: 700, cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 1, transition: "all 0.12s", fontFamily: "inherit",
          boxShadow: has ? `0 0 8px ${color}30` : "none",
        }}
      >
        <span style={{ fontSize: 8, opacity: 0.7, lineHeight: 1 }}>
          {sticker.id.replace(`${sticker.team}-`, sticker.team === "FWC" ? "FWC-" : sticker.team === "CC" ? "CC-" : "")}
        </span>
        <span style={{ fontSize: 8, lineHeight: 1, maxWidth: 38, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
          {sticker.type === "escudo" ? "🛡" : sticker.type === "equipo" ? "📸" : sticker.type === "portada" ? "📖" : sticker.type === "coca" ? "🥤" : `J${sticker.label.replace("Jugador ", "")}`}
        </span>
      </button>
      {rep && (
        <span style={{
          position: "absolute", top: -7, right: -7,
          background: "#f59e0b", color: "#000", borderRadius: "50%",
          width: 17, height: 17, fontSize: 9, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>×{count}</span>
      )}
    </div>
  );
}

function Notification({ msg, type }) {
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 9999,
      background: type === "err" ? "#7f1d1d" : type === "info" ? "#1e3a5f" : "#14532d",
      color: "#fff", padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 32px #0009", maxWidth: 300, lineHeight: 1.4,
      animation: "slideIn 0.2s ease",
    }}>{msg}</div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("panini-user");
    return saved ? JSON.parse(saved) : null;
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
  const notifTimer = useRef(null);

  const notify = (msg, type = "ok") => {
    clearTimeout(notifTimer.current);
    setNotification({ msg, type });
    notifTimer.current = setTimeout(() => setNotification(null), 2800);
  };

  // ── Cargar colección desde Supabase ──
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from("collection").select("id, count")
      .then(({ data, error }) => {
        if (error) { notify("❌ Error al cargar datos", "err"); return; }
        const map = {};
        (data || []).forEach(row => { map[row.id] = row.count; });
        setOwned(map);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // ── Realtime sync ──
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("collection-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "collection" }, payload => {
        if (payload.eventType === "DELETE") {
          setOwned(prev => { const n = { ...prev }; delete n[payload.old.id]; return n; });
        } else {
          const { id, count } = payload.new;
          setOwned(prev => ({ ...prev, [id]: count }));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  // ── Actualizar en Supabase ──
  const upsertSticker = useCallback(async (id, newCount) => {
    setSyncing(true);
    if (newCount <= 0) {
      await supabase.from("collection").delete().eq("id", id);
    } else {
      await supabase.from("collection").upsert(
        { id, count: newCount, updated_at: new Date().toISOString(), updated_by: user?.id },
        { onConflict: "id" }
      );
    }
    setSyncing(false);
  }, [user]);

  const addSticker = useCallback(async (id) => {
    const upper = id.toUpperCase().trim();
    if (!STICKER_MAP[upper]) return false;
    const newCount = (owned[upper] || 0) + 1;
    setOwned(prev => ({ ...prev, [upper]: newCount }));
    await upsertSticker(upper, newCount);
    return true;
  }, [owned, upsertSticker]);

  const removeSticker = useCallback(async (id) => {
    const cur = owned[id] || 0;
    if (cur === 0) return;
    const newCount = cur - 1;
    setOwned(prev => {
      const n = { ...prev };
      if (newCount === 0) delete n[id]; else n[id] = newCount;
      return n;
    });
    await upsertSticker(id, newCount);
  }, [owned, upsertSticker]);

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

  // ── Filtrado ──
  const visibleStickers = ALL_STICKERS.filter(s => {
    if (groupFilter !== "all") {
      if (s.group !== groupFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const name = (TEAM_NAMES[s.team] || s.team).toLowerCase();
      if (!s.id.toLowerCase().includes(q) && !name.includes(q)) return false;
    }
    const c = owned[s.id] || 0;
    if (showFilter === "have" && c < 1) return false;
    if (showFilter === "missing" && c >= 1) return false;
    if (showFilter === "repeated" && c < 2) return false;
    return true;
  });

  const stats = getStats(owned);

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh", background: "#020617",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Bebas Neue', sans-serif", gap: 40, padding: 24,
        backgroundImage: "radial-gradient(ellipse at 50% 0%, #1e3a1a 0%, #020617 70%)",
      }}>
        <style>{`
          @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #0f172a; }
          ::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
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
            <button key={u.id} onClick={() => {
              setUser(u);
              localStorage.setItem("panini-user", JSON.stringify(u));
            }} style={{
              background: "#0f172a",
              border: `2px solid ${u.color}`,
              borderRadius: 20, padding: "28px 48px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              transition: "all 0.2s",
              boxShadow: `0 0 0 0 ${u.color}`,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 48px ${u.color}50`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 0 0 0 ${u.color}`; }}
            >
              <span style={{ fontSize: 48 }}>{u.emoji}</span>
              <span style={{ color: "#fff", fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 4 }}>{u.name}</span>
              <span style={{ color: u.color, fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}>Entrar como {u.name}</span>
            </button>
          ))}
        </div>
        <p style={{ color: "#334155", fontSize: 12, fontFamily: "'DM Sans', sans-serif", textAlign: "center", animation: "fadeUp 0.5s 0.2s ease both" }}>
          La colección es compartida — los cambios se sincronizan en tiempo real
        </p>
      </div>
    );
  }

  // ─── MAIN APP ────────────────────────────────────────────────────────────

  const tabs = [
    { id: "album", label: "📗 Álbum" },
    { id: "missing", label: "❌ Faltan" },
    { id: "repeated", label: "🔄 Repetidas" },
    { id: "add", label: "➕ Agregar" },
    { id: "stats", label: "📊 Stats" },
  ];

  const groupOpts = [
    { value: "all", label: "Todos los grupos" },
    { value: "FWC", label: "⭐ FWC Especiales" },
    ...Object.keys(GROUPS).map(g => ({ value: g, label: `Grupo ${g}` })),
    { value: "CC", label: "🥤 Coca-Cola" },
  ];

  // Agrupar por team para el álbum
  const stickersByTeam = {};
  visibleStickers.forEach(s => {
    if (!stickersByTeam[s.team]) stickersByTeam[s.team] = [];
    stickersByTeam[s.team].push(s);
  });

  return (
    <div style={{ minHeight: "100vh", background: "#020617", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
        input, select, button { font-family: inherit; }
        input::placeholder { color: #475569; }
      `}</style>

      {notification && <Notification {...notification} />}

      {/* HEADER */}
      <header style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 20px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 4, color: "#f97316" }}>⚽ PANINI 2026</span>
              {syncing && <span style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>sincronizando…</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ProgressBar pct={stats.pct} color="#22c55e" height={5} />
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{stats.have}/{stats.total} · {stats.pct}%</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>{user.emoji}</span>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{user.name}</span>
            <button onClick={() => { setUser(null); localStorage.removeItem("panini-user"); }} style={{
              background: "transparent", border: "1px solid #1e293b", borderRadius: 8,
              color: "#64748b", padding: "4px 10px", fontSize: 11, cursor: "pointer",
            }}>cambiar</button>
          </div>
        </div>
      </header>

      {/* STATS STRIP */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex" }}>
          {[
            { label: "Tengo", val: stats.have, color: "#22c55e" },
            { label: "Faltan", val: stats.missing, color: "#f43f5e" },
            { label: "Repetidas", val: stats.repeated, color: "#f59e0b" },
            { label: "Total", val: stats.total, color: "#475569" },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: "8px 0", textAlign: "center",
              borderRight: i < 3 ? "1px solid #1e293b" : "none",
            }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", overflowX: "auto" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "transparent", border: "none",
              borderBottom: tab === t.id ? "2px solid #f97316" : "2px solid transparent",
              color: tab === t.id ? "#fff" : "#64748b",
              padding: "11px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              transition: "color 0.15s",
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
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 48px" }}>

          {/* ── ÁLBUM ── */}
          {tab === "album" && (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={{
                  background: "#1e293b", border: "1px solid #334155", borderRadius: 9,
                  color: "#fff", padding: "9px 12px", fontSize: 12,
                }}>
                  {groupOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={showFilter} onChange={e => setShowFilter(e.target.value)} style={{
                  background: "#1e293b", border: "1px solid #334155", borderRadius: 9,
                  color: "#fff", padding: "9px 12px", fontSize: 12,
                }}>
                  <option value="all">Todas</option>
                  <option value="have">Tengo</option>
                  <option value="missing">Faltan</option>
                  <option value="repeated">Repetidas</option>
                </select>
                <input
                  placeholder="🔍 Buscar equipo o ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1, minWidth: 140, background: "#1e293b", border: "1px solid #334155",
                    borderRadius: 9, color: "#fff", padding: "9px 12px", fontSize: 12,
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: "#475569", marginBottom: 16 }}>
                💡 <strong style={{ color: "#64748b" }}>Clic izquierdo</strong> para añadir · <strong style={{ color: "#64748b" }}>Clic derecho</strong> para quitar
              </p>

              {Object.keys(stickersByTeam).length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "#475569" }}>Sin resultados para este filtro</div>
              )}

              {Object.entries(stickersByTeam).map(([team, stickers]) => {
                const ts = getTeamStats(team, owned);
                const grp = stickers[0].group;
                const grpColor = GROUP_COLORS[grp] || "#64748b";
                const isSpecial = team === "FWC" || team === "CC";
                const teamLabel = isSpecial
                  ? (team === "FWC" ? "⭐ FWC — Especiales del Álbum" : "🥤 Coca-Cola")
                  : `${TEAM_NAMES[team] || team}`;

                return (
                  <div key={team} style={{ marginBottom: 16, background: "#0f172a", borderRadius: 14, overflow: "hidden", border: "1px solid #1e293b" }}>
                    <div style={{
                      padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
                      borderBottom: "1px solid #1e293b",
                      background: `linear-gradient(90deg, ${grpColor}18 0%, #0f172a 100%)`,
                      borderLeft: `3px solid ${grpColor}`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 2, color: "#fff" }}>{teamLabel}</span>
                        {!isSpecial && (
                          <span style={{ marginLeft: 10, fontSize: 11, color: grpColor, fontWeight: 600 }}>Grupo {grp} · {team}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: ts.pct === 100 ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>
                          {ts.have}/{ts.total}
                        </span>
                        <div style={{ width: 64 }}><ProgressBar pct={ts.pct} color={ts.pct === 100 ? "#22c55e" : grpColor} /></div>
                        {ts.pct === 100 && <span style={{ fontSize: 14 }}>✅</span>}
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {stickers.map(s => (
                        <Chip key={s.id} sticker={s} count={owned[s.id] || 0}
                          onAdd={() => { addSticker(s.id); notify(`✅ ${s.id} +1`, "ok"); }}
                          onRemove={() => { removeSticker(s.id); notify(`🗑 ${s.id} -1`, "info"); }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FALTANTES ── */}
          {tab === "missing" && (
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, color: "#f43f5e", marginTop: 0 }}>
                ❌ FALTANTES — {stats.missing} láminas
              </h2>
              {stats.missing === 0 ? (
                <div style={{ textAlign: "center", padding: 48 }}>
                  <div style={{ fontSize: 48 }}>🏆</div>
                  <p style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 4, color: "#22c55e" }}>¡ÁLBUM COMPLETO!</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Clic en cualquier ID para marcarla como conseguida</p>
                  {/* Agrupadas por equipo */}
                  {Object.entries(
                    ALL_STICKERS.filter(s => !(owned[s.id] >= 1)).reduce((acc, s) => {
                      if (!acc[s.team]) acc[s.team] = [];
                      acc[s.team].push(s);
                      return acc;
                    }, {})
                  ).map(([team, stickers]) => {
                    const grp = stickers[0].group;
                    const grpColor = GROUP_COLORS[grp] || "#64748b";
                    return (
                      <div key={team} style={{ marginBottom: 12, background: "#0f172a", borderRadius: 12, overflow: "hidden", border: "1px solid #1e293b" }}>
                        <div style={{ padding: "8px 12px", background: `${grpColor}18`, borderLeft: `3px solid ${grpColor}`, borderBottom: "1px solid #1e293b" }}>
                          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2 }}>
                            {TEAM_NAMES[team] || team} <span style={{ color: grpColor, fontSize: 11 }}>({stickers.length} faltan)</span>
                          </span>
                        </div>
                        <div style={{ padding: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {stickers.map(s => (
                            <button key={s.id} onClick={() => { addSticker(s.id); notify(`✅ ${s.id} conseguida`, "ok"); }}
                              style={{
                                background: "#1e293b", border: "1px dashed #334155", borderRadius: 8,
                                color: "#94a3b8", padding: "4px 10px", fontSize: 11, cursor: "pointer",
                                transition: "all 0.12s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "#22c55e"; e.currentTarget.style.color = "#22c55e"; e.currentTarget.style.background = "#052e16"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "#1e293b"; }}
                            >{s.id}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ── REPETIDAS ── */}
          {tab === "repeated" && (
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, color: "#f59e0b", marginTop: 0 }}>
                🔄 REPETIDAS — {stats.repeated} copias extra
              </h2>
              {stats.repeated === 0 ? (
                <p style={{ color: "#475569" }}>Aún no hay repetidas. ¡Buena racha!</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ALL_STICKERS.filter(s => (owned[s.id] || 0) > 1)
                    .sort((a, b) => (owned[b.id] || 0) - (owned[a.id] || 0))
                    .map(s => {
                      const cnt = owned[s.id];
                      const grpColor = GROUP_COLORS[s.group] || "#64748b";
                      return (
                        <div key={s.id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          background: "#0f172a", borderRadius: 12, padding: "10px 14px",
                          border: "1px solid #f59e0b33", borderLeft: `3px solid ${grpColor}`,
                        }}>
                          <span style={{ background: "#f59e0b", color: "#000", borderRadius: 8, padding: "2px 10px", fontSize: 13, fontWeight: 900, minWidth: 36, textAlign: "center" }}>×{cnt}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{s.id}</span>
                            <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{TEAM_NAMES[s.team] || s.team} · {s.label}</span>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => { addSticker(s.id); notify(`✅ ${s.id} +1`, "ok"); }} style={{
                              background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
                              color: "#22c55e", width: 28, height: 28, cursor: "pointer", fontSize: 14,
                            }}>+</button>
                            <button onClick={() => { removeSticker(s.id); notify(`🗑 ${s.id} -1`, "info"); }} style={{
                              background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
                              color: "#f43f5e", width: 28, height: 28, cursor: "pointer", fontSize: 14,
                            }}>−</button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ── AGREGAR ── */}
          {tab === "add" && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, color: "#f97316", marginTop: 0 }}>
                ➕ AGREGAR LÁMINAS
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
                Escribe uno o varios IDs separados por espacios o comas y presiona <strong style={{ color: "#fff" }}>Agregar</strong> o <strong style={{ color: "#fff" }}>Enter</strong>.
              </p>

              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={addInput}
                  onChange={e => setAddInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleBulkAdd()}
                  placeholder="COL-1 COL-5 FWC-03 CC-7..."
                  style={{
                    flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 10,
                    color: "#fff", padding: "12px 16px", fontSize: 14,
                  }}
                />
                <button onClick={handleBulkAdd} style={{
                  background: "#f97316", border: "none", borderRadius: 10, color: "#fff",
                  padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>AGREGAR</button>
              </div>

              {/* Guía de formato */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 20, marginTop: 24 }}>
                <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 2, margin: "0 0 14px", color: "#f97316" }}>FORMATO DE IDs</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                  {[
                    ["COL-1", "Escudo Colombia"],
                    ["COL-2", "Foto de equipo"],
                    ["COL-3 … COL-20", "Jugadores 1–18"],
                    ["FWC-00 … FWC-19", "Especiales álbum"],
                    ["CC-1 … CC-14", "Coca-Cola"],
                    ["BRA-7, ARG-10", "Múltiples a la vez"],
                  ].map(([code, desc]) => (
                    <div key={code} style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ color: "#f97316", fontWeight: 700, marginBottom: 2 }}>{code}</div>
                      <div style={{ color: "#64748b" }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referencia de equipos */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 20, marginTop: 16 }}>
                <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 2, margin: "0 0 14px", color: "#94a3b8" }}>CÓDIGOS DE EQUIPOS</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(TEAM_NAMES).map(([code, name]) => (
                    <span key={code} title={name} style={{
                      background: "#1e293b", borderRadius: 6, padding: "3px 8px",
                      fontSize: 11, color: "#94a3b8", cursor: "default",
                    }}>
                      <strong style={{ color: "#f97316" }}>{code}</strong> {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STATS ── */}
          {tab === "stats" && (
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, marginTop: 0 }}>📊 ESTADÍSTICAS</h2>

              {/* Cards globales */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 28 }}>
                {[
                  { label: "Progreso global", val: `${stats.pct}%`, sub: `${stats.have} de ${stats.total} láminas`, color: "#22c55e" },
                  { label: "Faltan", val: stats.missing, sub: "láminas por conseguir", color: "#f43f5e" },
                  { label: "Repetidas", val: stats.repeated, sub: "copias extra disponibles", color: "#f59e0b" },
                  {
                    label: "Equipos completos", color: "#a78bfa",
                    val: Object.values(GROUPS).flat().filter(t => getTeamStats(t, owned).pct === 100).length,
                    sub: `de ${Object.values(GROUPS).flat().length} equipos`,
                  },
                ].map((c, i) => (
                  <div key={i} style={{ background: "#0f172a", border: `1px solid ${c.color}30`, borderRadius: 14, padding: "16px 18px", borderLeft: `3px solid ${c.color}` }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: c.color, lineHeight: 1 }}>{c.val}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Progreso por grupo */}
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
                          <span style={{ fontSize: 11, color: "#64748b" }}>{teams.map(t => TEAM_NAMES[t]).join(" · ")}</span>
                          <span style={{ fontSize: 11, color: pct === 100 ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>{have}/{total}</span>
                        </div>
                        <ProgressBar pct={pct} color={pct === 100 ? "#22c55e" : color} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? "#22c55e" : "#fff", width: 38, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Top repetidas */}
              <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 3, color: "#94a3b8", marginBottom: 12 }}>TOP REPETIDAS (para intercambio)</h3>
              {Object.entries(owned).filter(([, v]) => v > 1).length === 0 ? (
                <p style={{ color: "#475569", fontSize: 13 }}>Aún no hay repetidas.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(owned).filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id, cnt]) => {
                    const s = STICKER_MAP[id];
                    if (!s) return null;
                    const color = GROUP_COLORS[s.group] || "#64748b";
                    return (
                      <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#0f172a", borderRadius: 10, border: "1px solid #1e293b" }}>
                        <span style={{ background: "#f59e0b", color: "#000", borderRadius: 6, padding: "1px 10px", fontSize: 12, fontWeight: 900, minWidth: 32, textAlign: "center" }}>×{cnt}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{id}</span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{TEAM_NAMES[s.team] || s.team} · {s.label}</span>
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
