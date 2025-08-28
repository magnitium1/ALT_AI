import "./App3.css";
import "./App.css";
import { useEffect, useRef } from "react";
import img_logo from "./components/IMG/logo_img.jpeg";

const App3 = () => {
    
    const toHome = () => {
        location.href = "/";
    }

    const toALT_PAY = () => {
        location.href = "/alt_pay";
    }

    const toChat = () => {
        location.href = "/alt";
    }

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
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
                <div className="chats-history">
                    <h2 className="chats-history-title">CHATS</h2>
                    <input
                        className="chat-search"
                        type="text"
                        placeholder="Search"
                    />
                </div>
                <div className="statistics">
                    <h2 className="information">INFORMATION</h2>
                    <div className="content2">
                        <div className="nickname-container">
                            <h2 className="NickName">NickName:</h2>
                            <h2 className="nick">Vasiliy</h2>
                        </div>
                        <div className="email-container">
                            <h2 className="EmailLabel">Email:</h2>
                            <h2 className="email">vasiliy@example.com</h2>
                        </div>
                        <div className="subscription-block">
                            <button className="subscription-button" onClick={toALT_PAY}>SUBSCRIPTION</button>
                        </div>
                    </div>
                    <a className="edit-link" href="#">Edit</a>
                    <button className="logout-button" onClick={logout}>Exit</button>
                </div>
            </div>
        </>
    );
}

export default App3;