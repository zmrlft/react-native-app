import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveApiKey, getApiKey, removeApiKey } from '@/services/storageService';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(false);

  useEffect(() => {
    loadExistingApiKey();
  }, []);

  const loadExistingApiKey = async () => {
    try {
      const existingKey = await getApiKey();
      if (existingKey) {
        setHasExistingKey(true);
        // 显示部分密钥用于确认
        const maskedKey = existingKey.substring(0, 8) + '...' + existingKey.substring(existingKey.length - 4);
        setApiKey(maskedKey);
      }
    } catch (error) {
      console.error('加载API密钥失败:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('错误', '请输入API密钥');
      return;
    }

    if (apiKey.length < 20) {
      Alert.alert('错误', 'API密钥长度不足，请检查输入');
      return;
    }

    setIsLoading(true);
    try {
      await saveApiKey(apiKey.trim());
      setHasExistingKey(true);
      Alert.alert('成功', 'API密钥已保存', [
        {
          text: '确定',
          onPress: () => {
            // 保存后显示遮罩密钥
            const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
            setApiKey(maskedKey);
          }
        }
      ]);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '保存API密钥失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveApiKey = () => {
    Alert.alert(
      '确认删除',
      '确定要删除已保存的API密钥吗？删除后需要重新输入才能使用AI功能。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeApiKey();
              setApiKey('');
              setHasExistingKey(false);
              Alert.alert('成功', 'API密钥已删除');
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '删除API密钥失败');
            }
          }
        }
      ]
    );
  };

  const handleEditApiKey = () => {
    setApiKey('');
    setHasExistingKey(false);
  };

  const testApiKey = async () => {
    if (!hasExistingKey) {
      Alert.alert('提示', '请先保存API密钥');
      return;
    }

    Alert.alert(
      '测试API密钥',
      '此功能将在实际使用时验证API密钥的有效性。请在主页面尝试识别图片来测试API连接。',
      [{ text: '确定' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>设置</Text>
          
          {/* API密钥配置区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qwen-Omni API 配置</Text>
            <Text style={styles.description}>
              请输入您的Qwen-Omni API密钥以启用AI图片识别和语音生成功能。
              API密钥将安全地存储在本地设备上。
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>API 密钥</Text>
              <TextInput
                style={styles.textInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={hasExistingKey ? '当前已配置API密钥' : '请输入您的API密钥'}
                placeholderTextColor="#999"
                secureTextEntry={hasExistingKey}
                multiline={false}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!hasExistingKey}
              />
            </View>

            {/* 按钮区域 */}
            <View style={styles.buttonContainer}>
              {!hasExistingKey ? (
                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && styles.disabledButton]} 
                  onPress={handleSaveApiKey}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? '保存中...' : '💾 保存API密钥'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.existingKeyButtons}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleEditApiKey}>
                    <Text style={styles.secondaryButtonText}>✏️ 修改密钥</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.testButton} onPress={testApiKey}>
                    <Text style={styles.testButtonText}>🔍 测试连接</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.dangerButton} onPress={handleRemoveApiKey}>
                    <Text style={styles.dangerButtonText}>🗑️ 删除密钥</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* 使用说明区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>使用说明</Text>
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>1. 获取API密钥：访问Qwen-Omni官网注册账号并获取API密钥</Text>
              <Text style={styles.instructionText}>2. 输入密钥：将获取的API密钥粘贴到上方输入框中</Text>
              <Text style={styles.instructionText}>3. 保存配置：点击保存按钮将密钥安全存储到本地</Text>
              <Text style={styles.instructionText}>4. 开始使用：返回主页面即可使用AI识别功能</Text>
            </View>
          </View>

          {/* 关于应用区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>关于应用</Text>
            <View style={styles.aboutContainer}>
              <Text style={styles.aboutText}>智能阅读助手 v1.0</Text>
              <Text style={styles.aboutText}>专为视力不佳的老年用户设计</Text>
              <Text style={styles.aboutText}>集成AI技术，帮助轻松阅读小字体文本</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2c3e50',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  existingKeyButtons: {
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
    marginBottom: 10,
  },
  aboutContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
});
