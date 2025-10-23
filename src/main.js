const { app, BrowserWindow, screen, nativeImage, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 创建系统托盘（使用空图标）
function createTray() {
  try {
    console.log('开始创建系统托盘...');

    // 使用空图标作为初始图标
    tray = new Tray(nativeImage.createEmpty());
    console.log('Tray对象创建成功（空图标）');

    // 设置初始托盘标题
    tray.setTitle('民：--，浙：--');
    console.log('设置初始托盘标题');

    // 设置上下文菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '退出',
        click: () => {
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setIgnoreDoubleClickEvents(true);

    console.log('系统托盘创建成功');
    console.log('请检查屏幕右上角（macOS）或任务栏（Windows）是否有系统托盘文字显示');
  } catch (error) {
    console.error('创建系统托盘时出错:', error);
  }
}

// 创建主窗口
function createMainWindow() {
  console.log('开始创建主窗口...');

  // 创建一个隐藏的浏览器窗口
  mainWindow = new BrowserWindow({
    width: 0,
    height: 0,
    show: false, // 不显示窗口
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // 加载应用的index.html
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 只在开发环境下打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  console.log('主窗口创建完成（已隐藏）');
}

// 监听来自渲染进程的价格更新
ipcMain.on('price-update', (event, priceInfo) => {
  console.log('收到价格更新:', priceInfo);
  if (tray) {
    // 根据涨跌情况添加箭头
    let price1Text = priceInfo.price1;
    let price2Text = priceInfo.price2;

    if (priceInfo.change1 !== undefined) {
      if (priceInfo.change1 > 0) {
        price1Text = `↑${priceInfo.price1}`; // 上涨箭头
      } else if (priceInfo.change1 < 0) {
        price1Text = `↓${priceInfo.price1}`; // 下跌箭头
      }
      // 持平不加箭头
    }

    if (priceInfo.change2 !== undefined) {
      if (priceInfo.change2 > 0) {
        price2Text = `↑${priceInfo.price2}`; // 上涨箭头
      } else if (priceInfo.change2 < 0) {
        price2Text = `↓${priceInfo.price2}`; // 下跌箭头
      }
      // 持平不加箭头
    }

    // 只显示纯文本数字，不使用颜色
    const title = `民：${price1Text}，浙：${price2Text}`;
    console.log('设置托盘标题为:', title);
    tray.setTitle(title);
  } else {
    console.log('托盘对象不存在');
  }
});

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  console.log('Electron应用准备就绪');

  // 创建系统托盘
  createTray();

  // 创建主窗口
  createMainWindow();

  app.on('activate', function () {
    console.log('应用激活事件');
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  console.log('所有窗口已关闭');
  if (process.platform !== 'darwin') app.quit();
});
