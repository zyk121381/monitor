import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@radix-ui/themes';
import { MonitorStatusHistory } from '../types/monitors';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import 'chartjs-adapter-moment';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  TimeScale
);

interface ResponseTimeChartProps {
  history?: MonitorStatusHistory[];
  height?: number;
  showTimeLabels?: boolean;
}

interface DataPoint {
  x: number; // 时间戳（毫秒）
  y: number; // 响应时间（毫秒）
  status: 'up' | 'down'; // 状态
  originalIndex?: number; // 原始数据索引
  response_time?: number; // 直接存储原始的响应时间，方便调试
}

const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({
  history = [],
  height = 200,
  showTimeLabels = true
}) => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<{
    datasets: {
      data: DataPoint[];
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      pointBackgroundColor: string[];
      pointBorderColor: string[];
      pointRadius: number[];
      tension: number;
      pointHoverRadius: number;
      pointHoverBackgroundColor: string;
      pointHoverBorderColor: string;
      pointHoverBorderWidth: number;
      pointHitRadius: number[];
    }[];
  }>({
    datasets: [{
      data: [],
      borderColor: 'rgba(72, 161, 245, 0.8)',
      borderWidth: 2,
      backgroundColor: 'rgba(72, 161, 245, 0.1)',
      pointBackgroundColor: [],
      pointBorderColor: [],
      pointRadius: [],
      tension: 0.4,
      pointHoverRadius: 0,
      pointHoverBackgroundColor: '',
      pointHoverBorderColor: '',
      pointHoverBorderWidth: 0,
      pointHitRadius: []
    }]
  });

  // 使用 useState 管理图表选项，而不是常量
  const [chartOptions, setChartOptions] = useState<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeOutQuad'
    },
    interaction: {
      mode: 'nearest' as const,
      intersect: true,
      axis: 'xy' as const,
      includeInvisible: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        titleFont: {
          weight: 'bold',
          size: 12
        },
        bodyFont: {
          size: 12
        },
        padding: 10,
        cornerRadius: 6,
        animation: {
          duration: 200,
          easing: 'easeOutQuad'
        },
        // 这里先不设置回调，在useEffect中设置
      },
      title: {
        display: true,
        text: '', // 初始为空，在useEffect中设置
        align: 'start',
        color: '#888',
        font: {
          size: 14
        },
        padding: { top: 10, bottom: 10 }
      }
    },
    scales: {
      x: {
        type: 'time',
        display: showTimeLabels,
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'HH:mm'
          }
        },
        grid: {
          color: '#e0e0e0',
          lineWidth: 0.5
        },
        ticks: {
          color: '#888',
          font: {
            size: 10
          },
          maxRotation: 0,
          autoSkip: false,
          major: {
            enabled: true
          },
          callback: function(value) {
            const date = new Date(value);
            if (date.getHours() % 2 === 0) {
              return `${date.getHours().toString().padStart(2, '0')}:00`;
            }
            return '';
          }
        }
      },
      y: {
        beginAtZero: true,
        max: 10000, // 设置y轴最大值为10000ms
        grid: {
          color: '#e0e0e0',
          lineWidth: 0.5
        },
        ticks: {
          color: '#888',
          font: {
            size: 10
          },
          callback: (value) => `${value}ms`
        }
      }
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    animations: {
      colors: {
        duration: 300,
        easing: 'easeOutQuad'
      },
      radius: {
        duration: 300,
        easing: 'easeOutQuad',
        from: 0,
        to: 4,
        loop: false
      },
      hover: {
        duration: 300,
        easing: 'easeOutQuad'
      }
    },
    events: ['mouseout', 'mousemove', 'touchstart', 'touchmove']
  }));

  const chartRef = useRef<ChartJS<'line'>>(null);

  // 更新图表选项
  useEffect(() => {
    if (!chartRef.current) return;
    
    console.log('更新图表选项，设置tooltip回调');

    // 更新图表选项
    const newOptions = {
      ...chartOptions,
      plugins: {
        ...chartOptions.plugins,
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          titleColor: 'white',
          bodyColor: 'white',
          titleAlign: 'left' as const,
          bodyAlign: 'left' as const,
          titleFont: {
            size: 14,
            weight: 'bold' as const
          },
          callbacks: {
            title: function(context: any) {
              if (context.length > 0) {
                const dataPoint = context[0].raw;
                if (dataPoint && dataPoint.x) {
                  const date = new Date(dataPoint.x);
                  return date.toLocaleString();
                }
              }
              return '';
            },
            label: function(context: any) {
              try {
                const dataPoint = context.raw;
                console.log('Tooltip dataPoint:', dataPoint);
                
                if (dataPoint) {
                  const statusText = dataPoint.status === 'up' ? '正常' : '故障';
                  
                  return [
                    `响应时间: ${dataPoint.response_time} ms`,
                    `状态: ${statusText}`
                  ];
                }
              } catch (e) {
                console.error('Tooltip callback error:', e);
              }
              return '';
            }
          }
        }
      }
    };

    // 更新图表实例的选项
    if (chartRef.current) {
      // 使用 Chart.js 的类型定义更安全地设置选项
      Object.assign(chartRef.current.options.plugins!.tooltip!, {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        titleColor: 'white',
        bodyColor: 'white',
        titleAlign: 'left' as const,
        bodyAlign: 'left' as const,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        callbacks: newOptions.plugins.tooltip.callbacks
      });
      
      chartRef.current.update();
      console.log('已更新图表选项和tooltip配置');
    }
  }, [chartOptions]);

  // 每次 t 函数改变时更新图表的国际化文本
  useEffect(() => {
    console.log('更新图表的国际化文本');
    setChartOptions(prevOptions => {
      // 创建新的图表选项
      const newOptions = {
        ...prevOptions,
        plugins: {
          ...prevOptions.plugins,
          tooltip: {
            ...prevOptions.plugins?.tooltip,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            titleFont: {
              size: 13
            },
            bodyFont: {
              size: 12
            },
            padding: 10,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              title: (items: TooltipItem<'line'>[]) => {
                if (items.length > 0 && items[0].raw) {
                  const dataPoint = items[0].raw as DataPoint;
                  return formatTime(new Date(dataPoint.x));
                }
                return '';
              },
              label: (context: TooltipItem<'line'>) => {
                const dataPoint = context.raw as DataPoint;
                console.log('Tooltip显示数据点:', dataPoint); // 添加日志以调试
                
                // 确保有清晰明确的属性显示
                const lines = [
                  `${t('monitor.history.responseTime')}: ${Math.round(dataPoint.y || 0)}ms`,
                  `${t('common.status')}: ${dataPoint.status === 'up' ? t('monitor.status.normal') : t('monitor.status.failure')}`
                ];
                
                return lines;
              }
            }
          },
          title: {
            ...prevOptions.plugins?.title,
            text: t('monitor.history.responseTime')
          }
        }
      };

      console.log('已更新tooltip回调函数');
      return newOptions;
    });
  }, [t]); // 移除 formatTime 从依赖数组中，因为它是组件内部函数

  // 格式化时间
  const formatTime = (date: Date) => {
    try {
      // 检查日期是否有效
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '无效日期';
      }
      
      // 统一使用本地时间格式，确保在客户端一致显示
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false // 使用24小时制
      };
      
      return date.toLocaleString(undefined, options);
    } catch (e) {
      console.error('格式化日期失败:', e);
      return '无效日期';
    }
  };

  // 处理数据
  useEffect(() => {
    console.log('----开始处理响应时间图表数据----');
    console.log('收到的原始history数据:', history);

    if (history.length === 0) {
      console.log('没有接收到历史数据');
      setChartData({
        datasets: [{
          ...chartData.datasets[0],
          data: []
        }]
      });
      return;
    }

    // 预处理数据，确保所有数据结构正确
    const processedHistory = history.map(item => {
      // 确保所有必要字段都存在
      return {
        ...item,
        status: item.status || 'up', // 确保有状态字段
        response_time: item.response_time || 0 // 确保有响应时间字段
      };
    });

    console.log('预处理后的数据:', processedHistory);

    // 计算24小时前的时间戳
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // 提取响应时间数据
    let responseTimeData: DataPoint[] = processedHistory
      .map((item, idx) => {
        try {
          console.log(`处理history数据点 ${idx}:`, JSON.stringify(item));
          
          // 解析时间
          let timestamp: Date;
          try {
            // 确保时间戳解析正确，服务端返回的是 UTC 时间
            if (item && item.timestamp) {
              timestamp = new Date(item.timestamp);
              console.log(`  - 原始时间戳:`, item.timestamp);
              console.log(`  - 解析后日期:`, timestamp.toISOString());
              // 检查日期是否有效
              if (isNaN(timestamp.getTime())) {
                console.warn(`  - 时间戳无效，使用当前时间`);
                timestamp = new Date(); // 使用当前时间作为备用
              }
            } else {
              console.warn(`  - 时间戳为空，使用当前时间`);
              timestamp = new Date(); // 使用当前时间作为备用
            }
          } catch (e) {
            console.error(`  - 解析时间戳失败:`, e);
            timestamp = new Date(); // 使用当前时间作为备用
          }
          
          // 使用响应时间，或者默认值0
          let responseTime = 0;
          if (item && item.response_time !== undefined && item.response_time > 0) {
            responseTime = item.response_time;
          }
          
          let status: 'up' | 'down' = 'up';
          if (item && item.status === 'down') {
            status = 'down';
          }
          
          console.log(`  - 最终数据点:`, {
            time: timestamp.toISOString(),
            responseTime,
            status
          });
          
          const dataPoint: DataPoint = {
            x: timestamp.getTime(),
            y: responseTime,
            status,
            response_time: responseTime,
            originalIndex: idx
          };
          
          return dataPoint;
        } catch (e) {
          console.error(`处理数据点 ${idx} 时出错:`, e);
          // 返回带有当前时间的备用数据点
          return {
            x: new Date().getTime(),
            y: 0,
            status: 'up' as 'up',
            response_time: 0,
            originalIndex: idx
          };
        }
      })
      // 过滤出过去24小时内的数据点
      .filter(point => point.x >= twentyFourHoursAgo)
      .sort((a, b) => a.x - b.x);

    console.log('解析后的数据点数量:', responseTimeData.length);
    
    if (responseTimeData.length === 0) {
      console.log('过滤后无有效数据点');
      return;
    }
    
    // 确保相邻点至少间隔1分钟
    const oneMinute = 60 * 1000; // 1分钟的毫秒数
    let filteredData: DataPoint[] = [];
    
    if (responseTimeData.length > 0) {
      // 添加第一个点
      filteredData.push(responseTimeData[0]);
      
      // 遍历剩余数据点，确保每个点与上一个点至少间隔5分钟
      for (let i = 1; i < responseTimeData.length; i++) {
        const lastAddedTime = filteredData[filteredData.length - 1].x;
        const currentTime = responseTimeData[i].x;
        
        if (currentTime - lastAddedTime >= oneMinute) {
          filteredData.push(responseTimeData[i]);
        }
      }
    }
    
    console.log('应用1分钟间隔过滤后的数据点数量:', filteredData.length);
    
    if (filteredData.length === 0) {
      console.log('过滤后无有效数据点');
      return;
    }
    
    // 最终使用的数据点
    responseTimeData = filteredData;

    // 如果有数据，设置图表的时间范围
    if (responseTimeData.length > 0) {
      const oldestTime = responseTimeData[0].x;
      const newestTime = responseTimeData[responseTimeData.length - 1].x;
      
      // 更新图表选项以显示正确的时间范围
      setChartOptions(prevOptions => ({
        ...prevOptions,
        scales: {
          ...prevOptions.scales,
          x: {
            ...prevOptions.scales?.x,
            min: oldestTime,
            max: newestTime
          },
          y: {
            ...prevOptions.scales?.y,
            max: 10000 // 确保保留y轴最大值为10000ms
          }
        }
      }));
      
      console.log('设置时间范围:', new Date(oldestTime).toISOString(), '至', new Date(newestTime).toISOString());
    }

    // 处理点的样式
    const pointBackgroundColors: string[] = [];
    const pointBorderColors: string[] = [];
    const pointRadii: number[] = [];
    const pointHitRadii: number[] = []; // 添加点的命中区域半径数组

    // 根据数据点状态设置不同的样式
    responseTimeData.forEach(point => {
      if (point.status === 'down') {
        // down 状态点的颜色
        pointBackgroundColors.push('rgba(0, 0, 0, 0)');
        pointBorderColors.push('rgba(0, 0, 0, 0)');
      } else {
        // up 状态点的颜色
        pointBackgroundColors.push('rgba(0, 0, 0, 0)');
        pointBorderColors.push('rgba(0, 0, 0, 0)');
      }
      
      // 所有点默认半径设为0，使数据点不可见
      pointRadii.push(0);
      
      // 设置点的命中区域半径（决定多大范围会触发交互）
      pointHitRadii.push(20);
    });

    // 更新图表数据
    setChartData({
      datasets: [{
        data: responseTimeData,
        borderColor: 'rgba(128, 128, 128, 0.8)',
        borderWidth: 2,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: pointBorderColors,
        pointRadius: pointRadii,
        tension: 0.4,
        // 悬停时的样式
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgba(128, 128, 128, 0.7)',
        pointHoverBorderColor: 'rgba(128, 128, 128, 0.9)',
        pointHoverBorderWidth: 2,
        // 设置点的命中区域半径
        pointHitRadius: pointHitRadii
      }]
    });
  }, [history]);

  // 如果没有数据，显示空图表和提示信息
  if (!chartData.datasets[0].data.length) {
    console.log('没有数据点，显示空图表提示');
    return (
      <Box style={{
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--gray-1)',
        borderRadius: '4px',
        color: 'gray',
        fontSize: '14px'
      }}>
        {t('monitor.noResponseTimeData')}
      </Box>
    );
  }

  console.log('渲染图表，数据点数量:', chartData.datasets[0].data.length, '个点');
  console.log('图表时间范围:', chartOptions.scales?.x?.min, '至', chartOptions.scales?.x?.max);

  return (
    <Box style={{
      width: '100%',
      paddingTop: '10px',
      paddingBottom: '10px',
      position: 'relative',
      overflow: 'visible'
    }}>
      <div style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '4px',
        backgroundColor: 'var(--gray-1)'
      }}>
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
        />
      </div>
    </Box>
  );
};

export default ResponseTimeChart; 