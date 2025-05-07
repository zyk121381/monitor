package collector

import (
	"context"
	"fmt"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/xugou/agent/pkg/config"
	"github.com/xugou/agent/pkg/model"
)

// Collector 定义数据收集器接口
type Collector interface {
	Collect(ctx context.Context) (*model.SystemInfo, error)
	CollectBatch(ctx context.Context) ([]*model.SystemInfo, error) // 批量采集一段时间内的系统信息
}

// DefaultCollector 是默认的数据收集器实现
type DefaultCollector struct{}

// NewCollector 创建一个新的数据收集器
func NewCollector() Collector {
	return &DefaultCollector{}
}

// Collect 收集系统信息
func (c *DefaultCollector) Collect(ctx context.Context) (*model.SystemInfo, error) {
	info := &model.SystemInfo{
		Timestamp: time.Now(),
	}

	info.Token = config.Token

	// 获取主机信息
	hostInfo, err := host.Info()
	if err != nil {
		return nil, fmt.Errorf("获取主机信息失败: %w", err)
	}
	info.Hostname = hostInfo.Hostname
	info.Platform = hostInfo.Platform
	info.OS = hostInfo.OS
	// 设置操作系统版本，格式化为更有意义的信息
	info.Version = fmt.Sprintf("%s %s (%s)", hostInfo.Platform, hostInfo.PlatformVersion, hostInfo.KernelVersion)

	// 获取CPU信息
	cpuPercent, err := cpu.Percent(time.Second, false)
	if err != nil {
		return nil, fmt.Errorf("获取CPU使用率失败: %w", err)
	}

	cpuInfo, err := cpu.Info()
	if err != nil {
		return nil, fmt.Errorf("获取CPU信息失败: %w", err)
	}

	var modelName string
	if len(cpuInfo) > 0 {
		modelName = cpuInfo[0].ModelName
	}

	info.CPUInfo = model.CPUInfo{
		Usage:     cpuPercent[0],
		Cores:     runtime.NumCPU(),
		ModelName: modelName,
	}

	// 获取内存信息
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return nil, fmt.Errorf("获取内存信息失败: %w", err)
	}

	info.MemoryInfo = model.MemoryInfo{
		Total:     memInfo.Total,
		Used:      memInfo.Used,
		Free:      memInfo.Free,
		UsageRate: memInfo.UsedPercent,
	}

	// 获取磁盘信息
	partitions, err := disk.Partitions(false)
	if err != nil {
		return nil, fmt.Errorf("获取磁盘分区信息失败: %w", err)
	}

	for _, partition := range partitions {
		usage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			continue
		}

		diskInfo := model.DiskInfo{
			Device:     partition.Device,
			MountPoint: partition.Mountpoint,
			Total:      usage.Total,
			Used:       usage.Used,
			Free:       usage.Free,
			UsageRate:  usage.UsedPercent,
			FSType:     partition.Fstype,
		}
		info.DiskInfo = append(info.DiskInfo, diskInfo)
	}

	// 获取网络信息
	netIOCounters, err := net.IOCounters(true)
	if err != nil {
		return nil, fmt.Errorf("获取网络信息失败: %w", err)
	}

	for _, netIO := range netIOCounters {
		networkInfo := model.NetworkInfo{
			Interface:   netIO.Name,
			BytesSent:   netIO.BytesSent,
			BytesRecv:   netIO.BytesRecv,
			PacketsSent: netIO.PacketsSent,
			PacketsRecv: netIO.PacketsRecv,
		}
		info.NetworkInfo = append(info.NetworkInfo, networkInfo)
	}

	// 获取系统负载
	loadAvg, err := load.Avg()
	if err == nil {
		info.LoadInfo = model.LoadInfo{
			Load1:  loadAvg.Load1,
			Load5:  loadAvg.Load5,
			Load15: loadAvg.Load15,
		}
	}

	return info, nil
}

// CollectBatch 在指定时间段内批量收集系统信息，现在只采集一条，以后再扩展
func (c *DefaultCollector) CollectBatch(ctx context.Context) ([]*model.SystemInfo, error) {
	// 创建结果切片
	results := make([]*model.SystemInfo, 0)

	// 采集第一条数据
	info, err := c.Collect(ctx)
	if err != nil {
		return nil, err
	}
	results = append(results, info)

	return results, nil
}
