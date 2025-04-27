/**
 * 工具函数集合
 */

/**
 * 格式化日期
 * @param dateString 日期字符串
 * @param locale 地区设置
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  dateString: string,
  locale: string = "zh-CN"
): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * 截断文本
 * @param text 需要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间(毫秒)
 * @returns 防抖处理后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);

    timeout = window.setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * 节流函数
 * @param func 要执行的函数
 * @param limit 时间限制(毫秒)
 * @returns 节流处理后的函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 获取查询参数
 * @param search 查询字符串
 * @returns 查询参数对象
 */
export const getQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  return JSON.parse(JSON.stringify(obj));
};

/**
 * 随机ID生成器
 * @param length ID长度
 * @returns 随机ID
 */
export const generateId = (length: number = 8): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};
