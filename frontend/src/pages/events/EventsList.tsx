import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Card, Table, Badge, IconButton, Tooltip, Select, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon, Cross2Icon, InfoCircledIcon, ReloadIcon, BellIcon, CheckIcon } from '@radix-ui/react-icons';

// 定义事件严重性颜色映射
const severityColors: Record<string, "red" | "orange" | "yellow" | "blue" | "gray"> = {
  critical: "red",
  high: "orange",
  medium: "yellow",
  low: "blue",
  info: "gray"
};

// 定义事件类型接口
interface Event {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceId: string;
  sourceName: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
  resolvedBy?: string;
  resolution?: string;
}

// 模拟事件数据
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'API服务不可用',
    description: 'API服务连续3次检查失败，当前状态为不可用。',
    source: 'monitor',
    sourceId: '1',
    sourceName: 'API服务',
    severity: 'critical',
    status: 'active',
    createdAt: '2023-10-15T14:30:00Z',
    updatedAt: '2023-10-15T14:30:00Z',
    assignedTo: null
  },
  {
    id: '2',
    title: '数据库服务响应缓慢',
    description: '数据库服务响应时间超过阈值（500ms），当前响应时间为780ms。',
    source: 'monitor',
    sourceId: '3',
    sourceName: '数据库服务',
    severity: 'high',
    status: 'active',
    createdAt: '2023-10-15T13:45:00Z',
    updatedAt: '2023-10-15T13:45:00Z',
    assignedTo: '张三'
  },
  {
    id: '3',
    title: '生产服务器CPU使用率高',
    description: '生产服务器CPU使用率超过90%，当前为92%。',
    source: 'agent',
    sourceId: '1',
    sourceName: '生产服务器客户端',
    severity: 'medium',
    status: 'active',
    createdAt: '2023-10-15T12:20:00Z',
    updatedAt: '2023-10-15T12:20:00Z',
    assignedTo: null
  },
  {
    id: '4',
    title: '测试服务器客户端离线',
    description: '测试服务器客户端已离线超过30分钟。',
    source: 'agent',
    sourceId: '2',
    sourceName: '测试服务器客户端',
    severity: 'medium',
    status: 'resolved',
    createdAt: '2023-10-14T09:15:00Z',
    updatedAt: '2023-10-14T10:30:00Z',
    assignedTo: '李四',
    resolvedBy: '李四',
    resolution: '重启了客户端服务'
  },
  {
    id: '5',
    title: '用户服务性能下降',
    description: '用户服务响应时间增加了50%，从200ms增加到300ms。',
    source: 'monitor',
    sourceId: '2',
    sourceName: '用户服务',
    severity: 'low',
    status: 'resolved',
    createdAt: '2023-10-13T16:40:00Z',
    updatedAt: '2023-10-13T17:30:00Z',
    assignedTo: '王五',
    resolvedBy: '王五',
    resolution: '增加了服务实例数量'
  },
  {
    id: '6',
    title: '备份服务器磁盘空间不足',
    description: '备份服务器磁盘使用率达到85%，接近警告阈值。',
    source: 'agent',
    sourceId: '4',
    sourceName: '备份服务器客户端',
    severity: 'info',
    status: 'active',
    createdAt: '2023-10-15T11:10:00Z',
    updatedAt: '2023-10-15T11:10:00Z',
    assignedTo: null
  }
];

const EventsList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    source: 'all',
    search: ''
  });

  useEffect(() => {
    // 模拟API调用获取事件列表
    const fetchEvents = () => {
      setLoading(true);
      // 模拟网络延迟
      setTimeout(() => {
        let filteredEvents = [...mockEvents];
        
        // 应用过滤器
        if (filters.status !== 'all') {
          filteredEvents = filteredEvents.filter(event => event.status === filters.status);
        }
        
        if (filters.severity !== 'all') {
          filteredEvents = filteredEvents.filter(event => event.severity === filters.severity);
        }
        
        if (filters.source !== 'all') {
          filteredEvents = filteredEvents.filter(event => event.source === filters.source);
        }
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchLower) || 
            event.description.toLowerCase().includes(searchLower) ||
            event.sourceName.toLowerCase().includes(searchLower)
          );
        }
        
        setEvents(filteredEvents);
        setLoading(false);
      }, 500);
    };

    fetchEvents();
  }, [filters]);

  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新
    setTimeout(() => {
      let filteredEvents = [...mockEvents];
      
      // 应用过滤器
      if (filters.status !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.status === filters.status);
      }
      
      if (filters.severity !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.severity === filters.severity);
      }
      
      if (filters.source !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.source === filters.source);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(searchLower) || 
          event.description.toLowerCase().includes(searchLower) ||
          event.sourceName.toLowerCase().includes(searchLower)
        );
      }
      
      setEvents(filteredEvents);
      setLoading(false);
    }, 500);
  };

  const handleResolve = (eventId: string) => {
    // 模拟解决事件
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          status: 'resolved',
          updatedAt: new Date().toISOString(),
          resolvedBy: '当前用户',
          resolution: '手动标记为已解决'
        };
      }
      return event;
    });
    
    setEvents(updatedEvents);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Heading size="6">事件与告警</Heading>
        <Flex gap="2">
          <Button onClick={handleRefresh} disabled={loading}>
            {loading ? '加载中...' : '刷新'}
            <ReloadIcon />
          </Button>
        </Flex>
      </Flex>

      <Card mb="4">
        <Flex gap="4" wrap={{ initial: 'wrap', md: 'nowrap' }}>
          <Box style={{ flex: 1, minWidth: '120px' }}>
            <Text as="div" size="2" mb="1" weight="bold">状态</Text>
            <Select.Root 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">全部</Select.Item>
                <Select.Item value="active">活跃</Select.Item>
                <Select.Item value="resolved">已解决</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
          
          <Box style={{ flex: 1, minWidth: '120px' }}>
            <Text as="div" size="2" mb="1" weight="bold">严重性</Text>
            <Select.Root 
              value={filters.severity} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">全部</Select.Item>
                <Select.Item value="critical">严重</Select.Item>
                <Select.Item value="high">高</Select.Item>
                <Select.Item value="medium">中</Select.Item>
                <Select.Item value="low">低</Select.Item>
                <Select.Item value="info">信息</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
          
          <Box style={{ flex: 1, minWidth: '120px' }}>
            <Text as="div" size="2" mb="1" weight="bold">来源</Text>
            <Select.Root 
              value={filters.source} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">全部</Select.Item>
                <Select.Item value="monitor">监控</Select.Item>
                <Select.Item value="agent">客户端</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
          
          <Box style={{ flex: 2 }}>
            <Text as="div" size="2" mb="1" weight="bold">搜索</Text>
            <TextField.Root
              placeholder="搜索事件..." 
              value={filters.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </Box>
        </Flex>
      </Card>

      <Card>
        {loading ? (
          <Flex justify="center" align="center" p="6">
            <Text>加载事件列表中...</Text>
          </Flex>
        ) : events.length === 0 ? (
          <Flex direction="column" align="center" justify="center" p="6" gap="4">
            <BellIcon width="32" height="32" color="var(--gray-8)" />
            <Text size="5">没有事件</Text>
            <Text color="gray">当前没有符合条件的事件</Text>
          </Flex>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>严重性</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>状态</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>标题</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>来源</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>创建时间</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>分配给</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>操作</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {events.map(event => (
                <Table.Row key={event.id}>
                  <Table.Cell>
                    <Badge color={severityColors[event.severity]}>
                      {event.severity === 'critical' && '严重'}
                      {event.severity === 'high' && '高'}
                      {event.severity === 'medium' && '中'}
                      {event.severity === 'low' && '低'}
                      {event.severity === 'info' && '信息'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={event.status === 'active' ? 'red' : 'green'}>
                      {event.status === 'active' ? '活跃' : '已解决'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text as="div" size="2" weight="bold">{event.title}</Text>
                    <Text as="div" size="1" color="gray" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.description}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex direction="column">
                      <Text as="div" size="2">{event.sourceName}</Text>
                      <Text as="div" size="1" color="gray">
                        {event.source === 'monitor' ? '监控' : '客户端'}
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>{formatDate(event.createdAt)}</Table.Cell>
                  <Table.Cell>
                    {event.assignedTo || <Text color="gray">未分配</Text>}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="1">
                      <Tooltip content="查看详情">
                        <IconButton 
                          size="1" 
                          variant="ghost" 
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          <InfoCircledIcon />
                        </IconButton>
                      </Tooltip>
                      {event.status === 'active' && (
                        <Tooltip content="标记为已解决">
                          <IconButton 
                            size="1" 
                            variant="ghost" 
                            color="green" 
                            onClick={() => handleResolve(event.id)}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip content="忽略事件">
                        <IconButton 
                          size="1" 
                          variant="ghost" 
                          color="gray" 
                        >
                          <Cross2Icon />
                        </IconButton>
                      </Tooltip>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Card>
    </Box>
  );
};

export default EventsList; 