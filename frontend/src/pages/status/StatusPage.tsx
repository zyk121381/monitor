import { useState, useEffect, useRef } from 'react';
import { Box, Flex, Heading, Text, Grid, Badge, Theme } from '@radix-ui/themes';
import { getStatusPageData } from '../../services/api/status';
import { StatusAgent } from '../../types/status';
import { Monitor } from '../../types/monitors';
import AgentCard from '../../components/AgentCard';
import MonitorCard from '../../components/MonitorCard';
import { useTranslation } from 'react-i18next';

const StatusPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<{monitors: Monitor[], agents: StatusAgent[]}>({
    monitors: [],
    agents: []
  });
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>(t('statusPage.title'));
  const [pageDescription, setPageDescription] = useState<string>(t('statusPage.allOperational'));
  const [error, setError] = useState<string | null>(null);
  const requestInProgressRef = useRef(false); // 新增：跟踪请求是否正在进行中
  const fetchControllerRef = useRef<AbortController | null>(null); // 新增：用于取消重复请求

  // 从API获取数据
  useEffect(() => {
    // 创建数据获取函数
    const fetchData = async () => {
      
      try {
        setLoading(true);
        console.log(t('statusPage.fetchingData'));
        const response = await getStatusPageData();
        console.log(t('statusPage.dataResponse'), response);
        
        if (response) {
          const statusData = response;
          console.log(t('statusPage.processingData'), statusData);
          
          // 设置页面标题和描述
          setPageTitle(statusData.title || t('statusPage.title'));
          setPageDescription(statusData.description || t('statusPage.allOperational'));
          
          // 处理agents数据，将cpu、memory、disk等字段转换为cpuUsage、memoryUsage、diskUsage格式
          const processedAgents = statusData.agents.map((agent: any) => {
            // 创建处理后的agent对象
            const processedAgent: any = { ...agent };
            
            // 将cpu、memory、disk属性值转换为cpuUsage、memoryUsage、diskUsage
            if (agent.cpu !== undefined) {
              processedAgent.cpuUsage = agent.cpu;
              delete processedAgent.cpu;
            }
            
            if (agent.memory !== undefined) {
              processedAgent.memoryUsage = agent.memory;
              delete processedAgent.memory;
            }
            
            if (agent.disk !== undefined) {
              processedAgent.diskUsage = agent.disk;
              delete processedAgent.disk;
            }
            
            return processedAgent;
          });
          
          setData({
            monitors: statusData.monitors || [],
            agents: processedAgents
          });
        } else {
          setError(t('statusPage.fetchError'));
        }
      } catch (err: any) {
        // 忽略被中止的请求错误
        if (err.name !== 'AbortError') {
          console.error(t('statusPage.fetchError'), err);
          setError(t('statusPage.fetchError'));
        }
      } finally {
        // 标记请求结束
        requestInProgressRef.current = false;
        fetchControllerRef.current = null;
        setLoading(false);
      }
    };
    
    // 执行初始数据获取
    fetchData();
    
    // 设置定时刷新，每分钟更新数据
    const intervalId = setInterval(() => {
      console.log(t('statusPage.autoRefresh'));
      fetchData();
    }, 60000); // 60000ms = 1分钟
    
    // 组件卸载时清除定时器和取消请求
    return () => {
      console.log(t('statusPage.componentUnmount'));
      clearInterval(intervalId);
      
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, [t]); // 依赖于 t 函数

  // 错误显示
  if (error) {
    return (
      <Theme appearance="light">
        <Box>
          <div className="page-container">
            <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
              <Text size="3" style={{ color: 'var(--red-9)' }}>{error}</Text>
            </Flex>
          </div>
        </Box>
      </Theme>
    );
  }

  if (loading) {
    return (
      <Theme appearance="light">
        <Box>
          <div className="page-container">
            <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
              <Text size="3">{t('common.loading')}</Text>
            </Flex>
          </div>
        </Box>
      </Theme>
    );
  }

  return (
    <Theme appearance="light">
      <Box>
        <div className="page-container">
          {/* 状态页标题区域 */}
          <Flex direction="column" align="center" justify="center" py="9" gap="5">
            <Heading size="9" align="center">{pageTitle}</Heading>
            <Text size="5" align="center" style={{ maxWidth: '800px' }}>
              {pageDescription}
            </Text>
            <Flex gap="2" mt="2">
              <Badge size="2">{t('statusPage.lastUpdated')}: {t('statusPage.justNow')}</Badge>
            </Flex>
          </Flex>
          
          {/* API服务状态 */}
          {data.monitors.length > 0 && (
            <Box py="6">
              <Heading size="5" mb="4">{t('statusPage.apiServices')}</Heading>
              <Grid columns={{ initial: '1' }} gap="4">
                {data.monitors.map(monitor => (
                  <MonitorCard key={monitor.id} monitor={monitor} />
                ))}
              </Grid>
            </Box>
          )}
          
          {/* 客户端监控状态 */}
          {data.agents.length > 0 && (
            <Box py="6">
              <Heading size="5" mb="4">{t('statusPage.agentStatus')}</Heading>
              <Grid columns={{ initial: '1'}} gap="4">
                {data.agents.map(agent => (
                  <Box key={agent.id} style={{ position: 'relative' }}>
                    <AgentCard agent={agent} showIpAddress={false} />
                  </Box>
                ))}
              </Grid>
            </Box>
          )}
        </div>
      </Box>
    </Theme>
  );
};

export default StatusPage; 