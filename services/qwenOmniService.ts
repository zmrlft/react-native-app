import { Dialect, getAudioVoice, getDefaultPrompt, Language } from '@/constants/i18n';
import { fetch as expoFetch } from 'expo/fetch';
import OpenAI from 'openai';
import { getApiKey } from './storageService';

export interface QwenOmniResponse {
  text: string;
  audioBase64: string;
}

/**
 * 为 PCM 音频数据添加 WAV 文件头
 * Qwen-Omni 返回的是 PCM 数据，需要添加 WAV 文件头才能被标准音频播放器识别
 * 参数：采样率 24000Hz, 单声道, 16位
 * 使用标准 JavaScript API (Uint8Array) 以兼容 React Native
 */
function addWavHeader(pcmBase64: string): string {
  try {
    // 使用 atob() 解码 Base64 为二进制字符串
    const binaryString = atob(pcmBase64);
    const pcmLength = binaryString.length;
    
    // WAV 文件参数
    const sampleRate = 24000;
    const channels = 1;
    const bytesPerSample = 2; // 16位 = 2字节
    const byteRate = sampleRate * channels * bytesPerSample;
    const blockAlign = channels * bytesPerSample;
    
    // 计算文件大小
    const fileSize = 36 + pcmLength;
    
    // 创建 WAV 文件头 (44 字节)
    const wavHeaderArray = new Uint8Array(44);
    
    // 辅助函数：写入字符串
    const writeString = (arr: Uint8Array, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        arr[offset + i] = str.charCodeAt(i);
      }
    };
    
    // 辅助函数：写入 32 位无符号整数（小端）
    const writeUint32 = (arr: Uint8Array, offset: number, value: number) => {
      arr[offset] = value & 0xff;
      arr[offset + 1] = (value >> 8) & 0xff;
      arr[offset + 2] = (value >> 16) & 0xff;
      arr[offset + 3] = (value >> 24) & 0xff;
    };
    
    // 辅助函数：写入 16 位无符号整数（小端）
    const writeUint16 = (arr: Uint8Array, offset: number, value: number) => {
      arr[offset] = value & 0xff;
      arr[offset + 1] = (value >> 8) & 0xff;
    };
    
    let offset = 0;
    
    // RIFF chunk descriptor
    writeString(wavHeaderArray, offset, 'RIFF'); offset += 4;
    writeUint32(wavHeaderArray, offset, fileSize); offset += 4;
    writeString(wavHeaderArray, offset, 'WAVE'); offset += 4;
    
    // fmt sub-chunk
    writeString(wavHeaderArray, offset, 'fmt '); offset += 4;
    writeUint32(wavHeaderArray, offset, 16); offset += 4; // sub-chunk size
    writeUint16(wavHeaderArray, offset, 1); offset += 2;  // audio format (1 = PCM)
    writeUint16(wavHeaderArray, offset, channels); offset += 2;
    writeUint32(wavHeaderArray, offset, sampleRate); offset += 4;
    writeUint32(wavHeaderArray, offset, byteRate); offset += 4;
    writeUint16(wavHeaderArray, offset, blockAlign); offset += 2;
    writeUint16(wavHeaderArray, offset, 16); offset += 2; // bits per sample
    
    // data sub-chunk
    writeString(wavHeaderArray, offset, 'data'); offset += 4;
    writeUint32(wavHeaderArray, offset, pcmLength); offset += 4;
    
    // 合并文件头和 PCM 数据
    const pcmArray = new Uint8Array(pcmLength);
    for (let i = 0; i < pcmLength; i++) {
      pcmArray[i] = binaryString.charCodeAt(i);
    }
    
    const wavArray = new Uint8Array(wavHeaderArray.length + pcmArray.length);
    wavArray.set(wavHeaderArray, 0);
    wavArray.set(pcmArray, wavHeaderArray.length);
    
    // 转换回 Base64
    let wavBinaryString = '';
    for (let i = 0; i < wavArray.length; i++) {
      wavBinaryString += String.fromCharCode(wavArray[i]);
    }
    const wavBase64 = btoa(wavBinaryString);
    
    console.log('✅ WAV文件头添加成功。原始PCM大小:', pcmLength, '字节，WAV文件大小:', wavArray.length, '字节');
    
    return wavBase64;
  } catch (error) {
    console.error('添加WAV文件头失败:', error);
    // 如果处理失败，返回原始数据
    return pcmBase64;
  }
}

/**
 * 调用Qwen-Omni API进行图片识别和分析（使用OpenAI SDK + expo/fetch）
 * @param base64Image Base64编码的图片
 * @param language 用户语言设置
 * @param dialect 用户方言设置（仅中文支持）
 * @param textPrompt 文本提示，如果未提供将使用默认提示词
 * @returns 包含文本和音频的响应
 */
export const callQwenOmniAPI = async (
  base64Image: string,
  language: Language = 'zh',
  dialect?: Dialect,
  textPrompt?: string
): Promise<QwenOmniResponse | null> => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.error("API Key not set.");
    throw new Error('请先在设置页面配置API密钥');
  }

  // 使用提供的提示词或根据语言获取默认提示词
  const finalPrompt = textPrompt || getDefaultPrompt(language);
  const audioVoice = getAudioVoice(language, dialect);

  try {
    // 初始化OpenAI客户端 - 使用expo/fetch以支持流式传输
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      fetch: expoFetch as any,
      timeout: 300000, // 5分钟超时
    });

    // 调用API
    const completion = await client.chat.completions.create({
      model: 'qwen3-omni-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64Image}` }
            },
            {
              type: 'text',
              text: finalPrompt
            }
          ]
        }
      ],
      stream: true,
      stream_options: {
        include_usage: true
      },
      modalities: ['text', 'audio'],
      audio: { voice: audioVoice, format: 'wav' }
    } as any); // 使用any避免类型检查问题

    let fullText = "";
    let fullAudioBase64 = "";

    // 处理流式响应 - 强制转换为异步可迭代对象
    const stream = completion as any;
    if (stream[Symbol.asyncIterator]) {
      for await (const chunk of stream) {
        if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
          const choice = chunk.choices[0];
          
          // 处理文本内容
          if (choice.delta && choice.delta.content) {
            fullText += choice.delta.content;
          }
          
          // 处理音频数据 - 累积Base64编码的音频片段
          if (choice.delta && (choice.delta as any).audio && (choice.delta as any).audio.data) {
            const audioChunk = (choice.delta as any).audio.data;
            fullAudioBase64 += audioChunk;
            console.log('收到音频数据片段，累积长度:', fullAudioBase64.length);
          }
        }
        
        // 处理usage信息
        if (chunk.usage) {
          console.log("API Usage:", chunk.usage);
        }
      }
    }

    // 日志输出 - 确保音频数据被正确收集
    console.log('API响应完成。文本长度:', fullText.length, '音频Base64长度:', fullAudioBase64.length);
    if (fullAudioBase64.length > 0) {
      console.log('✅ 成功收集音频数据，总大小:', (fullAudioBase64.length / 1024).toFixed(2), 'KB');
      // 为 PCM 音频添加 WAV 文件头
      const wavAudioBase64 = addWavHeader(fullAudioBase64);
      return { text: fullText, audioBase64: wavAudioBase64 };
    } else {
      console.log('⚠️  未收到音频数据');
      return { text: fullText, audioBase64: '' };
    }

  } catch (error) {
    console.error("Error calling Qwen-Omni API:", error);
    if (error instanceof Error) {
      // 提供更详细的错误信息
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('API密钥无效，请检查设置');
      } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        throw new Error('API调用频率过高，请稍后再试');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络设置');
      } else if (error.message.includes('timeout')) {
        throw new Error('请求超时，请重试');
      }
      throw error;
    }
    throw new Error('AI服务暂时不可用，请稍后再试');
  }
};