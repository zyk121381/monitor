import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Card, Button, TextField, TextArea, Tabs, Separator, Container, Theme } from '@radix-ui/themes';
import { ArrowLeftIcon, EyeOpenIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import * as Toast from '@radix-ui/react-toast';
import { getAllMonitors, Monitor } from '../../api/monitors';
import { getAllAgents, Agent } from '../../api/agents';
import { 
  getStatusPageConfig, 
  saveStatusPageConfig, 
  StatusPageConfig as StatusConfig,
  StatusPageConfigResponse
} from '../../api/status';
import '../../styles/components.css';

// 监控项带选择状态
interface MonitorWithSelection extends Monitor {
  selected: boolean;
}

// 客户端带选择状态
interface AgentWithSelection extends Agent {
  selected: boolean;
}

// 状态页配置带详细信息
interface StatusConfigWithDetails {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  publicUrl: string;
  monitors: MonitorWithSelection[];
  agents: AgentWithSelection[];
}

const StatusPageConfig = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const hasInitializedRef = useRef(false);
  
  // 初始化配置对象
  const [config, setConfig] = useState<StatusConfigWithDetails>({
    title: '系统状态',
    description: '实时监控系统状态',
    logoUrl: '',
    customCss: '',
    publicUrl: window.location.origin + '/status',
    monitors: [],
    agents: []
  });

  // 从API获取数据
  useEffect(() => {
    // 使用 ref 防止重复请求
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    setLoading(true);
    
    const fetchData = async () => {
      try {
        // 获取状态页配置
        console.log('开始获取状态页配置...');
        const configResponse = await getStatusPageConfig();
        console.log('==== 状态页配置API响应 ====', JSON.stringify(configResponse, null, 2));
        
        let configData: StatusPageConfigResponse | null = null;
        
        // 判断响应是否包含所需数据
        if (configResponse) {
          if (configResponse.success === false) {
            console.log('API响应失败:', configResponse.message);
          } else if (configResponse.config) {
            // 从config属性获取配置
            configData = configResponse.config;
            console.log('从config属性获取的状态页配置:', JSON.stringify(configData, null, 2));
          } else {
            // 直接使用API响应作为配置数据 (可能是后端直接返回了配置对象)
            try {
              // 尝试将响应作为配置数据直接使用
              if ('monitors' in configResponse && Array.isArray(configResponse.monitors)) {
                console.log('API响应似乎直接包含配置数据，尝试直接使用');
                configData = configResponse as unknown as StatusPageConfigResponse;
              }
            } catch (err) {
              console.error('尝试解析API响应失败:', err);
            }
          }
          
          // 输出配置信息
          if (configData && configData.monitors && Array.isArray(configData.monitors)) {
            console.log('获取到的状态页配置:', JSON.stringify(configData, null, 2));
            console.log('监控项列表类型:', Array.isArray(configData.monitors) ? 'Array' : typeof configData.monitors);
            console.log('监控项数量:', configData.monitors.length);
            configData.monitors.forEach(monitor => {
              console.log(`配置中的监控项: id=${monitor.id}, name=${monitor.name}, selected=${monitor.selected}`);
            });
          } else {
            console.log('未获取到有效的状态页配置或配置为空');
          }
        } else {
          console.log('API响应无效');
        }

        // 获取监控数据
        console.log('开始获取所有监控项...');
        const monitorsResponse = await getAllMonitors();
        console.log('获取所有监控项响应:', JSON.stringify(monitorsResponse, null, 2));
        
        if (monitorsResponse.success && monitorsResponse.monitors) {
          const monitorsWithSelection = monitorsResponse.monitors.map(monitor => {
            // 在配置中查找对应ID的监控项
            let isSelected = false;
            
            if (configData && configData.monitors && Array.isArray(configData.monitors)) {
              // 查找配置中的对应监控项
              const configMonitor = configData.monitors.find(m => m.id === monitor.id);
              if (configMonitor) {
                console.log(`找到配置中的监控项: ${monitor.name}(${monitor.id}), 原始选中状态:`, configMonitor.selected);
                // 确保严格布尔值比较
                isSelected = configMonitor.selected === true;
                console.log(`处理后的选中状态: ${isSelected}`);
              } else {
                console.log(`未在配置中找到监控项: ${monitor.name}(${monitor.id})`);
              }
            }
            
            console.log(`最终监控项处理结果: ${monitor.name}(${monitor.id}) - 选中状态: ${isSelected}`);
            
            return {
              ...monitor,
              selected: isSelected
            };
          });
          
          console.log('处理后的监控项列表:', monitorsWithSelection.map(m => ({
            id: m.id,
            name: m.name,
            selected: m.selected
          })));
          
          // 获取客户端数据
          console.log('开始获取所有客户端...');
          const agentsResponse = await getAllAgents();
          if (agentsResponse.success && agentsResponse.agents) {
            const agentsWithSelection = agentsResponse.agents.map((agent: Agent) => {
              // 在配置中查找对应ID的客户端
              let isSelected = false;
              
              if (configData && configData.agents && Array.isArray(configData.agents)) {
                // 查找配置中的对应客户端
                const configAgent = configData.agents.find(a => a.id === agent.id);
                if (configAgent) {
                  console.log(`找到配置中的客户端: ${agent.name}(${agent.id}), 原始选中状态:`, configAgent.selected);
                  // 确保严格布尔值比较
                  isSelected = configAgent.selected === true;
                  console.log(`处理后的选中状态: ${isSelected}`);
                } else {
                  console.log(`未在配置中找到客户端: ${agent.name}(${agent.id})`);
                }
              }
              
              console.log(`最终客户端处理结果: ${agent.name}(${agent.id}) - 选中状态: ${isSelected}`);
              
              return {
                ...agent,
                selected: isSelected
              };
            });
            
            console.log('处理后的客户端列表:', agentsWithSelection.map((a: AgentWithSelection) => ({
              id: a.id,
              name: a.name,
              selected: a.selected
            })));
            
            setConfig(prev => ({
              ...prev,
              title: configData?.title || '系统状态',
              description: configData?.description || '实时监控系统状态',
              logoUrl: configData?.logoUrl || '',
              customCss: configData?.customCss || '',
              monitors: monitorsWithSelection,
              agents: agentsWithSelection
            }));
          }
        } else {
          console.error('获取监控数据失败');
          setError('获取监控数据失败');
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        setError('获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && config.monitors.length > 0) {
      console.log('=====================');
      console.log('状态页配置加载完成，验证监控项选中状态:');
      config.monitors.forEach(monitor => {
        console.log(`- ${monitor.name}(ID: ${monitor.id}): ${monitor.selected ? '已选中' : '未选中'}`);
      });
      console.log('=====================');
    }
  }, [loading, config.monitors]);

  // 处理表单字段变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理监控选择变化
  const handleMonitorChange = (id: number, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      monitors: prev.monitors.map(monitor => 
        monitor.id === id ? { ...monitor, selected: checked } : monitor
      )
    }));
  };

  // 处理客户端监控选择变化
  const handleAgentChange = (id: number, checked: boolean) => {
    // 确保id是有效的数字
    if (isNaN(id) || id <= 0) {
      console.error('尝试更改无效的客户端ID:', id);
      return;
    }
    
    setConfig(prev => ({
      ...prev,
      agents: prev.agents.map(agent => 
        agent.id === id ? { ...agent, selected: checked } : agent
      )
    }));
  };

  // 复制公共URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(config.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    try {
      // 构建要保存的配置对象
      const configToSave: StatusConfig = {
        title: config.title,
        description: config.description,
        logoUrl: config.logoUrl,
        customCss: config.customCss,
        monitors: config.monitors.filter(m => m.selected).map(m => m.id),
        agents: config.agents.filter(a => a.selected).map(a => a.id)
      };
      
      // 调试日志
      console.log('准备保存配置对象:', configToSave);
      console.log('选中的监控项:', config.monitors.filter(m => m.selected));
      console.log('选中的监控项ID列表:', configToSave.monitors);
      
      // 调用API保存配置
      console.log('开始调用保存配置API...');
      const response = await saveStatusPageConfig(configToSave);
      console.log('保存配置API响应:', response);
      
      if (response.success) {
        setToastMessage('状态页配置已保存');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        setToastMessage(response.message || '保存状态页配置失败');
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (err) {
      console.error('保存状态页配置错误:', err);
      setToastMessage('保存状态页配置失败');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // 预览状态页
  const handlePreview = () => {
    // 在新标签页中打开状态页
    window.open('/status', '_blank');
  };

  // 错误显示
  if (error) {
    return (
      <Box>
        <div className="page-container detail-page">
          <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
            <Text size="3" style={{ color: 'var(--red-9)' }}>{error}</Text>
            <Button variant="soft" onClick={() => window.location.reload()} ml="2">
              重试
            </Button>
          </Flex>
        </div>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <div className="page-container detail-page">
          <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
            <Text size="3">加载中...</Text>
          </Flex>
        </div>
      </Box>
    );
  }

  return (
    <Box>
      <Theme appearance="light" accentColor="blue">
        <Container>
          <div className="page-container detail-page">
            {/* 美化顶部导航栏 */}
            <Box mb="6">
              <Flex justify="between" align="center" className="detail-header" py="4">
                <Flex align="center" gap="3">
                  <Button variant="soft" size="2" radius="full" onClick={() => navigate('/dashboard')}>
                    <ArrowLeftIcon width="18" height="18" />
                  </Button>
                  <Heading size="6" weight="medium">状态页配置</Heading>
                </Flex>
                <Flex gap="3">
                  <Button variant="soft" size="3" highContrast onClick={handlePreview}>
                    <EyeOpenIcon width="16" height="16" />
                    <Text ml="2">预览状态页</Text>
                    <ExternalLinkIcon width="14" height="14" style={{ marginLeft: '4px' }} />
                  </Button>
                  <Button size="3" variant="solid" onClick={handleSave} disabled={saving}>
                    {saving ? '保存中...' : '保存配置'}
                  </Button>
                </Flex>
              </Flex>
              <Separator size="4" mb="4" color="gray" />
            </Box>

            <div className="detail-content">
              <Card size="2">
                <Tabs.Root defaultValue="general">
                  <Tabs.List>
                    <Tabs.Trigger value="general">基本设置</Tabs.Trigger>
                    <Tabs.Trigger value="services">API服务设置</Tabs.Trigger>
                    <Tabs.Trigger value="agents">客户端设置</Tabs.Trigger>
                    <Tabs.Trigger value="appearance">外观设置</Tabs.Trigger>
                  </Tabs.List>

                  <Box pt="6" px="1">
                    <Tabs.Content value="general">
                      <Flex direction="column" gap="5">
                        <Box>
                          <Text as="label" size="2" weight="medium" style={{ marginBottom: '6px', display: 'block' }}>
                            状态页标题
                          </Text>
                          <TextField.Input
                            value={config.title}
                            onChange={handleChange}
                            placeholder="输入状态页标题"
                            size="3"
                          />
                        </Box>

                        <Box>
                          <Text as="label" size="2" weight="medium" style={{ marginBottom: '6px', display: 'block' }}>
                            状态页描述
                          </Text>
                          <TextArea
                            name="description"
                            value={config.description}
                            onChange={handleChange}
                            placeholder="输入状态页描述"
                            style={{ minHeight: '80px' }}
                            size="3"
                          />
                        </Box>

                        <Box>
                          <Text as="label" size="2" weight="medium" style={{ marginBottom: '6px', display: 'block' }}>
                            公共访问URL
                          </Text>
                          <Flex gap="2">
                            <TextField.Input
                              value={config.publicUrl}
                              readOnly
                              style={{ flex: 1 }}
                              size="3"
                            />
                            <Button variant="soft" size="3" onClick={handleCopyUrl}>
                              {copied ? <CheckIcon /> : <CopyIcon />}
                              <Text ml="2">{copied ? '已复制' : '复制'}</Text>
                            </Button>
                          </Flex>
                          <Text size="1" color="gray" style={{ marginTop: '8px' }}>
                            此URL可以公开分享，无需登录即可访问
                          </Text>
                        </Box>

                        <Box style={{ background: 'var(--blue-2)', padding: '12px', borderRadius: '6px' }}>
                          <Text as="div" size="2" color="blue">
                            注意：如果您没有选择任何API服务或客户端，对应的部分将不会在状态页上显示。
                          </Text>
                        </Box>
                      </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="services">
                      <Flex direction="column" gap="5">
                        <Text size="2" color="gray" mb="3">选择要在状态页上显示的API服务</Text>
                        
                        {config.monitors.length === 0 ? (
                          <Text color="gray">暂无API服务</Text>
                        ) : (
                          <Box>
                            {config.monitors.map(monitor => {
                              console.log(`【服务渲染】${monitor.name}(${monitor.id}), 选中状态: ${monitor.selected}`);
                              return (
                                <Flex key={monitor.id} align="center" justify="between" className="service-item">
                                  <Text size="3">{monitor.name}</Text>
                                  <div className="custom-checkbox">
                                    <input 
                                      type="checkbox"
                                      id={`monitor-${monitor.id}`}
                                      checked={monitor.selected}
                                      onChange={(e) => {
                                        console.log(`监控项状态变更: ${monitor.name}(${monitor.id}), 从 ${monitor.selected} 变为 ${e.target.checked}`);
                                        handleMonitorChange(monitor.id, e.target.checked);
                                      }}
                                    />
                                    <label htmlFor={`monitor-${monitor.id}`} className={monitor.selected ? 'checked' : ''}></label>
                                  </div>
                                </Flex>
                              );
                            })}
                          </Box>
                        )}
                      </Flex>
                    </Tabs.Content>
                    
                    <Tabs.Content value="agents">
                      <Flex direction="column" gap="5">
                        <Text size="2" color="gray" mb="3">选择要在状态页上显示的客户端</Text>
                        
                        {config.agents.length === 0 ? (
                          <Text color="gray">暂无客户端</Text>
                        ) : (
                          <Box>
                            {config.agents.map(agent => {
                              console.log(`【客户端渲染】${agent.name}(${agent.id}), 选中状态: ${agent.selected}`);
                              return (
                                <Flex key={agent.id} align="center" justify="between" className="service-item">
                                  <Text size="3">{agent.name}</Text>
                                  <div className="custom-checkbox">
                                    <input 
                                      type="checkbox"
                                      id={`agent-${agent.id}`}
                                      checked={agent.selected}
                                      onChange={(e) => {
                                        console.log(`客户端状态变更: ${agent.name}(${agent.id}), 从 ${agent.selected} 变为 ${e.target.checked}`);
                                        handleAgentChange(agent.id, e.target.checked);
                                      }}
                                    />
                                    <label htmlFor={`agent-${agent.id}`} className={agent.selected ? 'checked' : ''}></label>
                                  </div>
                                </Flex>
                              );
                            })}
                          </Box>
                        )}
                      </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="appearance">
                      <Flex direction="column" gap="5">
                        <Box>
                          <Text as="label" size="2" weight="medium" style={{ marginBottom: '6px', display: 'block' }}>
                            Logo URL (可选)
                          </Text>
                          <TextField.Input
                            name="logoUrl"
                            value={config.logoUrl}
                            onChange={handleChange}
                            placeholder="输入logo图片的URL"
                            size="3"
                          />
                        </Box>

                        <Box>
                          <Text as="label" size="2" weight="medium" style={{ marginBottom: '6px', display: 'block' }}>
                            自定义CSS (可选)
                          </Text>
                          <TextArea
                            name="customCss"
                            value={config.customCss}
                            onChange={handleChange}
                            placeholder="输入自定义CSS样式"
                            style={{ 
                              minHeight: '150px',
                              fontFamily: 'monospace'
                            }}
                            size="3"
                          />
                          <Text size="1" color="gray" style={{ marginTop: '8px' }}>
                            高级用户可以添加自定义CSS来修改状态页的外观
                          </Text>
                        </Box>
                      </Flex>
                    </Tabs.Content>
                  </Box>
                </Tabs.Root>
              </Card>
            </div>
          </div>

          {/* Toast 提示 */}
          <Toast.Provider swipeDirection="right">
            <Toast.Viewport className="ToastViewport" />
            
            {showSuccessToast && (
              <Toast.Root className="ToastRoot" duration={3000} style={{ backgroundColor: 'var(--green-9)', borderRadius: '8px' }}>
                <div className="ToastContent">
                  <div className="ToastIcon" style={{ backgroundColor: 'var(--green-10)', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon color="white" width="18" height="18" />
                  </div>
                  <div className="ToastText">
                    <div className="ToastTitle" style={{ fontSize: '15px', fontWeight: '600' }}>操作成功</div>
                    <div className="ToastDescription" style={{ fontSize: '13px', opacity: '0.9' }}>{toastMessage}</div>
                  </div>
                  <Toast.Close className="ToastClose" style={{ opacity: '0.8', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }} aria-label="关闭">
                    ×
                  </Toast.Close>
                </div>
              </Toast.Root>
            )}

            {showErrorToast && (
              <Toast.Root className="ToastRoot" duration={3000} style={{ backgroundColor: 'var(--red-9)', borderRadius: '8px' }}>
                <div className="ToastContent">
                  <div className="ToastIcon" style={{ backgroundColor: 'var(--red-10)', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 0.875C3.83475 0.875 0.875 3.83475 0.875 7.5C0.875 11.1652 3.83475 14.125 7.5 14.125C11.1652 14.125 14.125 11.1652 14.125 7.5C14.125 3.83475 11.1652 0.875 7.5 0.875ZM7.5 8.5C6.94772 8.5 6.5 8.05228 6.5 7.5C6.5 6.94772 6.94772 6.5 7.5 6.5C8.05228 6.5 8.5 6.94772 8.5 7.5C8.5 8.05228 8.05228 8.5 7.5 8.5ZM6.75 4.25L7 6.25H8L8.25 4.25H6.75Z" fill="white" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ToastText">
                    <div className="ToastTitle" style={{ fontSize: '15px', fontWeight: '600' }}>操作失败</div>
                    <div className="ToastDescription" style={{ fontSize: '13px', opacity: '0.9' }}>{toastMessage}</div>
                  </div>
                  <Toast.Close className="ToastClose" style={{ opacity: '0.8', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }} aria-label="关闭">
                    ×
                  </Toast.Close>
                </div>
              </Toast.Root>
            )}
          </Toast.Provider>
        </Container>
      </Theme>
    </Box>
  );
};

export default StatusPageConfig; 