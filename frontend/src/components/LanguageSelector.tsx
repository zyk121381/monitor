import React from "react";
import { DropdownMenu, Button, Text, Flex } from "@radix-ui/themes";
import { GlobeIcon, CheckIcon } from "@radix-ui/react-icons";
import { useLanguage } from "../providers/LanguageProvider";
import { useTranslation } from "react-i18next";

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { t } = useTranslation();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost" size="2" className="nav-button">
          <Flex align="center" gap="1">
            <GlobeIcon width="14" height="14" />
            <Text size="2" className="language-text">
              {currentLanguage === "zh-CN" ? "中文" : "English"}
            </Text>
          </Flex>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        {availableLanguages.map((lang) => (
          <DropdownMenu.Item
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
          >
            <Flex
              gap="2"
              align="center"
              justify="between"
              style={{ width: "100%" }}
            >
              <Text size="2">
                {t(`language.${lang.code.replace("-", "")}`)}
              </Text>
              {currentLanguage === lang.code && (
                <CheckIcon width="14" height="14" />
              )}
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default LanguageSelector;
