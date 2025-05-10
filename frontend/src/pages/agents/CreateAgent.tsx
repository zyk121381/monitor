import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  Code,
  Separator,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { generateToken } from "../../api/agents";
import { useTranslation } from "react-i18next";
import { ENV_API_BASE_URL } from "../../config";

const CreateAgent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  // 获取当前浏览器访问的地址作为服务端地址
  const serverUrl = ENV_API_BASE_URL;
  const { t } = useTranslation();

  // State for copy buttons
  const [serverUrlCopied, setServerUrlCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [installCommandCopied, setInstallCommandCopied] = useState(false);

  // 生成服务端验证的 token
  useEffect(() => {
    // 获取当前访问的URL

    const fetchToken = async () => {
      setLoading(true);
      try {
        const response = await generateToken();
        if (response.success && response.token) {
          setToken(response.token);
        } else {
          console.error("获取 token 失败:", response.message);
        }
      } catch (error) {
        console.error("获取 token 失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  // 复制Server URL
  const handleCopyServerUrl = () => {
    navigator.clipboard.writeText(serverUrl);
    setServerUrlCopied(true);
    setTimeout(() => setServerUrlCopied(false), 2000);
  };

  // 复制token
  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  // 生成并复制安装命令
  const installScriptUrl =
    "https://gh-proxy.com/github.com/zaunist/xugou/blob/main/install-agent.sh";
  const oneLinerInstallCommand = `curl -sSL ${installScriptUrl} | bash -s -- --server ${serverUrl} --token ${token} --interval 60`;

  const handleCopyInstallCommand = () => {
    navigator.clipboard.writeText(oneLinerInstallCommand);
    setInstallCommandCopied(true);
    setTimeout(() => setInstallCommandCopied(false), 2000);
  };

  return (
    <Box>
      <div className="page-container detail-page">
        <Flex justify="between" align="center" className="detail-header">
          <Flex align="center" gap="2">
            <Button variant="soft" size="1" onClick={() => navigate("/agents")}>
              <ArrowLeftIcon />
            </Button>
            <Heading size="6">{t("agent.form.title.create")}</Heading>
          </Flex>
        </Flex>

        <div className="detail-content">
          <Card>
            <Flex direction="column" gap="5">
              {/* 提示信息 */}
              <Box
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  backgroundColor: "var(--accent-3)",
                  color: "var(--accent-11)",
                }}
              >
                <Flex gap="2">
                  <InfoCircledIcon />
                  <Text>{t("agent.add.note")}</Text>
                </Flex>
              </Box>

              {/* 服务端地址 */}
              <Box>
                <Text
                  as="label"
                  size="2"
                  weight="bold"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  {t("agent.add.serverAddress")}
                </Text>
                <Flex gap="2">
                  <Text
                    className="token-display"
                    style={{
                      padding: "10px",
                      backgroundColor: "var(--gray-3)",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      flex: 1,
                      overflowX: "auto",
                    }}
                  >
                    {serverUrl}
                  </Text>
                  <Button variant="soft" onClick={handleCopyServerUrl}>
                    {serverUrlCopied ? <CheckIcon /> : <CopyIcon />}
                    {serverUrlCopied ? t("common.copied") : t("common.copy")}
                  </Button>
                </Flex>
                <Text size="1" color="gray" style={{ marginTop: "6px" }}>
                  {t("agent.add.serverAddressHelp")}
                </Text>
              </Box>

              {/* 客户端Token */}
              <Box>
                <Text
                  as="label"
                  size="2"
                  weight="bold"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  {t("agent.add.registrationToken")}
                </Text>
                {loading ? (
                  <Text>{t("agent.add.generatingToken")}</Text>
                ) : (
                  <>
                    <Flex gap="2">
                      <Text
                        className="token-display"
                        style={{
                          padding: "10px",
                          backgroundColor: "var(--gray-3)",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontSize: "14px",
                          flex: 1,
                          overflowX: "auto",
                        }}
                      >
                        {token}
                      </Text>
                      <Button variant="soft" onClick={handleCopyToken}>
                        {tokenCopied ? <CheckIcon /> : <CopyIcon />}
                        {tokenCopied ? t("common.copied") : t("common.copy")}
                      </Button>
                    </Flex>
                    <Text size="1" color="gray" style={{ marginTop: "6px" }}>
                      {t("agent.add.tokenHelp")}
                    </Text>
                  </>
                )}
              </Box>

              <Separator size="4" />

              {/* 安装指南 */}
              <Box>
                <Flex align="baseline" gap="2" mb="3">
                  <Heading size="4">{t("agent.add.installGuide")}</Heading>
                  <Text size="2" color="gray">
                    {t(
                      "agent.add.installCommandHelpText",
                      "使用以下命令自动下载并安装 Agent："
                    )}
                  </Text>
                </Flex>

                <Card
                  variant="surface"
                  style={{ backgroundColor: "var(--gray-2)" }}
                >
                  <Flex direction="column" gap="3" p="3">
                    <Text as="div" size="2" weight="bold" mb="1">
                      {t(
                        "agent.add.oneLinerCommandTitle",
                        "一键安装命令 (Linux/macOS/Windows):"
                      )}
                    </Text>
                    <Code
                      size="2"
                      style={{
                        display: "block",
                        padding: "12px",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.5",
                        wordBreak: "break-all",
                      }}
                    >
                      {oneLinerInstallCommand}
                    </Code>
                    <Button
                      variant="soft"
                      onClick={handleCopyInstallCommand}
                      style={{ alignSelf: "flex-end" }}
                    >
                      {installCommandCopied ? <CheckIcon /> : <CopyIcon />}
                      {installCommandCopied
                        ? t("common.copied")
                        : t("common.copy")}
                    </Button>
                    <Text size="1" color="gray" style={{ marginTop: "4px" }}>
                      {t(
                        "agent.add.oneLinerCommandNote",
                        "注意: 此脚本在 Linux 上安装服务时需要 sudo 权限。Windows 用户请参考脚本内的提示手动下载。"
                      )}
                    </Text>
                  </Flex>
                </Card>
              </Box>

              {/* 返回按钮 */}
              <Flex justify="end" gap="3">
                <Button variant="soft" onClick={() => navigate("/agents")}>
                  {t("agent.add.returnToList")}
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
