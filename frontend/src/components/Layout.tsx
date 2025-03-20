import { ReactNode } from 'react';
import { Box, Flex, Text, Container, Theme, Separator } from '@radix-ui/themes';
import Navbar from './Navbar';
import '../styles/components.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Theme appearance="light" accentColor="blue">
      <Flex direction="column" className="layout-container">
        {/* 顶部导航栏 */}
        <Navbar />
        
        {/* 主要内容 */}
        <Box className="main-content">
          {children}
        </Box>
        
        {/* 页脚 */}
        <Box className="footer">
          <Container>
            <Separator size="4" mb="4" color="gray" />
            <Flex justify="center" align="center" py="3">
              <Text size="2" color="gray">© {currentYear} XUGOU. 保留所有权利。</Text>
            </Flex>
          </Container>
        </Box>
      </Flex>
    </Theme>
  );
};

export default Layout; 