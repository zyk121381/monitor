import { Box, Card, Flex, Text, Badge } from '@radix-ui/themes';
import { GlobeIcon } from '@radix-ui/react-icons';
import { Agent } from '../api/agents';
import ClientResourceSection from './ClientResourceSection';
import '../styles/components.css';

// 格式化时间间隔为"几分钟前"、"几小时前"等
const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return `${diffDay}天前`;
  } else if (diffHour > 0) {
    return `${diffHour}小时前`;
  } else if (diffMin > 0) {
    return `${diffMin}分钟前`;
  } else {
    return '刚刚';
  }
};

interface AgentCardProps {
  agent: Agent;
}

/**
 * 客户端状态卡片组件
 * 用于显示单个客户端的状态和资源使用情况
 */
const AgentCard = ({ agent }: AgentCardProps) => {
  // 解析获取资源使用情况
  let cpuUsage = 0;
  let memoryUsage = 0;
  let diskUsage = 0;
  let networkRx = 0;
  let networkTx = 0;
  
  console.log('AgentCard接收到的客户端数据:', agent);
  
  try {
    // 直接从agent获取资源使用情况
    if (agent.cpu_usage !== null && agent.memory_total && agent.memory_used && agent.disk_total && agent.disk_used) {
      cpuUsage = Math.round(agent.cpu_usage);
      memoryUsage = Math.round((agent.memory_used / agent.memory_total) * 100);
      diskUsage = Math.round((agent.disk_used / agent.disk_total) * 100);
      
      // 传递原始网络流量数据 (KB/s)，由 ClientResourceSection 负责转换为 MB/s
      networkRx = agent.network_rx || 0;
      networkTx = agent.network_tx || 0;
      
      console.log('计算后的资源使用情况:', {
        cpuUsage,
        memoryUsage,
        diskUsage,
        networkRx,
        networkTx
      });
    } else {
      console.warn('客户端没有资源指标数据:', agent.id);
    }
  } catch (e) {
    console.error("解析客户端资源使用数据失败", e);
  }
  
  // 根据status属性判断状态
  const agentStatus = agent.status || 'inactive';
  
  // 状态颜色映射
  const statusColors: { [key: string]: string } = {
    'active': 'green',
    'inactive': 'amber',
    'connecting': 'yellow'
  };

  // 状态文本映射
  const statusText: { [key: string]: string } = {
    'active': '活跃',
    'inactive': '离线',
    'connecting': '连接中'
  };

  return (
    <Card className="agent-card">
      <Flex justify="between" align="center" p="4">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Box style={{ color: agentStatus === 'active' ? 'var(--green-9)' : 'var(--gray-9)' }}>
              <GlobeIcon width="16" height="16" />
            </Box>
            <Text weight="medium">{agent.name}</Text>
          </Flex>
        </Flex>
        <Badge color={statusColors[agentStatus] as any}>
          {statusText[agentStatus] || agentStatus}
        </Badge>
      </Flex>
      
      <Box p="4" pt="0">
        <ClientResourceSection 
          cpuUsage={cpuUsage}
          memoryUsage={memoryUsage}
          diskUsage={diskUsage}
          networkRx={networkRx}
          networkTx={networkTx}
        />
      </Box>
    </Card>
  );
};

export default AgentCard;
