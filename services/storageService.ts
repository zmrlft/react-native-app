import { Language } from '@/constants/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE_KEY = '@qwen_omni_api_key';
const LANGUAGE_STORAGE_KEY = '@app_language';
const DEFAULT_LANGUAGE: Language = 'zh';

/**
 * 保存API密钥到本地存储
 * @param key API密钥
 */
export const saveApiKey = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
    console.log('API Key saved successfully');
  } catch (error) {
    console.error('Error saving API Key:', error);
    throw new Error('保存API密钥失败');
  }
};

/**
 * 从本地存储获取API密钥
 * @returns API密钥或null
 */
export const getApiKey = async (): Promise<string | null> => {
  try {
    const key = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    return key;
  } catch (error) {
    console.error('Error getting API Key:', error);
    return null;
  }
};

/**
 * 删除本地存储的API密钥
 */
export const removeApiKey = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    console.log('API Key removed successfully');
  } catch (error) {
    console.error('Error removing API Key:', error);
    throw new Error('删除API密钥失败');
  }
};

/**
 * 获取用户选择的语言
 * @returns 用户语言设置或默认语言
 */
export const getLanguage = async (): Promise<Language> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage === 'en' || savedLanguage === 'zh') {
      return savedLanguage as Language;
    }
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('Error getting language:', error);
    return DEFAULT_LANGUAGE;
  }
};

/**
 * 保存用户选择的语言
 * @param language 用户选择的语言
 */
export const setLanguage = async (language: Language): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
    throw new Error('保存语言设置失败');
  }
};