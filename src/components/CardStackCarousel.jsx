import { useState, useRef, useEffect, useCallback } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────
const CARDS = [
  {
    id: 0,
    title: "Neon Drift Festival",
    date: "Sat 10 May",
    venue: "Harbour Front",
    price: "₹499",
    tag: "Music",
    tagColor: "rgba(232,255,107,0.18)",
    tagTextColor: "#e8ff6b",
    bg: "linear-gradient(135deg,#1a0533 0%,#2d1060 40%,#0d2060 100%)",
    emoji: "🎵",
  },
  {
    id: 1,
    title: "Biennale Night Walk",
    date: "Sun 11 May",
    venue: "Fort Kochi",
    price: "Free",
    tag: "Art",
    tagColor: "rgba(107,224,255,0.18)",
    tagTextColor: "#6be0ff",
    bg: "linear-gradient(135deg,#001833 0%,#003366 50%,#001a33 100%)",
    emoji: "🎨",
  },
  {
    id: 2,
    title: "Craft Beer Garden",
    date: "Sat 10 May",
    venue: "Indiranagar",
    price: "₹299",
    tag: "Food",
    tagColor: "rgba(255,107,107,0.18)",
    tagTextColor: "#ff6b6b",
    bg: "linear-gradient(135deg,#1a0a00 0%,#3d1a00 50%,#1a0a00 100%)",
    emoji: "🍺",
  },
  {
    id: 3,
    title: "Techno Warehouse",
    date: "Fri 9 May",
    venue: "Industrial Zone",
    price: "₹799",
    tag: "Nightlife",
    tagColor: "rgba(255,107,157,0.18)",
    tagTextColor: "#ff6b9d",
    bg: "linear-gradient(135deg,#0a0014 0%,#1a0028 50%,#000814 100%)",
    emoji: "🎧",
  },
  {
    id: 4,
    title: "Sunrise Yoga Retreat",
    date: "Sun 11 May",
    venue: "Cubbon Park",
    price: "₹199",
    tag: "Wellness",
    tagColor: "rgba(163,230,53,0.15)",
    tagTextColor: "#a3e635",
    bg: "linear-gradient(135deg,#001a08 0%,#003314 50%,#001a08 100%)",
    emoji: "🧘",
  },
];

const LIST_ITEMS = [
  { emoji: "🎪", title: "Street Food Carnival",  sub: "Sat · MG Road",          price: "Free", color: "#fbbf24" },
  { emoji: "🎭", title: "Improv Comedy Night",   sub: "Fri · The Humour Lab",   price: "₹350", color: "#c084fc" },
  { emoji: "🏃", title: "5K Charity Run",        sub: "Sun · Lalbagh",          price: "₹250", color: "#6be0ff" },
  { emoji: "🎸", title: "Indie Gig Night",       sub: "Sat · The Humming Tree", price: "₹400", color: "#ff6b9d" },
];

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const TOTAL       = CARDS.length + 1;
const PEEK1       = 44;
const PEEK2       = 28;
const THRESHOLD   = 0.28;
const DUR         = 620;
const EASE_OUT    = "cubic-bezier(0.16,1,0.3,1)";
const EASE_SPRING = "cubic-bezier(0.25,1.1,0.5,1)";

// ── POSITION HELPERS ──────────────────────────────────────────────────────────
function cX(i, cur, W) {
  if (i < cur)       return -(W + 80);
  if (i === cur)     return 0;
  if (i === cur + 1) return W - PEEK1;
  return W - PEEK2;
}
function cS(i, cur) {
  if (i === cur)     return 1;
  if (i === cur + 1) return 0.95;
  return 0.9;
}
function rubber(x) {
  return Math.sign(x) * Math.pow(Math.abs(x), 0.45) * 2;
}
function setT(el, x, s = 1) {
  if (el) el.style.transform = `translateX(${x}px) scale(${s})`;
}

// ── ICONS ─────────────────────────────────────────────────────────────────────
const CalIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.7, flexShrink: 0 }}>
    <rect x="1" y="2" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M3 1v2M7 1v2M1 5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
const PinIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.7, flexShrink: 0 }}>
    <path d="M5 1C3.34 1 2 2.34 2 4c0 2.5 3 6 3 6s3-3.5 3-6c0-1.66-1.34-3-3-3z" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function EventCard({ data, elRef }) {
  return (
    <div ref={elRef} style={{
      position: "absolute", top: 0, left: 0,
      width: "calc(100% - 48px)", height: "100%",
      borderRadius: 20, overflow: "hidden",
      userSelect: "none", touchAction: "none",
      willChange: "transform",
    }}>
      <div style={{ position: "absolute", inset: 0, background: data.bg }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.2) 55%,transparent 100%)" }} />
      <div style={{
        position: "absolute", top: 14, left: 14,
        fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase",
        padding: "4px 10px", borderRadius: 100,
        background: data.tagColor, color: data.tagTextColor,
        backdropFilter: "blur(8px)",
      }}>{data.tag}</div>
      <div style={{ position: "absolute", bottom: 18, left: 18, right: 64, zIndex: 1 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, lineHeight: 1.2, marginBottom: 6, color: "#fff" }}>
          {data.emoji} {data.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,.7)", fontWeight: 300 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><CalIcon />{data.date}</span>
          <span>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><PinIcon />{data.venue}</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 18, right: 18, fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "#e8ff6b", zIndex: 1 }}>
        {data.price}
      </div>
    </div>
  );
}

function ListRow({ item, elRef }) {
  return (
    <div ref={elRef} style={{
      flex: 1, background: "#1c1e28", borderRadius: 14,
      display: "flex", alignItems: "center", padding: "0 14px", gap: 12,
      border: "1px solid rgba(255,255,255,.05)", overflow: "hidden",
      willChange: "transform,opacity",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: item.color + "22" }}>
        {item.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff", marginBottom: 2 }}>
          {item.title}
        </div>
        <div style={{ fontSize: 11, color: "#8888a0", fontWeight: 300 }}>{item.sub}</div>
      </div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#e8ff6b", flexShrink: 0 }}>
        {item.price}
      </div>
    </div>
  );
}

function Dot({ active, diamond }) {
  const base = {
    background: active ? (diamond ? "#ff6b9d" : "#e8ff6b") : "#8888a0",
    opacity: active ? 1 : 0.35,
    transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)",
    flexShrink: 0,
  };
  if (diamond) return <div style={{ ...base, width: 7, height: 7, borderRadius: 2, transform: active ? "rotate(45deg) scale(1.2)" : "rotate(45deg)" }} />;
  return <div style={{ ...base, width: active ? 18 : 6, height: 6, borderRadius: active ? 3 : "50%" }} />;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function EventCardStack() {
  const [index, setIndex] = useState(0);
  const idxRef     = useRef(0);
  const animating  = useRef(false);
  const sceneRef   = useRef(null);
  const cardRefs   = useRef([]);
  const listRef    = useRef(null);
  const rowRefs    = useRef([]);
  const drag       = useRef({ on: false, x0: 0, dx: 0 });

  // Keep ref in sync with state
  useEffect(() => { idxRef.current = index; }, [index]);

  const getW = useCallback(() =>
    sceneRef.current ? sceneRef.current.offsetWidth - 48 : 300, []);

  // ── APPLY RESTING POSITIONS ─────────────────────────────────────────────
  const rest = useCallback((cur) => {
    const w = getW();
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transition = "none";
      el.style.zIndex = CARDS.length - i + 5;
      setT(el, cX(i, cur, w), cS(i, cur));
    });
    const lv = listRef.current;
    if (!lv) return;
    lv.style.transition = "none";
    lv.style.zIndex = 20;
    if (cur === CARDS.length) {
      lv.style.opacity = "1";
      setT(lv, 0);
    } else {
      lv.style.opacity = "0";
      setT(lv, w + 80);
    }
  }, [getW]);

  useEffect(() => { rest(0); }, [rest]);

  useEffect(() => {
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => rest(idxRef.current), 100); };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [rest]);

  // ── TWEEN — uses fill:"none" and commits style manually ────────────────
  // This is critical: fill:"forwards" freezes transforms inside the browser's
  // animation engine and blocks subsequent pointer-driven style writes.
  const tween = useCallback((el, x0, x1, dur, ease, s0 = 1, s1 = 1) => {
    if (!el) return Promise.resolve();
    el.getAnimations().forEach(a => a.cancel());
    return new Promise(resolve => {
      const anim = el.animate(
        [{ transform: `translateX(${x0}px) scale(${s0})` },
         { transform: `translateX(${x1}px) scale(${s1})` }],
        { duration: dur, easing: ease, fill: "none" }
      );
      anim.onfinish = () => { setT(el, x1, s1); resolve(); };
      anim.oncancel = resolve;
    });
  }, []);

  // ── FORWARD ─────────────────────────────────────────────────────────────
  const forward = useCallback((dragX) => {
    const cur = idxRef.current;
    if (cur >= CARDS.length || animating.current) return;
    animating.current = true;
    const w   = getW();
    const nxt = cur + 1;
    const toList = nxt === CARDS.length;
    const ps  = [];

    ps.push(tween(cardRefs.current[cur], dragX, w + 100, DUR, EASE_OUT));

    if (!toList) {
      ps.push(tween(cardRefs.current[nxt], cX(nxt, cur, w), 0, DUR, EASE_OUT, cS(nxt, cur), 1));
      if (nxt + 1 < CARDS.length) {
        ps.push(tween(cardRefs.current[nxt + 1], cX(nxt+1,cur,w), cX(nxt+1,nxt,w), DUR, EASE_OUT, cS(nxt+1,cur), cS(nxt+1,nxt)));
      }
    } else {
      const lv = listRef.current;
      if (lv) { lv.style.opacity = "1"; setT(lv, 0); }
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        row.getAnimations().forEach(a => a.cancel());
        row.style.opacity = "0";
        row.style.transform = "translateX(28px)";
        const a = row.animate(
          [{ transform: "translateX(28px)", opacity: 0 },
           { transform: "translateX(0)",   opacity: 1 }],
          { duration: 500, delay: i * 40, easing: EASE_SPRING, fill: "none" }
        );
        a.onfinish = () => { row.style.transform = "translateX(0)"; row.style.opacity = "1"; };
        ps.push(a.finished);
      });
    }

    idxRef.current = nxt;
    setIndex(nxt);
    Promise.all(ps).then(() => { animating.current = false; rest(nxt); });
  }, [getW, tween, rest]);

  // ── BACKWARD ────────────────────────────────────────────────────────────
  const backward = useCallback((dragX) => {
    const cur = idxRef.current;
    if (cur <= 0 || animating.current) return;
    animating.current = true;
    const w   = getW();
    const prv = cur - 1;
    const fromList = cur === CARDS.length;
    const ps  = [];

    if (!fromList) {
      ps.push(tween(cardRefs.current[cur], dragX, w + 100, DUR, EASE_OUT));
    } else {
      const lv = listRef.current;
      if (lv) {
        lv.getAnimations().forEach(a => a.cancel());
        const a = lv.animate(
          [{ transform: "translateX(0)" }, { transform: `translateX(${w + 100}px)` }],
          { duration: DUR, easing: EASE_OUT, fill: "none" }
        );
        a.onfinish = () => { setT(lv, w + 100); lv.style.opacity = "0"; };
        ps.push(a.finished);
      }
    }

    ps.push(tween(cardRefs.current[prv], dragX > 0 ? dragX : -(w + 100), 0, DUR, EASE_OUT));

    [prv + 1, prv + 2].forEach(pi => {
      if (pi < CARDS.length && pi !== cur) {
        ps.push(tween(cardRefs.current[pi], cX(pi,cur,w), cX(pi,prv,w), DUR, EASE_OUT, cS(pi,cur), cS(pi,prv)));
      }
    });

    idxRef.current = prv;
    setIndex(prv);
    Promise.all(ps).then(() => { animating.current = false; rest(prv); });
  }, [getW, tween, rest]);

  // ── SNAP BACK ────────────────────────────────────────────────────────────
  const snapBack = useCallback((dragX) => {
    const cur = idxRef.current;
    animating.current = true;
    const w   = getW();
    const topEl = cur < CARDS.length ? cardRefs.current[cur] : listRef.current;
    const ps  = [tween(topEl, dragX, 0, 520, EASE_SPRING)];

    cardRefs.current.forEach((el, i) => {
      if (i !== cur && el) {
        el.getAnimations().forEach(a => a.cancel());
        el.style.transition = `transform 520ms ${EASE_SPRING}`;
        setT(el, cX(i, cur, w), cS(i, cur));
      }
    });

    Promise.all(ps).then(() => { animating.current = false; rest(cur); });
  }, [getW, tween, rest]);

  // ── POINTER EVENTS on scene div ──────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (animating.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { on: true, x0: e.clientX, dx: 0 };
    const cur = idxRef.current;
    const el  = cur < CARDS.length ? cardRefs.current[cur] : listRef.current;
    if (el) { el.getAnimations().forEach(a => a.cancel()); el.style.transition = "none"; }
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!drag.current.on) return;
    const dx  = e.clientX - drag.current.x0;
    drag.current.dx = dx;
    const cur = idxRef.current;
    const w   = getW();

    let tx = dx;
    if (cur === 0          && dx > 0) tx = rubber(dx);
    if (cur === CARDS.length && dx < 0) tx = rubber(dx);

    const topEl = cur < CARDS.length ? cardRefs.current[cur] : listRef.current;
    if (topEl) setT(topEl, tx);

    const p = Math.min(Math.abs(dx) / w, 1);

    if (dx < 0 && cur < CARDS.length) {
      const nxt = cur + 1;
      if (nxt < CARDS.length) {
        const nel = cardRefs.current[nxt];
        const sx = cX(nxt, cur, w), ss = cS(nxt, cur);
        if (nel) setT(nel, sx + (0 - sx) * p, ss + (1 - ss) * p);
        const t2 = cur + 2;
        if (t2 < CARDS.length) {
          const el2 = cardRefs.current[t2];
          if (el2) setT(el2, cX(t2,cur,w)+(cX(t2,nxt,w)-cX(t2,cur,w))*p, cS(t2,cur)+(cS(t2,nxt)-cS(t2,cur))*p);
        }
      } else {
        const lv = listRef.current;
        if (lv) { lv.style.opacity = `${p * 0.85}`; setT(lv, (w + 80) * (1 - p)); }
      }
    }

    if (dx > 0 && cur > 0) {
      const prv = cur - 1;
      const pel = cardRefs.current[prv];
      if (pel) setT(pel, -(w + 80) * (1 - p));
    }
  }, [getW]);

  const onPointerUp = useCallback(() => {
    if (!drag.current.on) return;
    drag.current.on = false;
    const { dx } = drag.current;
    const cur = idxRef.current;
    const threshold = getW() * THRESHOLD;

    if      (dx < -threshold && cur < CARDS.length) forward(dx);
    else if (dx >  threshold && cur > 0)            backward(dx);
    else                                             snapBack(dx);
  }, [getW, forward, backward, snapBack]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#0e0f13", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans',sans-serif", color: "#f0f0f0" }}>
        <div style={{ background: "#16181f", borderRadius: "24px 24px 24px 6px", padding: "20px 16px 24px", width: "100%", maxWidth: 400, boxShadow: "0 32px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04)" }}>

          {/* Bubble header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "0 4px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#e8ff6b,#ff6b9d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#000", fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>✦</div>
            <div style={{ fontSize: 13, color: "#8888a0", lineHeight: 1.4, fontWeight: 300 }}>Here are some events happening near you this weekend:</div>
          </div>

          {/* Stack — pointer handlers live on the scene div, not on individual cards */}
          <div style={{ position: "relative", height: 260, touchAction: "none" }}>
            <div
              ref={sceneRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ position: "relative", height: "100%", overflow: "hidden", borderRadius: 20, cursor: "grab" }}
            >
              {CARDS.map((card, i) => (
                <EventCard key={card.id} data={card} elRef={el => (cardRefs.current[i] = el)} />
              ))}

              <div
                ref={listRef}
                style={{ position: "absolute", top: 0, left: 0, width: "calc(100% - 48px)", height: "100%", display: "flex", flexDirection: "column", gap: 6, zIndex: 20, willChange: "transform", touchAction: "none", opacity: 0, pointerEvents: "none" }}
              >
                {LIST_ITEMS.map((item, i) => (
                  <ListRow key={i} item={item} elRef={el => (rowRefs.current[i] = el)} />
                ))}
              </div>
            </div>
          </div>

          {/* Dots */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
            {Array.from({ length: TOTAL }, (_, i) => (
              <Dot key={i} active={i === index} diamond={i === CARDS.length} />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}