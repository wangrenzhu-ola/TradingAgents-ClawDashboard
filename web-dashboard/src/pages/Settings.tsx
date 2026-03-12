import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Form, Input, Select, InputNumber, Card, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

const { Header, Content } = Layout;
const { Option } = Select;

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/config/');
        form.setFieldsValue(response.data);
      } catch (error) {
        message.error('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [form]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      await apiClient.post('/config/', values);
      message.success('Configuration saved successfully');
    } catch (error) {
      message.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 20px', background: '#001529' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          style={{ color: 'white', marginRight: 16 }} 
          onClick={() => navigate('/')}
        >
          Back
        </Button>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Settings</div>
      </Header>
      <Content style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>
        ) : (
          <Card title="LLM Configuration" style={{ maxWidth: 800, margin: '0 auto' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              <Form.Item
                name="llm_provider"
                label="LLM Provider"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select a provider">
                  <Option value="openai">OpenAI</Option>
                  <Option value="anthropic">Anthropic</Option>
                  <Option value="google">Google</Option>
                  <Option value="ollama">Ollama</Option>
                  <Option value="openrouter">OpenRouter</Option>
                  <Option value="xai">xAI</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="deep_think_llm"
                label="Deep Think Model"
                tooltip="Model used for heavy reasoning tasks (e.g. gpt-4o, claude-3-5-sonnet)"
              >
                <Input placeholder="e.g. gpt-4o" />
              </Form.Item>

              <Form.Item
                name="quick_think_llm"
                label="Quick Think Model"
                tooltip="Model used for faster, simpler tasks (e.g. gpt-4o-mini)"
              >
                <Input placeholder="e.g. gpt-4o-mini" />
              </Form.Item>

              <Form.Item
                name="backend_url"
                label="Backend URL"
                tooltip="Override base URL (e.g. for MiniMax compatible OpenAI endpoint)"
              >
                <Input placeholder="e.g. https://api.minimax.chat/v1" />
              </Form.Item>
              
              <Form.Item
                name="api_key"
                label="API Key"
                tooltip="Set API Key (Will be saved to environment/config)"
              >
                <Input.Password placeholder="Enter API Key" />
              </Form.Item>

              <Form.Item
                name="max_debate_rounds"
                label="Max Debate Rounds"
              >
                <InputNumber min={1} max={10} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} block>
                  Save Configuration
                </Button>
              </Form.Item>
            </Form>
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default Settings;
