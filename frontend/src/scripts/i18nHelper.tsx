import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 国际化高阶组件，为组件提供翻译函数
 * @param Component 需要包装的组件
 * @returns 包装后的组件，含有t函数
 */
export function withTranslation<P extends object>(
  Component: React.ComponentType<P & { t: (key: string) => string }>
): React.FC<P> {
  return (props: P) => {
    const { t } = useTranslation();
    return <Component {...props} t={t} />;
  };
}

/**
 * 获取本地化文本
 * @param key 翻译键
 * @returns 翻译后的文本
 */
export function getLocalizedText(key: string): string {
  const { t } = useTranslation();
  return t(key);
}

/**
 * 国际化上下文提供者组件
 */
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
}; 