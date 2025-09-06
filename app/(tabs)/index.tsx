import { playAudioSmart, stopAudioPlayback, stopSpeaking } from '@/services/audioService';
import { ImageResult, pickImageFromLibrary, takePhotoWithCamera } from '@/services/imageService';
import { callQwenOmniAPI } from '@/services/qwenOmniService';
import { getApiKey } from '@/services/storageService';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReaderScreen() {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [originalText, setOriginalText] = useState<string>('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  // 使用useFocusEffect在每次页面获得焦点时检查API密钥
  useFocusEffect(
    useCallback(() => {
      checkApiKey();
    }, [])
  );

  const checkApiKey = async () => {
    const apiKey = await getApiKey();
    setHasApiKey(!!apiKey);
    console.log('API密钥检查结果:', !!apiKey);
  };

  const handlePickImage = async () => {
    if (isLoading) return; // 防止重复操作
    
    try {
      const result = await pickImageFromLibrary();
      if (result) {
        setSelectedImage(result);
        await processImage(result.base64);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      // imageService 中已经处理了用户友好的错误提示
      // 这里只需要处理未预期的错误
      if (error instanceof Error && !error.message.includes('权限')) {
        Alert.alert('错误', error.message);
      }
    }
  };

  const handleTakePhoto = async () => {
    if (isLoading) return; // 防止重复操作
    
    try {
      const result = await takePhotoWithCamera();
      if (result) {
        setSelectedImage(result);
        await processImage(result.base64);
      }
    } catch (error) {
      console.error('拍摄照片失败:', error);
      // imageService 中已经处理了用户友好的错误提示
      // 这里只需要处理未预期的错误
      if (error instanceof Error && !error.message.includes('权限')) {
        Alert.alert('错误', error.message);
      }
    }
  };

  const processImage = async (base64Image: string) => {
    // 实时检查API密钥状态
    await checkApiKey();

    if (!hasApiKey) {
      Alert.alert(
        '配置需要',
        '请先在设置页面配置API密钥后再使用图片识别功能',
        [
          { text: '确定', style: 'default' }
        ]
      );
      return;
    }

    setIsLoading(true);
    setOriginalText('');
    setAiSummary('');
    setAudioBase64('');
    
    try {
      const response = await callQwenOmniAPI(base64Image, '请识别这张图片中的文字内容，并提供简洁的摘要。');
      if (response) {
        setOriginalText('图片识别完成');
        setAiSummary(response.text || '识别完成，但未获取到文本内容');
        if (response.audioBase64) {
          setAudioBase64(response.audioBase64);
        }
      } else {
        throw new Error('API返回了空响应');
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      let errorMessage = 'AI分析失败，请重试';
      
      if (error instanceof Error) {
        if (error.message.includes('API密钥')) {
          errorMessage = 'API密钥无效，请检查设置';
        } else if (error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else if (error.message.includes('超时')) {
          errorMessage = '请求超时，请重试';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('分析失败', errorMessage);
      setAiSummary('分析失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    try {
      if (isPlaying) {
        await stopAudioPlayback();
        stopSpeaking();
        setIsPlaying(false);
      } else {
        // 使用智能音频播放：iOS优先TTS，Android可尝试Base64音频
        console.log('开始智能音频播放...');
        await playAudioSmart(audioBase64, aiSummary, false); // 设置为false优先使用TTS
        console.log('音频播放成功');
        setIsPlaying(true);
        // 简单的播放状态管理，实际应用中可以监听播放完成事件
        setTimeout(() => setIsPlaying(false), 8000); // 增加到8秒，给音频更多播放时间
      }
    } catch (error) {
      console.error('音频播放错误:', error);

      let errorMessage = '播放失败';
      if (error instanceof Error) {
        if (error.message.includes('没有可播放的内容')) {
          errorMessage = '没有可播放的音频内容';
        } else if (error.message.includes('网络')) {
          errorMessage = '网络问题，请检查网络连接后重试';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('播放失败', errorMessage);
      setIsPlaying(false);
    }
  };

  const resetAll = () => {
    setSelectedImage(null);
    setOriginalText('');
    setAiSummary('');
    setAudioBase64('');
    stopAudioPlayback();
    stopSpeaking();
    setIsPlaying(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>智能阅读助手</Text>
        
        {!hasApiKey && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>请先在设置页面配置API密钥</Text>
          </View>
        )}

        {/* 图片选择区域 */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>选择或拍摄图片</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={handlePickImage}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, isLoading && styles.disabledButtonText]}>📷 选择图片</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={handleTakePhoto}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, isLoading && styles.disabledButtonText]}>📸 拍摄照片</Text>
            </TouchableOpacity>
          </View>
          
          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            </View>
          )}
        </View>

        {/* 加载指示器 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>AI正在分析图片...</Text>
          </View>
        )}

        {/* AI摘要显示区域 */}
        {aiSummary && (
          <View style={styles.textSection}>
            <Text style={styles.sectionTitle}>AI智能摘要</Text>
            <View style={styles.textContainer}>
              <Text style={styles.summaryText}>{aiSummary}</Text>
            </View>
          </View>
        )}

        {/* 朗读控制区域 */}
        {(aiSummary || audioBase64) && (
          <View style={styles.controlSection}>
            <TouchableOpacity 
              style={[styles.playButton, isPlaying && styles.playButtonActive]} 
              onPress={handlePlayAudio}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? '⏸️ 停止朗读' : '🔊 开始朗读'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 重置按钮 */}
        {selectedImage && (
          <View style={styles.resetSection}>
            <TouchableOpacity style={styles.resetButton} onPress={resetAll}>
              <Text style={styles.resetButtonText}>🔄 重新开始</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2c3e50',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningText: {
    fontSize: 18,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  selectedImage: {
    width: 300,
    height: 200,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  textSection: {
    marginBottom: 30,
  },
  textContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  summaryText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#2c3e50',
  },
  controlSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#28a745',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playButtonActive: {
    backgroundColor: '#dc3545',
  },
  playButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  resetSection: {
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledButtonText: {
    color: '#666666',
  },
});