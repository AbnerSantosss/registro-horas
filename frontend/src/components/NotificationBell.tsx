import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, X, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  task_assigned:    { icon: <Bell size={14} />, color: '#3b82f6' },
  task_started:     { icon: <Clock size={14} />, color: '#f59e0b' },
  task_completed:   { icon: <Check size={14} />, color: '#10b981' },
  task_approved:    { icon: <CheckCheck size={14} />, color: '#10b981' },
  task_rejected:    { icon: <X size={14} />, color: '#ef4444' },
  task_overdue:     { icon: <AlertTriangle size={14} />, color: '#f97316' },
  task_transferred: { icon: <Bell size={14} />, color: '#8b5cf6' },
  info:             { icon: <Bell size={14} />, color: '#6b7280' },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const handleNotificationClick = (n: any) => {
    if (!n.read) markAsRead(n.id);
    setSelectedNotification(n);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 10,
          border: 'none',
          background: open ? 'var(--surface-3)' : 'transparent',
          color: 'var(--text-2)',
          cursor: 'pointer',
          transition: 'all 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        title="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: unreadCount > 9 ? 18 : 16,
              height: 16,
              borderRadius: 99,
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px var(--surface-1)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 380,
            maxHeight: 480,
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)' }}>
              Notificações
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: '#ef4444',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 20,
                  }}
                >
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-600)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CheckCheck size={13} /> Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-3)',
                  fontSize: '0.85rem',
                }}
              >
                <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      background: n.read ? 'transparent' : 'var(--brand-50)',
                      cursor: n.read ? 'default' : 'pointer',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => { if (!n.read) e.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={e => { if (!n.read) e.currentTarget.style.background = 'var(--brand-50)'; }}
                  >
                    {/* Type icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: config.color + '18',
                        color: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: n.read ? 400 : 600,
                          color: 'var(--text-1)',
                          lineHeight: 1.4,
                          marginBottom: 2,
                        }}
                      >
                        {n.title}
                      </p>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-3)',
                          lineHeight: 1.35,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {n.message}
                      </p>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-3)',
                          marginTop: 4,
                          display: 'inline-block',
                        }}
                      >
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Unread indicator */}
                    {!n.read && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 99,
                          background: '#3b82f6',
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal / Popup for Notification Details */}
      {selectedNotification && (() => {
        const config = TYPE_CONFIG[selectedNotification.type] || TYPE_CONFIG.info;
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
          }}>
            <div 
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} 
              onClick={() => setSelectedNotification(null)}
            />
            <div 
              className="animate-scale-in"
              style={{ 
                position: 'relative', 
                background: 'var(--surface-1)', 
                borderRadius: 16, 
                width: '100%', 
                maxWidth: 420, 
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
                border: '1px solid var(--border)',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Detalhes da Notificação
                </h3>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', outline: 'none', padding: 4, borderRadius: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: config.color + '15',
                    color: config.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {/* Render icon with slightly larger size */}
                    {React.isValidElement(config.icon) ? React.cloneElement(config.icon as React.ReactElement, { size: 24 } as any) : config.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: 4, lineHeight: 1.3 }}>
                      {selectedNotification.title}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                      {new Date(selectedNotification.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--surface-2)', 
                  padding: 16, 
                  borderRadius: 12, 
                  color: 'var(--text-2)', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6,
                  border: '1px solid var(--border)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedNotification.message}
                </div>
              </div>

              <div style={{ padding: '16px 24px', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="btn-brand"
                  style={{ padding: '8px 24px' }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
