import { ReactNode } from 'react';
import { Box, Flex, Text, Container, Theme, Separator } from '@radix-ui/themes';
import Navbar from './Navbar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRss } from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

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
            <Flex justify="center" align="center" py="3" direction="column">
              <Text size="2" color="gray">© {currentYear} XUGOU. 保留所有权利。</Text>
              <Flex gap="3" mt="2">
                <a href="https://zaunist.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                  <FontAwesomeIcon icon={faRss} size="lg" className="footer-link-icon" />
                  <Text size="2">博客</Text>
                </a>
                <a href="https://www.youtube.com/@zaunist" target="_blank" rel="noopener noreferrer" className="footer-link">
                  <FontAwesomeIcon icon={faYoutube} size="lg" className="footer-link-icon" />
                  <Text size="2">油管频道</Text>
                </a>
                <a href="https://mail.mdzz.uk" target="_blank" rel="noopener noreferrer" className="footer-link">
                  <FontAwesomeIcon icon={faEnvelope} size="lg" className="footer-link-icon" />
                  <Text size="2">24小时临时邮箱</Text>
                </a>
              </Flex>
            </Flex>
          </Container>
        </Box>
      </Flex>
    </Theme>
  );
};

export default Layout; 