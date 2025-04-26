import React, { useState } from 'react';
import { Box, Flex, Tooltip, Dialog } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';
import { MonitorStatusHistory } from '../types/monitors';

interface StatusBarProps {
  status: string;
  uptime: number;
  history?: MonitorStatusHistory[];
}

/**
 * 状态条组件 - 展示监控状态历史的时间轴格子
 */
const StatusBar: React.FC<StatusBarProps> = ({ status, history = [] }) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(<div />);
  
  // 根据状态或百分比确定颜色
  const getColor = (value: string | number, isHover = false) => {
    // 如果值是百分比字符串，转换为数字
    const numValue = typeof value === 'string' 
      ? parseFloat(value) 
      : typeof value === 'number' ? value : 0;
    
    // 根据状态或百分比确定颜色
    if (typeof value === 'string') {
      switch (value) {
        case 'up':
          return isHover ? 'var(--green-6)' : 'var(--green-5)';
        case 'down':
          return isHover ? 'var(--red-6)' : 'var(--red-5)';
        default:
          return isHover ? 'var(--gray-6)' : 'var(--gray-5)';
      }
    } else {
      // 根据百分比确定颜色
      if (numValue >= 99) {
        return isHover ? 'var(--green-6)' : 'var(--green-5)';
      } else if (numValue >= 95) {
        return isHover ? 'var(--yellow-6)' : 'var(--yellow-5)';
      } else if (numValue >= 90) {
        return isHover ? 'var(--orange-6)' : 'var(--orange-5)';
      } else {
        return isHover ? 'var(--red-6)' : 'var(--red-5)';
      }
    }
  };

  // 最多显示90个时间点
  const maxPoints = 90;
  
  // 获取最近的历史记录
  let displayHistory = history.slice(-maxPoints);
  
  // 如果历史记录为空，创建一个初始状态记录
  if (displayHistory.length === 0) {
    displayHistory = [{
      id: 0,
      monitor_id: 0,
      status: status as 'up' | 'down',
      response_time: 0,
      timestamp: new Date().toISOString()
    }];
  }
  
  // 计算每个格子的宽度
  const boxWidth = `${100 / Math.min(maxPoints, displayHistory.length)}%`;
  
  // 显示详细信息对话框
  const showDialog = (item: MonitorStatusHistory) => {
    const statusText = item.status === 'up' 
      ? t('monitor.status.normal') 
      : t('monitor.status.failure');
    
    // 确保timestamp存在，否则使用当前时间
    const timestamp = item.timestamp ? new Date(item.timestamp) : new Date();
    
    setDialogTitle(`🔍 ${statusText} - ${timestamp.toLocaleString()}`);
    setDialogContent(
      <Box p="4">
        <p>{t('common.status')}: {statusText}</p>
        <p>{t('monitor.history.time')}: {timestamp.toLocaleString()}</p>
        <p>{t('monitor.history.responseTime')}: {item.response_time}ms</p>
      </Box>
    );
    setDialogOpen(true);
  };
  
  return (
    <>
      {/* 状态历史条 */}
      <Flex gap="1" style={{ width: '100%', overflow: 'hidden' }}>
        {displayHistory.map((item, index) => {
          // 确保timestamp存在，否则使用当前时间
          const timestamp = item.timestamp ? new Date(item.timestamp) : new Date();
          
          return (
            <Tooltip 
              key={item.id || `empty-${index}`}
              content={
                <Box>
                  <div>{t('common.status')}: {
                    item.status === 'up' 
                      ? t('monitor.status.normal') 
                      : item.status === 'down' 
                        ? t('monitor.status.failure') 
                        : t('monitor.status.pending')
                  }</div>
                  <div>{t('monitor.history.time')}: {timestamp.toLocaleString()}</div>
                </Box>
              }
            >
              <Box
                style={{
                  width: boxWidth,
                  height: '150px',
                  backgroundColor: getColor(item.status),
                  borderRadius: '2px',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => showDialog(item)}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.backgroundColor = getColor(item.status, true);
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.backgroundColor = getColor(item.status);
                }}
              />
            </Tooltip>
          );
        })}
      </Flex>

      {/* 详细信息对话框 */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Content style={{ maxWidth: '450px' }}>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Description>{dialogContent}</Dialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <button style={{ cursor: 'pointer', padding: '6px 12px' }}>
                {t('common.close')}
              </button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default StatusBar; 