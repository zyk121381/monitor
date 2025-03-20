import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Box, Flex, Text, Button, Avatar, DropdownMenu, Separator, Container, Theme } from '@radix-ui/themes';
import { ExitIcon, PersonIcon, PersonIcon as UserIcon, DashboardIcon, ChevronDownIcon, ActivityLogIcon, CubeIcon, PieChartIcon } from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <Theme appearance="light" accentColor="blue">
      <Box className="navbar-wrapper">
        <Box className="navbar-container">
          <Container>
            <Flex justify="between" align="center" py="3" className="navbar-content">
              {/* Logo 部分 */}
              <Flex align="center" gap="6">
                <Link to="/" className="navbar-logo-link">
                  <Flex align="center" gap="2">
                    <Box className="navbar-logo">
                      <PieChartIcon width="24" height="24" />
                    </Box>
                    <Text size="5" weight="bold">XUGOU</Text>
                  </Flex>
                </Link>
              </Flex>
              
              {/* 导航链接 */}
              <Flex align="center" gap="1">
                {isAuthenticated ? (
                  <>
                    <Flex className="navbar-links" align="center">
                      <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                        <Button variant={isActive('/dashboard') ? 'solid' : 'ghost'} size="3" className="nav-button">
                          <DashboardIcon width="16" height="16" />
                          <Text ml="2">仪表盘</Text>
                        </Button>
                      </Link>
                      
                      <Link to="/monitors" className={`nav-link ${isActive('/monitors') ? 'active' : ''}`}>
                        <Button variant={isActive('/monitors') ? 'solid' : 'ghost'} size="3" className="nav-button">
                          <ActivityLogIcon width="16" height="16" />
                          <Text ml="2">API监控</Text>
                        </Button>
                      </Link>
                      
                      <Link to="/agents" className={`nav-link ${isActive('/agents') ? 'active' : ''}`}>
                        <Button variant={isActive('/agents') ? 'solid' : 'ghost'} size="3" className="nav-button">
                          <CubeIcon width="16" height="16" />
                          <Text ml="2">客户端监控</Text>
                        </Button>
                      </Link>
                      
                      <Link to="/status/config" className={`nav-link ${isActive('/status/config') ? 'active' : ''}`}>
                        <Button variant={isActive('/status/config') ? 'solid' : 'ghost'} size="3" className="nav-button">
                          <PieChartIcon width="16" height="16" />
                          <Text ml="2">自定义状态页</Text>
                        </Button>
                      </Link>
                    </Flex>
                    
                    {/* 用户菜单 */}
                    <Separator orientation="vertical" mx="4" />
                    
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <Button variant="ghost" className="user-menu-button">
                          <Flex align="center" gap="2">
                            <Avatar
                              size="2"
                              radius="full"
                              fallback={user?.username?.charAt(0).toUpperCase() || 'U'}
                              color="blue"
                            />
                            <Box display={{ initial: 'none', sm: 'block' }}>
                              <Text size="2">{user?.username}</Text>
                            </Box>
                            <ChevronDownIcon width="14" height="14" />
                          </Flex>
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" className="user-dropdown">
                        <DropdownMenu.Label>
                          <Text size="1" color="gray">已登录为</Text>
                          <Text size="2" weight="bold">{user?.username}</Text>
                        </DropdownMenu.Label>
                        
                        <DropdownMenu.Separator />
                        
                        {user?.role === 'admin' && (
                          <DropdownMenu.Item onClick={() => navigate('/users')}>
                            <Flex gap="2" align="center">
                              <UserIcon />
                              <Text>用户管理</Text>
                            </Flex>
                          </DropdownMenu.Item>
                        )}
                        
                        <DropdownMenu.Item onClick={() => navigate('/profile')}>
                          <Flex gap="2" align="center">
                            <PersonIcon />
                            <Text>个人资料</Text>
                          </Flex>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Separator />
                        
                        <DropdownMenu.Item color="red" onClick={handleLogout}>
                          <Flex gap="2" align="center">
                            <ExitIcon />
                            <Text>退出登录</Text>
                          </Flex>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </>
                ) : (
                  <Flex gap="3">
                    <Button variant="soft" onClick={() => navigate('/login')}>
                      登录
                    </Button>
                    <Button onClick={() => navigate('/register')}>
                      注册
                    </Button>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Container>
        </Box>
      </Box>
    </Theme>
  );
};

export default Navbar; 