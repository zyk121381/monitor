import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Card, Badge, Tabs, Grid, TextArea, Avatar } from '@radix-ui/themes';
import { ArrowLeftIcon, CheckIcon, Cross2Icon, ReloadIcon, ClockIcon, InfoCircledIcon, PersonIcon } from '@radix-ui/react-icons';

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

// 模拟事件时间线数据
const mockTimeline = [
  {
    id: '1',
    eventId: '1',
    type: 'created',
    timestamp: '2023-10-15T14:30:00Z',
    user: '系统',
    message: '事件已创建'
  },
  {
    id: '2',
    eventId: '2',
    type: 'created',
    timestamp: '2023-10-15T13:45:00Z',
    user: '系统',
    message: '事件已创建'
  },
  {
    id: '3',
    eventId: '2',
    type: 'assigned',
    timestamp: '2023-10-15T13:50:00Z',
    user: '管理员',
    message: '事件已分配给张三'
  },
  {
    id: '4',
    eventId: '3',
    type: 'created',
    timestamp: '2023-10-15T12:20:00Z',
    user: '系统',
    message: '事件已创建'
  },
  {
    id: '5',
    eventId: '4',
    type: 'created',
    timestamp: '2023-10-14T09:15:00Z',
    user: '系统',
    message: '事件已创建'
  },
  {
    id: '6',
    eventId: '4',
    type: 'assigned',
    timestamp: '2023-10-14T09:30:00Z',
    user: '管理员',
    message: '事件已分配给李四'
  },
  {
    id: '7',
    eventId: '4',
    type: 'resolved',
    timestamp: '2023-10-14T10:30:00Z',
    user: '李四',
    message: '事件已解决：重启了客户端服务'
  },
  {
    id: '8',
    eventId: '5',
    type: 'created',
    timestamp: '2023-10-13T16:40:00Z',
    user: '系统',
    message: '事件已创建'
  },
  {
    id: '9',
    eventId: '5',
    type: 'assigned',
    timestamp: '2023-10-13T16:45:00Z',
    user: '管理员',
    message: '事件已分配给王五'
  },
  {
    id: '10',
    eventId: '5',
    type: 'resolved',
    timestamp: '2023-10-13T17:30:00Z',
    user: '王五',
    message: '事件已解决：增加了服务实例数量'
  },
  {
    id: '11',
    eventId: '6',
    type: 'created',
    timestamp: '2023-10-15T11:10:00Z',
    user: '系统',
    message: '事件已创建'
  }
];

const EventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [timeline, setTimeline] = useState<typeof mockTimeline>([]);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    // 模拟API调用获取事件详情
    const fetchEventDetail = () => {
      setLoading(true);
      // 模拟网络延迟
      setTimeout(() => {
        const foundEvent = mockEvents.find(e => e.id === id);
        setEvent(foundEvent || null);
        
        if (foundEvent) {
          const eventTimeline = mockTimeline.filter(t => t.eventId === foundEvent.id);
          setTimeline(eventTimeline);
        }
        
        setLoading(false);
      }, 800);
    };

    fetchEventDetail();
  }, [id]);

  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新
    setTimeout(() => {
      const foundEvent = mockEvents.find(e => e.id === id);
      setEvent(foundEvent || null);
      
      if (foundEvent) {
        const eventTimeline = mockTimeline.filter(t => t.eventId === foundEvent.id);
        setTimeline(eventTimeline);
      }
      
      setLoading(false);
    }, 800);
  };

  const handleResolve = () => {
    if (!event || !resolution.trim()) return;
    
    setResolving(true);
    
    // 模拟API调用
    setTimeout(() => {
      const updatedEvent = {
        ...event,
        status: 'resolved',
        updatedAt: new Date().toISOString(),
        resolvedBy: '当前用户',
        resolution: resolution
      };
      
      setEvent(updatedEvent);
      
      // 添加新的时间线项
      const newTimelineItem = {
        id: String(Date.now()),
        eventId: event.id,
        type: 'resolved',
        timestamp: new Date().toISOString(),
        user: '当前用户',
        message: `事件已解决：${resolution}`
      };
      
      setTimeline([...timeline, newTimelineItem]);
      setResolving(false);
      setResolution('');
    }, 800);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <InfoCircledIcon />;
      case 'assigned':
        return <PersonIcon />;
      case 'resolved':
        return <CheckIcon />;
      default:
        return <InfoCircledIcon />;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'blue';
      case 'assigned':
        return 'orange';
      case 'resolved':
        return 'green';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box>
        <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
          <Text>加载事件详情中...</Text>
        </Flex>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box>
        <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
          <Card>
            <Flex direction="column" align="center" gap="4" p="4">
              <Heading size="6">事件未找到</Heading>
              <Text>找不到ID为 {id} 的事件</Text>
              <Button onClick={() => navigate('/events')}>返回事件列表</Button>
            </Flex>
          </Card>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Flex align="center" gap="2">
          <Button variant="soft" size="1" onClick={() => navigate('/events')}>
            <ArrowLeftIcon />
          </Button>
          <Heading size="6">事件详情</Heading>
          <Badge color={severityColors[event.severity]}>
            {event.severity === 'critical' && '严重'}
            {event.severity === 'high' && '高'}
            {event.severity === 'medium' && '中'}
            {event.severity === 'low' && '低'}
            {event.severity === 'info' && '信息'}
          </Badge>
          <Badge color={event.status === 'active' ? 'red' : 'green'}>
            {event.status === 'active' ? '活跃' : '已解决'}
          </Badge>
        </Flex>
        <Flex gap="2">
          <Button variant="soft" onClick={handleRefresh} disabled={loading}>
            <ReloadIcon />
            刷新
          </Button>
          {event.status === 'active' && (
            <Button variant="soft" color="green" onClick={() => {
              const resolutionText = prompt('请输入解决方案');
              if (resolutionText) {
                setResolution(resolutionText);
                handleResolve();
              }
            }}>
              <CheckIcon />
              标记为已解决
            </Button>
          )}
        </Flex>
      </Flex>

      <Card mb="4">
        <Heading size="5" mb="2">{event.title}</Heading>
        <Text as="div" mb="4">{event.description}</Text>

        <Grid columns={{ initial: '1', md: '2' }} gap="4">
          <Flex align="center" gap="2">
            <InfoCircledIcon />
            <Text as="div" size="2" weight="bold">来源:</Text>
            <Text as="div" size="2">
              {event.sourceName} ({event.source === 'monitor' ? '监控' : '客户端'})
            </Text>
          </Flex>
          
          <Flex align="center" gap="2">
            <ClockIcon />
            <Text as="div" size="2" weight="bold">创建时间:</Text>
            <Text as="div" size="2">{formatDate(event.createdAt)}</Text>
          </Flex>
          
          <Flex align="center" gap="2">
            <ClockIcon />
            <Text as="div" size="2" weight="bold">更新时间:</Text>
            <Text as="div" size="2">{formatDate(event.updatedAt)}</Text>
          </Flex>
          
          <Flex align="center" gap="2">
            <PersonIcon />
            <Text as="div" size="2" weight="bold">分配给:</Text>
            <Text as="div" size="2">{event.assignedTo || '未分配'}</Text>
          </Flex>
          
          {event.status === 'resolved' && (
            <>
              <Flex align="center" gap="2">
                <PersonIcon />
                <Text as="div" size="2" weight="bold">解决者:</Text>
                <Text as="div" size="2">{event.resolvedBy}</Text>
              </Flex>
              
              <Flex align="center" gap="2">
                <CheckIcon />
                <Text as="div" size="2" weight="bold">解决方案:</Text>
                <Text as="div" size="2">{event.resolution}</Text>
              </Flex>
            </>
          )}
        </Grid>
      </Card>

      <Tabs.Root defaultValue="timeline">
        <Tabs.List>
          <Tabs.Trigger value="timeline">时间线</Tabs.Trigger>
          {event.status === 'active' && <Tabs.Trigger value="resolve">解决事件</Tabs.Trigger>}
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="timeline">
            <Card>
              <Heading size="4" mb="4">事件时间线</Heading>
              {timeline.length === 0 ? (
                <Flex justify="center" p="4">
                  <Text color="gray">没有时间线记录</Text>
                </Flex>
              ) : (
                <Flex direction="column" gap="3">
                  {timeline.map((item, index) => (
                    <Card key={item.id} variant="surface">
                      <Flex gap="3">
                        <Box style={{ color: `var(--${getTimelineColor(item.type)}-9)` }}>
                          {getTimelineIcon(item.type)}
                        </Box>
                        <Box style={{ flex: 1 }}>
                          <Flex justify="between" align="center" mb="1">
                            <Text size="2" weight="bold">{item.user}</Text>
                            <Text size="1" color="gray">{formatDate(item.timestamp)}</Text>
                          </Flex>
                          <Text size="2">{item.message}</Text>
                        </Box>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              )}
            </Card>
          </Tabs.Content>

          {event.status === 'active' && (
            <Tabs.Content value="resolve">
              <Card>
                <Heading size="4" mb="4">解决事件</Heading>
                <Box mb="4">
                  <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                    解决方案 *
                  </Text>
                  <TextArea
                    placeholder="请输入解决方案..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    style={{ minHeight: '100px' }}
                  />
                </Box>
                <Flex justify="end">
                  <Button 
                    onClick={handleResolve} 
                    disabled={resolving || !resolution.trim()}
                  >
                    {resolving ? '处理中...' : '标记为已解决'}
                    {!resolving && <CheckIcon />}
                  </Button>
                </Flex>
              </Card>
            </Tabs.Content>
          )}
        </Box>
      </Tabs.Root>
    </Box>
  );
};

export default EventDetail; 