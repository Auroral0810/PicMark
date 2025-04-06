/**
 * 安全的复制文本到剪贴板
 * 处理不同环境下的浏览器兼容性问题
 */

/**
 * 将文本复制到剪贴板
 * @param {string} text 要复制的文本
 * @returns {Promise<boolean>} 复制成功返回true，失败返回false
 */
export const copyToClipboard = async (text) => {
  // 检查是否有现代的Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API失败，尝试回退方法', err);
      // 继续尝试回退方法
    }
  }

  // 回退方法1：使用document.execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // 设置样式使其不可见
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.style.left = '-9999px';
    
    document.body.appendChild(textarea);
    textarea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      return true;
    }
  } catch (err) {
    console.warn('execCommand回退方法失败', err);
  }

  // 回退方法2：提示用户手动复制
  try {
    // 创建一个模态框显示文本
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.width = '80%';
    textArea.style.height = '150px';
    textArea.style.margin = '20px auto';
    textArea.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';
    
    const message = document.createElement('div');
    message.innerText = '自动复制失败，请手动复制下面的文本：';
    message.style.color = 'white';
    message.style.marginBottom = '10px';
    
    const closeButton = document.createElement('button');
    closeButton.innerText = '关闭';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '5px 15px';
    
    modal.appendChild(message);
    modal.appendChild(textArea);
    modal.appendChild(closeButton);
    
    document.body.appendChild(modal);
    
    // 自动选择文本
    textArea.focus();
    textArea.select();
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    return false;
  } catch (err) {
    console.error('所有复制方法都失败了', err);
    return false;
  }
}; 