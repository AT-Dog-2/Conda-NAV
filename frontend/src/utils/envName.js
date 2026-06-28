export const PROTECTED_ENVS = new Set(['base', 'root']);
export const ENV_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export function isProtectedEnv(name) {
  return PROTECTED_ENVS.has((name || '').toLowerCase());
}

export function validateNewEnvName(value, t) {
  if (!value) return t('create.nameRequired');
  if (isProtectedEnv(value)) return t('create.protectedName');
  if (!ENV_NAME_RE.test(value)) return t('create.nameRule');
  return null;
}

export const envNameFormRules = (t) => [
  { required: true, message: t('create.nameRequired') },
  { pattern: ENV_NAME_RE, message: t('create.nameRule') },
  {
    validator: (_, value) => {
      if (value && isProtectedEnv(value)) {
        return Promise.reject(new Error(t('create.protectedName')));
      }
      return Promise.resolve();
    },
  },
];
