import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Table, Badge, Card, IconButton, Grid, Tabs } from '@radix-ui/themes';
import { PlusIcon, Pencil1Icon, TrashIcon, CheckCircledIcon, CrossCircledIcon, QuestionMarkCircledIcon, LayoutIcon, ViewGridIcon, ReloadIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { getAllMonitors, deleteMonitor, Monitor, MonitorStatusHistory } from '../../api/monitors';
import HeartbeatGrid from '../../components/HeartbeatGrid';
import MonitorCard from '../../components/MonitorCard';

const MonitorsList = () => {
  const navigate = useNavigate();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('grid');

  // 获取监控数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getAllMonitors();
      
      if (response.success && response.monitors) {
        setMonitors(response.monitors);
      } else {
        setError(response.message || '获取监控数据失败');
      }
    } catch (err) {
      console.error('获取监控数据错误:', err);
      setError('获取监控数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // 设置定时器，每分钟刷新一次数据
    const intervalId = setInterval(() => {
      console.log('MonitorsList: 自动刷新数据...');
      fetchData();
    }, 60000); // 60000ms = 1分钟
    
    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, []);

  // 处理刷新
  const handleRefresh = () => {
    fetchData();
  };

  // 处理删除
  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除此监控吗？')) return;
    
    try {
      const response = await deleteMonitor(id);
      
      if (response.success) {
        // 更新列表，移除已删除的监控
        setMonitors(monitors.filter(monitor => monitor.id !== id));
      } else {
        alert(response.message || '删除监控失败');
      }
    } catch (err) {
      console.error('删除监控错误:', err);
      alert('删除监控失败');
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
      <Box className="page-container detail-page">
        <Flex justify="center" align="center" p="4">
          <Text>加载中...</Text>
        </Flex>
      </Box>
    );
  }

  // 错误显示
  if (error) {
    return (
      <Box className="page-container detail-page">
        <Card mb="4">
          <Flex p="3" style={{ backgroundColor: 'var(--red-3)' }}>
            <Text style={{ color: 'var(--red-9)' }}>{error}</Text>
          </Flex>
        </Card>
        <Button variant="soft" onClick={() => window.location.reload()} mt="2">
          重试
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <div className="page-container detail-page">
        <Flex justify="between" align="center" className="detail-header">
          <Heading size="6">API监控</Heading>
          <Flex gap="3">
            <Tabs.Root defaultValue="grid">
              <Tabs.List>
                <Tabs.Trigger value="grid" onClick={() => setView('grid')}>
                  <ViewGridIcon />
                </Tabs.Trigger>
                <Tabs.Trigger value="list" onClick={() => setView('list')}>
                  <LayoutIcon />
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
            <Button onClick={handleRefresh} disabled={loading}>
              <ReloadIcon />
              刷新
            </Button>
            <Button onClick={() => navigate('/monitors/create')}>
              <PlusIcon />
              添加监控
            </Button>
          </Flex>
        </Flex>

        <div className="detail-content">
          {monitors.length === 0 ? (
            <Card>
              <Flex direction="column" align="center" justify="center" p="6" gap="3">
                <Text>没有找到监控</Text>
                <Button onClick={() => navigate('/monitors/create')}>
                  <PlusIcon />
                  添加监控
                </Button>
              </Flex>
            </Card>
          ) : view === 'list' ? (
            // 列表视图
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>名称</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>状态</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>响应时间</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>可用率</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>操作</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {monitors.map(monitor => (
                  <Table.Row key={monitor.id}>
                    <Table.Cell>
                      <Text weight="medium">{monitor.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text style={{ wordBreak: 'break-all' }}>{monitor.url}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <StatusIcon status={monitor.status} />
                        <Badge color={statusColors[monitor.status]}>
                          {monitor.status === 'up' ? '正常' : monitor.status === 'down' ? '故障' : '等待检查'}
                        </Badge>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{monitor.response_time}ms</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{monitor.uptime}%</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <IconButton variant="soft" onClick={() => navigate(`/monitors/${monitor.id}`)} title="查看详情">
                          <InfoCircledIcon />
                        </IconButton>
                        <IconButton variant="soft" onClick={() => navigate(`/monitors/edit/${monitor.id}`)} title="编辑监控">
                          <Pencil1Icon />
                        </IconButton>
                        <IconButton variant="soft" color="red" onClick={() => handleDelete(monitor.id)} title="删除监控">
                          <TrashIcon />
                        </IconButton>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            // 网格视图 - 使用 MonitorCard 组件
            <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
              {monitors.map(monitor => (
                <Box key={monitor.id} style={{ position: 'relative' }}>
                  <MonitorCard monitor={monitor} />
                  <Flex 
                    style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '10px',
                      zIndex: 1
                    }} 
                    gap="2"
                  >
                    <IconButton variant="ghost" size="1" onClick={() => navigate(`/monitors/${monitor.id}`)} title="查看详情">
                      <InfoCircledIcon />
                    </IconButton>
                    <IconButton variant="ghost" size="1" onClick={() => navigate(`/monitors/edit/${monitor.id}`)} title="编辑监控">
                      <Pencil1Icon />
                    </IconButton>
                    <IconButton variant="ghost" size="1" color="red" onClick={() => handleDelete(monitor.id)} title="删除监控">
                      <TrashIcon />
                    </IconButton>
                  </Flex>
                </Box>
              ))}
            </Grid>
          )}
        </div>
      </div>
    </Box>
  );
};

export default MonitorsList; 