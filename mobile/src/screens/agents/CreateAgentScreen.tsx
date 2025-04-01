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

const CreateAgentScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  const [name, setName] = useState('');
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(
        t('agents.createError', '创建错误'),
        t('agents.nameRequired', '请输入客户端名称')
      );
      return;
    }
    
    setIsLoading(true);
    
    // 模拟创建客户端的 API 调用
    setTimeout(() => {
      setIsLoading(false);
      
      // 生成随机令牌
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      Alert.alert(
        t('agents.createSuccess', '创建成功'),
        t('agents.tokenGenerated', '客户端已创建，请复制以下令牌: ') + token,
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
        <Text style={styles.label}>{t('agents.name', '名称')} *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('agents.enterName', '输入客户端名称')}
        />
        
        <Text style={styles.label}>{t('agents.hostname', '主机名')}</Text>
        <TextInput
          style={styles.input}
          value={hostname}
          onChangeText={setHostname}
          placeholder={t('agents.enterHostname', '输入主机名')}
        />
        
        <Text style={styles.label}>{t('agents.ipAddress', 'IP地址')}</Text>
        <TextInput
          style={styles.input}
          value={ipAddress}
          onChangeText={setIpAddress}
          placeholder={t('agents.enterIp', '输入IP地址')}
          keyboardType="numeric"
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>{t('agents.instructions', '安装说明')}</Text>
          <Text style={styles.infoText}>
            {t('agents.installInstructions', '1. 创建客户端并获取令牌')}
          </Text>
          <Text style={styles.infoText}>
            {t('agents.installInstructions2', '2. 在您的服务器上运行安装脚本')}
          </Text>
          <Text style={styles.infoText}>
            {t('agents.installInstructions3', '3. 使用令牌完成客户端配置')}
          </Text>
          <Text style={styles.infoText}>
            {t('agents.installInstructions4', '4. 客户端将自动连接到监控服务')}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t('agents.create', '创建客户端')}
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
  infoContainer: {
    backgroundColor: '#e6f3ff',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0066cc',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateAgentScreen; 