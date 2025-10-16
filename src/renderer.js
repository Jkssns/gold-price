const axios = require('axios');

// DOM元素
const currentPriceElement = document.getElementById('current-price');

// API URL
const API_URL = 'https://api.jdjygold.com/gw/generic/hj/h5/m/latestPrice';

// 上一次的价格，用于比较变化
let lastPrice = null;

// 格式化价格，确保统一长度但更紧凑
function formatPrice(price) {
  if (!price) return '--';
  // 确保价格有统一的格式，保留1位小数使显示更紧凑
  return price
}

// 显示加载状态
function showLoading() {
  // 不改变当前显示的价格，只在首次加载时显示加载中
  if (!lastPrice) {
    currentPriceElement.textContent = '--';
  }
  console.log('正在加载数据...');
}

// 显示错误状态
function showError(message) {
  // 如果有上一次的数据，保持显示，不显示错误
  if (!lastPrice) {
    currentPriceElement.textContent = '--';
  }
  console.error('错误:', message);
}

// 更新UI函数
function updateUI(data) {
  if (!data || !data.resultData || !data.resultData.datas) {
    showError('Invalid data format');
    return;
  }

  const goldData = data.resultData.datas;
  const currentPrice = goldData.price;

  // 保存当前价格用于下次比较
  lastPrice = currentPrice;

  // 更新当前价格，格式化确保长度一致
  const formattedPrice = formatPrice(currentPrice);
  currentPriceElement.textContent = formattedPrice;

  // 根据涨跌设置颜色
  const changeAmount = parseFloat(goldData.upAndDownAmt);
  if (changeAmount > 0) {
    currentPriceElement.style.color = '#F44336'; // 上涨红色
  } else if (changeAmount < 0) {
    currentPriceElement.style.color = '#4CAF50'; // 下跌绿色
  } else {
    currentPriceElement.style.color = '#FFD700'; // 持平金色
  }

  // 输出调试信息
  console.log('数据更新:', {
    当前价格: formattedPrice,
    昨日价格: goldData.yesterdayPrice,
    涨跌额: goldData.upAndDownAmt,
    涨跌幅: goldData.upAndDownRate,
    更新时间: new Date().toLocaleTimeString()
  });
}

// 获取黄金价格数据
async function fetchGoldPrice() {
  try {
    const response = await axios.get(API_URL);
    console.log('API响应:', response.data);
    updateUI(response.data);
  } catch (error) {
    console.error('API错误:', error);
    showError(`Error fetching gold price: ${error.message}`);
  }
}

// 初始化函数
function init() {
  // 立即获取一次数据
  fetchGoldPrice();

  // 每1秒获取一次数据
  setInterval(fetchGoldPrice, 1000);

  console.log('初始化完成，数据将每1秒更新一次');
}

// 启动应用
init();
