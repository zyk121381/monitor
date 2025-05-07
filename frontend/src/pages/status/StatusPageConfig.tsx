import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Card,
  Button,
  TextField,
  TextArea,
  Tabs,
  Container,
} from "@radix-ui/themes";
import { EyeOpenIcon, CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import * as Toast from "@radix-ui/react-toast";
import {
  getStatusPageConfig,
  saveStatusPageConfig,
} from "../../api/status";
import { StatusPageConfig as StatusConfig } from "../../types/status";
import "../../styles/components.css";
import { useTranslation } from "react-i18next";

// 监控项带选择状态
interface MonitorWithSelection {
  id: number;
  name: string;
  selected: boolean;
}

// 客户端带选择状态
interface AgentWithSelection {
  id: number;
  name: string;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  // 初始化配置对象
  const [config, setConfig] = useState<StatusConfigWithDetails>({
    title: t("statusPage.title"),
    description: t("statusPage.allOperational"),
    logoUrl: "",
    customCss: "",
    publicUrl: window.location.origin + "/status",
    monitors: [],
    agents: [],
  });

  // 从API获取数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 获取状态页配置
    setLoading(true);
    console.log(t("statusPageConfig.fetchingConfig"));
    const configResponse = await getStatusPageConfig();
    console.log(
      "==== 状态页配置API响应 ====",
      JSON.stringify(configResponse, null, 2)
    );

    // 如果获取到有效的配置数据，直接使用
    if (configResponse) {
      setConfig((prev) => ({
        ...prev,
        title: configResponse?.title || t("statusPage.title"),
        description:
          configResponse?.description || t("statusPage.allOperational"),
        logoUrl: configResponse?.logoUrl || "",
        customCss: configResponse?.customCss || "",
        monitors: configResponse.monitors || [],
        agents: configResponse.agents || [],
      }));
    }
    setLoading(false);
  };

  // 处理表单字段变化
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 处理监控选择变化
  const handleMonitorChange = (id: number, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      monitors: prev.monitors.map((monitor) =>
        monitor.id === id ? { ...monitor, selected: checked } : monitor
      ),
    }));
  };

  // 处理客户端监控选择变化
  const handleAgentChange = (id: number, checked: boolean) => {
    // 确保id是有效的数字
    if (isNaN(id) || id <= 0) {
      console.error(t("statusPageConfig.invalidAgentId"), id);
      return;
    }

    setConfig((prev) => ({
      ...prev,
      agents: prev.agents.map((agent) =>
        agent.id === id ? { ...agent, selected: checked } : agent
      ),
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
    // 构建要保存的配置对象
    const configToSave: StatusConfig = {
      title: config.title,
      description: config.description,
      logoUrl: config.logoUrl,
      customCss: config.customCss,
      monitors: config.monitors
        .filter((m: MonitorWithSelection) => m.selected)
        .map((m: MonitorWithSelection) => m.id),
      agents: config.agents
        .filter((a: AgentWithSelection) => a.selected)
        .map((a: AgentWithSelection) => a.id),
    };

    const response = await saveStatusPageConfig(configToSave);

    if (response) {
      setToastMessage(t("statusPageConfig.configSaved"));
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } else {
      setToastMessage(response || t("statusPageConfig.saveError"));
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    }
    setSaving(false);
  };

  // 预览状态页
  const handlePreview = () => {
    // 在新标签页中打开状态页
    window.open("/status", "_blank");
  };

  if (loading) {
    return (
      <Box>
        <div className="page-container detail-page">
          <Flex justify="center" align="center" style={{ minHeight: "50vh" }}>
            <Text size="3">{t("common.loading")}</Text>
          </Flex>
        </div>
      </Box>
    );
  }

  return (
    <Box>
      <Container>
        <div className="page-container detail-page">
          {/* 美化顶部导航栏 */}
          <Box mb="5">
            <Flex
              justify="between"
              align="center"
              className="detail-header"
              py="3"
            >
              <Flex align="center" gap="2">
                <Heading size="5" weight="medium">
                  {t("statusPageConfig.title")}
                </Heading>
              </Flex>
              <Flex gap="3" align="center">
                <Button
                  variant="ghost"
                  size="2"
                  className="nav-button config-button"
                  onClick={handlePreview}
                >
                  <EyeOpenIcon width="16" height="16" />
                  <Text size="2">{t("statusPageConfig.preview")}</Text>
                </Button>
                <Button
                  variant="soft"
                  size="2"
                  className="nav-button config-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
                            fill="currentColor"
                          >
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              dur="0.75s"
                              values="0 12 12;360 12 12"
                              repeatCount="indefinite"
                            />
                          </path>
                        </svg>
                      </span>
                      <Text size="2">{t("common.savingChanges")}</Text>
                    </>
                  ) : (
                    <>
                      <CheckIcon width="16" height="16" />
                      <Text size="2">{t("statusPageConfig.save")}</Text>
                    </>
                  )}
                </Button>
              </Flex>
            </Flex>
          </Box>

          <div className="detail-content">
            <Card size="2">
              <Tabs.Root defaultValue="general" className="config-tabs">
                <Tabs.List className="config-tabs-list">
                  <Tabs.Trigger value="general" className="tab-trigger">
                    {t("statusPageConfig.general")}
                  </Tabs.Trigger>
                  <Tabs.Trigger value="services" className="tab-trigger">
                    {t("statusPageConfig.services")}
                  </Tabs.Trigger>
                  <Tabs.Trigger value="agents" className="tab-trigger">
                    {t("statusPageConfig.agents")}
                  </Tabs.Trigger>
                </Tabs.List>

                <Box pt="5" px="2" className="tab-content-container">
                  <Tabs.Content value="general" className="tab-content">
                    <Flex direction="column" gap="5">
                      <Box>
                        <Text
                          as="label"
                          size="2"
                          weight="medium"
                          style={{ marginBottom: "6px", display: "block" }}
                        >
                          {t("statusPageConfig.pageTitle")}
                        </Text>
                        <TextField.Input
                          name="title"
                          value={config.title}
                          onChange={handleChange}
                          placeholder={t(
                            "statusPageConfig.pageTitlePlaceholder"
                          )}
                          size="3"
                        />
                      </Box>

                      <Box>
                        <Text
                          as="label"
                          size="2"
                          weight="medium"
                          style={{ marginBottom: "6px", display: "block" }}
                        >
                          {t("statusPageConfig.pageDescription")}
                        </Text>
                        <TextArea
                          name="description"
                          value={config.description}
                          onChange={handleChange}
                          placeholder={t(
                            "statusPageConfig.pageDescriptionPlaceholder"
                          )}
                          style={{ minHeight: "80px" }}
                          size="3"
                        />
                      </Box>

                      <Box>
                        <Text
                          as="label"
                          size="2"
                          weight="medium"
                          style={{ marginBottom: "6px", display: "block" }}
                        >
                          {t("statusPageConfig.publicUrl")}
                        </Text>
                        <Flex gap="2">
                          <Box style={{ flex: 1, position: "relative" }}>
                            <TextField.Input
                              value={config.publicUrl}
                              readOnly
                              style={{
                                width: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                paddingRight: "16px",
                              }}
                              size="3"
                            />
                          </Box>
                          <Button
                            variant="ghost"
                            size="2"
                            className="nav-button copy-button"
                            onClick={handleCopyUrl}
                          >
                            {copied ? (
                              <>
                                <CheckIcon width="16" height="16" />
                                <Text size="2">{t("common.copied")}</Text>
                              </>
                            ) : (
                              <>
                                <CopyIcon width="16" height="16" />
                                <Text size="2">{t("common.copy")}</Text>
                              </>
                            )}
                          </Button>
                        </Flex>
                        <Text
                          size="1"
                          color="gray"
                          style={{
                            marginTop: "6px",
                            display: "block",
                            lineHeight: "1.5",
                          }}
                        >
                          {t("statusPageConfig.publicUrlHelp")}
                        </Text>
                      </Box>

                      <Box
                        style={{
                          background: "var(--gray-2)",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          marginTop: "4px",
                        }}
                      >
                        <Text
                          as="div"
                          size="2"
                          color="gray"
                          style={{ lineHeight: "1.5" }}
                        >
                          {t("statusPageConfig.selectionNote")}
                        </Text>
                      </Box>
                    </Flex>
                  </Tabs.Content>

                  <Tabs.Content value="services" className="tab-content">
                    <Flex direction="column" gap="5">
                      <Text size="2" color="gray" mb="3">
                        {t("statusPageConfig.selectServicesPrompt")}
                      </Text>

                      {config.monitors.length === 0 ? (
                        <Text color="gray">{t("monitors.noMonitors")}</Text>
                      ) : (
                        <Box>
                          {config.monitors.map((monitor) => {
                            console.log(
                              `【${t("statusPageConfig.serviceRendering")}】${
                                monitor.name
                              }(${monitor.id}), ${t(
                                "statusPageConfig.selectedStatus"
                              )}: ${monitor.selected}`
                            );
                            return (
                              <Flex
                                key={monitor.id}
                                align="center"
                                justify="between"
                                className="service-item"
                              >
                                <Text size="3">{monitor.name}</Text>
                                <div className="custom-checkbox">
                                  <input
                                    type="checkbox"
                                    id={`monitor-${monitor.id}`}
                                    checked={monitor.selected}
                                    onChange={(e) => {
                                      console.log(
                                        `${t(
                                          "statusPageConfig.monitorStatusChange"
                                        )}: ${monitor.name}(${monitor.id}), ${t(
                                          "statusPageConfig.from"
                                        )} ${monitor.selected} ${t(
                                          "statusPageConfig.to"
                                        )} ${e.target.checked}`
                                      );
                                      handleMonitorChange(
                                        monitor.id,
                                        e.target.checked
                                      );
                                    }}
                                  />
                                  <label
                                    htmlFor={`monitor-${monitor.id}`}
                                    className={
                                      monitor.selected ? "checked" : ""
                                    }
                                  ></label>
                                </div>
                              </Flex>
                            );
                          })}
                        </Box>
                      )}
                    </Flex>
                  </Tabs.Content>

                  <Tabs.Content value="agents" className="tab-content">
                    <Flex direction="column" gap="5">
                      <Text size="2" color="gray" mb="3">
                        {t("statusPageConfig.selectAgentsPrompt")}
                      </Text>

                      {config.agents.length === 0 ? (
                        <Text color="gray">{t("agents.noAgents")}</Text>
                      ) : (
                        <Box>
                          {config.agents.map((agent) => {
                            console.log(
                              `【${t("statusPageConfig.agentRendering")}】${
                                agent.name
                              }(${agent.id}), ${t(
                                "statusPageConfig.selectedStatus"
                              )}: ${agent.selected}`
                            );
                            return (
                              <Flex
                                key={agent.id}
                                align="center"
                                justify="between"
                                className="service-item"
                              >
                                <Text size="3">{agent.name}</Text>
                                <div className="custom-checkbox">
                                  <input
                                    type="checkbox"
                                    id={`agent-${agent.id}`}
                                    checked={agent.selected}
                                    onChange={(e) => {
                                      console.log(
                                        `${t(
                                          "statusPageConfig.agentStatusChange"
                                        )}: ${agent.name}(${agent.id}), ${t(
                                          "statusPageConfig.from"
                                        )} ${agent.selected} ${t(
                                          "statusPageConfig.to"
                                        )} ${e.target.checked}`
                                      );
                                      handleAgentChange(
                                        agent.id,
                                        e.target.checked
                                      );
                                    }}
                                  />
                                  <label
                                    htmlFor={`agent-${agent.id}`}
                                    className={agent.selected ? "checked" : ""}
                                  ></label>
                                </div>
                              </Flex>
                            );
                          })}
                        </Box>
                      )}
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
            <Toast.Root
              className="ToastRoot"
              duration={3000}
              style={{ backgroundColor: "var(--green-9)", borderRadius: "8px" }}
            >
              <div className="ToastContent">
                <div
                  className="ToastIcon"
                  style={{
                    backgroundColor: "var(--green-10)",
                    borderRadius: "50%",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckIcon color="white" width="18" height="18" />
                </div>
                <div className="ToastText">
                  <div
                    className="ToastTitle"
                    style={{ fontSize: "15px", fontWeight: "600" }}
                  >
                    {t("common.success")}
                  </div>
                  <div
                    className="ToastDescription"
                    style={{ fontSize: "13px", opacity: "0.9" }}
                  >
                    {toastMessage}
                  </div>
                </div>
                <Toast.Close
                  className="ToastClose"
                  style={{
                    opacity: "0.8",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "20px",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                  aria-label={t("common.close")}
                >
                  ×
                </Toast.Close>
              </div>
            </Toast.Root>
          )}

          {showErrorToast && (
            <Toast.Root
              className="ToastRoot"
              duration={3000}
              style={{ backgroundColor: "var(--red-9)", borderRadius: "8px" }}
            >
              <div className="ToastContent">
                <div
                  className="ToastIcon"
                  style={{
                    backgroundColor: "var(--red-10)",
                    borderRadius: "50%",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 0.875C3.83475 0.875 0.875 3.83475 0.875 7.5C0.875 11.1652 3.83475 14.125 7.5 14.125C11.1652 14.125 14.125 11.1652 14.125 7.5C14.125 3.83475 11.1652 0.875 7.5 0.875ZM7.5 8.5C6.94772 8.5 6.5 8.05228 6.5 7.5C6.5 6.94772 6.94772 6.5 7.5 6.5C8.05228 6.5 8.5 6.94772 8.5 7.5C8.5 8.05228 8.05228 8.5 7.5 8.5ZM6.75 4.25L7 6.25H8L8.25 4.25H6.75Z"
                      fill="white"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <div className="ToastText">
                  <div
                    className="ToastTitle"
                    style={{ fontSize: "15px", fontWeight: "600" }}
                  >
                    {t("common.error")}
                  </div>
                  <div
                    className="ToastDescription"
                    style={{ fontSize: "13px", opacity: "0.9" }}
                  >
                    {toastMessage}
                  </div>
                </div>
                <Toast.Close
                  className="ToastClose"
                  style={{
                    opacity: "0.8",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "20px",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                  aria-label={t("common.close")}
                >
                  ×
                </Toast.Close>
              </div>
            </Toast.Root>
          )}
        </Toast.Provider>
      </Container>
    </Box>
  );
};

export default StatusPageConfig;
