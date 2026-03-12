import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Button,
  Table,
  Modal,
  Form,
  Input,
  DatePicker,
  Tag,
  message,
} from "antd";
import {
  PlusOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "../api/client";

const { Header, Content, Sider } = Layout;

interface Task {
  task_id: string;
  ticker: string;
  date: string;
  status: string;
  result?: any;
}

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  const fetchTasks = async () => {
    // Only set loading on initial load to avoid flickering
    if (tasks.length === 0) setLoading(true);
    try {
      const response = await apiClient.get("/tasks/");
      setTasks(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (values: any) => {
    try {
      await apiClient.post("/tasks/", {
        ticker: values.ticker,
        date: values.date.format("YYYY-MM-DD"),
      });
      message.success("Task created successfully");
      setIsModalOpen(false);
      form.resetFields();
      fetchTasks();
    } catch (error) {
      message.error("Failed to create task");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const columns = [
    {
      title: "Ticker",
      dataIndex: "ticker",
      key: "ticker",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "completed") color = "success";
        if (status === "running") color = "processing";
        if (status === "failed") color = "error";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Task) => (
        <Button
          type="link"
          disabled={record.status !== "completed"}
          onClick={() => navigate(`/tasks/${record.task_id}`)}
        >
          View Result
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ color: "white", fontSize: "18px", fontWeight: "bold" }}>
          Claw Dashboard
        </div>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          style={{ color: "white" }}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Header>
      <Layout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            style={{ height: "100%", borderRight: 0 }}
            items={[
              {
                key: "1",
                icon: <DashboardOutlined />,
                label: "Tasks",
                onClick: () => navigate("/"),
              },
              {
                key: "2",
                icon: <SettingOutlined />,
                label: "Settings",
                onClick: () => navigate("/settings"),
              },
            ]}
          />
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h2>Analysis Tasks</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalOpen(true)}
              >
                New Task
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="task_id"
              loading={loading}
            />
          </Content>
        </Layout>
      </Layout>

      <Modal
        title="Create New Analysis Task"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateTask} layout="vertical">
          <Form.Item
            name="ticker"
            label="Ticker Symbol"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. NVDA, AAPL" />
          </Form.Item>
          <Form.Item
            name="date"
            label="Analysis Date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Start Analysis
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Dashboard;
