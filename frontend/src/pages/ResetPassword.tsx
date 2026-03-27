/**
 * ResetPassword.tsx — Logame Run Task
 * Dark red+black theme · 6-digit code + new password
 */
import React, { useState, useRef, CSSProperties } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, Variants } from 'motion/react';
import { Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

/* ─── Design tokens ─────────────────────────── */
const C = {
  bg:       '#080b10',
  panel:    '#0d1018',
  red:      '#e63232',
  redDark:  '#c02020',
  border:   'rgba(255,255,255,0.07)',
  text1:    '#ffffff',
  text2:    'rgba(255,255,255,0.55)',
  text3:    'rgba(255,255,255,0.25)',
};

/* ─── Logo ─── */
function LogameLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="https://logame.com.br/wp-content/uploads/2026/01/LOGAME-1.png"
      alt="Logame"
      style={{ height: size, width: 'auto', display: 'block', objectFit: 'contain' }}
    />
  );
}

/* ─── Motion variants ───────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

/* ─── Styles ────────────────────────────────── */
const S: Record<string, CSSProperties> = {
  root:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: "'Inter','Helvetica Neue',sans-serif" },
  card:  { width: '100%', maxWidth: 420, padding: '40px 32px', background: C.panel, borderRadius: 20, border: `1px solid ${C.border}`, position: 'relative' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: C.text2, marginBottom: 6 },
  field: { position: 'relative' },
  icon:  { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text3, pointerEvents: 'none' },
  input: { width: '100%', boxSizing: 'border-box' as const, padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 14, outline: 'none', transition: 'border-color 150ms, box-shadow 150ms' },
  btn:   { width: '100%', padding: '13px', background: `linear-gradient(135deg, ${C.red} 0%, ${C.redDark} 100%)`, color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: `0 4px 24px rgba(230,50,50,0.45)`, transition: 'opacity 150ms, transform 100ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  error: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(230,50,50,0.1)', border: '1px solid rgba(230,50,50,0.3)', borderRadius: 10, fontSize: 13, color: '#f87171' },
  success: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, fontSize: 13, color: '#4ade80' },
  codeRow: { display: 'flex', gap: 10, justifyContent: 'center' },
  codeInput: {
    width: 44, height: 52, textAlign: 'center' as const, fontSize: 22, fontWeight: 700,
    background: 'rgba(255,255,255,0.05)', border: `2px solid ${C.border}`, borderRadius: 12,
    color: C.text1, outline: 'none', transition: 'border-color 200ms, box-shadow 200ms',
  },
};

export default function ResetPassword() {
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';

  const [email,       setEmail]       = useState(emailFromState);
  const [code,        setCode]        = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(230,50,50,0.7)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(230,50,50,0.15)';
  };
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = C.border;
    e.target.style.boxShadow   = 'none';
  };

  /* ─── Code input handlers ─── */
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newCode = [...code];
    newCode[index] = value.slice(-1); // single digit
    setCode(newCode);
    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    // Focus the last filled or first empty
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const codeString = code.join('');
    if (codeString.length !== 6) {
      setError('Preencha o código completo de 6 dígitos.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPwd) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeString, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Senha redefinida com sucesso!');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(data.error || 'Erro ao redefinir senha.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.root}>
      <motion.div style={S.card} variants={stagger} initial="hidden" animate="show">

        {/* Logo */}
        <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
          <LogameLogo size={34} />
          <p style={{ marginTop: 6, fontSize: 12, color: C.text3 }}>Run Task · Sistema de gestão de horas</p>
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text1 }}>Redefinir senha</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: C.text2, lineHeight: 1.5 }}>
            Informe o código de 6 dígitos recebido por email e sua nova senha.
          </p>
        </motion.div>

        {/* Feedback */}
        {error && (
          <motion.div style={{ ...S.error, marginBottom: 16 }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />{error}
          </motion.div>
        )}
        {success && (
          <motion.div style={{ ...S.success, marginBottom: 16 }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />{success}
          </motion.div>
        )}

        {/* Form */}
        <motion.form variants={fadeUp} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Email (pre-filled if coming from ForgotPassword) */}
          {!emailFromState && (
            <div>
              <label style={S.label}>Email</label>
              <div style={S.field}>
                <input type="email" required autoComplete="email" placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ ...S.input, paddingLeft: 14 }} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>
          )}

          {emailFromState && (
            <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, color: C.text3, margin: '0 0 2px' }}>Enviado para:</p>
              <p style={{ fontSize: 14, color: C.text1, margin: 0, fontWeight: 600 }}>{emailFromState}</p>
            </div>
          )}

          {/* 6-digit code */}
          <div>
            <label style={S.label}>Código de verificação</label>
            <div style={S.codeRow} onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  style={S.codeInput}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          {/* New password */}
          <div>
            <label style={S.label}>Nova senha</label>
            <div style={S.field}>
              <Lock size={15} style={S.icon} />
              <input type="password" required autoComplete="new-password" placeholder="Mínimo 6 caracteres"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={S.input} onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label style={S.label}>Confirmar senha</label>
            <div style={S.field}>
              <Lock size={15} style={S.icon} />
              <input type="password" required autoComplete="new-password" placeholder="Repita a nova senha"
                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                style={S.input} onFocus={onFocus} onBlur={onBlur}
              />
            </div>
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
                Redefinindo…
              </>
            ) : 'Redefinir senha'}
          </motion.button>
        </motion.form>

        {/* Back to login */}
        <motion.div variants={fadeUp} style={{ marginTop: 20, textAlign: 'center' }}>
          <Link
            to="/login"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.text2, textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.red)}
            onMouseLeave={e => (e.currentTarget.style.color = C.text2)}
          >
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
}
