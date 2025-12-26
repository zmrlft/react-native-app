import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let soundObject: Audio.Sound | null = null;

/**
 * 智能音频播放：优先使用Base64编码的音频数据，失败时降级到TTS
 * @param audioBase64 Base64编码的音频数据（Qwen-Omni返回）
 * @param text 文本内容，用于TTS备用方案
 * @param language 语言设置，用于TTS的语言选择
 */
export const playAudioSmart = async (audioBase64?: string, text?: string, language: string = 'zh'): Promise<void> => {
  try {
    // 停止当前播放
    await stopAudioPlayback();

    // 如果有Base64音频数据，优先使用
    if (audioBase64 && audioBase64.trim().length > 0) {
      try {
        console.log('使用Base64音频数据播放...');
        await playBase64Audio(audioBase64, text);
        return;
      } catch (error) {
        console.log('Base64音频播放失败，切换到TTS备用方案:', error);
      }
    }

    // Base64音频不可用或播放失败，使用TTS
    if (text && text.trim()) {
      console.log('使用TTS播放文本...');
      speakText(text, language);
      return;
    }

    throw new Error('没有可播放的内容');

  } catch (error) {
    console.error('智能音频播放失败:', error);
    throw error;
  }
};

/**
 * 播放Base64编码的音频数据
 * @param base64AudioData Base64编码的音频数据
 * @param fallbackText 备用文本，如果音频播放失败则使用TTS朗读此文本
 */
export const playBase64Audio = async (base64AudioData: string, fallbackText?: string): Promise<void> => {
  try {
    // 验证Base64数据
    if (!base64AudioData || base64AudioData.trim().length === 0) {
      throw new Error('音频数据为空');
    }

    // 清理Base64数据（移除可能的前缀和空白字符）
    const cleanBase64 = base64AudioData.replace(/^data:audio\/[^;]+;base64,/, '').trim();

    if (cleanBase64.length === 0) {
      throw new Error('无效的音频数据格式');
    }

    console.log('开始播放音频，数据长度:', cleanBase64.length);

    // 停止当前播放的音频
    await stopAudioPlayback();

    // 创建一个临时文件路径，iOS使用.m4a格式更兼容
    const fileExtension = Platform.OS === 'ios' ? '.m4a' : '.wav';
    const filename = FileSystem.cacheDirectory + `qwen_omni_audio${fileExtension}`;

    // 将 Base64 解码并写入文件
    await FileSystem.writeAsStringAsync(filename, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64
    });

    // 验证文件是否成功写入
    const fileInfo = await FileSystem.getInfoAsync(filename);
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error('音频文件写入失败');
    }

    console.log('音频文件写入成功，大小:', fileInfo.size, 'bytes');

    // 创建新的音频实例
    soundObject = new Audio.Sound();

    // 设置音频模式（重要：确保在iOS上正确播放）
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // 加载音频文件
    console.log('开始加载音频文件...');

    // iOS特定的加载配置
    const loadConfig = Platform.OS === 'ios' ? {
      uri: filename,
      shouldPlay: false,
      // iOS特定配置
      progressUpdateIntervalMillis: 1000,
      positionMillis: 0,
      rate: 1.0,
      shouldCorrectPitch: true,
      volume: 1.0,
      isMuted: false,
      isLooping: false,
    } : {
      uri: filename,
      shouldPlay: false
    };

    await soundObject.loadAsync(loadConfig);

    // 检查加载状态
    const status = await soundObject.getStatusAsync();
    if (!status.isLoaded) {
      throw new Error('音频文件加载失败');
    }

    console.log('音频加载成功，开始播放...');

    // 播放音频
    await soundObject.playAsync();

    // 设置播放状态监听
    soundObject.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        if (status.didJustFinish) {
          console.log('音频播放完成');
        }
      }
    });

  } catch (error) {
    console.error("Error playing Base64 audio:", error);

    // 清理可能创建的音频对象
    if (soundObject) {
      try {
        await soundObject.unloadAsync();
      } catch (cleanupError) {
        console.error("Error cleaning up sound object:", cleanupError);
      }
      soundObject = null;
    }

    // 提供更详细的错误信息和备用方案
    if (error instanceof Error) {
      if (error.message.includes('11800') || error.message.includes('AVFoundationErrorDomain')) {
        console.log('音频播放失败，尝试使用TTS备用方案...');

        // 如果提供了备用文本，使用TTS播放
        if (fallbackText && fallbackText.trim()) {
          try {
            speakText(fallbackText);
            console.log('已切换到TTS播放模式');
            return; // 成功使用TTS，直接返回
          } catch (ttsError) {
            console.error('TTS备用方案也失败:', ttsError);
          }
        }

        throw new Error('音频播放失败，设备可能不支持此音频格式');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('网络问题导致音频加载失败');
      } else {
        throw new Error(`音频播放失败: ${error.message}`);
      }
    }

    throw new Error('音频播放失败，请重试');
  }
};

/**
 * 停止音频播放
 */
export const stopAudioPlayback = async (): Promise<void> => {
  try {
    if (soundObject) {
      // 检查音频对象状态
      const status = await soundObject.getStatusAsync();

      if (status.isLoaded) {
        // 只有在音频已加载的情况下才尝试停止
        if (status.isPlaying) {
          await soundObject.stopAsync();
        }
        await soundObject.unloadAsync();
      }

      soundObject = null;
    }

    // 同时停止TTS
    Speech.stop();
  } catch (error) {
    console.error("Error stopping audio playback:", error);
    // 即使出错也要清理soundObject引用
    soundObject = null;
  }
};

/**
 * 暂停音频播放
 */
export const pauseAudioPlayback = async (): Promise<void> => {
  try {
    if (soundObject) {
      const status = await soundObject.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundObject.pauseAsync();
      }
    }
  } catch (error) {
    console.error("Error pausing audio playback:", error);
  }
};

/**
 * 恢复音频播放
 */
export const resumeAudioPlayback = async (): Promise<void> => {
  try {
    if (soundObject) {
      const status = await soundObject.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await soundObject.playAsync();
      }
    }
  } catch (error) {
    console.error("Error resuming audio playback:", error);
  }
};

/**
 * 使用TTS朗读文本
 * @param text 要朗读的文本
 * @param language 语言设置 ('zh' 为中文, 'en' 为英文)
 */
export const speakText = (text: string, language: string = 'zh'): void => {
  try {
    // 停止当前播放的音频
    stopAudioPlayback();
    
    // 根据语言选择合适的TTS语言
    const speechLanguage = language === 'en' ? 'en-US' : 'zh-CN';
    
    Speech.speak(text, {
      language: speechLanguage,
      pitch: 1, // 音调
      rate: 0.8, // 语速，略慢以适应老年用户
    });
  } catch (error) {
    console.error("Error speaking text:", error);
    throw new Error('语音朗读失败');
  }
};

/**
 * 停止TTS朗读
 */
export const stopSpeaking = (): void => {
  Speech.stop();
};

/**
 * 获取当前音频播放状态
 */
export const getAudioStatus = async (): Promise<any> => {
  if (soundObject) {
    return await soundObject.getStatusAsync();
  }
  return null;
};