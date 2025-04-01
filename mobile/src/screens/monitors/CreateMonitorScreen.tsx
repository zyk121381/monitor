import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const CreateMonitorScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState('60');
  const [monitorType, setMonitorType] = useState('http');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) {
      Alert.alert(
        t('monitors.createError', '创建错误'),
        t('monitors.fieldsRequired', '请填写所有必填字段')
      );
      return;
    }
    
    setIsLoading(true);
    
    // 模拟创建监控的 API 调用
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        t('monitors.createSuccess', '创建成功'),
        t('monitors.monitorCreated', '监控已成功创建'),
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    }, 1000);
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.label}>{t('monitors.name', '名称')} *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('monitors.enterName', '输入监控名称')}
        />
        
        <Text style={styles.label}>{t('monitors.url', 'URL/主机')} *</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder={t('monitors.enterUrl', '输入要监控的 URL 或主机')}
        />
        
        <Text style={styles.label}>{t('monitors.type', '监控类型')}</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              monitorType === 'http' && styles.typeButtonActive
            ]}
            onPress={() => setMonitorType('http')}
          >
            <Text style={[
              styles.typeButtonText,
              monitorType === 'http' && styles.typeButtonTextActive
            ]}>
              HTTP
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              monitorType === 'tcp' && styles.typeButtonActive
            ]}
            onPress={() => setMonitorType('tcp')}
          >
            <Text style={[
              styles.typeButtonText,
              monitorType === 'tcp' && styles.typeButtonTextActive
            ]}>
              TCP
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              monitorType === 'ping' && styles.typeButtonActive
            ]}
            onPress={() => setMonitorType('ping')}
          >
            <Text style={[
              styles.typeButtonText,
              monitorType === 'ping' && styles.typeButtonTextActive
            ]}>
              PING
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>{t('monitors.interval', '检查间隔 (秒)')}</Text>
        <TextInput
          style={styles.input}
          value={interval}
          onChangeText={setInterval}
          keyboardType="numeric"
        />
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t('monitors.create', '创建监控')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#0066cc',
  },
  typeButtonText: {
    fontWeight: '500',
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateMonitorScreen; 