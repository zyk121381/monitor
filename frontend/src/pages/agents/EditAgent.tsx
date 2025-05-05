import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  TextField,
} from "@radix-ui/themes";
import { ArrowLeftIcon, Cross2Icon } from "@radix-ui/react-icons";
import * as Toast from "@radix-ui/react-toast";
import { getAgent, updateAgent } from "../../api/agents";
import { useTranslation } from "react-i18next";

const EditAgent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [formData, setFormData] = useState<{
    name: string;
    status: "active" | "inactive" | "connecting" | "unknown";
  }>({
    name: "",
    status: "inactive",
  });
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchAgentData();
    }
  }, [id]);

  const fetchAgentData = async () => {
    setLoading(true);

    const response = await getAgent(Number(id));

    if (response.success && response.agent) {
      const agent = response.agent;

      setFormData({
        name: agent.name,
        status: agent.status || "inactive",
      });
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 准备提交数据 - 只包含名称
    const payload = {
      name: formData.name,
    };

    // 调用API更新客户端
    const response = await updateAgent(Number(id), payload);

    if (response.success) {
      setToastMessage(t("agent.form.updateSuccess"));
      setToastType("success");
      setToastOpen(true);

      // 短暂延迟后导航，让用户有时间看到提示
      setTimeout(() => {
        navigate("/agents");
      }, 1500);
    }
    setLoading(false);
  };

  if (notFound) {
    return (
      <Box>
        <Flex justify="center" align="center" style={{ minHeight: "60vh" }}>
          <Card>
            <Flex direction="column" align="center" gap="4" p="4">
              <Heading size="6">{t("agents.notFound")}</Heading>
              <Text>{t("agents.notFoundId", { id })}</Text>
              <Button onClick={() => navigate("/agents")}>
                {t("common.backToList")}
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <div className="page-container detail-page">
        <Flex justify="between" align="center" className="detail-header">
          <Flex align="center" gap="2">
            <Button
              variant="soft"
              size="1"
              onClick={() => navigate(`/agents/${id}`)}
            >
              <ArrowLeftIcon />
            </Button>
            <Heading size="6">
              {t("agent.form.editingClient", { name: formData.name })}
            </Heading>
          </Flex>
        </Flex>

        <div className="detail-content">
          <Card>
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="4">
                <Box mb="4">
                  <Text as="label" size="2" mb="1" weight="bold">
                    {t("agent.form.name")}{" "}
                    <Text size="2" color="red">
                      *
                    </Text>
                  </Text>
                  <TextField.Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("agent.form.namePlaceholder")}
                    required
                  />
                  <Text size="1" color="gray" mt="1">
                    {t("agent.form.nameHelp")}
                  </Text>
                </Box>

                <Flex justify="end" mt="4" gap="2">
                  <Button
                    variant="soft"
                    onClick={() => navigate(`/agents/${id}`)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? t("common.savingChanges")
                      : t("common.saveChanges")}
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Card>
        </div>

        <Toast.Provider swipeDirection="right">
          <Toast.Root
            className="ToastRoot"
            open={toastOpen}
            onOpenChange={setToastOpen}
            duration={2000}
            style={{
              backgroundColor:
                toastType === "success" ? "var(--green-9)" : "var(--red-9)",
              borderRadius: "8px",
            }}
          >
            <Toast.Title className="ToastTitle">
              {toastType === "success"
                ? t("common.success")
                : t("common.error")}
            </Toast.Title>
            <Toast.Description className="ToastDescription">
              {toastMessage}
            </Toast.Description>
            <Toast.Close className="ToastClose">
              <Cross2Icon />
            </Toast.Close>
          </Toast.Root>
          <Toast.Viewport className="ToastViewport" />
        </Toast.Provider>
      </div>
    </Box>
  );
};

export default EditAgent;
