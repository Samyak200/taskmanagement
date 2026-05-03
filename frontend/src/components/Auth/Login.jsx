import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const API = "http://localhost:5000/api/auth";

  const [doctors, setDoctors] = useState([]);
  const [formdata, setForm] = useState({
    name: "",
    specialization: "",
    experience: "",
    location: "",
    fee: "",
    image: "",
  });
  const [render, setRender] = useState("");
  const [infoData, setInfoData] = useState(null);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(API);
      setDoctors(res.data);
    } catch (err) {
      <h1>{err.message}</h1>;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(API, formdata);
    setForm({
      name: "",
      specialization: "",
      experience: "",
      location: "",
      fee: "",
      image: "",
    });
    fetchDoctors();
  };

  const handleRender = (task) => {
    setRender(task);
  };

  React.useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [loading, user, navigate, from]);

  function parseIdentifier(value) {
    const v = value.trim();
    if (v.includes("@")) return { email: v };
    return { username: v };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!usernameOrEmail.trim()) {
      setError("Enter username or email.");
      return;
    }
    setPending(true);
    try {
      await login({
        ...parseIdentifier(usernameOrEmail),
        password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-slate-900">
          Log in
        </h1>

        {error ? (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label
              htmlFor="identity"
              className="text-sm font-medium text-slate-700"
            >
              Username or email
            </label>
            <input
              id="identity"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-500 focus:ring-2"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="username or you@mail.com"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-500 focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          No account?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
