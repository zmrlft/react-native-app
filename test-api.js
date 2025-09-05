// 简单的API测试脚本
const axios = require('axios');

// 测试Qwen-Omni API调用
async function testQwenOmniAPI() {
  const testApiKey = 'your-api-key-here'; // 需要替换为实际的API密钥
  const testBase64Image = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='; // 1x1像素的测试图片
  
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
  
  const requestData = {
    model: 'qwen-vl-ocr',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            {
              image: `data:image/jpeg;base64,${testBase64Image}`
            },
            {
              text: '请识别这张图片中的内容'
            }
          ]
        }
      ]
    },
    parameters: {
      result_format: 'message'
    }
  };
  
  try {
    console.log('开始测试API调用...');
    
    const response = await axios.post(url, requestData, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      timeout: 30000
    });
    
    console.log('API调用成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('API调用失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else if (error.request) {
      console.error('网络错误:', error.message);
    } else {
      console.error('其他错误:', error.message);
    }
    return false;
  }
}

// 运行测试
if (require.main === module) {
  testQwenOmniAPI().then(success => {
    if (success) {
      console.log('\n✅ API测试通过!');
    } else {
      console.log('\n❌ API测试失败!');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testQwenOmniAPI };