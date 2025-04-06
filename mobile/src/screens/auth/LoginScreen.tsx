import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, saveApiBaseUrl } from '../../config/api';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  { Login: undefined },
  'Login'
>;

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiUrlModalVisible, setApiUrlModalVisible] = useState(false);
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  
  const { login, isLoading, error } = useAuthStore();
  
  const handleLogin = async () => {
    // 重置错误
    setUsernameError('');
    setPasswordError('');
    
    // 表单验证
    let isValid = true;
    
    if (!username.trim()) {
      setUsernameError(t('auth.usernameRequired'));
      isValid = false;
    }
    
    if (!password) {
      setPasswordError(t('auth.passwordRequired'));
      isValid = false;
    }
    
    if (!isValid) {
      return;
    }
    
    // 执行登录
    const success = await login({ username, password });
    
    if (!success && error) {
      Alert.alert(t('common.error'), error);
    }
  };

  const handleOpenApiSettings = () => {
    setApiUrlModalVisible(true);
  };

  const handleSaveApiUrl = async () => {
    try {
      await saveApiBaseUrl(apiUrl);
      setApiUrlModalVisible(false);
      Alert.alert(
        t('common.success'),
        t('settings.apiUrlSaved')
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('settings.apiUrlSaveFailed')
      );
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleOpenApiSettings}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('auth.login')}</Text>
          <Text style={styles.subtitle}>XUGOU 监控</Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.username')}</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={t('auth.username')}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password')}
              secureTextEntry
              placeholderTextColor="#999"
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
          )}
        </TouchableOpacity>

        <Modal
          visible={apiUrlModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setApiUrlModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('settings.apiSettings')}</Text>
              
              <Text style={styles.modalLabel}>{t('settings.apiBaseUrl')}</Text>
              <TextInput
                style={styles.modalInput}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://..."
                autoCapitalize="none"
                keyboardType="url"
                placeholderTextColor="#999"
              />
              
              <Text style={styles.apiHelperText}>
                {t('settings.apiHelperText')}
              </Text>
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setApiUrlModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveApiUrl}
                >
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    right: 0,
    top: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  apiHelperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
    lineHeight: 18,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#0066cc',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen; 