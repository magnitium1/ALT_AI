import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import "./UI-UX/Login.model.css";


const Login = ({ regForm }) => {
    const { reload } = useAuth();
    const [flag, setFlag] = useState(true);
    const [loginName, setLoginName] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [regName, setRegName] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [errorText, setErrorText] = useState("");
    const [infoText, setInfoText] = useState("");
    // Показываем постоянное сообщение об успешном входе, если оно было ранее
    useEffect(() => {
        try {
            const ok = localStorage.getItem('login_success');
            if (ok === '1') {
                setInfoText('LOGIN SUCCESSFUL');
            }
        } catch {}
    }, []);


    const reverse1 = () => {
        setFlag(false);
    };

    const reverse2 = () => {
        setFlag(true);
    };

    let d_n1 = "";
    let d_n2 = "display_none";
    let o_c = "display_none";
    if (regForm) {
        o_c = "";
    }
    if (!flag) {
        d_n2 = "";
        d_n1 = "display_none";
    }

    const handleRegister = async () => {
        setErrorText("");
        setInfoText("");
        try {
            if (!regName || !regPassword) {
                setErrorText("Введите логин и пароль");
                return;
            }
            await api.post(`/register`, {
                username: regName,
                password: regPassword,
                email: regEmail || undefined,
            });
            setInfoText("Регистрация успешна. Теперь войдите.");
            setFlag(true);
        } catch (e) {
            const msg = e?.response?.data?.error || "Ошибка регистрации";
            setErrorText(msg);
        }
    };

    const handleLogin = async () => {
        setErrorText("");
        try {
            if (!loginName || !loginPassword) {
                setErrorText("Введите логин и пароль");
                return;
            }
            const resp = await api.post(`/login`, {
                username: loginName,
                password: loginPassword,
            });
            if (resp?.data?.ok) {
                setInfoText("LOGIN SUCCESSFUL");
                try { localStorage.setItem('login_success', '1'); } catch {}
                await reload();
            } else {
                setErrorText("Вход не подтверждён сервером");
            }
        } catch (e) {
            const msg = e?.response?.data?.error || "Ошибка входа";
            setErrorText(msg);
        }
    };

    return (
        <div className={`Login ${o_c}`}>
            <h2 className="text-content">Knowledge is power</h2>
            {errorText && <div className="error-text">{errorText}</div>}
            {infoText && <div className="info-text success-text">{infoText}</div>}
            <div className={`div-input1 ${d_n1}`}>
                <input className="input class1" placeholder="Nickname" value={loginName} onChange={(e) => setLoginName(e.target.value)} />
                <input className="input class2" type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                <h3 className="ac">
                    No account?{" "}
                    <a className="link1" onClick={reverse1}>
                        Create →
                    </a>
                </h3>
                <button className="btn-enter1 one" onClick={handleLogin}>Enter</button>
            </div>
            <div className={`div-input2 ${d_n2}`}>
                <input className="input class3" placeholder="Nickname" value={regName} onChange={(e) => setRegName(e.target.value)} />
                <input className="input class1" type="password" placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                <input className="input class2" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                <h3 className="ac">
                    Have account?{" "}
                    <a className="link1" onClick={reverse2}>
                        Come in →
                    </a>
                </h3>
                <button className="btn-enter1 one" onClick={handleRegister}>Register</button>
            </div>
        </div>
    );
};

export default Login;
