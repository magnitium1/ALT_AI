import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "./api/client";
import { useAuth } from "./auth/AuthContext";

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/chats/${id}`);
        setMessages(data?.messages || []);
      } catch (e) {
        navigate("/");
      }
    }
    if (id) load();
  }, [id, navigate]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const text = (input || "").trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { id: Date.now(), role: "user", content: text }]);
    try {
      // Сохраняем сообщение
      await api.post(`/chats/${id}/messages`, { role: "user", content: text });
      // Вызываем модель и сохраняем ответ
      const { data } = await api.post(`/request_to_model`, { request: text, chat_id: Number(id) });
      const answer = data?.answer || "";
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", content: answer }]);
    } catch (e) {
      setMessages((m) => [...m, { id: Date.now() + 2, role: "system", content: "Ошибка запроса" }]);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100vh"}}>
      <div ref={listRef} style={{flex:1, overflowY:"auto", padding:16}}>
        {messages.map((m) => (
          <div key={m.id} style={{margin:"8px 0", whiteSpace:"pre-wrap"}}>
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>
      <div style={{display:"flex", gap:8, padding:16, borderTop:"1px solid #333"}}>
        <textarea value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={onKeyDown} style={{flex:1}} placeholder="Write a message" />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}


