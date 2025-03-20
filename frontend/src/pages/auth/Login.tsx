import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';
import './auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 检查是否有来自注册页面的消息
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查您的凭据');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="page-container">
      <Flex justify="center" align="center" style={{ minHeight: 'calc(100vh - 130px)', padding: '2rem 0' }}>
        <Card style={{ width: '400px', padding: '2rem' }}>
          <Flex direction="column" gap="4">
            <Heading align="center" size="6">登录</Heading>
            
            {message && (
              <Text color="green" align="center">{message}</Text>
            )}
            
            {error && (
              <Text color="red" align="center">{error}</Text>
            )}
            
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3">
                <div className="input-wrapper">
                  <input 
                    placeholder="用户名" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="text-input"
                  />
                </div>
                
                <div className="input-wrapper">
                  <input 
                    placeholder="密码" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-input"
                  />
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </Flex>
            </form>
            
            <Flex justify="between" mt="2">
              <Text size="2">
                <Link to="/forgot-password" style={{ color: 'var(--accent-9)', textDecoration: 'none' }}>
                  忘记密码?
                </Link>
              </Text>
              <Text size="2">
                <Link to="/register" style={{ color: 'var(--accent-9)', textDecoration: 'none' }}>
                  注册账号
                </Link>
              </Text>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </div>
  );
};

export default Login; 