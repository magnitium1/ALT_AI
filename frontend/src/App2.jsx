import { useState } from "react";
import "./App2.css";
import img_logo from "./components/IMG/logo_img.jpeg"
import { api } from "./api/client";
import { useEffect, useRef } from "react";
import { useAuth } from "./auth/AuthContext";

const App2 = () => {

    const [cnt1, setCnt1] = useState(false);
    const [cnt2, setCnt2] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef(null);
    const textareaRef = useRef(null);
    const wrapperRef = useRef(null);
    const contentRef = useRef(null);
    const baseHeightRef = useRef(0);
    const lineHeightRef = useRef(0);
    const contentBaseHeightRef = useRef(0);
    const { user, loading } = useAuth();

    // Автосоздание чата при входе на ALT, если его нет
    useEffect(() => {
        async function ensureChatOnEnter() {
            try {
                if (!user || loading) return;
                // Всегда создаем новый чат при входе на ALT
                const { data } = await api.post('/chats', {});
                if (data?.id) {
                    localStorage.setItem('current_chat_id', String(data.id));
                }
            } catch (e) {
                // игнорируем
            }
        }
        ensureChatOnEnter();
    }, [user, loading]);

    const handleAutoGrow = () => {
        const textarea = textareaRef.current;
        const wrapper = wrapperRef.current;
        const content = contentRef.current;
        if (!textarea) return;

        // Устанавливаем состояние печатания
        setIsTyping(true);
        
        // Сбрасываем таймер через 1 секунду после остановки печатания
        clearTimeout(window.typingTimer);
        window.typingTimer = setTimeout(() => {
            setIsTyping(false);
        }, 1000);

        const base = baseHeightRef.current || textarea.clientHeight;
        const line = lineHeightRef.current || 20;

        textarea.style.height = `${base}px`;

        const overflow = Math.max(0, textarea.scrollHeight - textarea.clientHeight);
        const steps = Math.ceil(overflow / Math.max(1, line));
        const extra = Math.min(150, steps * Math.max(1, line));

        if (wrapper && wrapper.classList.contains("bottom")) {
            if (content) {
                const baseContent = contentBaseHeightRef.current || content.clientHeight;
                if (!contentBaseHeightRef.current) contentBaseHeightRef.current = baseContent;
                const newContentHeight = Math.max(0, baseContent - extra);
                content.style.height = `${newContentHeight}px`;
            }
        }

        if (overflow <= 0) {
            textarea.style.height = `${base}px`;
            if (wrapper && wrapper.classList.contains("bottom") && contentRef.current && contentBaseHeightRef.current) {
                contentRef.current.style.height = `${contentBaseHeightRef.current}px`;
            }
            return;
        }

        textarea.style.height = `${base + extra}px`;
    };

    const toHome = () => {
        location.href = "/";
    }

    const toAccount = () => {
        location.href = "/account"
    }

    const click2 = () => {
        const deeper_think = document.querySelector(".deeper_think");
        const deep_think = document.querySelector(".deep_think");
        if (!cnt1) {
            deep_think.classList.add("new_design");
            if (cnt2) {
                deeper_think.classList.remove("new_design");
                setCnt2(!cnt2);
            }
        } else {
            deep_think.classList.remove("new_design");
        }
        setCnt1(!cnt1);
        
    }

    const click3 = () => {
        const deeper_think = document.querySelector(".deeper_think");
        const deep_think = document.querySelector(".deep_think");
        if (!cnt2) {
            deeper_think.classList.add("new_design");
            if (cnt1) {
                deep_think.classList.remove("new_design");
                setCnt1(!cnt1);
            }
        } else {
            deeper_think.classList.remove("new_design");
        }
        setCnt2(!cnt2);
        
    }

    const typeWriter = (element, text, speed = 50, onComplete) => {
        const words = text.split(' ');
        let currentWordIndex = 0;
        
        // Начинаем генерацию текста
        setIsGenerating(true);
        
        const typeNextWord = () => {
            if (currentWordIndex < words.length) {
                if (currentWordIndex === 0) {
                    element.innerText = words[currentWordIndex];
                } else {
                    element.innerText += ' ' + words[currentWordIndex];
                }
                currentWordIndex++;
                
                const content = document.querySelector(".content");
                content.scrollTo({
                    top: content.scrollHeight,
                    behavior: 'smooth'
                });
                
                setTimeout(typeNextWord, speed);
            } else if (typeof onComplete === 'function') {
                // Заканчиваем генерацию текста
                setIsGenerating(false);
                onComplete();
            }
        };
        
        typeNextWord();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                return;
            } else {
                e.preventDefault();
                if (!isBusy && !loading && user) {
                    click();
                }
            }
        }
    }

    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch {
            null;
        }
        try {
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = text;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            return true;
        } catch {
            return false;
        }
    };

    const click = () => {
        if (isBusy) return;
        const textareaForm = document.querySelector(".textarea-wrapper");
        const textarea = document.querySelector(".text-area");
        const content = document.querySelector(".content");
        
        if (!user) {
            const content = document.querySelector(".content");
            const warn = document.createElement('div');
            warn.className = 'answer error';
            warn.textContent = 'Вы не авторизованы. Войдите через LOGIN и попробуйте снова.';
            content.appendChild(warn);
            content.scrollTo({ top: content.scrollHeight, behavior: 'smooth' });
            return;
        }

        if (!textarea.value.trim()) {
            return;
        }
        setIsBusy(true);
        
        textareaForm.classList.add("bottom");
        if (textareaRef.current) {
            textareaRef.current.style.height = "";
        }
        if (contentRef.current) {
            contentRef.current.style.height = "";
            contentBaseHeightRef.current = contentRef.current.clientHeight;
        }

        const question = document.createElement("p");
        question.className = "question";
        question.innerText = textarea.value;
        content.appendChild(question);
        let cnt = textarea.value;
        textarea.value = "";
        content.scrollTo({
            top: content.scrollHeight,
            behavior: 'smooth'
        });

        const load = document.createElement("div");
        load.className = "load";
        content.appendChild(load);
        content.scrollTo({
            top: content.scrollHeight,
            behavior: 'smooth'
        });
        
        // Обеспечиваем наличие chat_id: создаём чат при первом сообщении
        let chatId = null;
        try { chatId = localStorage.getItem('current_chat_id'); } catch {}
        const ensureChat = async () => {
            // если есть id — проверим, что чат существует и наш
            if (chatId) {
                try {
                    await api.get(`/chats/${Number(chatId)}`);
                    return Number(chatId);
                } catch (e) {
                    // не найден — создаём новый
                }
            }
            const { data } = await api.post('/chats', {});
            const newId = data?.id;
            if (newId) {
                try { localStorage.setItem('current_chat_id', String(newId)); } catch {}
                return newId;
            }
            throw new Error('Не удалось создать чат');
        };

        ensureChat()
            .then((cid) => api.post(
                '/request_to_model',
                { request: cnt, chat_id: Number(cid) }
            ))
            .then((response) => {
                const answer = document.createElement("p");
                answer.className = "answer";
                content.appendChild(answer);

                const text = (response && response.data && response.data.answer) ? response.data.answer : 'Нет ответа от сервера';
                typeWriter(answer, text, 80, () => {
                    const actions = document.createElement('div');
                    actions.className = 'answer-actions';

                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'action-button copy-button';
                    copyBtn.textContent = 'Copy Text';
                    copyBtn.addEventListener('click', async () => {
                        const ok = await copyToClipboard(answer.innerText || '');
                        if (ok) {
                            const old = copyBtn.textContent;
                            copyBtn.textContent = 'Copied!';
                            setTimeout(() => { copyBtn.textContent = old; }, 1500);
                        }
                    });

                    actions.appendChild(copyBtn);
                    content.appendChild(actions);

                    setIsBusy(false);
                    if (load && load.parentNode) {
                        load.remove();
                    }

                    content.scrollTo({ top: content.scrollHeight, behavior: 'smooth' });
                });
            })
            .catch((error) => {
                console.error("Error:", error);
                if (load && load.parentNode) {
                    load.remove();
                }
                const err = document.createElement('div');
                err.className = 'answer error';
                const status = error?.response?.status;
                if (status === 429) {
                    err.textContent = 'Daily message limit reached';
                } else {
                    const msg = error?.response?.data?.error || error?.message || 'Неизвестная ошибка';
                    err.textContent = `Ошибка запроса${status ? ` (${status})` : ''}: ${msg}`;
                }
                content.appendChild(err);
                content.scrollTo({ top: content.scrollHeight, behavior: 'smooth' });
                setIsBusy(false);
            });
    }

    const readCookie = (name) => {
        const cookies = document.cookie ? document.cookie.split('; ') : [];
        for (const cookie of cookies) {
            const [key, ...rest] = cookie.split('=');
            if (key === name) {
                return decodeURIComponent(rest.join('='));
            }
        }
        return undefined;
    };

    useEffect(() => {
        const ta = textareaRef.current;
        if (ta) {
            const cs = window.getComputedStyle(ta);
            const lh = parseFloat(cs.lineHeight);
            lineHeightRef.current = isNaN(lh) ? 20 : lh;
            baseHeightRef.current = ta.clientHeight;
            ta.style.height = `${baseHeightRef.current}px`;
        }
        if (contentRef.current) {
            contentBaseHeightRef.current = contentRef.current.clientHeight;
        }

        const initialMessage = readCookie('messege');
        if (initialMessage) {
            const textarea = document.querySelector(".text-area");
            if (textarea) {
                textarea.value = initialMessage;
                const sendButton = document.querySelector('.inside-button');
                if (sendButton) {
                    sendButton.click();
                }
                document.cookie = 'messege=; Max-Age=0; path=/';
            }
        }
    }, []);

    // Обновляем класс колесика загрузки при изменении состояния генерации
    useEffect(() => {
        const loadElements = document.querySelectorAll('.load');
        loadElements.forEach(load => {
            if (isGenerating) {
                load.classList.add('generating');
            } else {
                load.classList.remove('generating');
            }
        });
    }, [isGenerating]);

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
            clearTimeout(window.typingTimer);
        };
    }, []);

    return (
        <>
            <canvas ref={canvasRef} className="mw-canvas"></canvas>
            <div className="right-wrapper">
                <div className="logo2">
                    <span className="alt" onClick={toHome}>
                        <img src={img_logo} className="logo_img"/>
                        ThinkerAI
                    </span>
                </div>
                <button className="accaunt" onClick={toAccount}>ACCOUNT</button>
                <div className="textarea-wrapper" ref={wrapperRef}>
                    <textarea
                        className="text-area"
                        placeholder={(!loading && !user) ? "Login to chat first" : "Ask ALT to come up with an idea"}
                        onKeyDown={handleKeyDown}
                        onInput={handleAutoGrow}
                        ref={textareaRef}
                        disabled={loading || !user}
                    />
                    <button className="deep_think" onClick={click2}>DeepThink</button>
                    <button className="deeper_think" onClick={click3}>DeeperThink</button>
                    <button className="inside-button" onClick={click} disabled={isBusy || loading || !user}>→</button>
                </div>
                <div className={`content ${isTyping || isBusy ? 'typing' : ''}`} ref={contentRef}>
                </div>
            </div>
        </>
    );
};

export default App2;


