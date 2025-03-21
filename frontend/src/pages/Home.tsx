import { Box, Flex, Heading, Text, Button, Card, Grid } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { ActivityLogIcon, LightningBoltIcon, MixerHorizontalIcon, DesktopIcon, GitHubLogoIcon } from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Box>
      <div className="page-container">
        {/* 英雄区域 */}
        <Flex direction="column" align="center" justify="center" py="9" gap="5">
          <Heading size="9" align="center">
            轻量化监控平台
          </Heading>
          <Text size="5" align="center" style={{ maxWidth: '800px' }}>
            XUGOU 是一个轻量化的监控平台，基于 CloudFlare 搭建，用于跟踪API、服务和系统的可用性以及资源使用情况。
          </Text>
          
          {/* GitHub 图标 */}
          <Flex justify="center" py="2">
            <GitHubLogoIcon width="32" height="32" />
          </Flex>

          <Flex gap="4" mt="4">
            {isAuthenticated ? (
              <Button size="3" asChild>
                <Link to="/dashboard">进入仪表盘</Link>
              </Button>
            ) : (
              <>
                <Button size="3" asChild>
                  <Link to="/login">开始使用</Link>
                </Button>
                <Button size="3" asChild>
                  <a href="https://github.com/zaunist/xugou" target="_blank" rel="noopener noreferrer">访问仓库</a>
                </Button>
              </>
            )}
          </Flex>
        </Flex>

        {/* 特性区域 */}
        <Box py="9">
          <Heading size="6" mb="6" align="center">
            主要功能
          </Heading>
          <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
            <Card size="3">
              <Flex direction="column" gap="2" align="center" p="4">
                <ActivityLogIcon width="32" height="32" />
                <Heading size="4">API监控</Heading>
                <Text align="center">
                  监控API端点的可用性和性能，设置自定义检查间隔和警报阈值。
                </Text>
              </Flex>
            </Card>
            <Card size="3">
              <Flex direction="column" gap="2" align="center" p="4">
                <DesktopIcon width="32" height="32" />
                <Heading size="4">系统监控</Heading>
                <Text align="center">
                  通过轻量级客户端收集服务器的CPU、内存、磁盘和网络指标。
                </Text>
              </Flex>
            </Card>
            <Card size="3">
              <Flex direction="column" gap="2" align="center" p="4">
                <LightningBoltIcon width="32" height="32" />
                <Heading size="4">实时通知</Heading>
                <Text align="center">
                  当监控检测到问题时，通过多种渠道接收实时通知。
                </Text>
              </Flex>
            </Card>
            <Card size="3">
              <Flex direction="column" gap="2" align="center" p="4">
                <MixerHorizontalIcon width="32" height="32" />
                <Heading size="4">自定义状态页</Heading>
                <Text align="center">
                  创建公共状态页面，展示服务的实时状态和历史可用性。
                </Text>
              </Flex>
            </Card>
          </Grid>
        </Box>
      </div>
    </Box>
  );
};

export default Home; 