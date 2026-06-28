const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { settingsDir } = require('./settings');

// ── Token 持久化 ───────────────────────────────────────
// 随机生成一次，持久化到配置目录，跨重启稳定。
// 用于校验本机 HTTP 调用方（挡 curl/exe 等本机程序），与 CORS 白名单（挡网页）配合使用。
const tokenFile = path.join(settingsDir, 'auth-token.json');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

let cachedToken = null;

function getToken() {
  if (cachedToken) return cachedToken;

  try {
    if (fs.existsSync(tokenFile)) {
      const data = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
      if (data && typeof data.token === 'string' && data.token.length >= 32) {
        cachedToken = data.token;
        return cachedToken;
      }
    }
  } catch { /* 损坏则重建 */ }

  // 生成新 token
  cachedToken = generateToken();
  try {
    fs.writeFileSync(tokenFile, JSON.stringify({ token: cachedToken, created_at: new Date().toISOString() }, null, 2), 'utf-8');
  } catch { /* ignore */ }
  return cachedToken;
}

// ── CORS 白名单 ────────────────────────────────────────
// 仅允许本机开发服务器 / 浏览器访问，挡掉外部网页与 DNS 重绑定。
const ALLOWED_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

// null origin（非浏览器请求，如 curl）允许通过 CORS，但仍需 Token 校验
function isOriginAllowed(origin) {
  if (!origin) return true;
  return ALLOWED_ORIGIN_RE.test(origin);
}

function corsAllowValue(origin) {
  return isOriginAllowed(origin) && origin ? origin : '';
}

// ── Token 校验 ────────────────────────────────────────
// 不需要鉴权的公开路由（仅端口探测 / 健康检查）
const PUBLIC_PATHS = new Set(['/api/health']);

function extractBearer(req) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

/** 判断请求是否通过鉴权
 *
 *  双层防御模型：
 *    1. CORS 白名单 → 挡外部网页（仅 localhost/127.0.0.1 可行）
 *    2. Bearer Token → 挡本机非浏览器程序（curl/exe 等不发送 Origin 头）
 *
 *  浏览器请求（带合法 Origin）：CORS 校验已通过 → 免 Token 放行
 *  非浏览器请求（无 Origin）：必须携带正确的 Bearer Token
 *
 *  安全性：同机恶意 localhost 页面理论上可 CSRF，但如果攻击者能在
 *  localhost 跑 Web 服务，它同样能直接读取磁盘上的 auth-token.json。
 */
function isAuthorized(req, pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;

  // 浏览器请求：Origin 来自 localhost/127.0.0.1 → CORS 已校验，放行
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) return true;

  // 非浏览器请求（curl/exe/脚本）：必须携带 Bearer token
  return extractBearer(req) === getToken();
}

module.exports = {
  getToken,
  generateToken,
  isOriginAllowed,
  corsAllowValue,
  isAuthorized,
  tokenFile,
};
