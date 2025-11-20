// 支持的语言类型
export type Language = 'zh' | 'en';

// 多语言文本内容
export const translations = {
  zh: {
    // 主页面
    home: {
      title: '图片识别助手',
      takePhoto: '拍照',
      pickImage: '从相册选择',
      processing: '处理中...',
      originalText: '识别文本',
      aiSummary: 'AI总结',
      audioContent: '音频内容',
      playAudio: '播放音频',
      stopAudio: '停止播放',
      noImageSelected: '未选择图片',
      selectImagePrompt: '请先拍照或从相册选择图片',
      configRequired: '配置需要',
      apiKeyRequired: '请先在设置页面配置API密钥后再使用图片识别功能',
      ok: '确定',
      error: '错误',
      selectImageFailed: '选择图片失败',
      takePhotoFailed: '拍摄照片失败',
    },
    // 设置页面
    settings: {
      title: '设置',
      qwenApiConfig: 'Qwen-Omni API 配置',
      apiKeyDescription: '请输入您的Qwen-Omni API密钥以启用AI图片识别和语音生成功能。API密钥将安全地存储在本地设备上。',
      apiKey: 'API 密钥',
      enterApiKey: '请输入您的API密钥',
      currentKeyConfigured: '当前已配置API密钥',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      testApiKey: '测试',
      confirmDelete: '确认删除',
      deleteKeyConfirm: '确定要删除已保存的API密钥吗？删除后需要重新输入才能使用AI功能。',
      cancel: '取消',
      deleteConfirmBtn: '删除',
      success: '成功',
      apiKeySaved: 'API密钥已保存',
      apiKeyDeleted: 'API密钥已删除',
      errorTitle: '错误',
      apiKeyTooShort: 'API密钥长度不足，请检查输入',
      apiKeyEmpty: '请输入API密钥',
      saveApiKeyFailed: '保存API密钥失败',
      deleteApiKeyFailed: '删除API密钥失败',
      testApiKeyMsg: '此功能将在实际使用时验证API密钥的有效性。请在主页面尝试识别图片来测试API连接。',
      language: '语言',
      languageSettings: '语言设置',
      selectLanguage: '选择语言',
      chinese: '中文',
      english: 'English',
    },
    // 权限相关
    permissions: {
      cameraPermissionTitle: '相机权限',
      cameraPermissionMessage: '此应用需要相机权限来拍照。请在设置中启用相机权限。',
      libraryPermissionTitle: '相册权限',
      libraryPermissionMessage: '此应用需要相册权限来选择图片。请在设置中启用相册权限。',
      goToSettings: '前往设置',
      permissionDenied: '权限被拒绝',
    },
  },
  en: {
    // Home screen
    home: {
      title: 'Image Recognition Assistant',
      takePhoto: 'Take Photo',
      pickImage: 'Pick from Library',
      processing: 'Processing...',
      originalText: 'Recognized Text',
      aiSummary: 'AI Summary',
      audioContent: 'Audio Content',
      playAudio: 'Play Audio',
      stopAudio: 'Stop Playback',
      noImageSelected: 'No Image Selected',
      selectImagePrompt: 'Please take a photo or pick an image from the library first',
      configRequired: 'Configuration Required',
      apiKeyRequired: 'Please configure the API key in the settings page before using image recognition',
      ok: 'OK',
      error: 'Error',
      selectImageFailed: 'Failed to select image',
      takePhotoFailed: 'Failed to take photo',
    },
    // Settings screen
    settings: {
      title: 'Settings',
      qwenApiConfig: 'Qwen-Omni API Configuration',
      apiKeyDescription: 'Please enter your Qwen-Omni API key to enable AI image recognition and voice generation. The API key will be securely stored on your device.',
      apiKey: 'API Key',
      enterApiKey: 'Please enter your API key',
      currentKeyConfigured: 'API key currently configured',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      testApiKey: 'Test',
      confirmDelete: 'Confirm Delete',
      deleteKeyConfirm: 'Are you sure you want to delete the saved API key? You will need to re-enter it to use AI features.',
      cancel: 'Cancel',
      deleteConfirmBtn: 'Delete',
      success: 'Success',
      apiKeySaved: 'API key saved successfully',
      apiKeyDeleted: 'API key deleted',
      errorTitle: 'Error',
      apiKeyTooShort: 'API key is too short, please check your input',
      apiKeyEmpty: 'Please enter an API key',
      saveApiKeyFailed: 'Failed to save API key',
      deleteApiKeyFailed: 'Failed to delete API key',
      testApiKeyMsg: 'This feature will validate your API key when you actually use it. Try recognizing an image on the home screen to test the API connection.',
      language: 'Language',
      languageSettings: 'Language Settings',
      selectLanguage: 'Select Language',
      chinese: '中文',
      english: 'English',
    },
    // Permissions
    permissions: {
      cameraPermissionTitle: 'Camera Permission',
      cameraPermissionMessage: 'This app needs camera permission to take photos. Please enable camera permission in settings.',
      libraryPermissionTitle: 'Photo Library Permission',
      libraryPermissionMessage: 'This app needs photo library permission to select images. Please enable photo library permission in settings.',
      goToSettings: 'Go to Settings',
      permissionDenied: 'Permission Denied',
    },
  },
};

// 获取语言代码到语言名称的映射
export const getLanguageName = (lang: Language): string => {
  if (lang === 'en') return 'English';
  return '中文';
};

// AI提示词模板 - 根据语言返回不同的提示词
export const getDefaultPrompt = (language: Language): string => {
  if (language === 'en') {
    return "Please identify the text content in the image and summarize it into a concise, easy-to-understand, conversational usage guide. Avoid technical jargon and provide clear explanations. This is for an English-speaking user.";
  }
  return "请识别图中文字内容，并将其总结成一份简洁、易懂、口语化的使用说明，避免专业术语，并提供朗读。";
};

// 获取AI配置中的语言声音设置
export const getAudioVoice = (language: Language): string => {
  // Qwen-Omni API 支持的语言特定语音
  if (language === 'en') {
    return 'Ethan'; // 英文女声
  }
  return 'Cherry'; // 中文女声
};
