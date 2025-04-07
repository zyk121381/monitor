import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// 客户端接口定义
interface Agent {
  id: string;
  name: string;
  hostname: string;
  ip_address?: string;
  status: string;
  version?: string;
  operating_system?: string;
  last_seen?: string;
  created_at: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  memory_total?: number;
  memory_used?: number;
  disk_total?: number;
  disk_used?: number;
  network_rx?: number;
  network_tx?: number;
}

// 资源历史记录
interface ResourceHistory {
  id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}

// 模拟服务
const agentService = {
  getAgent: (id: string): Promise<Agent> => {
    return Promise.resolve({
      id,
      name: '生产服务器',
      hostname: 'prod-server-01',
      ip_address: '192.168.1.101',
      status: 'active',
      version: '1.5.2',
      operating_system: 'Ubuntu 20.04 LTS',
      last_seen: new Date().toISOString(),
      created_at: '2023-08-15T10:20:30Z',
      cpu_usage: 45.2,
      memory_usage: 62.8,
      disk_usage: 78.3,
      memory_total: 16384, // MB
      memory_used: 10309, // MB
      disk_total: 512000, // MB
      disk_used: 401000, // MB
      network_rx: 15.6, // MB/s
      network_tx: 5.2, // MB/s
    });
  },
  
  getResourceHistory: (id: string): Promise<ResourceHistory[]> => {
    const history: ResourceHistory[] = [];
    const now = new Date();
    
    // 生成过去24小时的历史数据
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
      
      history.push({
        id: `hist-${id}-${i}`,
        timestamp,
        cpu_usage: Math.floor(Math.random() * 80) + 10,
        memory_usage: Math.floor(Math.random() * 40) + 40,
        disk_usage: Math.floor(Math.random() * 10) + 70,
      });
    }
    
    return Promise.resolve(history.reverse());
  },
  
  deleteAgent: (id: string): Promise<{ success: boolean }> => {
    return Promise.resolve({ success: true });
  }
};

// 路由参数类型
type AgentDetailRouteProp = RouteProp<{ AgentDetail: { agentId: string } }, 'AgentDetail'>;

const AgentDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<AgentDetailRouteProp>();
  const { agentId } = route.params;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [resourceHistory, setResourceHistory] = useState<ResourceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 加载客户端详情和资源历史
  const fetchData = async () => {
    try {
      const agentData = await agentService.getAgent(agentId);
      const historyData = await agentService.getResourceHistory(agentId);
      
      setAgent(agentData);
      setResourceHistory(historyData);
    } catch (error) {
      console.error('获取客户端详情失败', error);
      Alert.alert(t('common.error', '错误'), t('agents.fetchDetailFailed', '获取客户端详情失败'));
    } finally {
      setLoading(false);
    }
  };
  
  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };
  
  // 删除客户端
  const handleDelete = () => {
    Alert.alert(
      t('agents.deleteTitle', '删除客户端'),
      t('agents.deleteConfirmation', '您确定要删除此客户端吗？此操作不可撤销。'),
      [
        {
          text: t('common.cancel', '取消'),
          style: 'cancel'
        },
        {
          text: t('common.delete', '删除'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await agentService.deleteAgent(agentId);
              
              if (result.success) {
                navigation.goBack();
              }
            } catch (error) {
              console.error('删除客户端失败', error);
              Alert.alert(t('common.error', '错误'), t('agents.deleteFailed', '删除客户端失败'));
            }
          }
        }
      ]
    );
  };
  
  // 获取状态颜色
  const getStatusColor = (status: string) => {
    return status === 'active' ? '#30c85e' : '#888';
  };
  
  // 获取状态文本
  const getStatusText = (status: string) => {
    return status === 'active' 
      ? t('agents.status_active', '在线') 
      : t('agents.status_inactive', '离线');
  };
  
  // 获取资源颜色
  const getResourceColor = (usage: number) => {
    if (usage > 80) return '#f76363';
    if (usage > 60) return '#ffb224';
    return '#30c85e';
  };
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.unknown', '未知');
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // 格式化时间差
  const timeSince = (dateString?: string) => {
    if (!dateString) return t('common.unknown', '未知');
    
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 86400; // days
    if (interval > 1) {
      return Math.floor(interval) + t('common.time.daysAgo', '天前');
    }
    
    interval = seconds / 3600; // hours
    if (interval > 1) {
      return Math.floor(interval) + t('common.time.hoursAgo', '小时前');
    }
    
    interval = seconds / 60; // minutes
    if (interval > 1) {
      return Math.floor(interval) + t('common.time.minutesAgo', '分钟前');
    }
    
    return Math.floor(seconds) + t('common.time.secondsAgo', '秒前');
  };
  
  // 格式化内存/磁盘大小
  const formatSize = (sizeInMB?: number) => {
    if (!sizeInMB) return t('common.unknown', '未知');
    
    if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(0)} MB`;
    } else {
      const sizeInGB = sizeInMB / 1024;
      return `${sizeInGB.toFixed(1)} GB`;
    }
  };
  
  // 组件挂载时加载数据
  useEffect(() => {
    fetchData();
  }, [agentId]);
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }
  
  if (!agent) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#f76363" />
        <Text style={styles.errorText}>
          {t('agents.notFound', '找不到客户端信息')}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>{t('common.goBack', '返回')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 头部信息 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(agent.status) }]} />
          <View>
            <Text style={styles.title}>{agent.name}</Text>
            <Text style={styles.hostname}>{agent.hostname}</Text>
          </View>
        </View>
        <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(agent.status) }]}>
          {getStatusText(agent.status)}
        </Text>
      </View>
      
      {/* 基本信息卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('agents.basicInfo', '基本信息')}</Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('agents.hostname', '主机名')}:</Text>
          <Text style={styles.detailValue}>{agent.hostname}</Text>
        </View>
        {agent.ip_address && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('agents.ipAddress', 'IP地址')}:</Text>
            <Text style={styles.detailValue}>{agent.ip_address}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('agents.os', '操作系统')}:</Text>
          <Text style={styles.detailValue}>{agent.operating_system || t('common.unknown', '未知')}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('agents.version', '版本')}:</Text>
          <Text style={styles.detailValue}>{agent.version || t('common.unknown', '未知')}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('agents.lastSeen', '最后在线')}:</Text>
          <Text style={styles.detailValue}>{timeSince(agent.last_seen)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{t('agents.created', '安装时间')}:</Text>
          <Text style={styles.detailValue}>{formatDate(agent.created_at)}</Text>
        </View>
      </View>
      
      {/* 资源使用情况 */}
      {agent.status === 'active' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('agents.resources', '资源使用情况')}</Text>
          
          <View style={styles.resourceItem}>
            <View style={styles.resourceHeader}>
              <Text style={styles.resourceLabel}>CPU</Text>
              <Text style={[
                styles.resourceValue, 
                { color: getResourceColor(agent.cpu_usage || 0) }
              ]}>
                {agent.cpu_usage?.toFixed(1) || 0}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${agent.cpu_usage || 0}%`,
                    backgroundColor: getResourceColor(agent.cpu_usage || 0)
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.resourceItem}>
            <View style={styles.resourceHeader}>
              <Text style={styles.resourceLabel}>{t('agents.memory', '内存')}</Text>
              <Text style={[
                styles.resourceValue, 
                { color: getResourceColor(agent.memory_usage || 0) }
              ]}>
                {formatSize(agent.memory_used)} / {formatSize(agent.memory_total)} ({agent.memory_usage?.toFixed(1) || 0}%)
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${agent.memory_usage || 0}%`,
                    backgroundColor: getResourceColor(agent.memory_usage || 0)
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.resourceItem}>
            <View style={styles.resourceHeader}>
              <Text style={styles.resourceLabel}>{t('agents.disk', '磁盘')}</Text>
              <Text style={[
                styles.resourceValue, 
                { color: getResourceColor(agent.disk_usage || 0) }
              ]}>
                {formatSize(agent.disk_used)} / {formatSize(agent.disk_total)} ({agent.disk_usage?.toFixed(1) || 0}%)
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${agent.disk_usage || 0}%`,
                    backgroundColor: getResourceColor(agent.disk_usage || 0)
                  }
                ]} 
              />
            </View>
          </View>
          
          {agent.network_rx !== undefined && agent.network_tx !== undefined && (
            <View style={styles.networkContainer}>
              <View style={styles.networkItem}>
                <Ionicons name="arrow-down-outline" size={16} color="#30c85e" />
                <Text style={styles.networkLabel}>{t('agents.networkRx', '下载')}</Text>
                <Text style={styles.networkValue}>{agent.network_rx.toFixed(1)} MB/s</Text>
              </View>
              <View style={styles.networkItem}>
                <Ionicons name="arrow-up-outline" size={16} color="#0066cc" />
                <Text style={styles.networkLabel}>{t('agents.networkTx', '上传')}</Text>
                <Text style={styles.networkValue}>{agent.network_tx.toFixed(1)} MB/s</Text>
              </View>
            </View>
          )}
        </View>
      )}
      
      {/* 操作按钮 */}
      <View style={styles.actionsCard}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            {t('common.delete', '删除')}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
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
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  hostname: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  resourceItem: {
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resourceLabel: {
    fontSize: 14,
    color: '#666',
  },
  resourceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  networkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    marginRight: 8,
  },
  networkValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
  dangerButton: {
    backgroundColor: '#f76363',
  },
});

export default AgentDetailScreen; 