import { Box, Flex, Text } from '@radix-ui/themes';
import ResourceBar from './ResourceBar';
import '../styles/components.css';

interface ClientResourceSectionProps {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkRx: number;
  networkTx: number;
}

/**
 * 客户端资源使用情况展示组件
 * 用于显示CPU、内存、磁盘和网络流量等资源使用情况
 */
const ClientResourceSection = ({
  cpuUsage = 0,
  memoryUsage = 0,
  diskUsage = 0,
  networkRx = 0,
  networkTx = 0
}: ClientResourceSectionProps) => {
  // 将 KB/s 转换为 MB/s
  const networkRxMB = networkRx / 1024;
  const networkTxMB = networkTx / 1024;
  
  return (
    <Box className="client-resource-section">
      <Flex direction="column" gap="3">
        {/* CPU使用率 */}
        <Box className="resource-item">
          <Flex justify="between" align="center" mb="1">
            <Flex align="center" gap="2">
              <Box className="resource-indicator resource-indicator-cpu" />
              <Text size="2" className="resource-label">CPU</Text>
            </Flex>
            <Text size="2" weight="medium">{cpuUsage.toFixed(1)}%</Text>
          </Flex>
          <ResourceBar value={cpuUsage} color="green" height={6} />
        </Box>
        
        {/* 内存使用率 */}
        <Box className="resource-item">
          <Flex justify="between" align="center" mb="1">
            <Flex align="center" gap="2">
              <Box className="resource-indicator resource-indicator-memory" />
              <Text size="2" className="resource-label">内存</Text>
            </Flex>
            <Text size="2" weight="medium">{memoryUsage.toFixed(1)}%</Text>
          </Flex>
          <ResourceBar value={memoryUsage} color="blue" height={6} />
        </Box>
        
        {/* 磁盘使用率 */}
        <Box className="resource-item">
          <Flex justify="between" align="center" mb="1">
            <Flex align="center" gap="2">
              <Box className="resource-indicator resource-indicator-disk" />
              <Text size="2" className="resource-label">磁盘</Text>
            </Flex>
            <Text size="2" weight="medium">{diskUsage.toFixed(1)}%</Text>
          </Flex>
          <ResourceBar value={diskUsage} color="amber" height={6} />
        </Box>
        
        {/* 网络流量 */}
        <Box className="resource-item">
          <Flex justify="between" align="center" mb="1">
            <Text size="2" className="resource-label">网络流量</Text>
          </Flex>
          <Flex gap="3" className="network-metrics">
            {/* 下载速率 */}
            <Box className="network-segment">
              <Flex justify="between" align="center" mb="1">
                <Flex align="center" gap="2">
                  <Box className="resource-indicator resource-indicator-download" />
                  <Text size="2" className="resource-label">下载</Text>
                </Flex>
                <Text size="2" weight="medium">{networkRxMB.toFixed(2)} MB/s</Text>
              </Flex>
              <ResourceBar value={Math.min(networkRxMB * 20, 100)} color="cyan" height={6} />
            </Box>
            
            {/* 上传速率 */}
            <Box className="network-segment">
              <Flex justify="between" align="center" mb="1">
                <Flex align="center" gap="2">
                  <Box className="resource-indicator resource-indicator-upload" />
                  <Text size="2" className="resource-label">上传</Text>
                </Flex>
                <Text size="2" weight="medium">{networkTxMB.toFixed(2)} MB/s</Text>
              </Flex>
              <ResourceBar value={Math.min(networkTxMB * 20, 100)} color="indigo" height={6} />
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default ClientResourceSection; 