import { useState } from "react";
import axios from "axios";
import "./UI-UX/Login.model.css";

const API_BASE = "http://127.0.0.1:8070";

const Login = ({ regForm }) => {
    const [flag, setFlag] = useState(true);
    const [loginName, setLoginName] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [regName, setRegName] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [errorText, setErrorText] = useState("");
    const [infoText, setInfoText] = useState("");

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
            await axios.post(`${API_BASE}/register`, {
                username: regName,
                password: regPassword,
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
        setInfoText("");
        try {
            if (!loginName || !loginPassword) {
                setErrorText("Введите логин и пароль");
                return;
            }
            const resp = await axios.post(`${API_BASE}/login`, {
                username: loginName,
                password: loginPassword,
            });
            const token = resp?.data?.token;
            if (token) {
                localStorage.setItem("jwt_token", token);
                setInfoText("Вход выполнен");
            } else {
                setErrorText("Токен не получен");
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
            {infoText && <div className="info-text">{infoText}</div>}
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
