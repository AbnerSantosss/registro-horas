import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

interface WelcomeEmailData {
  name: string;
  email: string;
  password: string;
  role: string;
  position?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  colaborador: 'Colaborador',
  solicitante: 'Solicitante',
};

function buildWelcomeHtml(data: WelcomeEmailData): string {
  const APP_URL = process.env.APP_URL || 'http://localhost:5173';
  const roleLabel = ROLE_LABELS[data.role] || data.role;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:16px;border:1px solid #2a2d3e;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">LOGAME</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Gestão de Tarefas</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:600;">
            Bem-vindo(a), ${data.name}!
          </h2>
          <p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.6;">
            Sua conta foi criada no painel LOGAME.
            Utilize os dados abaixo para realizar seu primeiro acesso.
          </p>

          <!-- Credentials box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:12px;border:1px solid #2a2d3e;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email de acesso</td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px;color:#f1f5f9;font-size:15px;font-weight:500;">${data.email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Senha temporária</td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px;font-family:'Courier New',monospace;color:#f1f5f9;font-size:16px;font-weight:700;letter-spacing:2px;background:#161929;border-radius:8px;padding:12px 16px;border:1px dashed #3b82f6;">${data.password}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Nível de acesso</td>
                </tr>
                <tr>
                  <td style="padding:0;color:#f1f5f9;font-size:15px;font-weight:500;">${roleLabel}${data.position ? ` · ${data.position}` : ''}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:4px 0 8px;">
              <a href="${APP_URL}" target="_blank"
                 style="display:inline-block;background:#dc2626;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:10px;">
                Acessar o Painel
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px;border-top:1px solid #2a2d3e;text-align:center;">
          <p style="margin:0;color:#475569;font-size:12px;line-height:1.5;">
            Recomendamos alterar sua senha após o primeiro acesso.<br>
            Em caso de dúvidas, entre em contato com o administrador.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  console.log('[EMAIL DEBUG] GMAIL_USER:', gmailUser || '❌ UNDEFINED');
  console.log('[EMAIL DEBUG] GMAIL_APP_PASSWORD:', gmailPass ? `SET (${gmailPass.length} chars)` : '❌ UNDEFINED');
  console.log('[EMAIL DEBUG] Sending to:', data.email);

  if (!gmailUser || !gmailPass) {
    console.warn('⚠️  GMAIL_USER ou GMAIL_APP_PASSWORD não configurados. Email não enviado.');
    return { success: false, error: 'Gmail credentials not configured' };
  }

  try {
    // Force fresh transporter with current env values
    _transporter = null;
    const info = await getTransporter().sendMail({
      from: `LOGAME <${gmailUser}>`,
      to: data.email,
      subject: 'LOGAME — Sua conta foi criada',
      html: buildWelcomeHtml(data),
    });

    console.log(`✅ Welcome email sent to ${data.email}`);
    console.log('[EMAIL DEBUG] Response:', info.response);
    return { success: true };
  } catch (err: any) {
    console.error('❌ Email send failed:', err.message);
    console.error('[EMAIL DEBUG] Full error:', JSON.stringify(err, null, 2));
    return { success: false, error: err.message || 'Unknown email error' };
  }
}

export async function sendPasswordResetEmail(email: string, resetCode: string): Promise<{ success: boolean; error?: string }> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn('⚠️ GMAIL_USER ou GMAIL_APP_PASSWORD não configurados. Email de reset não enviado.');
    return { success: false, error: 'Gmail credentials not configured' };
  }

  try {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f4f4f5;color:#18181b;">
  <div style="max-width:500px;margin:0 auto;background:#fff;padding:30px;border-radius:10px;text-align:center;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);">
    <h2 style="color:#dc2626;margin-top:0;">Recuperação de Senha</h2>
    <p>Você solicitou a redefinição de senha para a sua conta.</p>
    <p style="margin:25px 0;">Seu código de recuperação é:</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:5px;color:#dc2626;background:#fef2f2;padding:15px;border-radius:8px;border:1px dashed #f87171;">
      ${resetCode}
    </div>
    <p style="margin-top:25px;font-size:14px;color:#71717a;">Este código é válido por 30 minutos.<br>Se você não solicitou isso, ignore este email.</p>
  </div>
</body>
</html>`;

    await getTransporter().sendMail({
      from: `LOGAME <${gmailUser}>`,
      to: email,
      subject: 'LOGAME — Código de Recuperação de Senha',
      html,
    });
    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true };
  } catch (err: any) {
    console.error('❌ Password reset email send failed:', err.message);
    return { success: false, error: err.message || 'Unknown email error' };
  }
}

export async function sendTaskAssignedEmail(email: string, name: string, taskTitle: string, taskDescription?: string | null): Promise<{ success: boolean; error?: string }> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn('⚠️ GMAIL_USER ou GMAIL_APP_PASSWORD não configurados. Email de atribuição não enviado.');
    return { success: false, error: 'Gmail credentials not configured' };
  }

  const APP_URL = process.env.APP_URL || 'http://localhost:5173';
  const displayDesc = taskDescription 
    ? taskDescription.replace(/\n/g, '<br>') 
    : '<span style="font-style: italic; color: #9ca3af;">Nenhuma descrição fornecida.</span>';

  try {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        .header { background-color: #2563eb; padding: 30px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px; }
        .content { padding: 40px; }
        .content h2 { margin-top: 0; font-size: 22px; color: #111827; }
        .task-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-top: 24px; margin-bottom: 32px; border-left: 4px solid #3b82f6; }
        .task-title { font-size: 18px; font-weight: 700; color: #1e3a8a; margin: 0 0 16px 0; display: flex; align-items: center; }
        .task-desc { font-size: 15px; color: #475569; line-height: 1.6; margin: 0; }
        .btn-container { text-align: center; margin-top: 32px; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; }
        .btn:hover { background-color: #1d4ed8; }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
            .container { margin: 15px; border-radius: 8px; }
            .content { padding: 24px; }
        }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6;">
        <tr>
            <td align="center">
                <div class="container">
                    <div class="header">
                        <h1>LOGAME</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, ${name}!</h2>
                        <p style="font-size: 16px; line-height: 1.5; color: #374151;">Você acabou de receber uma nova atribuição no painel. Confira os detalhes abaixo:</p>
                        
                        <div class="task-card">
                            <h3 class="task-title">📌 ${taskTitle}</h3>
                            <p class="task-desc">${displayDesc}</p>
                        </div>
                        
                        <div class="btn-container">
                            <a href="${APP_URL}" class="btn">Acessar Tarefa</a>
                        </div>
                    </div>
                    <div class="footer">
                        Este é um e-mail automático do sistema LOGAME. Por favor, não responda.<br>
                        © ${new Date().getFullYear()} LOGAME. Todos os direitos reservados.
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await getTransporter().sendMail({
      from: `LOGAME <${gmailUser}>`,
      to: email,
      subject: `LOGAME — Nova Tarefa: ${taskTitle}`,
      html,
    });
    console.log(`✅ Task assignment email sent to ${email}`);
    return { success: true };
  } catch (err: any) {
    console.error('❌ Task assignment email send failed:', err.message);
    return { success: false, error: err.message || 'Unknown email error' };
  }
}

