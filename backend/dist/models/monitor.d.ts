export interface Monitor {
    id: number;
    name: string;
    url: string;
    method: string;
    interval: number;
    timeout: number;
    expected_status: number;
    headers: string;
    body: string;
    created_by: number;
    active: boolean;
    status: string;
    uptime: number;
    response_time: number;
    last_checked: string;
    created_at: string;
    updated_at: string;
}
export interface MonitorStatusHistory {
    id: number;
    monitor_id: number;
    status: string;
    timestamp: string;
}
export interface MonitorCheck {
    id: number;
    monitor_id: number;
    status: string;
    response_time: number;
    status_code: number;
    error: string | null;
    checked_at: string;
}
