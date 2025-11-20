import { Language, translations } from '@/constants/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@app_language';
const DEFAULT_LANGUAGE: Language = 'zh';

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

/**
 * 获取翻译文本 - 根据语言和键获取翻译
 * @param language 语言
 * @param key 翻译键的路径，例如 'home.title' 或 'settings.apiKey'
 * @returns 翻译后的文本
 */
export const t = (language: Language, key: string): string => {
  try {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${language}.${key}`);
        return key; // 如果找不到翻译，返回键名
      }
    }
    
    return typeof value === 'string' ? value : key;
  } catch (error) {
    console.error(`Error getting translation for ${language}.${key}:`, error);
    return key;
  }
};

/**
 * 简化的翻译函数，假设使用的是当前语言
 * 这需要在使用时提供语言参数
 */
export const useTranslation = (language: Language) => {
  return {
    t: (key: string) => t(language, key),
    language,
  };
};
