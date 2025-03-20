import { useState, useEffect } from 'react';
import { Button, Card, Flex, Heading, Text, TextField, Box } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';
import { updateUser, changePassword, UpdateUserRequest, ChangePasswordRequest } from '../../api/users';

const UserProfile = () => {
  const { user } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email || '');
    }
  }, [user]);
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsProfileLoading(true);
    
    if (!user) {
      setProfileError('用户未登录');
      setIsProfileLoading(false);
      return;
    }
    
    const data: UpdateUserRequest = {
      username,
      email: email || undefined
    };
    
    try {
      const response = await updateUser(user.id, data);
      if (response.success) {
        setProfileSuccess('个人资料更新成功');
      } else {
        setProfileError(response.message || '更新个人资料失败');
      }
    } catch (err: any) {
      setProfileError(err.message || '更新个人资料失败');
    } finally {
      setIsProfileLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (!user) {
      setPasswordError('用户未登录');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不匹配');
      return;
    }
    
    setIsPasswordLoading(true);
    
    const data: ChangePasswordRequest = {
      currentPassword,
      newPassword
    };
    
    try {
      const response = await changePassword(user.id, data);
      if (response.success) {
        setPasswordSuccess('密码修改成功');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(response.message || '修改密码失败');
      }
    } catch (err: any) {
      setPasswordError(err.message || '修改密码失败');
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  if (!user) {
    return <Text>加载中...</Text>;
  }
  
  return (
    <Box>
      <div className="page-container detail-page">
        <Flex justify="between" align="center" className="detail-header">
          <Heading size="6">个人资料</Heading>
        </Flex>
        
        <div className="detail-content">
          <Flex direction="column" gap="6">
            <Card>
              <Heading size="4" mb="4">基本信息</Heading>
              
              {profileError && <Text color="red" mb="3">{profileError}</Text>}
              {profileSuccess && <Text color="green" mb="3">{profileSuccess}</Text>}
              
              <form onSubmit={handleProfileUpdate}>
                <Flex direction="column" gap="3">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">用户名</Text>
                    <TextField.Input
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      required
                    />
                  </Flex>
                  
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">电子邮箱</Text>
                    <TextField.Input
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    />
                  </Flex>
                  
                  <Button type="submit" disabled={isProfileLoading}>
                    {isProfileLoading ? '更新中...' : '更新个人资料'}
                  </Button>
                </Flex>
              </form>
            </Card>
            
            <Card>
              <Heading size="4" mb="4">修改密码</Heading>
              
              {passwordError && <Text color="red" mb="3">{passwordError}</Text>}
              {passwordSuccess && <Text color="green" mb="3">{passwordSuccess}</Text>}
              
              <form onSubmit={handlePasswordChange}>
                <Flex direction="column" gap="3">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">当前密码</Text>
                    <TextField.Input
                      type="password"
                      value={currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </Flex>
                  
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">新密码</Text>
                    <TextField.Input
                      type="password"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      required
                    />
                  </Flex>
                  
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">确认新密码</Text>
                    <TextField.Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Flex>
                  
                  <Button type="submit" disabled={isPasswordLoading}>
                    {isPasswordLoading ? '修改中...' : '修改密码'}
                  </Button>
                </Flex>
              </form>
            </Card>
          </Flex>
        </div>
      </div>
    </Box>
  );
};

export default UserProfile; 