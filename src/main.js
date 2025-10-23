const { app, BrowserWindow, screen, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;


// 根据平台选择合适的图标
function getIconPath() {
  if (process.platform === 'darwin') {
    return path.join(__dirname, '../logo.icns'); // macOS使用.icns格式
  } else if (process.platform === 'win32') {
    return path.join(__dirname, '../logo.ico'); // Windows使用.ico格式
  } else {
    return path.join(__dirname, '../logo.png'); // Linux等其他平台使用.png格式
  }
}

// 创建主窗口
function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 60,
    height: 40,
    frame: false,
    roundedCorners: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    x: width - 60, // 贴右边
    y: 0, // 靠近顶部
    icon: getIconPath() // 根据平台设置应用图标
  });

  mainWindow.visibleOnAllWorkspaces = true;

  // 加载应用的index.html
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 添加自动贴边功能
  setupSnapToEdge();

  // 只在开发环境下打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// 设置自动贴边功能
function setupSnapToEdge() {
  // 贴边阈值（像素）
  const SNAP_THRESHOLD = 20;

  // 监听窗口移动事件
  mainWindow.on('move', () => {
    // 获取所有显示器
    const displays = screen.getAllDisplays();
    const bounds = mainWindow.getBounds();

    // 找出当前窗口所在的显示器
    const currentDisplay = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });

    let x = bounds.x;
    let y = bounds.y;
    let needsUpdate = false;

    // 检查是否靠近当前显示器的边缘
    const displayBounds = currentDisplay.workArea;

    // 检查是否靠近左边缘
    if (bounds.x < displayBounds.x + SNAP_THRESHOLD && bounds.x >= displayBounds.x) {
      x = displayBounds.x;
      needsUpdate = true;
    }

    // 检查是否靠近右边缘
    if (bounds.x + bounds.width > displayBounds.x + displayBounds.width - SNAP_THRESHOLD &&
        bounds.x + bounds.width <= displayBounds.x + displayBounds.width) {
      x = displayBounds.x + displayBounds.width - bounds.width;
      needsUpdate = true;
    }

    // 检查是否靠近上边缘
    if (bounds.y < displayBounds.y + SNAP_THRESHOLD && bounds.y >= displayBounds.y) {
      y = displayBounds.y;
      needsUpdate = true;
    }

    // 检查是否靠近下边缘
    if (bounds.y + bounds.height > displayBounds.y + displayBounds.height - SNAP_THRESHOLD &&
        bounds.y + bounds.height <= displayBounds.y + displayBounds.height) {
      y = displayBounds.y + displayBounds.height - bounds.height;
      needsUpdate = true;
    }

    // 如果需要更新位置，则设置新的边界
    if (needsUpdate) {
      mainWindow.setBounds({ x, y, width: bounds.width, height: bounds.height });
    }
  });
}

// 设置应用程序图标
if (process.platform === 'darwin') { // macOS
  // 为macOS的Dock设置图标
  const dockIcon = nativeImage.createFromPath(path.join(__dirname, '../logo.png'));
  // 调整大小，使其在Dock中显示更合适
  const resizedIcon = dockIcon.resize({ width: 128, height: 128 });
  app.dock.setIcon(resizedIcon);
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
	createMainWindow();

  app.on('activate', function () {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
