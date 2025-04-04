/**
 * 主题切换工具函数
 * 提供亮色/暗色主题设置和获取功能
 */

// 主题类型枚举
export const ThemeType = {
  LIGHT: 'light',
  DARK: 'dark'
};

// 存储主题设置的localStorage键名
const THEME_KEY = 'picmark_theme';

/**
 * 获取当前主题
 * @returns {string} 当前主题类型 ('light' 或 'dark')
 */
export function getCurrentTheme() {
  // 尝试从localStorage获取主题设置
  const savedTheme = localStorage.getItem(THEME_KEY);
  
  if (savedTheme) {
    return savedTheme;
  }
  
  // 如果没有保存的主题设置，尝试使用系统偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return ThemeType.DARK;
  }
  
  // 默认使用亮色主题
  return ThemeType.LIGHT;
}

/**
 * 设置主题
 * @param {string} theme - 要设置的主题 ('light' 或 'dark')
 */
export function setTheme(theme) {
  // 验证主题类型
  if (theme !== ThemeType.LIGHT && theme !== ThemeType.DARK) {
    console.error('无效的主题类型:', theme);
    return;
  }
  
  // 保存主题设置到localStorage
  localStorage.setItem(THEME_KEY, theme);
  
  // 应用主题到DOM
  applyTheme(theme);
}

/**
 * 切换主题
 * 从亮色切换到暗色，或从暗色切换到亮色
 */
export function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === ThemeType.LIGHT ? ThemeType.DARK : ThemeType.LIGHT;
  setTheme(newTheme);
  return newTheme;
}

/**
 * 应用主题到DOM
 * @param {string} theme - 要应用的主题
 */
function applyTheme(theme) {
  // 设置data-theme属性到html元素
  document.documentElement.setAttribute('data-theme', theme);
  
  // 更新meta标签的theme-color
  const themeColor = theme === ThemeType.DARK ? '#1f2022' : '#ffffff';
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', themeColor);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = themeColor;
    document.head.appendChild(meta);
  }
}

/**
 * 初始化主题
 * 在应用启动时调用
 */
export function initTheme() {
  const currentTheme = getCurrentTheme();
  applyTheme(currentTheme);
  
  // 监听系统主题变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', event => {
        if (!localStorage.getItem(THEME_KEY)) {
          const newTheme = event.matches ? ThemeType.DARK : ThemeType.LIGHT;
          applyTheme(newTheme);
        }
      });
  }
} 