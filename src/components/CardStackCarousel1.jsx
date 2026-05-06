import { useState, useRef, useEffect, useCallback } from "react";

// ─── Mock Data (matching reference video style) ───────────────────────────────
const CARDS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
    title: "The Sun Comes Out - Shakira on World Tour 2026 | Mumbai",
    date: "10 Apr, 4 PM",
    venue: "Mahalaxmi Racecour...",
    price: "₹4,500",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&q=80",
    title: "Mumbai Comic Con",
    date: "9 - 10 May, 11 AM",
    venue: "Jio World Convention...",
    price: "₹999",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    title: "Musicland Mumbai",
    date: "9 May, 4:30 PM",
    venue: "Jio World Garden",
    price: "₹1,999",
  },
];

// List items — two layout types: "date" block or "photo" thumbnail
const LIST_ITEMS = [
  {
    id: "l1", type: "photo",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80",
    title: "Musicland Mumbai", date: "9 May, 4:30 PM", venue: "Jio World Garden",
    price: "₹1,999", source: null,
  },
  {
    id: "l2", type: "date",
    day: "17", month: "apr",
    title: "French Press Manual Brewing Workshop", price: "₹900",
    description: "Unlock the secrets to perfect French Press brewing at The Revolver Club",
    source: "District",
  },
  {
    id: "l3", type: "photo",
    image: "https://images.unsplash.com/photo-1603739903239-8b6e64c3b185?w=200&q=80",
    title: "Besharam Tour 2026 | Mumbai", date: "10 - 11 Apr, 9 PM...",
    venue: "Mirage | Santacr...", price: "₹1,499", source: null,
  },
  {
    id: "l4", type: "date",
    day: "24", month: "apr",
    title: "Daawat at RÜ", price: "₹400 onwards",
    description: "A lavish Nawabi dining experience inspired by Deccan cuisine",
    source: "BookMyShow",
  },
  {
    id: "l5", type: "photo",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&q=80",
    title: "The Gleehive Buzz", date: "12 Apr, 12 PM",
    venue: "St. Andrews Aud...", price: "₹4,500", source: null,
  },
  {
    id: "l6", type: "date",
    day: "05", month: "apr",
    title: "Zavaray S. Poonawalla Racing Carnival: Brewout Edition", price: "₹900",
    description: "Horse racing, craft brews, carnival vibes",
    source: "Skillbox",
  },
  {
    id: "l7", type: "date",
    day: "17", month: "apr",
    title: "Golden Ages With Senior Citizens", price: "₹900",
    description: "An afternoon of games, stories, laughter, and warm company",
    source: "Eventbrite",
  },
];

const VIEW_ALL_SECTIONS = [
  { emoji: "☝️", label: "TRENDING EVENTS" },
  { emoji: "♪",  label: "MUSIC EVENTS" },
];

// ─── Constants ─────────────────────────────────────────────────────────────────
const LIST_IDX  = CARDS.length;      // index of list-mode slot
const TOTAL     = CARDS.length + 1;  // dots count
const PEEK1     = 14;                // px: 2nd card offset
const PEEK2     = 28;                // px: 3rd card offset
const THRESHOLD = 0.38;              // fraction of width to commit
const ANIM_DUR  = 320;
const SNAP_DUR  = 260;

// ─── Easing ────────────────────────────────────────────────────────────────────
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const lerp   = (a, b, t) => a + (b - a) * t;
const rubber = (x, cw)   => x * 0.22 * (1 - Math.min(Math.abs(x) / (cw * 2), 0.92));

// ─── RAF runner ────────────────────────────────────────────────────────────────
function runAnim(duration, onFrame, onDone) {
  let raf, cancelled = false;
  const t0 = performance.now();
  function tick(now) {
    if (cancelled) return;
    const t = Math.min((now - t0) / duration, 1);
    onFrame(t);
    if (t < 1) raf = requestAnimationFrame(tick);
    else onDone?.();
  }
  raf = requestAnimationFrame(tick);
  return () => { cancelled = true; cancelAnimationFrame(raf); };
}

// ─── Resting state ─────────────────────────────────────────────────────────────
function restingState(idx) {
  const s = {};
  CARDS.forEach((_, i) => {
    const slot = i - idx;
    if      (i < idx)    s[`c${i}`] = { x: -2000, sc: 0.9,  op: 0,   pe: "none", z: 1  };
    else if (slot === 0) s[`c${i}`] = { x: 0,     sc: 1,    op: 1,   pe: idx < LIST_IDX ? "auto" : "none", z: 10 };
    else if (slot === 1) s[`c${i}`] = { x: PEEK1,    sc: 0.97, op: 0.9, pe: "none", z: 9  };
    else if (slot === 2) s[`c${i}`] = { x: PEEK2,    sc: 0.94, op: 0.6, pe: "none", z: 8  };
    else                 s[`c${i}`] = { x: PEEK2+10, sc: 0.91, op: 0,   pe: "none", z: 7  };
  });
  s.list = idx === LIST_IDX
    ? { x: 0,  op: 1, pe: "auto",  z: 10 }
    : { x: 50, op: 0, pe: "none",  z: 5  };
  return s;
}

// ─── Teal price pill ───────────────────────────────────────────────────────────
function PricePill({ price }) {
  return (
    <div style={{
      background: "#00D4C8", color: "#000", fontWeight: 700, fontSize: 12,
      padding: "5px 9px", borderRadius: 5, whiteSpace: "nowrap", flexShrink: 0,
      lineHeight: 1.3, textAlign: "center",
    }}>
      <div style={{ fontWeight: 800 }}>{price}</div>
      <div style={{ fontWeight: 500, fontSize: 10 }}>onwards</div>
    </div>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ card, style, onPointerDown }) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute", top: 0, left: 0,
        width: "calc(100% - 36px)", height: 192,
        borderRadius: 12, overflow: "hidden",
        cursor: "grab", touchAction: "none", willChange: "transform",
        boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
        ...style,
      }}
    >
      <img
        src={card.image}
        alt={card.title}
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
      />
      {/* Bottom scrim */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 50%, transparent 100%)",
        height: "70%",
      }} />
      {/* Content */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 12px 12px",
      }}>
        <div style={{
          fontWeight: 700, fontSize: 14, color: "#fff",
          lineHeight: 1.25, marginBottom: 8,
        }}>
          {card.title}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
            <div>{card.date}</div>
            <div>{card.venue}</div>
          </div>
          <PricePill price={card.price} />
        </div>
      </div>
    </div>
  );
}

// ─── List rows ────────────────────────────────────────────────────────────────
function PhotoRow({ item }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", borderBottom: "0.5px solid #f0f0f0",
      background: "#fff", flexShrink: 0,
    }}>
      <img
        src={item.image} alt={item.title}
        style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#111", lineHeight: 1.3, marginBottom: 3 }}>
          {item.title}
        </div>
        <div style={{ fontSize: 11, color: "#888" }}>{item.date}</div>
        <div style={{ fontSize: 11, color: "#888" }}>{item.venue}</div>
      </div>
      <PricePill price={item.price} />
    </div>
  );
}

function DateRow({ item }) {
  return (
    <div style={{ background: "#fff", borderBottom: "0.5px solid #f0f0f0", flexShrink: 0 }}>
      {item.source && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 12px 0" }}>
          <span style={{
            fontSize: 10, color: "#666", fontWeight: 600,
            background: "#f0f0f0", padding: "1px 6px", borderRadius: 3,
          }}>{item.source}</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px 4px" }}>
        <div style={{
          width: 52, minHeight: 52, background: "#f2f2f2", borderRadius: 8,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#111", lineHeight: 1 }}>{item.day}</div>
          <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", fontWeight: 600 }}>{item.month}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#111", lineHeight: 1.3 }}>{item.title}</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{item.price}</div>
        </div>
      </div>
      {item.description && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "0 12px 8px", paddingLeft: 74 }}>
          <div style={{ width: 18, height: 18, borderRadius: 3, background: "#ddd", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{item.description}</div>
        </div>
      )}
    </div>
  );
}

// ─── ListView ─────────────────────────────────────────────────────────────────
function ListView({ style, onPointerDown }) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute", top: 0, left: 0,
        width: "calc(100% - 36px)", height: 192,
        borderRadius: 12, overflowY: "auto",
        background: "#fff",
        boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
        cursor: "grab", touchAction: "none", willChange: "transform",
        display: "flex", flexDirection: "column",
        ...style,
      }}
    >
      {LIST_ITEMS.map((item) =>
        item.type === "photo"
          ? <PhotoRow key={item.id} item={item} />
          : <DateRow  key={item.id} item={item} />
      )}

      {/* VIEW ALL card */}
      <div style={{ background: "#f8f8f8", borderTop: "0.5px solid #eee", flexShrink: 0 }}>
        {VIEW_ALL_SECTIONS.map((sec, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 12px",
            borderBottom: i < VIEW_ALL_SECTIONS.length - 1 ? "0.5px solid #e8e8e8" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, background: "#fff", borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}>{sec.emoji}</div>
              <div>
                <div style={{ fontSize: 10, color: "#888", fontWeight: 600, letterSpacing: 0.3 }}>VIEW ALL</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111", letterSpacing: -0.3 }}>{sec.label}</div>
              </div>
            </div>
            <div style={{
              width: 32, height: 32, border: "2px solid #111", borderRadius: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 18, color: "#111",
            }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dots — all diamond shaped (matching reference) ────────────────────────────
function Dots({ currentIdx }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
      {Array.from({ length: TOTAL }).map((_, i) => {
        const active = i === currentIdx;
        return (
          <div
            key={i}
            role="tab"
            aria-selected={active}
            aria-label={i === LIST_IDX ? "List view" : `Card ${i + 1}`}
            style={{
              width: 9, height: 9,
              background: active ? "#333" : "transparent",
              border: `1.5px solid ${active ? "#333" : "#bbb"}`,
              transform: "rotate(45deg)",
              flexShrink: 0,
              transition: "background .15s, border-color .15s",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CardStackCarousel() {
  const stackRef     = useRef(null);
  const cancelRef    = useRef(null);
  const animatingRef = useRef(false);
  const idxRef       = useRef(0);
  const dragRef      = useRef({ active: false, startX: 0, committed: false });

  const [transforms, setTransforms] = useState(() => restingState(0));
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => { idxRef.current = currentIdx; }, [currentIdx]);

  const cw = () => (stackRef.current?.offsetWidth ?? 380) - 36;

  function startAnim(dur, frames, done) {
    cancelRef.current?.();
    animatingRef.current = true;
    cancelRef.current = runAnim(dur, frames, () => {
      animatingRef.current = false;
      done?.();
    });
  }

  // ── Commit forward ────────────────────────────────────────────────────────
  const commitForward = useCallback((fromX) => {
    const W = cw();
    const fi = idxRef.current;
    const ti = fi + 1;
    const toList = ti === LIST_IDX;

    startAnim(ANIM_DUR, (t) => {
      const eq = easeOutQuint(t);
      const ec = easeOutCubic(t);
      setTransforms((prev) => {
        const n = { ...prev };
        n[`c${fi}`] = { ...n[`c${fi}`], x: lerp(fromX, W * 1.25, eq), op: lerp(1, 0, Math.min(t * 2.5, 1)) };
        if (toList) {
          n.list = { ...n.list, x: lerp(50, 0, ec), op: easeOutCubic(t), pe: "none", z: 10 };
        } else {
          if (fi+1 < CARDS.length) n[`c${fi+1}`] = { ...n[`c${fi+1}`], x: lerp(PEEK1, 0, ec), sc: lerp(0.97,1,ec), op: lerp(0.9,1,t), z:10 };
          if (fi+2 < CARDS.length) n[`c${fi+2}`] = { ...n[`c${fi+2}`], x: lerp(PEEK2,PEEK1,ec), sc: lerp(0.94,0.97,ec), op: lerp(0.6,0.9,t) };
          if (fi+3 < CARDS.length) n[`c${fi+3}`] = { ...n[`c${fi+3}`], x: lerp(PEEK2+10,PEEK2,ec), sc: lerp(0.91,0.94,ec), op: lerp(0,0.6,t) };
        }
        return n;
      });
    }, () => {
      idxRef.current = ti;
      setCurrentIdx(ti);
      setTransforms(restingState(ti));
    });
  }, []);

  // ── Commit backward ───────────────────────────────────────────────────────
  const commitBackward = useCallback((fromX) => {
    const W = cw();
    const fi = idxRef.current;
    const ti = fi - 1;
    const fromList = fi === LIST_IDX;

    startAnim(ANIM_DUR, (t) => {
      const eq = easeOutQuint(t);
      const ec = easeOutCubic(t);
      setTransforms((prev) => {
        const n = { ...prev };
        if (fromList) {
          n.list = { ...n.list, x: lerp(fromX, W * 1.25, eq), op: lerp(1, 0, Math.min(t * 2.5, 1)) };
        } else {
          n[`c${fi}`] = { ...n[`c${fi}`], x: lerp(fromX, W * 1.25, eq), op: lerp(1, 0, Math.min(t * 2.5, 1)) };
        }
        n[`c${ti}`] = { ...n[`c${ti}`], x: lerp(-W*0.7, 0, ec), sc: lerp(0.95,1,ec), op: easeOutCubic(t), z:10 };
        if (!fromList && fi < CARDS.length) {
          n[`c${fi}`] = { ...n[`c${fi}`], x: lerp(fromX, PEEK1, ec), sc: lerp(1,0.97,ec), op: lerp(1,0.9,t) };
        }
        return n;
      });
    }, () => {
      idxRef.current = ti;
      setCurrentIdx(ti);
      setTransforms(restingState(ti));
    });
  }, []);

  // ── Snap back ─────────────────────────────────────────────────────────────
  const snapBack = useCallback((fromX, peek1X) => {
    const idx = idxRef.current;
    startAnim(SNAP_DUR, (t) => {
      const e = easeOutQuint(t);
      setTransforms((prev) => {
        const n = { ...prev };
        if (idx === LIST_IDX) {
          n.list = { ...n.list, x: lerp(fromX, 0, e) };
        } else {
          n[`c${idx}`]   = { ...n[`c${idx}`],   x: lerp(fromX, 0, e) };
          if (idx+1 < CARDS.length)
            n[`c${idx+1}`] = { ...n[`c${idx+1}`], x: lerp(peek1X ?? PEEK1, PEEK1, e) };
        }
        return n;
      });
    }, () => setTransforms(restingState(idx)));
  }, []);

  // ── Pointer handlers ──────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (animatingRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startX: e.clientX, committed: false };
  }, []);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d.active || d.committed) return;

    const W   = cw();
    const raw = e.clientX - d.startX;
    const idx = idxRef.current;

    if (raw < -(W * THRESHOLD)) {
      d.committed = d.active = false;
      idx < LIST_IDX ? commitForward(raw) : snapBack(raw, PEEK1);
      return;
    }
    if (raw > W * THRESHOLD) {
      d.committed = d.active = false;
      idx > 0 ? commitBackward(raw) : snapBack(raw, PEEK1);
      return;
    }

    let dx = raw;
    if (raw > 0 && idx === 0)        dx = rubber(raw, W);
    if (raw < 0 && idx === LIST_IDX) dx = rubber(raw, W);

    const prog = Math.max(0, Math.min(-dx / W, 1));

    setTransforms((prev) => {
      const n = { ...prev };
      if (idx === LIST_IDX) {
        n.list = { ...n.list, x: dx };
      } else {
        n[`c${idx}`] = { ...n[`c${idx}`], x: dx };
        if (idx+1 < CARDS.length) n[`c${idx+1}`] = { ...n[`c${idx+1}`], x: lerp(PEEK1,0,prog), sc: lerp(0.97,1,prog), op: lerp(0.9,1,prog) };
        if (idx+2 < CARDS.length) n[`c${idx+2}`] = { ...n[`c${idx+2}`], x: lerp(PEEK2,PEEK1,prog), sc: lerp(0.94,0.97,prog), op: lerp(0.6,0.9,prog) };
      }
      return n;
    });
  }, [commitForward, commitBackward, snapBack]);

  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    if (!d.committed) {
      const idx    = idxRef.current;
      const topKey = idx === LIST_IDX ? "list" : `c${idx}`;
      const p1Key  = `c${idx+1}`;
      snapBack(transforms[topKey]?.x ?? 0, transforms[p1Key]?.x ?? PEEK1);
    }
  }, [transforms, snapBack]);

  useEffect(() => {
    const h = () => setTransforms(restingState(idxRef.current));
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#EBEBEB",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 15, fontWeight: 700,
          }}>S</div>
          <span style={{ fontSize: 14, color: "#555", fontWeight: 500 }}>Shadow</span>
        </div>

        {/* Message text */}
        <div style={{ fontSize: 15, color: "#111", marginBottom: 14, lineHeight: 1.55 }}>
          Shreyas, your calendar is about to get very full. Sorry, not sorry.
        </div>

        {/* White card wrapper */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "12px 12px 14px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}>
          {/* Stack */}
          <div
            ref={stackRef}
            style={{ position: "relative", height: 200, overflow: "visible" }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {CARDS.map((card, i) => {
              const t = transforms[`c${i}`] || {};
              return (
                <EventCard
                  key={card.id}
                  card={card}
                  onPointerDown={t.pe !== "none" ? onPointerDown : undefined}
                  style={{
                    transform: `translateX(${t.x ?? 0}px) scale(${t.sc ?? 1})`,
                    opacity: t.op ?? 1,
                    pointerEvents: t.pe ?? "none",
                    zIndex: t.z ?? 1,
                    transition: "none",
                  }}
                />
              );
            })}

            {(() => {
              const t = transforms.list || {};
              return (
                <ListView
                  onPointerDown={t.pe !== "none" ? onPointerDown : undefined}
                  style={{
                    transform: `translateX(${t.x ?? 50}px)`,
                    opacity: t.op ?? 0,
                    pointerEvents: t.pe ?? "none",
                    zIndex: t.z ?? 5,
                    transition: "none",
                  }}
                />
              );
            })()}
          </div>

          <Dots currentIdx={currentIdx} />
        </div>
      </div>
    </div>
  );
}
