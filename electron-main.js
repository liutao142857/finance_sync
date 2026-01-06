
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    title: "简易记账 - 桌面版",
    icon: path.join(__dirname, 'icon.ico'), // 需准备图标文件
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // 允许访问本地文件系统
      webSecurity: false 
    },
    // 隐藏菜单栏
    autoHideMenuBar: true
  });

  // 加载本地编译后的 index.html
  win.loadFile('index.html');

  // 开发环境下开启调试工具
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
