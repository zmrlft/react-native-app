import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface ImageResult {
  base64: string;
  uri: string;
}

export interface PermissionResult {
  granted: boolean;
  message?: string;
}

/**
 * 检查相机权限状态
 */
export const checkCameraPermission = async (): Promise<PermissionResult> => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    
    switch (status) {
      case 'granted':
        return { granted: true };
      case 'denied':
        return { 
          granted: false, 
          message: '相机权限被拒绝，请在设置中手动开启相机权限' 
        };
      case 'undetermined':
        return { granted: false, message: '需要请求相机权限' };
      default:
        return { 
          granted: false, 
          message: '无法获取相机权限状态' 
        };
    }
  } catch (error) {
    console.error('检查相机权限时出错:', error);
    return { 
      granted: false, 
      message: '检查相机权限时发生错误' 
    };
  }
};

/**
 * 检查媒体库权限状态
 */
export const checkMediaLibraryPermission = async (): Promise<PermissionResult> => {
  try {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    
    switch (status) {
      case 'granted':
        return { granted: true };
      case 'denied':
        return { 
          granted: false, 
          message: '相册权限被拒绝，请在设置中手动开启相册权限' 
        };
      case 'undetermined':
        return { granted: false, message: '需要请求相册权限' };
      default:
        return { 
          granted: false, 
          message: '无法获取相册权限状态' 
        };
    }
  } catch (error) {
    console.error('检查媒体库权限时出错:', error);
    return { 
      granted: false, 
      message: '检查相册权限时发生错误' 
    };
  }
};

/**
 * 请求相机权限
 */
export const requestCameraPermission = async (): Promise<PermissionResult> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status === 'granted') {
      return { granted: true };
    } else {
      return {
        granted: false,
        message: '需要相机权限才能拍摄照片。请在设置中开启相机权限。'
      };
    }
  } catch (error) {
    console.error('请求相机权限时出错:', error);
    return {
      granted: false,
      message: '请求相机权限时发生错误'
    };
  }
};

/**
 * 请求媒体库权限
 */
export const requestMediaLibraryPermission = async (): Promise<PermissionResult> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status === 'granted') {
      return { granted: true };
    } else {
      return {
        granted: false,
        message: '需要相册权限才能选择图片。请在设置中开启相册权限。'
      };
    }
  } catch (error) {
    console.error('请求媒体库权限时出错:', error);
    return {
      granted: false,
      message: '请求相册权限时发生错误'
    };
  }
};

/**
 * 请求相机和媒体库权限（保持向后兼容）
 */
export const requestPermissions = async (): Promise<boolean> => {
  try {
    const cameraResult = await requestCameraPermission();
    const mediaResult = await requestMediaLibraryPermission();
    
    return cameraResult.granted && mediaResult.granted;
  } catch (error) {
    console.error('请求权限时出错:', error);
    return false;
  }
};

/**
 * 显示权限设置引导
 */
export const showPermissionGuide = (type: 'camera' | 'library') => {
  const title = type === 'camera' ? '相机权限' : '相册权限';
  const message = type === 'camera' 
    ? '此应用需要相机权限来拍摄照片进行文字识别。请在设置中开启相机权限。'
    : '此应用需要相册权限来选择图片进行文字识别。请在设置中开启相册权限。';
  
  Alert.alert(
    title,
    message,
    [
      { text: '取消', style: 'cancel' },
      { 
        text: '去设置', 
        onPress: () => {
          if (Platform.OS === 'ios') {
            const settingPath = type === 'camera' ? '相机' : '照片';
            Alert.alert('设置路径', `设置 > 隐私与安全性 > ${settingPath} > 智能阅读助手`);
          } else {
            Alert.alert('设置路径', '设置 > 应用管理 > 智能阅读助手 > 权限管理');
          }
        }
      }
    ]
  );
};

/**
 * 从相册选择图片
 */
export const pickImageFromLibrary = async (): Promise<ImageResult | null> => {
  try {
    // 首先检查权限状态
    const permissionCheck = await checkMediaLibraryPermission();
    
    if (!permissionCheck.granted) {
      // 如果权限未授予，尝试请求权限
      const permissionRequest = await requestMediaLibraryPermission();
      
      if (!permissionRequest.granted) {
        // 显示用户友好的错误提示
        Alert.alert(
          '权限需要',
          permissionRequest.message || '需要相册权限才能选择图片',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '去设置', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Alert.alert('提示', '请在设置 > 隐私与安全性 > 照片中开启权限');
                } else {
                  Alert.alert('提示', '请在应用设置中开启存储权限');
                }
              }
            }
          ]
        );
        throw new Error(permissionRequest.message || '需要相册权限才能选择图片');
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // 适当压缩以减少文件大小
      base64: true, // 获取 Base64 编码
      aspect: [4, 3], // 设置合适的宽高比
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // 验证图片数据
      if (!asset.base64) {
        throw new Error('无法获取图片数据，请重试');
      }
      
      // 检查图片大小（限制为10MB）
      const imageSizeInMB = (asset.base64.length * 3) / (4 * 1024 * 1024);
      if (imageSizeInMB > 10) {
        throw new Error('图片文件过大，请选择小于10MB的图片');
      }
      
      return {
        base64: asset.base64,
        uri: asset.uri
      };
    }
    
    return null; // 用户取消选择
  } catch (error) {
    console.error('选择图片时出错:', error);
    
    if (error instanceof Error) {
      throw error; // 重新抛出已知错误
    }
    
    throw new Error('选择图片失败，请检查权限设置后重试');
  }
};

/**
 * 使用相机拍摄图片
 */
export const takePhotoWithCamera = async (): Promise<ImageResult | null> => {
  try {
    // 首先检查相机权限状态
    const permissionCheck = await checkCameraPermission();
    
    if (!permissionCheck.granted) {
      // 如果权限未授予，尝试请求权限
      const permissionRequest = await requestCameraPermission();
      
      if (!permissionRequest.granted) {
        // 显示用户友好的错误提示
        Alert.alert(
          '权限需要',
          permissionRequest.message || '需要相机权限才能拍摄照片',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '去设置', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Alert.alert('提示', '请在设置 > 隐私与安全性 > 相机中开启权限');
                } else {
                  Alert.alert('提示', '请在应用设置中开启相机权限');
                }
              }
            }
          ]
        );
        throw new Error(permissionRequest.message || '需要相机权限才能拍摄照片');
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // 适当压缩以减少文件大小
      base64: true, // 获取 Base64 编码
      aspect: [4, 3], // 设置合适的宽高比
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // 验证图片数据
      if (!asset.base64) {
        throw new Error('无法获取拍摄的图片数据，请重试');
      }
      
      // 检查图片大小（限制为10MB）
      const imageSizeInMB = (asset.base64.length * 3) / (4 * 1024 * 1024);
      if (imageSizeInMB > 10) {
        throw new Error('拍摄的图片文件过大，请调整拍摄设置');
      }
      
      return {
        base64: asset.base64,
        uri: asset.uri
      };
    }
    
    return null; // 用户取消拍摄
  } catch (error) {
    console.error('拍摄照片时出错:', error);
    
    if (error instanceof Error) {
      throw error; // 重新抛出已知错误
    }
    
    throw new Error('拍摄照片失败，请检查相机权限后重试');
  }
};