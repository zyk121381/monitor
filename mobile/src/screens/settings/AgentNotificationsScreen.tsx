import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// 引入API服务
import { getNotificationConfig, saveNotificationSettings } from '../../api/notifications';
import agentService from '../../api/agents';

// 类型定义
interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
}

interface AgentNotificationSettings {
  enabled: boolean;
  onOffline: boolean;
  onRecovery: boolean;
  onCpuThreshold: boolean;
  cpuThreshold: number;
  onMemoryThreshold: boolean;
  memoryThreshold: number;
  onDiskThreshold: boolean;
  diskThreshold: number;
  channels: string[];
  overrideGlobal?: boolean;
}

interface NotificationSettings {
  monitors: any;
  agents: {
    enabled: boolean;
    onOffline: boolean;
    onRecovery: boolean;
    onCpuThreshold: boolean;
    cpuThreshold: number;
    onMemoryThreshold: boolean;
    memoryThreshold: number;
    onDiskThreshold: boolean;
    diskThreshold: number;
    channels: string[];
  };
  specificMonitors: Record<string, any>;
  specificAgents: Record<string, AgentNotificationSettings>;
}

interface Agent {
  id: string;
  name: string;
  hostname?: string;
  ip_address?: string;
  status?: string;
  os?: string;
  cpu?: {
    usage: number;
    cores: number;
    model: string;
  };
  memory?: {
    total: number;
    used: number;
  };
  disk?: {
    total: number;
    used: number;
  };
  version?: string;
  created_at?: string;
  updated_at?: string;
}

// 定义模拟数据
const mockSettings: NotificationSettings = {
  monitors: {
    enabled: true,
    onDown: true,
    onRecovery: true,
    channels: ['1', '2']
  },
  specificMonitors: {},
  agents: {
    enabled: true,
    onOffline: true,
    onRecovery: true,
    onCpuThreshold: true,
    cpuThreshold: 90,
    onMemoryThreshold: true,
    memoryThreshold: 85,
    onDiskThreshold: true,
    diskThreshold: 90,
    channels: ['1', '2']
  },
  specificAgents: {
    "1": {
      enabled: true,
      onOffline: true,
      onRecovery: false,
      onCpuThreshold: true,
      cpuThreshold: 95,
      onMemoryThreshold: false,
      memoryThreshold: 85,
      onDiskThreshold: false,
      diskThreshold: 90,
      channels: ['1'],
      overrideGlobal: true
    }
  }
};

const mockChannels: NotificationChannel[] = [
  { id: '1', name: '系统通知', type: 'app', enabled: true, config: {} },
  { id: '2', name: '邮件通知', type: 'email', enabled: true, config: { email: 'admin@example.com' } },
  { id: '3', name: '微信通知', type: 'wechat', enabled: true, config: {} }
];

const mockAgents: Agent[] = [
  {
    id: '1',
    name: '应用服务器',
    hostname: 'app-server-01',
    ip_address: '192.168.1.10',
    status: 'active',
    os: 'Linux',
    cpu: { usage: 32.5, cores: 4, model: 'Intel i7' },
    memory: { total: 16384, used: 8192 },
    disk: { total: 512000, used: 256000 },
    version: '1.2.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: '数据库服务器',
    hostname: 'db-server-01',
    ip_address: '192.168.1.20',
    status: 'active',
    os: 'Ubuntu',
    cpu: { usage: 65.2, cores: 8, model: 'AMD Ryzen' },
    memory: { total: 32768, used: 24576 },
    disk: { total: 1024000, used: 512000 },
    version: '1.2.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const AgentNotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 加载通知配置和客户端列表
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('开始加载客户端通知设置数据...');
        
        // 获取通知配置
        let notificationSettings = null;
        let channelList = [];
        
        try {
          console.log('正在请求通知配置...');
          const configResponse = await getNotificationConfig();
          console.log('通知配置响应状态:', configResponse.success);
          
          if (configResponse.success && configResponse.data) {
            console.log('通知配置响应数据格式:', typeof configResponse.data);
            
            // 检查数据结构类型并处理
            if (configResponse.data.settings) {
              console.log('找到settings字段，使用标准格式');
              notificationSettings = configResponse.data.settings;
              channelList = configResponse.data.channels || [];
            } else if (configResponse.data.agents) {
              console.log('找到agents字段，使用顶层对象作为settings');
              notificationSettings = configResponse.data;
              // 尝试从其他属性获取channels
              channelList = configResponse.data.channels || [];
            } else {
              console.warn('无法识别的数据结构，将尝试使用整个数据对象');
              notificationSettings = configResponse.data;
              channelList = mockChannels;
            }
            
            console.log('处理后的设置对象包含字段:', Object.keys(notificationSettings || {}).join(', '));
            
            // 检查必要的字段是否存在并进行数据修复
            if (!notificationSettings || !notificationSettings.agents || typeof notificationSettings.agents !== 'object') {
              console.warn('agents字段缺失或格式不正确，使用模拟数据');
              notificationSettings = notificationSettings || {};
              notificationSettings.agents = mockSettings.agents;
            }
            
            if (!notificationSettings.specificAgents) {
              console.warn('specificAgents字段缺失，使用空对象');
              notificationSettings.specificAgents = {};
            }
            
            if (!notificationSettings.monitors) {
              console.warn('monitors字段缺失，使用模拟数据');
              notificationSettings.monitors = mockSettings.monitors;
            }
            
            if (!notificationSettings.specificMonitors) {
              console.warn('specificMonitors字段缺失，使用空对象');
              notificationSettings.specificMonitors = {};
            }
            
            // 数据验证与修复
            if (!Array.isArray(notificationSettings.agents.channels)) {
              console.warn('agents.channels不是数组，修复为空数组');
              notificationSettings.agents.channels = [];
            }
            
            setSettings(notificationSettings);
            setChannels(channelList.length > 0 ? channelList : mockChannels);
          } else {
            console.warn('通知配置获取失败，使用模拟数据', configResponse.message);
            setSettings(mockSettings);
            setChannels(mockChannels);
            if (configResponse.message) {
              console.error('错误详情:', configResponse.message);
            }
          }
        } catch (configError) {
          console.error('获取通知配置异常，使用模拟数据', configError);
          setSettings(mockSettings);
          setChannels(mockChannels);
        }
        
        // 获取客户端列表
        try {
          console.log('正在请求客户端列表...');
          const agentsResponse = await agentService.getAllAgents();
          console.log('客户端列表响应状态:', agentsResponse.success);
          
          if (agentsResponse.success && agentsResponse.agents && agentsResponse.agents.length > 0) {
            console.log('成功获取客户端列表，数量:', agentsResponse.agents.length);
            setAgents(agentsResponse.agents);
          } else {
            console.warn('使用模拟客户端数据:', agentsResponse.message || '无可用客户端');
            setAgents(mockAgents);
          }
        } catch (agentsError) {
          console.error('获取客户端列表异常，使用模拟数据', agentsError);
          setAgents(mockAgents);
        }
        
        console.log('数据加载完成');
        
      } catch (error) {
        console.error('加载数据失败', error);
        setError(typeof error === 'string' ? error : t('common.unknownError'));
        
        // 确保即使出错也能显示模拟数据
        setSettings(settings || mockSettings);
        setChannels(channels.length > 0 ? channels : mockChannels);
        setAgents(agents.length > 0 ? agents : mockAgents);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [t]);
  
  // 保存设置
  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      console.log('开始保存客户端通知设置...');
      
      // 记录将要保存的设置信息
      console.log('当前客户端全局设置:', JSON.stringify(settings.agents));
      console.log('当前特定客户端设置数量:', Object.keys(settings.specificAgents || {}).length);
      
      const response = await saveNotificationSettings(settings);
      console.log('保存响应结果:', JSON.stringify(response));
      
      if (response.success) {
        console.log('保存成功!');
        Alert.alert(
          t('common.success'),
          t('notifications.save.success'),
          [{ text: t('common.ok'), onPress: () => console.log('保存成功对话框关闭') }]
        );
      } else {
        console.error('保存失败:', response.message);
        Alert.alert(
          t('common.error'),
          response.message || t('notifications.save.error'),
          [{ text: t('common.ok'), onPress: () => console.log('保存失败对话框关闭') }]
        );
      }
    } catch (error) {
      console.error('保存设置异常:', error);
      Alert.alert(t('common.error'), t('notifications.save.error'));
    } finally {
      setSaving(false);
    }
  };
  
  // 全局客户端设置变更
  const handleAgentSettingChange = (key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      agents: {
        ...settings.agents,
        [key]: value
      }
    });
  };
  
  // 特定客户端的设置更新
  const handleSpecificAgentSettingChange = (agentId: string, key: string, value: any) => {
    if (!settings) return;
    
    const currentSettings = settings.specificAgents[agentId] || {
      enabled: false,
      onOffline: false,
      onRecovery: false,
      onCpuThreshold: false,
      cpuThreshold: 90,
      onMemoryThreshold: false,
      memoryThreshold: 85,
      onDiskThreshold: false,
      diskThreshold: 90,
      channels: [],
      overrideGlobal: true
    };
    
    // 更新设置
    let updatedSettings = {
      ...currentSettings,
      [key]: value,
      overrideGlobal: true
    };
    
    // 如果是启用通知，同时也设置overrideGlobal为true
    if (key === 'enabled' && value === true) {
      updatedSettings.overrideGlobal = true;
    }
    
    setSettings({
      ...settings,
      specificAgents: {
        ...settings.specificAgents,
        [agentId]: updatedSettings
      }
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>{t('common.loading', '加载中')}...</Text>
      </View>
    );
  }
  
  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#f76363" />
        <Text style={styles.errorText}>{error || t('notifications.loadFailed', '加载失败')}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>{t('common.goBack', '返回')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 特定客户端通知设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.specificSettings.title', '特定客户端通知设置')}</Text>
          <Text style={styles.sectionDescription}>
            {t('notifications.specificSettings.description', '为每个具体的客户端配置单独的通知设置。')}
          </Text>
          
          {agents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={40} color="#999" />
              <Text style={styles.emptyStateText}>{t('notifications.specificSettings.noAgents', '没有可用的客户端')}</Text>
            </View>
          ) : (
            agents.map(agent => (
              <View key={agent.id} style={styles.specificSettingItem}>
                <View style={styles.specificSettingHeader}>
                  <View style={styles.specificSettingTitleContainer}>
                    <Text style={styles.specificSettingTitle}>{agent.name}</Text>
                    <Text style={styles.specificSettingDescription}>
                      {agent.hostname || agent.ip_address || t('common.unknown', '未知')}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: agent.status === 'active' ? '#4caf50' : '#f44336' }
                  ]}>
                    <Text style={styles.statusText}>
                      {agent.status === 'active' ? t('agents.status.active', '在线') : t('agents.status.inactive', '离线')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.specificSettings}>
                  <View style={styles.settingItem}>
                    <View style={styles.settingItemContent}>
                      <Text style={styles.settingItemText}>{t('notifications.settings.enabled', '启用通知')}</Text>
                    </View>
                    <Switch
                      value={Boolean(settings.specificAgents[agent.id]?.enabled)}
                      onValueChange={(value) => handleSpecificAgentSettingChange(agent.id, 'enabled', value)}
                      trackColor={{ false: '#f0f0f0', true: '#bde0ff' }}
                      thumbColor={settings.specificAgents[agent.id]?.enabled ? '#0066cc' : '#ccc'}
                    />
                  </View>
                  
                  {Boolean(settings.specificAgents[agent.id]?.enabled) && (
                    <>
                      <View style={styles.settingItem}>
                        <View style={styles.settingItemContent}>
                          <Text style={styles.settingItemText}>{t('notifications.events.onOffline', '客户端离线时通知')}</Text>
                        </View>
                        <Switch
                          value={Boolean(settings.specificAgents[agent.id]?.onOffline)}
                          onValueChange={(value) => handleSpecificAgentSettingChange(agent.id, 'onOffline', value)}
                          trackColor={{ false: '#f0f0f0', true: '#bde0ff' }}
                          thumbColor={settings.specificAgents[agent.id]?.onOffline ? '#0066cc' : '#ccc'}
                        />
                      </View>
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingItemContent}>
                          <Text style={styles.settingItemText}>{t('notifications.events.onRecovery', '恢复在线时通知')}</Text>
                        </View>
                        <Switch
                          value={Boolean(settings.specificAgents[agent.id]?.onRecovery)}
                          onValueChange={(value) => handleSpecificAgentSettingChange(agent.id, 'onRecovery', value)}
                          trackColor={{ false: '#f0f0f0', true: '#bde0ff' }}
                          thumbColor={settings.specificAgents[agent.id]?.onRecovery ? '#0066cc' : '#ccc'}
                        />
                      </View>
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingItemContent}>
                          <Text style={styles.settingItemText}>{t('notifications.events.onCpuThreshold', 'CPU 使用率告警')}</Text>
                        </View>
                        <Switch
                          value={Boolean(settings.specificAgents[agent.id]?.onCpuThreshold)}
                          onValueChange={(value) => handleSpecificAgentSettingChange(agent.id, 'onCpuThreshold', value)}
                          trackColor={{ false: '#f0f0f0', true: '#bde0ff' }}
                          thumbColor={settings.specificAgents[agent.id]?.onCpuThreshold ? '#0066cc' : '#ccc'}
                        />
                      </View>
                      
                      {Boolean(settings.specificAgents[agent.id]?.onCpuThreshold) && (
                        <View style={styles.thresholdContainer}>
                          <Text style={styles.thresholdLabel}>{t('notifications.threshold.label', '阈值')}</Text>
                          <TextInput
                            style={styles.thresholdInput}
                            value={String(settings.specificAgents[agent.id]?.cpuThreshold || '')}
                            onChangeText={(text) => handleSpecificAgentSettingChange(agent.id, 'cpuThreshold', parseInt(text) || 0)}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                          <Text style={styles.thresholdUnit}>{t('notifications.threshold.percent', '%')}</Text>
                        </View>
                      )}
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingItemContent}>
                          <Text style={styles.settingItemText}>{t('notifications.events.onMemoryThreshold', '内存使用率告警')}</Text>
                        </View>
                        <Switch
                          value={Boolean(settings.specificAgents[agent.id]?.onMemoryThreshold)}
                          onValueChange={(value) => handleSpecificAgentSettingChange(agent.id, 'onMemoryThreshold', value)}
                          trackColor={{ false: '#f0f0f0', true: '#bde0ff' }}
                          thumbColor={settings.specificAgents[agent.id]?.onMemoryThreshold ? '#0066cc' : '#ccc'}
                        />
                      </View>
                      
                      {Boolean(settings.specificAgents[agent.id]?.onMemoryThreshold) && (
                        <View style={styles.thresholdContainer}>
                          <Text style={styles.thresholdLabel}>{t('notifications.threshold.label', '阈值')}</Text>
                          <TextInput
                            style={styles.thresholdInput}
                            value={String(settings.specificAgents[agent.id]?.memoryThreshold || '')}
                            onChangeText={(text) => handleSpecificAgentSettingChange(agent.id, 'memoryThreshold', parseInt(text) || 0)}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                          <Text style={styles.thresholdUnit}>{t('notifications.threshold.percent', '%')}</Text>
                        </View>
                      )}
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingItemContent}>
                          <Text style={styles.settingItemText}>{t('notifications.events.onDiskThreshold', '磁盘使用率告警')}</Text>
                        </View>
                        <Switch
                          value={Boolean(settings.specificAgents[agent.id]?.onDiskThreshold)}
                          onValueChange={(value) => handleSpecificAgentSettingChange(agent.id, 'onDiskThreshold', value)}
                          trackColor={{ false: '#f0f0f0', true: '#bde0ff' }}
                          thumbColor={settings.specificAgents[agent.id]?.onDiskThreshold ? '#0066cc' : '#ccc'}
                        />
                      </View>
                      
                      {Boolean(settings.specificAgents[agent.id]?.onDiskThreshold) && (
                        <View style={styles.thresholdContainer}>
                          <Text style={styles.thresholdLabel}>{t('notifications.threshold.label', '阈值')}</Text>
                          <TextInput
                            style={styles.thresholdInput}
                            value={String(settings.specificAgents[agent.id]?.diskThreshold || '')}
                            onChangeText={(text) => handleSpecificAgentSettingChange(agent.id, 'diskThreshold', parseInt(text) || 0)}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                          <Text style={styles.thresholdUnit}>{t('notifications.threshold.percent', '%')}</Text>
                        </View>
                      )}
                      
                      {/* 通知渠道设置 */}
                      <View style={styles.channelsContainer}>
                        <Text style={styles.channelsTitle}>{t('notifications.specificSettings.channels', '通知渠道')}</Text>
                        
                        {channels.length === 0 ? (
                          <Text style={styles.noChannelsText}>{t('notifications.channels.noChannels', '没有可用的通知渠道')}</Text>
                        ) : (
                          channels.map(channel => (
                            <View key={channel.id} style={styles.channelItem}>
                              <View style={styles.channelItemContent}>
                                <Text style={styles.channelItemName}>{channel.name}</Text>
                                <Text style={styles.channelItemType}>({t(`notifications.channels.type.${channel.type}`, channel.type)})</Text>
                              </View>
                              <Switch
                                value={settings.specificAgents[agent.id]?.channels?.includes(channel.id)}
                                onValueChange={(checked) => {
                                  const currentChannels = settings.specificAgents[agent.id]?.channels || [];
                                  const updatedChannels = checked 
                                    ? [...currentChannels, channel.id]
                                    : currentChannels.filter(id => id !== channel.id);
                                  
                                  handleSpecificAgentSettingChange(agent.id, 'channels', updatedChannels);
                                }}
                                trackColor={{ false: '#f0f0f0', true: '#bde0ff' }}
                                thumbColor={settings.specificAgents[agent.id]?.channels?.includes(channel.id) ? '#0066cc' : '#ccc'}
                              />
                            </View>
                          ))
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* 底部安全区域 */}
        <View style={styles.safeArea} />
      </ScrollView>
      
      {/* 保存按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0066cc" />
          <Text style={styles.backButtonText}>{t('common.goBack', '返回')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerSaveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.footerSaveButtonText}>
            {saving ? t('common.saving', '保存中...') : t('common.save', '保存')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBackButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSaveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#0066cc',
    borderRadius: 6,
  },
  headerSaveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingItemContent: {
    flex: 1,
    paddingRight: 16,
  },
  settingItemText: {
    fontSize: 15,
    color: '#333',
  },
  settingItemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  thresholdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32,
    marginBottom: 16,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  thresholdInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    textAlign: 'center',
  },
  thresholdUnit: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  channelsSection: {
    marginTop: 8,
  },
  channelsSectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  noChannelsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelItemName: {
    fontSize: 14,
    color: '#333',
  },
  channelItemType: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  noItemsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 16,
  },
  agentItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  agentInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  overrideSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overrideSwitchText: {
    fontSize: 13,
    color: '#333',
    marginRight: 8,
  },
  specificSettings: {
    marginTop: 16,
    paddingLeft: 12,
  },
  safeArea: {
    height: 40,
  },
  specificSettingItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  specificSettingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specificSettingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specificSettingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  specificSettingDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  overrideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overrideText: {
    fontSize: 13,
    color: '#333',
    marginRight: 8,
  },
  channelsContainer: {
    marginTop: 16,
  },
  channelsTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#0066cc',
  },
  footerSaveButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#0066cc',
    borderRadius: 6,
  },
  footerSaveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AgentNotificationsScreen; 