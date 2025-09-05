import { fetch } from 'expo/fetch';
import { getApiKey } from './storageService';

export interface QwenOmniResponse {
  text: string;
  audioBase64: string;
}

/**
 * 调用Qwen-Omni API进行图片识别和分析
 * @param base64Image Base64编码的图片
 * @param textPrompt 文本提示，默认为识别和总结说明书
 * @returns 包含文本和音频的响应
 */
export const callQwenOmniAPI = async (
  base64Image: string,
  textPrompt: string = "请识别图中文字内容，并将其总结成一份简洁、易懂、口语化的使用说明，避免专业术语，并提供朗读。"
): Promise<QwenOmniResponse | null> => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.error("API Key not set.");
    throw new Error('请先在设置页面配置API密钥');
  }

  try {
    const requestBody = {
      model: "qwen-omni-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64Image}` }
            },
            {
              type: "text",
              text: textPrompt
            }
          ]
        }
      ],
      stream: true,
      stream_options: {
        include_usage: true
      },
      modalities: ["text", "audio"],
      audio: { voice: "Cherry", format: "wav" }
    };

    // 使用expo-fetch进行API调用
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('响应体为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let fullAudioBase64 = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices.length > 0) {
                const delta = parsed.choices[0].delta;
                
                // 处理文本内容
                if (delta.content) {
                  fullText += delta.content;
                }
                
                // 处理音频数据
                if (delta.audio && delta.audio.data) {
                  fullAudioBase64 += delta.audio.data;
                }
              }
              
              if (parsed.usage) {
                console.log("API Usage:", parsed.usage);
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理下一行
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { text: fullText, audioBase64: fullAudioBase64 };

  } catch (error) {
    console.error("Error calling Qwen-Omni API:", error);
    if (error instanceof Error) {
      // 提供更详细的错误信息
      if (error.message.includes('401')) {
        throw new Error('API密钥无效，请检查设置');
      } else if (error.message.includes('429')) {
        throw new Error('API调用频率过高，请稍后再试');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络设置');
      }
      throw error;
    }
    throw new Error('AI服务暂时不可用，请稍后再试');
  }
};