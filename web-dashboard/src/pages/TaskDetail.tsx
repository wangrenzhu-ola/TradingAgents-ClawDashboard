import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Button,
  Card,
  Spin,
  Tabs,
  Typography,
  Tag,
  Divider,
  Descriptions,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { apiClient } from "../api/client";

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const TaskDetail: React.FC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await apiClient.get(`/results/${taskId}`);
        setResult(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [taskId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Loading results..." />
      </div>
    );
  }

  if (!result) {
    return <div>Result not found</div>;
  }

  const items = [
    {
      key: "1",
      label: "Summary",
      children: (
        <Card title="Final Decision">
          <Tag
            color={
              result.final_decision?.toLowerCase().includes("buy")
                ? "green"
                : result.final_decision?.toLowerCase().includes("sell")
                  ? "red"
                  : "blue"
            }
            style={{ fontSize: "16px", padding: "5px 10px" }}
          >
            {result.final_decision || "No Decision"}
          </Tag>
          <Divider />
          <Title level={4}>Trader Plan</Title>
          <Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {result.trader_plan || "No plan available"}
          </Paragraph>

          {result.raw_decision && (
            <>
              <Divider />
              <Title level={5}>Raw Decision Output</Title>
              <Paragraph code>{result.raw_decision}</Paragraph>
            </>
          )}
        </Card>
      ),
    },
    {
      key: "2",
      label: "Analysis",
      children: (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <Card title="Market Analysis">
            <Paragraph
              ellipsis={{ rows: 10, expandable: true, symbol: "more" }}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {result.analysis?.market || "No data"}
            </Paragraph>
          </Card>
          <Card title="Fundamentals">
            <Paragraph
              ellipsis={{ rows: 10, expandable: true, symbol: "more" }}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {result.analysis?.fundamentals || "No data"}
            </Paragraph>
          </Card>
          <Card title="News">
            <Paragraph
              ellipsis={{ rows: 10, expandable: true, symbol: "more" }}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {result.analysis?.news || "No data"}
            </Paragraph>
          </Card>
          <Card title="Sentiment">
            <Paragraph
              ellipsis={{ rows: 10, expandable: true, symbol: "more" }}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {result.analysis?.sentiment || "No data"}
            </Paragraph>
          </Card>
        </div>
      ),
    },
    {
      key: "3",
      label: "Research Team",
      children: (
        <Card title="Debate History">
          {(result.research?.history || []).map((item: any, index: number) => (
            <Card
              key={index}
              type="inner"
              title={`Round ${index + 1}`}
              style={{ marginTop: 16 }}
            >
              {/* Assuming item structure from log_states_dict */}
              <Text strong>History: </Text>
              <Paragraph>{JSON.stringify(item)}</Paragraph>
            </Card>
          ))}
          <Divider />
          <Title level={5}>Judge Decision</Title>
          <Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {result.research?.judge_decision || "No decision"}
          </Paragraph>
        </Card>
      ),
    },
    {
      key: "4",
      label: "Risk Team",
      children: (
        <Card title="Risk Assessment">
          {(result.risk?.history || []).map((item: any, index: number) => (
            <Card
              key={index}
              type="inner"
              title={`Round ${index + 1}`}
              style={{ marginTop: 16 }}
            >
              <Text strong>History: </Text>
              <Paragraph>{JSON.stringify(item)}</Paragraph>
            </Card>
          ))}
          <Divider />
          <Title level={5}>Risk Manager Decision</Title>
          <Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {result.risk?.judge_decision || "No decision"}
          </Paragraph>
        </Card>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          background: "#001529",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          style={{ color: "white", marginRight: 16 }}
          onClick={() => navigate("/")}
        >
          Back
        </Button>
        <div style={{ color: "white", fontSize: "18px", fontWeight: "bold" }}>
          Result: {result.company} ({result.date})
        </div>
      </Header>
      <Content style={{ padding: "24px" }}>
        <Tabs defaultActiveKey="1" items={items} />
      </Content>
    </Layout>
  );
};

export default TaskDetail;
