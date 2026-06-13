import { useState, useRef, useEffect } from 'react'
import { Layout, Tabs, Statistic, Row, Col, Card, Tag, Button, Input, Table, Drawer, Descriptions, Space, Progress } from 'antd'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useTaskStore } from '../store/tasks'
import type { Task, TaskStatus } from '../types'

const { Header, Content } = Layout

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '⏳ 待执行', running: '▶️ 运行中', success: '✅ 已完成', failed: '❌ 已失败', retry: '🔄 重试中',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'default', running: 'processing', success: 'success', failed: 'error', retry: 'warning'
}

const highlightStyle = `
@keyframes task-highlight-pulse {
  0% { background-color: rgba(24, 144, 255, 0.4) !important; }
  50% { background-color: rgba(24, 144, 255, 0.15) !important; }
  100% { background-color: rgba(24, 144, 255, 0.4) !important; }
}
@keyframes task-border-pulse {
  0% { box-shadow: inset 4px 0 0 0 #1890ff; }
  50% { box-shadow: inset 4px 0 0 0 #91d5ff; }
  100% { box-shadow: inset 4px 0 0 0 #1890ff; }
}
@keyframes status-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
@keyframes fade-slide-in {
  0% { opacity: 0; transform: translateX(-20px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes glow-pulse {
  0%, 100% { 
    box-shadow: 0 0 6px rgba(24, 144, 255, 0.7), 0 0 12px rgba(24, 144, 255, 0.4);
    filter: brightness(1.1);
  }
  50% { 
    box-shadow: 0 0 12px rgba(24, 144, 255, 1), 0 0 24px rgba(24, 144, 255, 0.6);
    filter: brightness(1.3);
  }
}
@keyframes badge-bounce-in {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.ant-table-tbody > tr.task-row-highlight > td {
  animation: task-highlight-pulse 1.1s ease-in-out infinite, fade-slide-in 0.5s ease-out, task-border-pulse 1.1s ease-in-out infinite;
  background-color: rgba(24, 144, 255, 0.2) !important;
  position: relative;
}
.ant-table-tbody > tr.task-row-highlight > td:first-child {
  padding-left: 8px;
}
.ant-table-tbody > tr.task-row-highlight > td:first-child .new-badge {
  display: inline-block;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%);
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
  margin-right: 8px;
  vertical-align: middle;
  animation: badge-bounce-in 0.5s ease-out, glow-pulse 1.2s ease-in-out infinite;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ant-table-tbody > tr.task-row-highlight .ant-tag {
  animation: status-bounce 1s ease-in-out infinite;
  font-weight: 700;
}
.ant-table-tbody > tr.task-row-highlight > td:nth-child(3) {
  position: relative;
}
.ant-table-tbody > tr.task-row-highlight:hover > td {
  background-color: rgba(24, 144, 255, 0.3) !important;
}
`

export default function Dashboard() {
  const store = useTaskStore()
  const [newTaskName, setNewTaskName] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('metrics')
  const [tablePage, setTablePage] = useState(1)
  const tableRef = useRef<any>(null)
  const highlightedTaskId = useTaskStore(s => s.highlightedTaskId)
  const clearHighlightedTaskId = useTaskStore(s => s.clearHighlightedTaskId)

  const selectedTask = useTaskStore(s => s.selectedTask)

  useEffect(() => {
    if (!highlightedTaskId) return
    setActiveTab('tasks')
    setTablePage(1)
    setDrawerOpen(true)
    let attempts = 0
    const maxAttempts = 30
    const scrollInterval = setInterval(() => {
      attempts++
      const rowEl = document.querySelector(`tr[data-row-key="${highlightedTaskId}"]`)
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        clearInterval(scrollInterval)
      }
      if (attempts >= maxAttempts) {
        clearInterval(scrollInterval)
      }
    }, 100)
    const clearTimer = setTimeout(() => {
      clearHighlightedTaskId()
    }, 8000)
    return () => {
      clearInterval(scrollInterval)
      clearTimeout(clearTimer)
    }
  }, [highlightedTaskId, clearHighlightedTaskId])

  const handleAddTask = () => {
    if (!newTaskName) return
    store.addTask(newTaskName)
    setNewTaskName('')
  }

  const taskColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 130, render: (id: string, r: Task) => (
      <>
        {r.id === highlightedTaskId && <span className="new-badge">NEW</span>}
        <span style={{ verticalAlign: 'middle' }}>{id}</span>
      </>
    )},
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: TaskStatus, r: Task) => {
      const isHighlighted = r.id === highlightedTaskId
      return isHighlighted ? (
        <Tag color={STATUS_COLORS[s]} style={{
          fontSize: 13,
          fontWeight: 700,
          padding: '2px 12px',
          border: `2px solid ${s === 'pending' ? '#faad14' : '#1890ff'}`,
          borderRadius: 6,
          boxShadow: `0 0 8px ${s === 'pending' ? 'rgba(250, 173, 20, 0.5)' : 'rgba(24, 144, 255, 0.5)'}`,
        }}>
          {STATUS_LABELS[s]}
        </Tag>
      ) : (
        <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Tag>
      )
    }},
    { title: '节点', dataIndex: 'node', key: 'node' },
    { title: '重试', key: 'retries', render: (_: any, r: Task) => `${r.retries}/${r.maxRetries}` },
    { title: '耗时', key: 'duration', render: (_: any, r: Task) => r.duration ? `${(r.duration / 1000).toFixed(1)}s` : '-' },
    { title: '操作', key: 'actions', render: (_: any, r: Task) => (
      <Space>
        {r.status === 'failed' && <Button size="small" type="primary" onClick={() => store.retryTask(r.id)}>重试</Button>}
        {r.status === 'running' && <Button size="small" danger onClick={() => store.cancelTask(r.id)}>取消</Button>}
        <Button size="small" onClick={() => { store.selectTask(r); setDrawerOpen(true) }}>详情</Button>
      </Space>
    )},
  ]

  const successCount = store.tasks.filter(t => t.status === 'success').length
  const failedCount = store.tasks.filter(t => t.status === 'failed').length
  const runningCount = store.tasks.filter(t => t.status === 'running').length

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <style>{highlightStyle}</style>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: 18 }}>🔧 分布式任务调度与监控平台</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Input placeholder="任务名称" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} style={{ width: 160 }} onPressEnter={handleAddTask} />
          <Button type="primary" onClick={handleAddTask}>
            添加任务
          </Button>
        </div>
      </Header>
      <Content style={{ padding: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Card><Statistic title="总任务" value={store.tasks.length} /></Card></Col>
          <Col span={6}><Card><Statistic title="运行中" value={runningCount} valueStyle={{ color: '#1890ff' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="成功" value={successCount} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="失败" value={failedCount} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'metrics', label: '监控指标', children: (
            <Row gutter={16}>
              <Col span={12}>
                <Card title="运行中任务数">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={store.metrics}>
                      <XAxis dataKey="time" tickFormatter={t => new Date(t).toLocaleTimeString()} fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip labelFormatter={t => new Date(t as number).toLocaleString()} />
                      <Area type="monotone" dataKey="runningTasks" stroke="#1890ff" fill="#1890ff" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="成功率 %">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={store.metrics}>
                      <XAxis dataKey="time" tickFormatter={t => new Date(t).toLocaleTimeString()} fontSize={10} />
                      <YAxis domain={[0, 100]} fontSize={10} />
                      <Tooltip labelFormatter={t => new Date(t as number).toLocaleString()} />
                      <Line type="monotone" dataKey="successRate" stroke="#52c41a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col span={24} style={{ marginTop: 16 }}>
                <Card title="平均延迟 (ms)">
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={store.metrics}>
                      <XAxis dataKey="time" tickFormatter={t => new Date(t).toLocaleTimeString()} fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Area type="monotone" dataKey="avgLatency" stroke="#faad14" fill="#faad14" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          )},
          { key: 'tasks', label: '任务列表', children: (
            <Table
              ref={tableRef}
              dataSource={store.tasks}
              columns={taskColumns}
              rowKey="id"
              size="small"
              pagination={{ current: tablePage, pageSize: 10, onChange: (p) => setTablePage(p) }}
              rowClassName={(record) => record.id === highlightedTaskId ? 'task-row-highlight' : ''}
            />
          )},
          { key: 'nodes', label: '集群节点', children: (
            <Row gutter={16}>
              {store.nodes.map(node => (
                <Col span={8} key={node.id} style={{ marginBottom: 16 }}>
                  <Card title={<span>{node.type === 'scheduler' ? '🎯' : '⚙️'} {node.name}</span>}
                    extra={<Tag color={node.status === 'online' ? 'green' : node.status === 'overloaded' ? 'orange' : 'red'}>{node.status}</Tag>}>
                    <Progress percent={Math.round(node.cpu)} strokeColor={node.cpu > 80 ? '#ff4d4f' : '#1890ff'} format={v => `CPU ${v}%`} />
                    <Progress percent={Math.round(node.memory)} strokeColor={node.memory > 80 ? '#ff4d4f' : '#52c41a'} format={v => `MEM ${v}%`} />
                    <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                      任务数: {node.tasks} | 运行时间: {Math.floor(node.uptime / 3600)}h
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )},
        ]} />

        <Drawer title="任务详情" open={drawerOpen} onClose={() => setDrawerOpen(false)} width={480}>
          {selectedTask && (
            <>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="ID">{selectedTask.id}</Descriptions.Item>
                <Descriptions.Item label="名称">{selectedTask.name}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={STATUS_COLORS[selectedTask.status]} style={{
                    fontWeight: selectedTask.id === highlightedTaskId ? 700 : 400,
                  }}>
                    {STATUS_LABELS[selectedTask.status]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="执行节点">{selectedTask.node}</Descriptions.Item>
                <Descriptions.Item label="重试次数">{selectedTask.retries}/{selectedTask.maxRetries}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{new Date(selectedTask.createdAt).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="耗时">{selectedTask.duration ? `${(selectedTask.duration / 1000).toFixed(1)}s` : '-'}</Descriptions.Item>
              </Descriptions>
              <h4 style={{ marginTop: 16 }}>执行日志</h4>
              <pre style={{ background: '#1f1f1f', padding: 12, borderRadius: 8, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>
                {selectedTask.logs.join('\n')}
              </pre>
            </>
          )}
        </Drawer>
      </Content>
    </Layout>
  )
}
