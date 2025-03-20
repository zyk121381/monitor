import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, Flex, Heading, Text, Box } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';
import './auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 验证密码
    if (password !== confirmPassword) {
      setError('两次输入的密码不匹配');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await register({ username, password, email });
      if (result.success) {
        navigate('/login', { state: { message: '注册成功，请登录' } });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="page-container">
      <Flex justify="center" align="center" style={{ minHeight: 'calc(100vh - 130px)', padding: '2rem 0' }}>
        <Card style={{ width: '400px', padding: '2rem' }}>
          <Flex direction="column" gap="4">
            <Heading align="center" size="6">注册账号</Heading>
            
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
                    placeholder="电子邮箱" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                
                <div className="input-wrapper">
                  <input 
                    placeholder="确认密码" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="text-input"
                  />
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '注册中...' : '注册'}
                </Button>
              </Flex>
            </form>
            
            <Text align="center" size="2">
              已有账号？ <Link to="/login" style={{ color: 'var(--accent-9)', textDecoration: 'none' }}>登录</Link>
            </Text>
          </Flex>
        </Card>
      </Flex>
    </div>
  );
};

export default Register; 