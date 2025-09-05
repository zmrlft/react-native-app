import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';

let soundObject: Audio.Sound | null = null;

/**
 * 播放Base64编码的音频数据
 * @param base64AudioData Base64编码的音频数据
 */
export const playBase64Audio = async (base64AudioData: string): Promise<void> => {
  try {
    // 停止当前播放的音频
    await stopAudioPlayback();
    
    // 创建一个临时文件路径
    const filename = FileSystem.cacheDirectory + 'qwen_omni_audio.wav';
    
    // 将 Base64 解码并写入文件
    await FileSystem.writeAsStringAsync(filename, base64AudioData, { 
      encoding: FileSystem.EncodingType.Base64 
    });

    // 创建新的音频实例
    soundObject = new Audio.Sound();
    
    // 加载并播放音频
    await soundObject.loadAsync({ uri: filename });
    await soundObject.playAsync();

    // 设置播放状态监听
    soundObject.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        console.log('Audio finished playing');
      }
    });

  } catch (error) {
    console.error("Error playing Base64 audio:", error);
    throw new Error('音频播放失败');
  }
};

/**
 * 停止音频播放
 */
export const stopAudioPlayback = async (): Promise<void> => {
  try {
    if (soundObject) {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
    }
    // 同时停止TTS
    Speech.stop();
  } catch (error) {
    console.error("Error stopping audio playback:", error);
  }
};

/**
 * 暂停音频播放
 */
export const pauseAudioPlayback = async (): Promise<void> => {
  try {
    if (soundObject) {
      await soundObject.pauseAsync();
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
      await soundObject.playAsync();
    }
  } catch (error) {
    console.error("Error resuming audio playback:", error);
  }
};

/**
 * 使用TTS朗读文本
 * @param text 要朗读的文本
 */
export const speakText = (text: string): void => {
  try {
    // 停止当前播放的音频
    stopAudioPlayback();
    
    Speech.speak(text, {
      language: 'zh-CN', // 中文
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