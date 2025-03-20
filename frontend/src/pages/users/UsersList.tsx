import { useState, useEffect } from 'react';
import { Button, Table, Text, Flex, Heading, AlertDialog, Box } from '@radix-ui/themes';
import { getAllUsers, deleteUser } from '../../api/users';
import { User } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      if (response.success && response.users) {
        setUsers(response.users);
      } else {
        setError(response.message || '获取用户列表失败');
      }
    } catch (err: any) {
      setError(err.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (userToDelete === null) return;
    
    try {
      const response = await deleteUser(userToDelete);
      if (response.success) {
        setUsers(users.filter(user => user.id !== userToDelete));
        setUserToDelete(null);
      } else {
        setError(response.message || '删除用户失败');
      }
    } catch (err: any) {
      setError(err.message || '删除用户失败');
    }
  };

  return (
    <Box p="4">
      <Flex justify="between" align="center" mb="4">
        <Heading size="6">用户管理</Heading>
        <Button onClick={() => navigate('/users/create')}>添加用户</Button>
      </Flex>

      {error && <Text color="red" mb="4">{error}</Text>}

      {loading ? (
        <Text>加载中...</Text>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>用户名</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>邮箱</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>角色</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>操作</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {users.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <Text align="center">暂无用户数据</Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              users.map(user => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.id}</Table.Cell>
                  <Table.Cell>{user.username}</Table.Cell>
                  <Table.Cell>{user.email || '-'}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <Button size="1" onClick={() => navigate(`/users/${user.id}`)}>
                        编辑
                      </Button>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger>
                          <Button size="1" color="red">
                            删除
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content>
                          <AlertDialog.Title>确认删除</AlertDialog.Title>
                          <AlertDialog.Description>
                            您确定要删除用户 "{user.username}" 吗？此操作无法撤销。
                          </AlertDialog.Description>
                          <Flex gap="3" mt="4" justify="end">
                            <AlertDialog.Cancel>
                              <Button variant="soft" color="gray">
                                取消
                              </Button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action>
                              <Button 
                                variant="solid" 
                                color="red" 
                                onClick={() => {
                                  setUserToDelete(user.id);
                                  handleDelete();
                                }}
                              >
                                删除
                              </Button>
                            </AlertDialog.Action>
                          </Flex>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
};

export default UsersList; 