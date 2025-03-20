import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Card, Code, Separator } from '@radix-ui/themes';
import { ArrowLeftIcon, CopyIcon, CheckIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { generateToken } from '../../api/agents';

const CreateAgent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  // 获取当前浏览器访问的地址作为服务端地址
  const [serverUrl, setServerUrl] = useState('');
  
  // 生成服务端验证的 token
  useEffect(() => {
    // 获取当前访问的URL
    const origin = window.location.origin;
    setServerUrl(origin);
    
    const fetchToken = async () => {
      setLoading(true);
      try {
        const response = await generateToken();
        if (response.success && response.token) {
          setToken(response.token);
        } else {
          console.error('获取 token 失败:', response.message);
        }
      } catch (error) {
        console.error('获取 token 失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchToken();
  }, []);

  // 复制token
  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 处理服务端地址变更
  const handleServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerUrl(e.target.value);
  };

  return (
    <Box>
      <div className="page-container detail-page">
        <Flex justify="between" align="center" className="detail-header">
          <Flex align="center" gap="2">
            <Button variant="soft" size="1" onClick={() => navigate('/agents')}>
              <ArrowLeftIcon />
            </Button>
            <Heading size="6">添加客户端</Heading>
          </Flex>
        </Flex>

        <div className="detail-content">
          <Card>
            <Flex direction="column" gap="5">
              {/* 提示信息 */}
              <Box style={{ 
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-3)',
                color: 'var(--accent-11)'
              }}>
                <Flex gap="2">
                  <InfoCircledIcon />
                  <Text>
                    客户端将在运行安装命令后自动添加到系统中，无需手动创建
                  </Text>
                </Flex>
              </Box>
              
              {/* 服务端地址 */}
              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '6px' }}>
                  服务端地址
                </Text>
                <input 
                  type="text" 
                  value={serverUrl} 
                  onChange={handleServerUrlChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--gray-7)',
                    fontSize: '14px'
                  }}
                  placeholder="请输入服务端地址，例如：https://xugou.example.com"
                />
                <Text size="1" color="gray" style={{ marginTop: '6px' }}>
                  请确保此地址可以从客户端服务器访问
                </Text>
              </Box>
              
              {/* 客户端Token */}
              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '6px' }}>
                  注册Token
                </Text>
                {loading ? (
                  <Text>正在生成Token...</Text>
                ) : (
                  <>
                    <Flex gap="2">
                      <Text className="token-display" style={{ 
                        padding: '10px', 
                        backgroundColor: 'var(--gray-3)', 
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        flex: 1,
                        overflowX: 'auto'
                      }}>
                        {token}
                      </Text>
                      <Button variant="soft" onClick={handleCopyToken}>
                        {copied ? <CheckIcon /> : <CopyIcon />}
                        {copied ? '已复制' : '复制'}
                      </Button>
                    </Flex>
                    <Text size="1" color="gray" style={{ marginTop: '6px' }}>
                      此令牌将用于您的客户端向服务器注册身份，有效期为24小时
                    </Text>
                  </>
                )}
              </Box>
              
              <Separator size="4" />
              
              {/* 安装指南 */}
              <Box>
                <Flex align="baseline" gap="2" mb="3">
                  <Heading size="4">安装指南</Heading>
                  <Text size="2" color="gray">按照以下两个步骤安装并注册客户端</Text>
                </Flex>
                
                <Card variant="surface" style={{ backgroundColor: 'var(--gray-2)' }}>
                  <Flex direction="column" gap="4">
                    {/* 第一步：下载客户端二进制文件 */}
                    <Box>
                      <Text as="div" size="2" weight="bold" mb="2">步骤 1: 下载客户端二进制文件</Text>
                      <Flex gap="2" direction="column">
                        <Code size="2" style={{ display: 'block', padding: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {`curl -sSL https://xugou-agent.r2.dev/xugou-agent-latest -o xugou-agent && chmod +x xugou-agent`}
                        </Code>
                        <Button 
                          variant="soft" 
                          onClick={() => {
                            navigator.clipboard.writeText(`curl -sSL https://xugou-agent.r2.dev/xugou-agent-latest -o xugou-agent && chmod +x xugou-agent`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }} 
                          style={{ alignSelf: 'flex-end' }}
                        >
                          {copied ? '已复制' : '复制命令'}
                        </Button>
                      </Flex>
                      <Text size="1" color="gray" style={{ marginTop: '8px' }}>
                        此命令将从 Cloudflare R2 存储下载最新版客户端二进制文件并赋予可执行权限
                      </Text>
                    </Box>
                    
                    {/* 第二步：运行并注册客户端 */}
                    <Box>
                      <Text as="div" size="2" weight="bold" mb="2">步骤 2: 注册并启动客户端</Text>
                      <Flex gap="2" direction="column">
                        <Code size="2" style={{ display: 'block', padding: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {`./xugou-agent start --server ${serverUrl} --token ${token} --interval 60`}
                        </Code>
                        <Button 
                          variant="soft" 
                          onClick={() => {
                            navigator.clipboard.writeText(`./xugou-agent start --server ${serverUrl} --token ${token} --interval 60`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }} 
                          style={{ alignSelf: 'flex-end' }}
                        >
                          {copied ? '已复制' : '复制命令'}
                        </Button>
                      </Flex>
                      <Text size="1" color="gray" style={{ marginTop: '8px' }}>
                        此命令将启动客户端，并使用生成的令牌自动注册到服务端。参数 interval 表示上报间隔（秒）
                      </Text>
                    </Box>
                    
                    {/* 设置为系统服务（可选） */}
                    <Box>
                      <Text as="div" size="2" weight="bold" mb="2">（可选）将客户端设置为系统服务</Text>
                      <Text size="1" color="gray" style={{ marginBottom: '8px' }}>
                        在 Linux/Unix 系统上，您可以使用以下命令创建系统服务
                      </Text>
                      <Flex gap="2" direction="column">
                        <Code size="2" style={{ display: 'block', padding: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {`sudo mv xugou-agent /usr/local/bin/
sudo tee /etc/systemd/system/xugou-agent.service > /dev/null << EOF
[Unit]
Description=Xugou Agent
After=network.target

[Service]
ExecStart=/usr/local/bin/xugou-agent start --server ${serverUrl} --token ${token} --interval 60
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable xugou-agent.service
sudo systemctl start xugou-agent.service`}
                        </Code>
                        <Button 
                          variant="soft" 
                          onClick={() => {
                            navigator.clipboard.writeText(`sudo mv xugou-agent /usr/local/bin/
sudo tee /etc/systemd/system/xugou-agent.service > /dev/null << EOF
[Unit]
Description=Xugou Agent
After=network.target

[Service]
ExecStart=/usr/local/bin/xugou-agent start --server ${serverUrl} --token ${token} --interval 60
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable xugou-agent.service
sudo systemctl start xugou-agent.service`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }} 
                          style={{ alignSelf: 'flex-end' }}
                        >
                          {copied ? '已复制' : '复制命令'}
                        </Button>
                      </Flex>
                    </Box>
                  </Flex>
                </Card>
              </Box>
              
              {/* 返回按钮 */}
              <Flex justify="end" gap="3">
                <Button 
                  variant="soft"
                  onClick={() => navigate('/agents')}
                >
                  返回客户端列表
                </Button>
              </Flex>
            </Flex>
          </Card>
        </div>
      </div>
    </Box>
  );
};

export default CreateAgent; 