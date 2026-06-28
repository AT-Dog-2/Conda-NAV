import React, { useState, useEffect, useRef } from 'react';
import { Modal, Typography, Space, Tag, Empty } from 'antd';
import { ConsoleSqlOutlined } from '@ant-design/icons';
import { useI18n } from '../i18n/context';

const { Text } = Typography;

export const terminalLogs = [];
const listeners = new Set();

export function addLog(level, message, detail = '') {
  const entry = { time: new Date().toLocaleTimeString(), level, message, detail };
  terminalLogs.push(entry);
  if (terminalLogs.length > 200) terminalLogs.shift();
  listeners.forEach((fn) => fn(entry));
}

export default function TerminalDrawer({ open, onClose }) {
  const { t } = useI18n();
  const [logs, setLogs] = useState([...terminalLogs]);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLogs([...terminalLogs]);
    const handler = () => setLogs([...terminalLogs]);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 高对比颜色
  const levelStyle = {
    info:    { tag: '#1890ff', text: '#b8d4fe' },
    success: { tag: '#4ade80', text: '#bbf7d0' },
    error:   { tag: '#f87171', text: '#fecaca' },
    cmd:     { tag: '#fb923c', text: '#fed7aa' },
  };

  const levelLabel = {
    info: 'INFO', success: 'OK', error: 'ERR', cmd: 'CMD',
  };

  return (
    <Modal
      title={
        <Space style={{ color: '#ffffff' }}>
          <ConsoleSqlOutlined style={{ color: '#4CAF50' }} />
          <span style={{ color: '#ffffff' }}>{t('app.terminal')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="70vw"
      destroyOnClose
      styles={{
        body: {
          padding: 0,
          maxHeight: '70vh',
          overflow: 'auto',
          background: '#1a1a1a',
          fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, Monaco, "Courier New", monospace',
          fontSize: 13,
          lineHeight: '22px',
        },
        header: {
          background: '#262626',
          borderBottom: '1px solid #363636',
          color: '#ffffff',
        },
      }}
    >
      <div style={{ padding: '12px 20px', minHeight: 120 }}>
        {logs.length === 0 ? (
          <Empty
            description={<span style={{ color: '#8b949e' }}>No logs</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          logs.map((log, i) => {
            const s = levelStyle[log.level] || levelStyle.info;
            return (
              <div key={i} style={{ marginBottom: 3, lineHeight: '22px' }}>
                {/* 时戳 */}
                <Text style={{ color: '#484f58', marginRight: 12, fontSize: 12 }}>
                  {log.time}
                </Text>

                {/* 级别标签 */}
                <Tag
                  color={s.tag}
                  bordered={false}
                  style={{
                    fontSize: 10,
                    lineHeight: '16px',
                    marginRight: 10,
                    padding: '0 6px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    background: s.tag + '20',
                    border: `1px solid ${s.tag}40`,
                  }}
                >
                  {levelLabel[log.level] || log.level.toUpperCase()}
                </Tag>

                {/* 消息 */}
                <Text style={{ color: s.text }}>{log.message}</Text>

                {/* 详情（灰色小字） */}
                {log.detail && (
                  <div style={{ color: '#6e7681', marginLeft: 32, fontSize: 12, wordBreak: 'break-all' }}>
                    {log.detail}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </Modal>
  );
}
