const axios = require('axios');
const { ipcRenderer } = require('electron');

// API URL https://api.jdjygold.com/gw/generic/hj/h5/m/latestPrice
const API_URL = 'https://api.jdjygold.com/gw/generic/hj/h5/m/latestPrice';
const API_URL2 = 'https://api.jdjygold.com/gw2/generic/jrm/h5/m/stdLatestPrice?productSku=1961543816'
// 上一次的价格，用于比较变化
let lastPrice = null;
let lastPrice2 = null;
let lastChange = 0;
let lastChange2 = 0;

// 格式化价格，确保统一长度但更紧凑
function formatPrice(price) {
  if (!price) return '--';
  // 确保价格有统一的格式，保留1位小数使显示更紧凑
  return parseFloat(price).toFixed(1);
}

// 显示加载状态
function showLoading() {
  console.log('正在加载数据...');

  // 发送初始加载状态到主进程
  ipcRenderer.send('price-update', { price1: '--', price2: '--' });
}

// 显示错误状态
function showError(message) {
  console.error('错误:', message);

  // 发送错误状态到主进程
  ipcRenderer.send('price-update', { price1: '--', price2: '--' });
}

// 更新UI函数
function updateUI(data, isSecondPrice = false) {
  if (!data || !data.resultData || !data.resultData.datas) {
    showError('Invalid data format');
    return;
  }

  const goldData = data.resultData.datas;
  const currentPrice = goldData.price;

  // 保存当前价格用于下次比较
  if (isSecondPrice) {
    lastPrice2 = currentPrice;
    lastChange2 = parseFloat(goldData.upAndDownAmt);
  } else {
    lastPrice = currentPrice;
    lastChange = parseFloat(goldData.upAndDownAmt);
  }

  // 输出调试信息
  console.log('数据更新:', {
    当前价格: formatPrice(currentPrice),
    昨日价格: goldData.yesterdayPrice,
    涨跌额: goldData.upAndDownAmt,
    涨跌幅: goldData.upAndDownRate,
    更新时间: new Date().toLocaleTimeString()
  });

  // 发送价格信息到主进程
  if (lastPrice !== null && lastPrice2 !== null) {
    ipcRenderer.send('price-update', {
      price1: formatPrice(lastPrice),
      change1: lastChange,
      price2: formatPrice(lastPrice2),
      change2: lastChange2
    });
  }
}

// 获取第一个黄金价格数据
async function fetchGoldPrice() {
  try {
    const response = await axios.get(API_URL);
    console.log('API1响应:', response.data);
    updateUI(response.data, false);
  } catch (error) {
    console.error('API1错误:', error);
    showError(`Error fetching gold price: ${error.message}`);
  }
}

// 获取第二个黄金价格数据
async function fetchGoldPrice2() {
  try {
    const response = await axios.get(API_URL2);
    console.log('API2响应:', response.data);
    updateUI(response.data, true);
  } catch (error) {
    console.error('API2错误:', error);
    showError(`Error fetching gold price: ${error.message}`);
  }
}

// 初始化函数
function init() {
  // 显示初始加载状态
  showLoading();

  // 立即获取一次数据
  fetchGoldPrice();
  fetchGoldPrice2();

  // 每1秒获取一次数据
  setInterval(fetchGoldPrice, 1000);
  setInterval(fetchGoldPrice2, 1000);

  console.log('初始化完成，数据将每1秒更新一次');
}

// 启动应用
init();
