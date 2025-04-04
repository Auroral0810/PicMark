const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
let token = '';
let imageId = '';

const testAPI = async () => {
  try {
    console.log('开始API测试...');
    
    // 1. 注册测试用户
    console.log('\n1. 注册测试用户');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      username: `test_${Math.floor(Math.random() * 10000)}`,
      email: `test_${Date.now()}@example.com`,
      password: '123456'
    });
    token = registerResponse.data.token;
    console.log('用户注册成功，获取到认证令牌');
    
    // 2. 测试上传凭证 (使用认证令牌)
    console.log('\n2. 测试获取上传凭证');
    const tokenResponse = await axios.get(`${API_BASE_URL}/token`, {
      params: { filename: 'test.jpg' },
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('上传凭证获取成功:', tokenResponse.data);
    
    // 3. 保存图片元数据
    console.log('\n3. 保存图片元数据');
    const randomKey = `test/api-test-${Date.now()}.jpg`;
    const saveImageResponse = await axios.post(
      `${API_BASE_URL}/images`,
      {
        title: '测试图片',
        description: '这是一张API测试上传的图片',
        url: 'http://example.com/test.jpg',
        key: randomKey,
        tags: ['测试', 'API'],
        width: 800,
        height: 600,
        fileSize: 102400,
        format: 'jpeg'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    imageId = saveImageResponse.data.data._id;
    console.log('图片元数据保存成功:', saveImageResponse.data);
    
    // 4. 获取图片列表
    console.log('\n4. 获取图片列表');
    const imagesResponse = await axios.get(
      `${API_BASE_URL}/images`,
      {
        params: { page: 1, limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`获取到 ${imagesResponse.data.data.images.length} 张图片`);
    
    // 5. 获取单张图片
    console.log('\n5. 获取单张图片');
    const imageResponse = await axios.get(
      `${API_BASE_URL}/images/${imageId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('图片获取成功:', imageResponse.data.data.title);
    
    // 6. 更新图片信息
    console.log('\n6. 更新图片信息');
    const updateResponse = await axios.put(
      `${API_BASE_URL}/images/${imageId}`,
      {
        title: '已更新的测试图片',
        tags: ['测试', 'API', '已更新']
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('图片更新成功:', updateResponse.data.data.title);
    
    // 7. 搜索图片
    console.log('\n7. 搜索图片');
    const searchResponse = await axios.get(
      `${API_BASE_URL}/images/search`,
      {
        params: { keyword: '测试' }
      }
    );
    console.log(`搜索结果: ${searchResponse.data.data.length} 张图片`);
    
    // 8. 删除图片
    console.log('\n8. 删除图片');
    const deleteResponse = await axios.delete(
      `${API_BASE_URL}/images/${imageId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('图片删除成功:', deleteResponse.data.message);
    
    console.log('\n所有API测试完成!');
  } catch (error) {
    console.error('测试失败:');
    if (error.response) {
      // 服务器响应了，但状态码不是2xx
      console.error('状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('无响应:', error.request);
    } else {
      // 请求配置出错
      console.error('错误信息:', error.message);
    }
    console.error('完整错误:', error);
  }
};

// 执行测试
testAPI(); 