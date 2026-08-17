// DeepSeek Harness 桌面客户端
// 功能：检测本机 DSH 服务（127.0.0.1:3080），未运行时自动用 npx 拉起，然后打开独立窗口。
const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

const DSH_URL = 'http://127.0.0.1:3080';
const DSH_PORT = 3080;
const LOG_FILE = path.join(app.getPath('userData'), 'dsh-desktop.log');

let dshProcess = null;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (_) { /* ignore */ }
  console.log(line);
}

// 检测端口是否可达
function checkPort(port, timeout = 1200) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' });
    sock.setTimeout(timeout);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('error', () => resolve(false));
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
  });
}

// 等待端口就绪，最多 waitMs
async function waitForPort(waitMs) {
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if (await checkPort(DSH_PORT)) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

// 确保 DSH 服务在运行
async function ensureDsh() {
  if (await checkPort(DSH_PORT)) {
    log('DSH 服务已在运行，直接连接');
    return true;
  }
  log('DSH 服务未运行，尝试启动 npx @deepseek-ai/dsh web ...');
  try {
    dshProcess = spawn('npx', ['@deepseek-ai/dsh', 'web'], {
      cwd: process.env.USERPROFILE || process.env.HOME || 'C:\\',
      env: process.env,
      windowsHide: true,
      shell: true,
      stdio: 'ignore',
    });
    dshProcess.on('error', (err) => log('启动 DSH 失败: ' + err.message));
    dshProcess.on('exit', (code) => log('DSH 进程退出，code=' + code));
  } catch (err) {
    log('spawn 异常: ' + err.message);
  }
  const ok = await waitForPort(90 * 1000);
  log(ok ? 'DSH 服务启动成功' : '等待 DSH 服务超时（90 秒）');
  return ok;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: 'DeepSeek Harness 桌面版',
    autoHideMenuBar: true,
    backgroundColor: '#111111',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 处理加载失败：服务可能还没完全就绪
  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    log(`页面加载失败(${code}): ${desc}`);
    if (url.startsWith(DSH_URL)) {
      setTimeout(() => { if (!win.isDestroyed()) win.loadURL(DSH_URL); }, 2000);
    }
  });

  win.loadURL(DSH_URL);
  return win;
}

// 单实例锁：避免重复打开
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(async () => {
    log('应用启动');
    const ok = await ensureDsh();
    if (!ok) {
      dialog.showMessageBoxSync({
        type: 'error',
        title: '启动失败',
        message: '无法启动 DeepSeek Harness 服务。\n请确认 Node.js 已安装、网络可用，然后重试。\n\n日志位置：' + LOG_FILE,
      });
      app.quit();
      return;
    }
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
