import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Card, Grid, Badge, Tabs, Table } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, ArrowLeftIcon, Pencil1Icon, TrashIcon, ReloadIcon, QuestionMarkCircledIcon, Cross2Icon } from '@radix-ui/react-icons';
import * as Toast from '@radix-ui/react-toast';
import { getMonitor, deleteMonitor, checkMonitor, Monitor, MonitorStatusHistory } from '../../api/monitors';
import { useTranslation } from 'react-i18next';

// 将范围状态码转换为可读形式（2 -> 2xx, 3 -> 3xx 等）
const formatStatusCode = (code: number): string => {
  // 对于2、3、4、5这些值，显示为2xx、3xx等
  if (code >= 2 && code <= 5) {
    return `${code}xx`;
  }
  // 其他正常显示数字
  return code.toString();
};

// 状态条组件 - 时间轴格子展示
const StatusBar = ({ status, history = [] }: { status: string, uptime: number, history?: MonitorStatusHistory[] }) => {
  const { t } = useTranslation();
  
  // 根据状态确定颜色
  const getColor = (itemStatus: string) => {
    switch (itemStatus) {
      case 'up':
        return 'var(--green-5)';
      case 'down':
        return 'var(--red-5)';
      default:
        return 'var(--gray-5)';
    }
  };

  // 根据状态确定悬停颜色
  const getHoverColor = (itemStatus: string) => {
    switch (itemStatus) {
      case 'up':
        return 'var(--green-6)';
      case 'down':
        return 'var(--red-6)';
      default:
        return 'var(--gray-6)';
    }
  };

  // 最多显示40个时间点
  const maxPoints = 40;
  
  // 获取最近的历史记录
  let displayHistory = history.slice(-maxPoints);
  
  // 如果历史记录为空，创建一个初始状态记录
  if (displayHistory.length === 0) {
    displayHistory = [{
      id: 0,
      monitor_id: 0,
      status: status,
      timestamp: new Date().toISOString()
    }];
  }
  
  // 计算每个格子的宽度
  const boxWidth = `${100 / maxPoints}%`;
  
  return (
    <Flex gap="1" style={{ width: '100%' }}>
      {displayHistory.map((item, index) => (
        <Box
          key={item.id || `empty-${index}`}
          style={{
            width: boxWidth,
            height: '20px',
            backgroundColor: getColor(item.status),
            borderRadius: '2px',
            transition: 'background-color 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = getHoverColor(item.status);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = getColor(item.status);
          }}
          title={`${t('common.status')}: ${item.status === 'up' ? t('monitor.status.normal') : item.status === 'down' ? t('monitor.status.failure') : t('monitor.status.pending')}\n${t('monitor.history.time')}: ${new Date(item.timestamp).toLocaleString()}`}
        />
      ))}
    </Flex>
  );
};

const MonitorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const { t } = useTranslation();

  // 获取监控详情数据
  const fetchMonitorData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await getMonitor(parseInt(id));
      
      if (response.success && response.monitor) {
        setMonitor(response.monitor);
      } else {
        setError(response.message || t('common.error.fetch'));
      }
    } catch (err) {
      console.error(t('common.error.fetch'), err);
      setError(t('common.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchMonitorData();
    
    // 设置定时器，每分钟刷新一次数据
    const intervalId = setInterval(() => {
      console.log('MonitorDetail: 自动刷新数据...');
      fetchMonitorData();
    }, 60000); // 60000ms = 1分钟
    
    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, [id]);

  // 手动检查监控状态
  const handleCheck = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await checkMonitor(parseInt(id));
      
      if (response.success) {
        // 重新获取监控数据以显示最新状态
        await fetchMonitorData();
        setToastMessage(t('monitor.checkCompleted'));
        setToastType('success');
        setToastOpen(true);
      } else {
        setToastMessage(response.message || t('monitor.checkFailed'));
        setToastType('error');
        setToastOpen(true);
      }
    } catch (err) {
      console.error(t('monitor.checkFailed'), err);
      setToastMessage(t('monitor.checkFailed'));
      setToastType('error');
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 删除监控
  const handleDelete = async () => {
    if (!id || !window.confirm(t('monitors.delete.confirm'))) return;
    
    try {
      const response = await deleteMonitor(parseInt(id));
      
      if (response.success) {
        setToastMessage(t('monitor.deleteSuccess'));
        setToastType('success');
        setToastOpen(true);
        
        // 短暂延迟后导航，让用户有时间看到提示
        setTimeout(() => {
          navigate('/monitors');
        }, 1500);
      } else {
        setToastMessage(response.message || t('monitor.deleteFailed'));
        setToastType('error');
        setToastOpen(true);
      }
    } catch (err) {
      console.error(t('monitor.deleteFailed'), err);
      setToastMessage(t('monitor.deleteFailed'));
      setToastType('error');
      setToastOpen(true);
    }
  };

  // 状态图标
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'up':
        return <CheckCircledIcon style={{ color: 'var(--green-9)' }} />;
      case 'down':
        return <CrossCircledIcon style={{ color: 'var(--red-9)' }} />;
      default:
        return <QuestionMarkCircledIcon style={{ color: 'var(--gray-9)' }} />;
    }
  };

  // 状态颜色映射
  const statusColors: { [key: string]: 'green' | 'red' | 'gray' } = {
    'up': 'green',
    'down': 'red',
    'pending': 'gray'
  };

  // 加载中显示
  if (loading) {
    return (
      <Box className="monitor-detail" p="4">
        <Text>{t('common.loading')}</Text>
      </Box>
    );
  }

  // 错误显示
  if (error || !monitor) {
    return (
      <Box className="monitor-detail" p="4">
        <Text style={{ color: 'var(--red-9)' }}>{error || t('monitor.notExist')}</Text>
        <Button variant="soft" onClick={() => navigate('/monitors')} mt="2">
          {t('monitor.returnToList')}
        </Button>
      </Box>
    );
  }

  return (
    <Box className="monitor-detail" p="4">
      <div>
        <Flex justify="between" align="center" className="detail-header">
          <Flex align="center" gap="2">
            <Button variant="soft" size="1" onClick={() => navigate('/monitors')}>
              <ArrowLeftIcon />
            </Button>
            <Heading size="6">{monitor.name}</Heading>
            <Badge color={statusColors[monitor.status]}>
              {monitor.status === 'up' ? t('monitor.status.normal') : monitor.status === 'down' ? t('monitor.status.failure') : t('monitor.status.pending')}
            </Badge>
          </Flex>
          <Flex gap="2">
            <Button variant="soft" onClick={handleCheck}>
              <ReloadIcon />
              {t('monitor.manualCheck')}
            </Button>
            <Button variant="soft" onClick={() => navigate(`/monitors/edit/${id}`)}>
              <Pencil1Icon />
              {t('monitor.edit')}
            </Button>
            <Button variant="soft" color="red" onClick={handleDelete}>
              <TrashIcon />
              {t('monitor.delete')}
            </Button>
          </Flex>
        </Flex>

        <Tabs.Root defaultValue="overview">
          <Tabs.List>
            <Tabs.Trigger value="overview">{t('monitor.tabs.overview')}</Tabs.Trigger>
            <Tabs.Trigger value="history">{t('monitor.tabs.history')}</Tabs.Trigger>
            <Tabs.Trigger value="settings">{t('monitor.tabs.settings')}</Tabs.Trigger>
          </Tabs.List>

          <Box pt="4" className="detail-content">
            <Tabs.Content value="overview">
              <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Card>
                  <Flex direction="column" gap="3">
                    <Heading size="4">{t('monitor.status.info')}</Heading>
                    <Grid columns="2" gap="3">
                      <Text>{t('common.status')}:</Text>
                      <Flex align="center" gap="1">
                        <StatusIcon status={monitor.status} />
                        <Text>{monitor.status === 'up' ? t('monitor.status.normal') : monitor.status === 'down' ? t('monitor.status.failure') : t('monitor.status.pending')}</Text>
                      </Flex>
                      <Text>{t('monitor.uptime')}:</Text>
                      <Box style={{ gridColumn: "2" }}>
                        <StatusBar status={monitor.status} uptime={monitor.uptime} history={monitor.history} />
                      </Box>
                      <Text>{t('monitor.responseTime')}:</Text>
                      <Text>{monitor.response_time}ms</Text>
                      <Text>{t('monitor.lastCheck')}:</Text>
                      <Text>{monitor.last_checked || t('monitor.notChecked')}</Text>
                    </Grid>
                  </Flex>
                </Card>

                <Card>
                  <Flex direction="column" gap="3">
                    <Heading size="4">{t('monitor.basicInfo')}</Heading>
                    <Grid columns="2" gap="3">
                      <Text>URL:</Text>
                      <Text>{monitor.url}</Text>
                      <Text>{t('monitor.method')}:</Text>
                      <Text>{monitor.method}</Text>
                      <Text>{t('monitor.interval')}:</Text>
                      <Text>{monitor.interval} {t('common.seconds')}</Text>
                      <Text>{t('monitor.timeout')}:</Text>
                      <Text>{monitor.timeout} {t('common.seconds')}</Text>
                      <Text>{t('monitor.expectedStatus')}:</Text>
                      <Text>{formatStatusCode(monitor.expected_status)}</Text>
                      <Text>{t('monitor.createTime')}:</Text>
                      <Text>{new Date(monitor.created_at).toLocaleString()}</Text>
                    </Grid>
                  </Flex>
                </Card>
              </Grid>
            </Tabs.Content>

            <Tabs.Content value="history">
              <Card>
                <Heading size="4" mb="3">{t('monitor.checkHistory')}</Heading>
                {monitor.checks && monitor.checks.length > 0 ? (
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>{t('monitor.history.time')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('monitor.history.status')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('monitor.history.responseTime')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('monitor.history.statusCode')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('monitor.history.error')}</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {monitor.checks.map((check) => (
                        <Table.Row key={check.id}>
                          <Table.Cell>{new Date(check.checked_at).toLocaleString()}</Table.Cell>
                          <Table.Cell>
                            <Flex align="center" gap="1">
                              <StatusIcon status={check.status} />
                              <Badge color={statusColors[check.status]}>
                                {check.status === 'up' ? t('monitor.status.normal') : t('monitor.status.failure')}
                              </Badge>
                            </Flex>
                          </Table.Cell>
                          <Table.Cell>{check.response_time}ms</Table.Cell>
                          <Table.Cell>{check.status_code}</Table.Cell>
                          <Table.Cell>{check.error || '-'}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                ) : (
                  <Text>{t('monitor.noCheckHistory')}</Text>
                )}
              </Card>
            </Tabs.Content>

            <Tabs.Content value="settings">
              <Card>
                <Heading size="4" mb="3">{t('monitor.configDetails')}</Heading>
                <Grid columns="2" gap="3">
                  <Text>{t('common.name')}:</Text>
                  <Text>{monitor.name}</Text>
                  <Text>URL:</Text>
                  <Text>{monitor.url}</Text>
                  <Text>{t('monitor.method')}:</Text>
                  <Text>{monitor.method}</Text>
                  <Text>{t('monitor.interval')}:</Text>
                  <Text>{monitor.interval} {t('common.seconds')}</Text>
                  <Text>{t('monitor.timeout')}:</Text>
                  <Text>{monitor.timeout} {t('common.seconds')}</Text>
                  <Text>{t('monitor.expectedStatus')}:</Text>
                  <Text>{formatStatusCode(monitor.expected_status)}</Text>
                  <Text>{t('monitor.headers')}:</Text>
                  <Text style={{ overflowWrap: 'break-word' }}>
                    {typeof monitor.headers === 'string' ? monitor.headers : JSON.stringify(monitor.headers)}
                  </Text>
                  <Text>{t('monitor.body')}:</Text>
                  <Text style={{ overflowWrap: 'break-word' }}>{monitor.body || '-'}</Text>
                  <Text>{t('common.status')}:</Text>
                  <Text>{monitor.active ? t('monitor.active') : t('monitor.inactive')}</Text>
                </Grid>
              </Card>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
        <Toast.Provider swipeDirection="right">
          <Toast.Root 
            className="ToastRoot" 
            open={toastOpen} 
            onOpenChange={setToastOpen}
            duration={3000}
            style={{ 
              backgroundColor: toastType === 'success' ? 'var(--green-9)' : 'var(--red-9)', 
              borderRadius: '8px',
              zIndex: 9999 
            }}
          >
            <Toast.Title className="ToastTitle">
              {toastType === 'success' ? t('common.success') : t('common.error')}
            </Toast.Title>
            <Toast.Description className="ToastDescription">
              {toastMessage}
            </Toast.Description>
            <Toast.Close className="ToastClose">
              <Cross2Icon />
            </Toast.Close>
          </Toast.Root>
          <Toast.Viewport className="ToastViewport" />
        </Toast.Provider>
      </div>
    </Box>
  );
};

export default MonitorDetail; 