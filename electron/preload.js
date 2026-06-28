const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  on: (channel, callback) => {
    const listener = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },

  once: (channel, callback) => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args));
  },

  openFileDialog: (options) => ipcRenderer.invoke('dialog:open-file', options),
  openDirectoryDialog: (options) => ipcRenderer.invoke('dialog:open-directory', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:save-file', options),

  // 本地 HTTP 鉴权 token（供浏览器模式 fetch 携带；IPC 模式不用）
  getToken: () => ipcRenderer.invoke('auth:get-token'),
});
