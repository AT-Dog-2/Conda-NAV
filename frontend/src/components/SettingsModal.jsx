import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Select, Switch, InputNumber, message, Alert, Typography, Divider } from 'antd';
import {
  SettingOutlined, SearchOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FolderOpenOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useI18n } from '../i18n/context';
import api from '../api';

const { Text } = Typography;

export default function SettingsModal({ open, onClose, onSaved }) {
  const { t, locale, setLocale } = useI18n();
  const [condaPath, setCondaPath] = useState('');
  const [mambaPath, setMambaPath] = useState('');
  const [testing, setTesting] = useState({ conda: false, mamba: false });
  const [testResult, setTestResult] = useState({ conda: null, mamba: null });
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [openingSettingsDir, setOpeningSettingsDir] = useState(false);
  const [calcEnvSize, setCalcEnvSize] = useState(false);
  const [calcTimeoutSec, setCalcTimeoutSec] = useState(30);

  useEffect(() => {
    if (open) {
      api.getSettings()
        .then((res) => {
          setCondaPath(res.data.conda_path || '');
          setMambaPath(res.data.mamba_path || '');
          setCalcEnvSize(!!res.data.calc_env_size);
          setCalcTimeoutSec(res.data.calc_timeout_sec ?? 30);
          setTestResult({ conda: null, mamba: null });
        })
        .catch(() => {});
    }
  }, [open]);

  const handleBrowse = async (type) => {
    if (window.electron?.openFileDialog) {
      try {
        const filePath = await window.electron.openFileDialog({
          title: type === 'conda' ? t('settings.condaPath') : t('settings.mambaPath'),
          filters: [{ name: 'Executables', extensions: ['exe', 'bat'] }],
        });
        if (filePath) {
          if (type === 'conda') setCondaPath(filePath);
          else setMambaPath(filePath);
          setTestResult((prev) => ({ ...prev, [type]: null }));
        }
      } catch {
        message.error(t('settings.browseFail'));
      }
      return;
    }
    message.info(t('settings.browseManual'));
  };

  const handleTest = async (type) => {
    const path = type === 'conda' ? condaPath : mambaPath;
    if (!path) { message.warning(t('settings.pathRequired')); return; }
    setTesting((prev) => ({ ...prev, [type]: true }));
    setTestResult((prev) => ({ ...prev, [type]: null }));
    try {
      const res = await api.testConda({ path });
      setTestResult((prev) => ({ ...prev, [type]: { ok: res.data.ok, info: res.data.info } }));
      res.data.ok ? message.success(res.data.info) : message.error(res.data.info);
    } catch (err) {
      setTestResult((prev) => ({ ...prev, [type]: { ok: false, info: err.message } }));
    } finally {
      setTesting((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const res = await api.autoDetect();
      setCondaPath(res.data.conda_path || '');
      setMambaPath(res.data.mamba_path || '');
      message.info(t('settings.autoDetected'));
    } catch {
      message.error(t('settings.autoDetectFail'));
    } finally {
      setDetecting(false);
    }
  };

  const handleOpenSettingsDir = async () => {
    setOpeningSettingsDir(true);
    try {
      await api.openSettingsDir();
      message.success(t('settings.openedDir'));
    } catch {
      message.error(t('settings.openDirFail'));
    } finally {
      setOpeningSettingsDir(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveSettings({
        conda_path: condaPath,
        mamba_path: mambaPath,
        onboarding_completed: true,
        calc_env_size: calcEnvSize,
        calc_timeout_sec: calcTimeoutSec,
      });
      message.success(t('settings.saved'));
      onSaved?.();
      onClose();
    } catch {
      message.error(t('settings.saveFail'));
    } finally {
      setSaving(false);
    }
  };

  const testIcon = (type) => {
    const r = testResult[type];
    if (r === null) return null;
    if (r.ok) return <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />;
    return <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />;
  };

  return (
    <Modal
      title={<Space><SettingOutlined />{t('settings.title')}</Space>}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText={t('settings.save')}
      cancelText={t('create.cancel')}
      confirmLoading={saving}
      width={580}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>{t('settings.language')}</Text>
        <Select
          value={locale}
          onChange={setLocale}
          style={{ width: '100%', marginTop: 4 }}
          options={[
            { label: t('settings.zh'), value: 'zh-CN' },
            { label: t('settings.en'), value: 'en-US' },
          ]}
        />
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* ── 计算大小设置 ── */}
      <div style={{ marginBottom: 12 }}>
        <Space>
          <Switch
            size="small"
            checked={calcEnvSize}
            onChange={(v) => setCalcEnvSize(v)}
          />
          <Text strong>{t('settings.calcEnvSize')}</Text>
        </Space>
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.calcEnvSizeDesc')}</Text>
        </div>
        {calcEnvSize && (
          <div style={{ marginTop: 8 }}>
            <Space>
              <Text type="secondary">{t('settings.calcTimeout')}：</Text>
              <InputNumber
                size="small"
                min={5}
                max={300}
                value={calcTimeoutSec}
                onChange={(v) => setCalcTimeoutSec(v || 30)}
                style={{ width: 80 }}
              />
              <Text type="secondary">{t('settings.calcTimeoutUnit')}</Text>
            </Space>
            <div style={{ marginTop: 2 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.calcTimeoutHint')}</Text>
            </div>
          </div>
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <Alert
        message={t('settings.info')}
        description={t('settings.infoDesc')}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <Button icon={<SearchOutlined />} onClick={handleAutoDetect} loading={detecting} size="small">
          {t('settings.autoDetect')}
        </Button>
        <Button icon={<FileTextOutlined />} onClick={handleOpenSettingsDir} loading={openingSettingsDir} size="small" style={{ marginLeft: 8 }}>
          {t('settings.openSettingsDir')}
        </Button>
      </div>

      <Form layout="vertical">
        <div style={{ marginBottom: 16 }}>
          <Text strong>{t('settings.condaPath')}</Text>
          <div style={{ marginTop: 4 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={condaPath}
                onChange={(e) => { setCondaPath(e.target.value); setTestResult((prev) => ({ ...prev, conda: null })); }}
                placeholder={t('settings.condaPlaceholder')}
                suffix={
                  <Space size={4}>
                    {testIcon('conda')}
                    <Button size="small" onClick={() => handleTest('conda')} loading={testing.conda} type="link">{t('settings.test')}</Button>
                  </Space>
                }
              />
              <Button icon={<FolderOpenOutlined />} onClick={() => handleBrowse('conda')}>{t('settings.browse')}</Button>
            </Space.Compact>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>{t('settings.mambaPath')} <Text type="secondary">({t('settings.mambaOptional')})</Text></Text>
          <div style={{ marginTop: 4 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={mambaPath}
                onChange={(e) => { setMambaPath(e.target.value); setTestResult((prev) => ({ ...prev, mamba: null })); }}
                placeholder={t('settings.mambaPlaceholder')}
                suffix={
                  <Space size={4}>
                    {testIcon('mamba')}
                    <Button size="small" onClick={() => handleTest('mamba')} loading={testing.mamba} type="link">{t('settings.test')}</Button>
                  </Space>
                }
              />
              <Button icon={<FolderOpenOutlined />} onClick={() => handleBrowse('mamba')}>{t('settings.browse')}</Button>
            </Space.Compact>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
