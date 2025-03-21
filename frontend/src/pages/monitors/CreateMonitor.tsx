import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Card, TextField, Select, TextArea, Table, IconButton } from '@radix-ui/themes';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { createMonitor } from '../../api/monitors';

const CreateMonitor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET',
    interval: 1, // 默认为1分钟
    timeout: 30,
    expectedStatus: 200,
    body: ''
  });
  
  // 请求头部分使用键值对数组
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' }
  ]);

  // 具体状态码选项
  const specificStatusCodes = [
    { group: '2xx - 成功', codes: [
      { label: '2xx - 所有成功状态码', value: 2, isRange: true },
      { label: '200 - OK', value: 200 },
      { label: '201 - Created', value: 201 },
      { label: '204 - No Content', value: 204 }
    ]},
    { group: '3xx - 重定向', codes: [
      { label: '3xx - 所有重定向状态码', value: 3, isRange: true },
      { label: '301 - Moved Permanently', value: 301 },
      { label: '302 - Found', value: 302 },
      { label: '304 - Not Modified', value: 304 }
    ]},
    { group: '4xx - 客户端错误', codes: [
      { label: '4xx - 所有客户端错误状态码', value: 4, isRange: true },
      { label: '400 - Bad Request', value: 400 },
      { label: '401 - Unauthorized', value: 401 },
      { label: '403 - Forbidden', value: 403 },
      { label: '404 - Not Found', value: 404 }
    ]},
    { group: '5xx - 服务器错误', codes: [
      { label: '5xx - 所有服务器错误状态码', value: 5, isRange: true },
      { label: '500 - Internal Server Error', value: 500 },
      { label: '502 - Bad Gateway', value: 502 },
      { label: '503 - Service Unavailable', value: 503 },
      { label: '504 - Gateway Timeout', value: 504 }
    ]}
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'interval' || name === 'timeout' || name === 'expectedStatus' 
        ? parseInt(value) || 0 
        : value
    }));
  };
  
  // 处理请求头键值对更改
  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    
    // 如果最后一行有输入内容，添加新的空行
    if (index === headers.length - 1 && (newHeaders[index].key || newHeaders[index].value)) {
      newHeaders.push({ key: '', value: '' });
    }
    
    setHeaders(newHeaders);
  };
  
  // 删除请求头行
  const removeHeader = (index: number) => {
    if (headers.length > 1) {
      const newHeaders = [...headers];
      newHeaders.splice(index, 1);
      setHeaders(newHeaders);
    }
  };
  
  // 将键值对转换为JSON对象
  const headersToJson = () => {
    const result: Record<string, string> = {};
    
    headers.forEach(({ key, value }) => {
      if (key.trim()) {
        result[key.trim()] = value;
      }
    });
    
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 调用实际API，将分钟转换为秒
      const response = await createMonitor({
        name: formData.name,
        url: formData.url,
        method: formData.method,
        interval: formData.interval * 60, // 转换为秒
        timeout: formData.timeout,
        expectedStatus: formData.expectedStatus,
        headers: headersToJson(),
        body: formData.body
      });

      if (response.success) {
        navigate('/monitors');
      } else {
        alert(`创建失败: ${response.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('创建监控错误:', error);
      alert('创建监控失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 判断是否需要显示请求体输入框
  const showBodyField = ['POST', 'PUT', 'PATCH'].includes(formData.method);

  return (
    <Box>
      <div className="page-container detail-page">
        <Flex justify="between" align="center" className="detail-header">
          <Flex align="center" gap="2">
            <Button variant="soft" size="1" onClick={() => navigate('/monitors')}>
              <ArrowLeftIcon />
            </Button>
            <Heading size="6">创建监控</Heading>
          </Flex>
        </Flex>

        <div className="detail-content">
          <Card>
            <form onSubmit={handleSubmit}>
              <Box pt="2">
                <Flex direction="column" gap="4">
                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      监控名称 *
                    </Text>
                    <TextField.Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="输入监控名称"
                      required
                    />
                  </Box>

                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      URL *
                    </Text>
                    <TextField.Input
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      placeholder="输入要监控的URL"
                      required
                    />
                  </Box>

                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      请求方法 *
                    </Text>
                    <Select.Root 
                      name="method" 
                      value={formData.method} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="GET">GET</Select.Item>
                        <Select.Item value="POST">POST</Select.Item>
                        <Select.Item value="PUT">PUT</Select.Item>
                        <Select.Item value="DELETE">DELETE</Select.Item>
                        <Select.Item value="HEAD">HEAD</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Flex gap="4">
                    <Box style={{ flex: 1 }}>
                      <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                        检查间隔（分钟）*
                      </Text>
                      <TextField.Input
                        name="interval"
                        type="number"
                        value={formData.interval.toString()}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                      <Text size="1" color="gray">
                        最小间隔 1 分钟
                      </Text>
                    </Box>

                    <Box style={{ flex: 1 }}>
                      <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                        超时时间（秒）*
                      </Text>
                      <TextField.Input
                        name="timeout"
                        type="number"
                        value={formData.timeout.toString()}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                    </Box>
                  </Flex>

                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      预期状态码 *
                    </Text>
                    <Select.Root 
                      name="expectedStatus" 
                      value={formData.expectedStatus.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        expectedStatus: parseInt(value) 
                      }))}
                    >
                      <Select.Trigger style={{ width: '100%' }} />
                      <Select.Content position="popper" sideOffset={5}>
                        {specificStatusCodes.map((group) => (
                          <Select.Group key={group.group}>
                            <Select.Label style={{ fontWeight: 'bold', padding: '8px 12px', color: 'var(--gray-10)' }}>
                              {group.group}
                            </Select.Label>
                            {group.codes.map((code) => (
                              <Select.Item 
                                key={code.value} 
                                value={code.value.toString()}
                                style={{ 
                                  padding: code.isRange ? '8px 12px 8px 30px' : '8px 12px 8px 40px',
                                  fontWeight: code.isRange ? 'bold' : 'normal'
                                }}
                              >
                                {code.label}
                              </Select.Item>
                            ))}
                            {group !== specificStatusCodes[specificStatusCodes.length - 1] && (
                              <Select.Separator style={{ margin: '8px 0' }} />
                            )}
                          </Select.Group>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    <Text size="1" color="gray" style={{ marginTop: '4px' }}>
                      选择预期的HTTP状态码或状态码范围
                    </Text>
                  </Box>

                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      请求头
                    </Text>
                    <Box style={{ border: '1px solid var(--gray-6)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                      <Table.Root>
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeaderCell>名称</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>值</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell style={{ width: '40px' }}></Table.ColumnHeaderCell>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {headers.map((header, index) => (
                            <Table.Row key={index}>
                              <Table.Cell>
                                <TextField.Input
                                  placeholder="Header Name"
                                  value={header.key}
                                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                                />
                              </Table.Cell>
                              <Table.Cell>
                                <TextField.Input
                                  placeholder="Header Value"
                                  value={header.value}
                                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                                />
                              </Table.Cell>
                              <Table.Cell>
                                <IconButton 
                                  variant="soft" 
                                  color="red" 
                                  size="1"
                                  onClick={() => removeHeader(index)}
                                >
                                  <TrashIcon />
                                </IconButton>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                      <Flex justify="end" mt="2">
                        <Button 
                          size="1" 
                          variant="soft"
                          onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                        >
                          <PlusIcon />
                          添加请求头
                        </Button>
                      </Flex>
                    </Box>
                    <Text size="1" color="gray">
                      添加请求头，例如：Content-Type: application/json
                    </Text>
                  </Box>

                  {showBodyField && (
                    <Box>
                      <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                        请求体
                      </Text>
                      <TextArea
                        name="body"
                        value={formData.body}
                        onChange={handleChange}
                        placeholder="请求体内容"
                        style={{ minHeight: '100px' }}
                      />
                    </Box>
                  )}
                </Flex>
              </Box>

              <Flex justify="end" mt="4" gap="2">
                <Button variant="soft" onClick={() => navigate('/monitors')}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '创建中...' : '创建监控'}
                  {!loading && <PlusIcon />}
                </Button>
              </Flex>
            </form>
          </Card>
        </div>
      </div>
    </Box>
  );
};

export default CreateMonitor; 