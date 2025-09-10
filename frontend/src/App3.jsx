import "./App3.css";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import img_logo from "./components/IMG/logo_img.jpeg";
import { useAuth } from "./auth/AuthContext";
import { api } from "./api/client";

const App3 = () => {
    
    const { user } = useAuth();
    const [msg, setMsg] = useState("");
    const [search, setSearch] = useState("");
    const [chats, setChats] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const toHome = () => {
        location.href = "/";
    }

    const toALT_PAY = () => {
        location.href = "/alt_pay";
    }

    const toChat = () => {
        location.href = "/alt";
    }

    const createNewChat = async () => {
        setMsg("");
        try {
            if (!user) {
                setMsg("Войдите, чтобы создавать чаты");
                return;
            }
            const { data } = await api.post('/chats', {});
            if (data?.id) {
                try { localStorage.setItem('current_chat_id', String(data.id)); } catch {}
                location.href = `/alt`;
            } else {
                setMsg("Не удалось создать чат");
            }
        } catch (e) {
            const status = e?.response?.status;
            const text = e?.response?.data?.error || e?.message || 'Ошибка';
            if (status === 401) setMsg('Сессия истекла. Войдите снова.');
            else setMsg(`Ошибка создания чата: ${text}`);
        }
    }

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch {}
        location.href = "/";
    }

    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });

        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        let width = 0, height = 0;
        let stars = [];
        let starSprite = null;
        let raf = 0;
        let lastTime = performance.now();
        const minDistance = 16;
        const repulsionStrength = 0.1;

        function buildStarSprite() {
            const size = 48;
            const off = document.createElement('canvas');
            off.width = size;
            off.height = size;
            const g = off.getContext('2d');
            const r = size / 2;
            const grad = g.createRadialGradient(r, r, 0, r, r, r);
            grad.addColorStop(0.0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
            grad.addColorStop(1.0, 'rgba(255,255,255,0)');
            g.fillStyle = grad;
            g.beginPath();
            g.arc(r, r, r, 0, Math.PI * 2);
            g.fill();
            return off;
        }

        function resize() {
            width = Math.floor(window.innerWidth);
            height = Math.floor(window.innerHeight);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            canvas.width = Math.floor(width * DPR);
            canvas.height = Math.floor(height * DPR);
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            if (!starSprite) starSprite = buildStarSprite();
            rebuildStars();
        }

        function random(min, max) { return Math.random() * (max - min) + min; }

        function createStar() {
            const speed = random(6, 12);
            const dir = Math.random() * Math.PI * 2;
            const size = random(0.25, 0.65);
            const alpha = random(0.75, 1.0);
            const x = random(0, width);
            const y = random(0, height);
            return { x, y, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, speed, size, alpha };
        }

        function rebuildStars() {
            const area = width * height;
            const density = 0.00018;
            const maxCount = 900;
            const count = Math.min(Math.max(200, Math.floor(area * density)), maxCount);
            stars = new Array(count).fill(0).map(() => createStar());
        }

        function frame(now) {
            const dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            const cellSize = minDistance;
            const grid = new Map();
            const getKey = (cx, cy) => cx + ',' + cy;
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                const cx = Math.floor(s.x / cellSize);
                const cy = Math.floor(s.y / cellSize);
                const key = getKey(cx, cy);
                if (!grid.has(key)) grid.set(key, []);
                grid.get(key).push(i);
            }

            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                const cx = Math.floor(s.x / cellSize);
                const cy = Math.floor(s.y / cellSize);
                let repelX = 0, repelY = 0;
                for (let ox = -1; ox <= 1; ox++) {
                    for (let oy = -1; oy <= 1; oy++) {
                        const list = grid.get(getKey(cx + ox, cy + oy));
                        if (!list) continue;
                        for (let k = 0; k < list.length; k++) {
                            const j = list[k];
                            if (j === i) continue;
                            const n = stars[j];
                            const dx = s.x - n.x;
                            const dy = s.y - n.y;
                            const d2 = dx * dx + dy * dy;
                            const md = minDistance;
                            if (d2 > 0 && d2 < md * md) {
                                const d = Math.sqrt(d2) || 0.001;
                                const force = (md - d) / md;
                                repelX += (dx / d) * force;
                                repelY += (dy / d) * force;
                            }
                        }
                    }
                }
                if (repelX !== 0 || repelY !== 0) {
                    let nvx = s.vx + repelX * repulsionStrength;
                    let nvy = s.vy + repelY * repulsionStrength;
                    const mag = Math.hypot(nvx, nvy) || 1;
                    s.vx = (nvx / mag) * s.speed;
                    s.vy = (nvy / mag) * s.speed;
                }
            }

            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                s.x += s.vx * dt * 0.5;
                s.y += s.vy * dt * 0.6;

                if (s.x < -10) s.x = width + 10;
                if (s.x > width + 10) s.x = -10;
                if (s.y < -10) s.y = height + 10;
                if (s.y > height + 10) s.y = -10;

                const imgSize = 9 * s.size;
                ctx.globalAlpha = s.alpha;
                ctx.drawImage(starSprite, s.x - imgSize / 2, s.y - imgSize / 2, imgSize, imgSize);
            }
            ctx.globalAlpha = 1;

            raf = requestAnimationFrame(frame);
        }

        function onVisibility() {
            if (document.hidden) {
                cancelAnimationFrame(raf);
            } else {
                lastTime = performance.now();
                raf = requestAnimationFrame(frame);
            }
        }

        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', onVisibility);
        resize();
        lastTime = performance.now();
        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    useEffect(() => {
        async function loadChats() {
            try {
                const { data } = await api.get('/chats');
                const list = data?.chats || [];
                setChats(list);
                setFiltered((prev) => {
                    // если есть активный поиск — перефильтровать по новому списку
                    const q = (search || '').trim().toLowerCase();
                    if (!q) return list;
                    return list.filter(c => String(c.title || '').toLowerCase().includes(q) || String(c.id).includes(q));
                });
            } catch (e) {
                // игнорируем, если не авторизованы
            }
        }
        loadChats();
        // авто-обновление на короткое время, чтобы подтянуть первый заголовок
        const t1 = setInterval(loadChats, 2000);
        // и при фокусе окна
        const onFocus = () => loadChats();
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(t1);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    useEffect(() => {
        const q = (search || '').trim().toLowerCase();
        if (!q) { setFiltered(chats); return; }
        setFiltered(
            chats.filter(c =>
                String(c.title || '').toLowerCase().includes(q) ||
                String(c.id).includes(q)
            )
        );
    }, [search, chats]);

    const openChat = (id) => {
        location.href = `/chat/${id}`;
    }

    const deleteChat = async (id) => {
        setMsg("");
        try {
            await api.delete(`/chats/${id}`);
            const next = chats.filter(c => c.id !== id);
            setChats(next);
            // Поддерживаем фильтрованное отображение
            const q = (search || '').trim().toLowerCase();
            setFiltered(
                q ? next.filter(c => String(c.title || '').toLowerCase().includes(q) || String(c.id).includes(q)) : next
            );
            setMsg("");
        } catch (e) {
            setMsg('Не удалось удалить чат');
        }
    }

    return (
        <>
            <canvas ref={canvasRef} style={{position:"fixed", inset:0, width:"100vw", height:"100vh", zIndex:0, display:"block"}}></canvas>
            <div className="app3">
                <div className="logo2">
                    <span className="alt" onClick={toHome}>
                        <img src={img_logo} className="logo_img"/>
                        ThinkerAI
                    </span>
                </div>
                <button className="accaunt" onClick={toChat}>CHAT</button>
                <div className="chats-history" style={{display:"flex", flexDirection:"column", gap:12}}>
                    <h2 className="chats-history-title">CHATS</h2>
                    <input
                        className="chat-search"
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e)=>setSearch(e.target.value)}
                        style={{position:'relative', margin:0, display:'block', zIndex:2, marginBottom:12}}
                    />
                    <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6, position:'relative', zIndex:1, paddingTop:6, marginTop:34}}>
                        {filtered.map((c) => (
                            <div key={c.id} style={{display:'flex', gap:8, alignItems:'center', width:'100%'}}>
                                <button className="subscription-button" onClick={()=>openChat(c.id)} style={{textAlign:'left', flex:1}}>
                                    {c.title || `Chat #${c.id}`}
                                </button>
                                <button
                                    className="subscription-button delete"
                                    title="Delete chat"
                                    aria-label="Delete chat"
                                    onClick={()=>deleteChat(c.id)}
                                    style={{minWidth:36, marginLeft:'auto', padding:'8px 12px'}}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {filtered.length === 0 && <div style={{opacity:0.8}}>No chats</div>}
                    </div>
                    {msg && <div className="info-text" style={{marginTop:8}}>{msg}</div>}
                    <button className="subscription-button" style={{marginTop:12}} onClick={createNewChat}>NEW CHAT</button>
                </div>
                <div className="statistics">
                    <h2 className="information">INFORMATION</h2>
                    <div className="content2">
                        <div className="nickname-container">
                            <h2 className="NickName">NickName:</h2>
                            <h2 className="nick">{user?.username || "—"}</h2>
                        </div>
                        <div className="email-container">
                            <h2 className="EmailLabel">Email:</h2>
                            <h2 className="email">{user?.email || "—"}</h2>
                        </div>
                        <div className="subscription-block">
                            <button className="subscription-button" onClick={toALT_PAY}>SUBSCRIPTION</button>
                        </div>
                    </div>
                    <a className="edit-link" onClick={(e)=>{e.preventDefault(); const val = prompt('Enter new username', user?.username || ''); if (val && val.trim()) { const body = new URLSearchParams({ username: val.trim() }); api.post('/auth/update_username', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(()=>location.reload()).catch(err=>alert(err?.response?.data?.error || 'Update failed')); } }}>Edit</a>
                    <button className="home-button" onClick={toHome}>Home</button>
                    <button className="logout-button" onClick={logout}>Exit</button>
                </div>
            </div>
        </>
    );
}

export default App3;