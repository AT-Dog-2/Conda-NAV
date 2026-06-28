import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Alert, Space } from 'antd';
import { BranchesOutlined, PlusOutlined, ImportOutlined } from '@ant-design/icons';
import { useI18n } from '../i18n/context';
import { envNameFormRules } from '../utils/envName';

/**
 * 新建 / 克隆 / 从 yml 导入 三合一弹窗
 * mode: 'create' | 'clone' | 'import'
 * importFilePath: 仅 import 模式，yml 文件路径
 */
export default function CreateModal({ open, mode, cloneSource, importFilePath, onCancel, onSubmit }) {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const isClone = mode === 'clone';
  const isImport = mode === 'import';

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ name: '', python_version: '3.12' });
    }
  }, [open, mode, cloneSource, importFilePath, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch { /* 校验未通过 */ }
  };

  const titleIcon = isImport
    ? <ImportOutlined style={{ color: '#4CAF50' }} />
    : isClone
      ? <BranchesOutlined style={{ color: '#4CAF50' }} />
      : <PlusOutlined style={{ color: '#4CAF50' }} />;

  const titleText = isImport
    ? t('create.titleImport')
    : isClone
      ? t('create.titleClone')
      : t('create.titleNew');

  const okText = isImport
    ? t('create.importBtn')
    : isClone
      ? t('create.cloneBtn')
      : t('create.createBtn');

  return (
    <Modal
      title={<Space>{titleIcon}{titleText}</Space>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={t('create.cancel')}
      destroyOnClose
    >
      {isImport && importFilePath && (
        <Alert
          message={t('create.importFrom', { file: importFilePath })}
          type="info" showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {isClone && cloneSource && (
        <Alert
          message={t('create.cloneFrom', { name: cloneSource.name, ver: cloneSource.python_version || t('env.unknown') })}
          type="info" showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('create.name')}
          rules={envNameFormRules(t)}
        >
          <Input placeholder={t('create.namePlaceholder')} maxLength={32} />
        </Form.Item>

        {!isClone && !isImport && (
          <Form.Item
            name="python_version"
            label={t('create.pythonVer')}
            rules={[{ required: true, message: t('create.pythonRequired') }]}
          >
            <Select
              placeholder={t('create.pythonPlaceholder')}
              options={[
                { label: 'Python 3.12', value: '3.12' },
                { label: 'Python 3.11', value: '3.11' },
                { label: 'Python 3.10', value: '3.10' },
                { label: 'Python 3.9', value: '3.9' },
                { label: 'Python 3.8', value: '3.8' },
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
