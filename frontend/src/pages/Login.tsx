/**
 * Login.tsx — Logame Run Task
 * Dark red+black theme · motion animations · logo Logame inline
 */
import React, { useState, CSSProperties } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, Variants } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, AlertCircle,
  ClipboardList, Timer, BarChart3, Users,
  Eye, EyeOff
} from 'lucide-react';

/* ─── Design tokens ─────────────────────────── */
const C = {
  bg:       '#080b10',
  panel:    '#0d1018',
  red:      '#e63232',
  redDark:  '#c02020',
  border:   'rgba(255,255,255,0.07)',
  glass:    'rgba(255,255,255,0.03)',
  text1:    '#ffffff',
  text2:    'rgba(255,255,255,0.55)',
  text3:    'rgba(255,255,255,0.25)',
};

/* ─── Logo — imagem oficial Logame ─── */
function LogameLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="https://logame.com.br/wp-content/uploads/2026/01/LOGAME-1.png"
      alt="Logame"
      style={{ height: size, width: 'auto', display: 'block', objectFit: 'contain' }}
    />
  );
}

/* ─── Feature cards ─────────────────────────── */
const features = [
  { icon: ClipboardList, label: 'Gestão de Tarefas',   desc: 'Organize com kanban inteligente' },
  { icon: Timer,         label: 'Controle de Horas',    desc: 'Timesheet por tarefa e projeto' },
  { icon: BarChart3,     label: 'Relatórios',           desc: 'Dashboards em tempo real' },
  { icon: Users,         label: 'Equipe',               desc: 'Colaboração centralizada' },
];

/* ─── Motion variants ───────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: -32 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: 32 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Styles ────────────────────────────────── */
const S: Record<string, CSSProperties> = {
  root:   { minHeight: '100vh', display: 'flex', background: C.bg, fontFamily: "'Inter','Helvetica Neue',sans-serif", overflow: 'hidden' },
  left:   { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden', background: `linear-gradient(155deg, #120408 0%, #140c0c 50%, #0d0d0d 100%)` },
  right:  { width: 440, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: C.panel, position: 'relative' },
  grid:   { position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(230,50,50,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(230,50,50,0.06) 1px, transparent 1px)`, backgroundSize: '52px 52px' },
  glow1:  { position: 'absolute', top: '-15%', left: '-10%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,50,50,0.2) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(8px)' },
  glow2:  { position: 'absolute', bottom: '-10%', right: '0', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,50,50,0.12) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(8px)' },
  tagline:{ fontSize: 13, color: C.text3, marginTop: 32 },
  form:   { width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 20 },
  label:  { display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: C.text2, marginBottom: 6 },
  field:  { position: 'relative' },
  icon:   { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text3, pointerEvents: 'none' },
  input:  { width: '100%', boxSizing: 'border-box' as const, padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 14, outline: 'none', transition: 'border-color 150ms, box-shadow 150ms' },
  btn:    { width: '100%', padding: '13px', background: `linear-gradient(135deg, ${C.red} 0%, ${C.redDark} 100%)`, color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: `0 4px 24px rgba(230,50,50,0.45)`, transition: 'opacity 150ms, transform 100ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  error:  { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(230,50,50,0.1)', border: '1px solid rgba(230,50,50,0.3)', borderRadius: 10, fontSize: 13, color: '#f87171' },
  hint:   { padding: '14px 16px', background: 'rgba(230,50,50,0.06)', border: '1px solid rgba(230,50,50,0.18)', borderRadius: 12, textAlign: 'center' as const, fontSize: 12, color: C.text3 },
  featureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 440 },
  featCard:    { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: C.glass, border: `1px solid rgba(230,50,50,0.15)`, borderRadius: 14, backdropFilter: 'blur(8px)' },
  featIcon:    { width: 34, height: 34, borderRadius: 8, background: 'rgba(230,50,50,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};

/* ─── Component ─────────────────────────────── */
export default function Login() {
  const [email,      setEmail]      = useState(() => localStorage.getItem('savedEmail') || '');
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('savedEmail'));
  const [showPassword, setShowPassword] = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(230,50,50,0.7)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(230,50,50,0.15)';
  };
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = C.border;
    e.target.style.boxShadow   = 'none';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (res.ok) { 
        if (rememberMe) {
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('savedEmail');
        }
        login(data.token, data.user, rememberMe); 
        navigate('/'); 
      }
      else setError(data.error || 'Email ou senha inválidos.');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div style={S.root}>

      {/* ═══ LEFT PANEL ═══ */}
      <motion.div
        style={{ ...S.left, display: 'none' } as CSSProperties}
        className="lg-left"
        variants={slideRight}
        initial="hidden"
        animate="show"
      >
        <style>{`.lg-left { display: none !important; } @media(min-width:1024px){ .lg-left { display:flex !important; flex-direction:column; justify-content:space-between; } }`}</style>

        {/* Decorative bg */}
        <div style={S.grid} />
        <div style={S.glow1} />
        <div style={S.glow2} />

        {/* Logo */}
        <motion.div style={{ position: 'relative' }} variants={fadeUp}>
          <LogameLogo size={38} />
          <p style={{ marginTop: 6, fontSize: 13, color: C.text3, letterSpacing: '0.04em' }}>Run Task · Sistema de gestão de horas</p>
        </motion.div>

        {/* Headline + features */}
        <motion.div style={{ position: 'relative' }} variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: C.text1, lineHeight: 1.15, margin: 0 }}>
              Controle total<br />
              <span style={{ color: C.red }}>das suas horas</span>
            </h2>
            <p style={{ marginTop: 12, fontSize: 15, color: C.text2, maxWidth: 360, lineHeight: 1.6 }}>
              Gerencie tarefas, registre horas e acompanhe a produtividade da sua equipe em um só lugar.
            </p>
          </motion.div>

          <motion.div style={{ ...S.featureGrid, marginTop: 32 }} variants={stagger} initial="hidden" animate="show">
            {features.map(({ icon: Icon, label, desc }) => (
              <motion.div key={label} style={S.featCard} variants={fadeUp} whileHover={{ scale: 1.02, borderColor: 'rgba(230,50,50,0.35)' }}>
                <div style={S.featIcon}><Icon size={16} color={C.red} /></div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 12, color: C.text3, margin: '3px 0 0' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.p style={S.tagline} variants={fadeUp}>© {new Date().getFullYear()} Logame Run Task · Todos os direitos reservados</motion.p>
      </motion.div>

      {/* ═══ RIGHT PANEL — Form ═══ */}
      <motion.div style={S.right} variants={slideLeft} initial="hidden" animate="show">
        {/* Subtle vertical line separator */}
        <div style={{ position: 'absolute', left: 0, top: '10%', bottom: '10%', width: 1, background: 'rgba(230,50,50,0.15)' }} />

        <motion.div style={S.form} variants={stagger} initial="hidden" animate="show">

          {/* Logo (always visible on mobile, hidden on desktop left panel) */}
          <motion.div variants={fadeUp} style={{ marginBottom: 8 }}>
            <LogameLogo size={34} />
            <p style={{ marginTop: 6, fontSize: 12, color: C.text3 }}>Run Task · Sistema de gestão de horas</p>
          </motion.div>

          {/* Header */}
          <motion.div variants={fadeUp}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text1 }}>Bem-vindo de volta</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: C.text2 }}>Entre na sua conta para continuar</p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div style={S.error} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />{error}
            </motion.div>
          )}

          {/* Form */}
          <motion.form variants={fadeUp} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={S.label}>Email</label>
              <div style={S.field}>
                <Mail size={15} style={S.icon} />
                <input type="email" required autoComplete="email" placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={S.input} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={S.label}>Senha</label>
              <div style={S.field}>
                <Lock size={15} style={S.icon} />
                <input type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ ...S.input, paddingRight: 40 }} onFocus={onFocus} onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: C.text3, display: 'flex'
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.text2, userSelect: 'none' }}
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div
                  style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${rememberMe ? C.red : 'rgba(255,255,255,0.15)'}`,
                    background: rememberMe ? C.red : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  {rememberMe && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                Lembrar-me
              </label>

              <Link
                to="/forgot-password"
                style={{
                  fontSize: 13, color: C.red, textDecoration: 'none',
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
              whileHover={loading ? {} : { opacity: 0.9, scale: 1.01 }}
              whileTap={loading   ? {} : { scale: 0.98 }}
            >
              {loading ? (
                <>
                  <svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Entrando…
                </>
              ) : 'Entrar'}
            </motion.button>
          </motion.form>

          {/* Credentials hint */}
          <motion.div style={S.hint} variants={fadeUp}>
            <p style={{ fontWeight: 700, color: C.text2, margin: '0 0 6px', fontSize: 12 }}>🔑 Acesso padrão</p>
            <p style={{ margin: '2px 0' }}>admin@runtask.com</p>
            <p style={{ margin: '2px 0' }}>admin123</p>
          </motion.div>

          {/* Divider */}
          <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.text3 }}>Logame © {new Date().getFullYear()}</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </motion.div>

        </motion.div>
      </motion.div>
    </div>
  );
}
