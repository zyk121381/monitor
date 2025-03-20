import { Box, Flex, Heading, Text, Button } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

const NotFound = () => {
  return (
    <div className="page-container">
      <Flex direction="column" align="center" justify="center" style={{ minHeight: 'calc(100vh - 200px)' }} gap="4">
        <ExclamationTriangleIcon width="48" height="48" color="var(--amber-9)" />
        <Heading size="9">404</Heading>
        <Heading size="6">页面未找到</Heading>
        <Text align="center" style={{ maxWidth: '500px' }}>
          您访问的页面不存在或已被移除。请检查URL是否正确，或返回首页。
        </Text>
        <Button size="3" mt="4" asChild>
          <Link to="/">返回首页</Link>
        </Button>
      </Flex>
    </div>
  );
};

export default NotFound; 