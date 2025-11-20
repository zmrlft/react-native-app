import LanguagePicker from "@/components/LanguagePicker";
import { Language, translations } from "@/constants/i18n";
import {
  getApiKey,
  getLanguage,
  removeApiKey,
  saveApiKey,
  setLanguage,
} from "@/services/storageService";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(false);
  const [language, setLanguageState] = useState<Language>("zh");
  const [showLanguagePicker, setShowLanguagePicker] = useState<boolean>(false);

  // 翻译辅助函数
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  useEffect(() => {
    loadExistingApiKey();
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const userLanguage = await getLanguage();
      setLanguageState(userLanguage);
    } catch (error) {
      console.error("加载语言设置失败:", error);
      setLanguageState("zh");
    }
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      await setLanguage(newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      Alert.alert(t("settings.errorTitle"), t("settings.language"));
    }
  };

  const loadExistingApiKey = async () => {
    try {
      const existingKey = await getApiKey();
      if (existingKey) {
        setHasExistingKey(true);
        // 显示部分密钥用于确认
        const maskedKey =
          existingKey.substring(0, 8) +
          "..." +
          existingKey.substring(existingKey.length - 4);
        setApiKey(maskedKey);
      }
    } catch (error) {
      console.error("加载API密钥失败:", error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert(t("settings.errorTitle"), t("settings.apiKeyEmpty"));
      return;
    }

    if (apiKey.length < 20) {
      Alert.alert(t("settings.errorTitle"), t("settings.apiKeyTooShort"));
      return;
    }

    setIsLoading(true);
    try {
      await saveApiKey(apiKey.trim());
      setHasExistingKey(true);
      Alert.alert(t("settings.success"), t("settings.apiKeySaved"), [
        {
          text: t("settings.ok"),
          onPress: () => {
            // 保存后显示遮罩密钥
            const maskedKey =
              apiKey.substring(0, 8) +
              "..." +
              apiKey.substring(apiKey.length - 4);
            setApiKey(maskedKey);
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        t("settings.errorTitle"),
        error instanceof Error ? error.message : t("settings.saveApiKeyFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveApiKey = () => {
    Alert.alert(t("settings.confirmDelete"), t("settings.deleteKeyConfirm"), [
      { text: t("settings.cancel"), style: "cancel" },
      {
        text: t("settings.deleteConfirmBtn"),
        style: "destructive",
        onPress: async () => {
          try {
            await removeApiKey();
            setApiKey("");
            setHasExistingKey(false);
            Alert.alert(t("settings.success"), t("settings.apiKeyDeleted"));
          } catch (error) {
            Alert.alert(
              t("settings.errorTitle"),
              error instanceof Error
                ? error.message
                : t("settings.deleteApiKeyFailed")
            );
          }
        },
      },
    ]);
  };

  const handleEditApiKey = () => {
    setApiKey("");
    setHasExistingKey(false);
  };

  const testApiKey = async () => {
    if (!hasExistingKey) {
      Alert.alert(language === "en" ? "Tip" : "提示", t("settings.testApiKey"));
      return;
    }

    Alert.alert(
      language === "en" ? "Test API Key" : "测试API密钥",
      t("settings.testApiKeyMsg"),
      [{ text: t("settings.ok") }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{t("settings.title")}</Text>

          {/* 语言设置区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("settings.languageSettings")}
            </Text>
            <TouchableOpacity
              style={styles.languageSelectButton}
              onPress={() => setShowLanguagePicker(true)}
            >
              <Text style={styles.languageSelectText}>
                {language === "en" ? "English" : "中文"} ▼
              </Text>
            </TouchableOpacity>
          </View>

          {/* API密钥配置区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("settings.qwenApiConfig")}
            </Text>
            <Text style={styles.description}>
              {t("settings.apiKeyDescription")}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("settings.apiKey")}</Text>
              <TextInput
                style={styles.textInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={
                  hasExistingKey
                    ? t("settings.currentKeyConfigured")
                    : t("settings.enterApiKey")
                }
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
                  style={[
                    styles.primaryButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleSaveApiKey}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading
                      ? language === "en"
                        ? "Saving..."
                        : "保存中..."
                      : t("settings.save")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.existingKeyButtons}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleEditApiKey}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {t("settings.edit")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={testApiKey}
                  >
                    <Text style={styles.testButtonText}>
                      {t("settings.testApiKey")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={handleRemoveApiKey}
                  >
                    <Text style={styles.dangerButtonText}>
                      {t("settings.delete")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* 使用说明区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === "en" ? "Instructions" : "使用说明"}
            </Text>
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                {language === "en"
                  ? "1. Get API Key: Visit Qwen-Omni official website to register and get your API key"
                  : "1. 获取API密钥：访问Qwen-Omni官网注册账号并获取API密钥"}
              </Text>
              <Text style={styles.instructionText}>
                {language === "en"
                  ? "2. Enter Key: Paste the API key into the input field above"
                  : "2. 输入密钥：将获取的API密钥粘贴到上方输入框中"}
              </Text>
              <Text style={styles.instructionText}>
                {language === "en"
                  ? "3. Save: Click the save button to store the key securely"
                  : "3. 保存配置：点击保存按钮将密钥安全存储到本地"}
              </Text>
              <Text style={styles.instructionText}>
                {language === "en"
                  ? "4. Start Using: Return to the home screen to use AI features"
                  : "4. 开始使用：返回主页面即可使用AI识别功能"}
              </Text>
            </View>
          </View>

          {/* 关于应用区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === "en" ? "About" : "关于应用"}
            </Text>
            <View style={styles.aboutContainer}>
              <Text style={styles.aboutText}>
                {language === "en"
                  ? "Smart Reading Assistant v1.0"
                  : "智能阅读助手 v1.0"}
              </Text>
              <Text style={styles.aboutText}>
                {language === "en"
                  ? "Designed for visually impaired elderly users"
                  : "专为视力不佳的老年用户设计"}
              </Text>
              <Text style={styles.aboutText}>
                {language === "en"
                  ? "Integrated with AI technology to help read small text easily"
                  : "集成AI技术，帮助轻松阅读小字体文本"}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 语言选择器 */}
      <LanguagePicker
        visible={showLanguagePicker}
        currentLanguage={language}
        onLanguageSelect={handleLanguageChange}
        onClose={() => setShowLanguagePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#2c3e50",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2c3e50",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#2c3e50",
  },
  textInput: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e1e8ed",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 50,
    textAlignVertical: "top",
  },
  buttonContainer: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  existingKeyButtons: {
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  testButton: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: "center",
  },
  testButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  instructionContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#2c3e50",
    marginBottom: 10,
  },
  aboutContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    alignItems: "center",
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 5,
  },
  languageSelectButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  languageSelectText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
  },
});
