import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Card, Code, Separator } from '@radix-ui/themes';
import { ArrowLeftIcon, CopyIcon, CheckIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { generateToken } from '../../api/agents';
import { useTranslation } from 'react-i18next';

const CreateAgent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  // 获取当前浏览器访问的地址作为服务端地址
  const [serverUrl, setServerUrl] = useState('');
  const { t } = useTranslation();
  
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
            <Heading size="6">{t('agent.form.title.create')}</Heading>
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
                    {t('agent.add.note')}
                  </Text>
                </Flex>
              </Box>
              
              {/* 服务端地址 */}
              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '6px' }}>
                  {t('agent.add.serverAddress')}
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
                  placeholder={t('agent.add.serverAddressPlaceholder')}
                />
                <Text size="1" color="gray" style={{ marginTop: '6px' }}>
                  {t('agent.add.serverAddressHelp')}
                </Text>
              </Box>
              
              {/* 客户端Token */}
              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '6px' }}>
                  {t('agent.add.registrationToken')}
                </Text>
                {loading ? (
                  <Text>{t('agent.add.generatingToken')}</Text>
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
                        {copied ? t('common.copied') : t('common.copy')}
                      </Button>
                    </Flex>
                    <Text size="1" color="gray" style={{ marginTop: '6px' }}>
                      {t('agent.add.tokenHelp')}
                    </Text>
                  </>
                )}
              </Box>
              
              <Separator size="4" />
              
              {/* 安装指南 */}
              <Box>
                <Flex align="baseline" gap="2" mb="3">
                  <Heading size="4">{t('agent.add.installGuide')}</Heading>
                  <Text size="2" color="gray">{t('agent.add.installSteps')}</Text>
                </Flex>
                
                <Card variant="surface" style={{ backgroundColor: 'var(--gray-2)' }}>
                  <Flex direction="column" gap="4">
                    {/* 第一步：下载客户端二进制文件 */}
                    <Box>
                      <Text as="div" size="2" weight="bold" mb="2">{t('agent.add.step1')}</Text>
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
                          {copied ? t('common.copied') : t('agents.copyCommand')}
                        </Button>
                      </Flex>
                      <Text size="1" color="gray" style={{ marginTop: '8px' }}>
                        {t('agent.add.step1Help')}
                      </Text>
                    </Box>
                    
                    {/* 第二步：运行并注册客户端 */}
                    <Box>
                      <Text as="div" size="2" weight="bold" mb="2">{t('agent.add.step2')}</Text>
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
                          {copied ? t('common.copied') : t('agents.copyCommand')}
                        </Button>
                      </Flex>
                      <Text size="1" color="gray" style={{ marginTop: '8px' }}>
                        {t('agent.add.step2Help')}
                      </Text>
                    </Box>
                    
                    {/* 设置为系统服务（可选） */}
                    <Box>
                      <Text as="div" size="2" weight="bold" mb="2">{t('agent.add.optionalSetup')}</Text>
                      <Text size="1" color="gray" style={{ marginBottom: '8px' }}>
                        {t('agent.add.optionalSetupHelp')}
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
                          {copied ? t('common.copied') : t('agents.copyCommand')}
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
                  {t('agent.add.returnToList')}
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