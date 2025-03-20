import { Box, Card, Flex, Text, Badge } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { Monitor } from '../api/monitors';
import HeartbeatGrid from './HeartbeatGrid';
import '../styles/components.css';

interface MonitorCardProps {
  monitor: Monitor;
}

/**
 * API监控卡片组件
 * 用于显示单个API监控服务的状态信息
 */
const MonitorCard = ({ monitor }: MonitorCardProps) => {
  // 状态图标组件
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'up':
        return <CheckCircledIcon width="16" height="16" color="var(--green-9)" />;
      case 'down':
      default:
        return <CrossCircledIcon width="16" height="16" color="var(--red-9)" />;
    }
  };

  // 状态颜色映射
  const statusColors: { [key: string]: string } = {
    'up': 'green',
    'down': 'red'
  };

  // 状态文本映射
  const statusText: { [key: string]: string } = {
    'up': '正常',
    'down': '故障'
  };

  return (
    <Card className="monitor-card">
      <Flex justify="between" align="start" p="4" gap="2" direction="column">
        <Flex justify="between" align="center" style={{ width: '100%' }}>
          <Flex align="center" gap="2">
            <StatusIcon status={monitor.status} />
            <Text weight="medium">{monitor.name}</Text>
          </Flex>
          <Badge color={statusColors[monitor.status === 'up' ? 'up' : 'down'] as any}>
            {statusText[monitor.status === 'up' ? 'up' : 'down']}
          </Badge>
        </Flex>
        
        <Flex align="center" gap="2" style={{ width: '100%', minHeight: '8px' }}>
          <Text size="1" color="gray">
            响应时间: {monitor.response_time}ms
          </Text>
        </Flex>
          
        <Box pt="2" style={{ width: '100%' }}>
          <HeartbeatGrid 
            uptime={monitor.uptime} 
            history={monitor.history} 
          />
        </Box>
      </Flex>
    </Card>
  );
};

export default MonitorCard;
