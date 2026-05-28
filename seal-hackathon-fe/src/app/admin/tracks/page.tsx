"use client";
import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Card, Tag, Drawer, Form, Input, App, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { databaseService } from '../../../services/databaseService';

const { Title, Text } = Typography;

export default function AdminTracksPage() {
  const { message } = App.useApp();
  const [tracks, setTracks] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setTracks(databaseService.getTracks());
  }, []);

  const showCreateDrawer = () => {
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const showEditDrawer = (record: any) => {
    setIsEditMode(true);
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      desc: record.desc,
      mentor: record.mentor,
      teamsCount: record.teamsCount || 0,
      status: record.status || 'Active'
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this track?',
      onOk: () => {
        databaseService.deleteTrack(id);
        setTracks(databaseService.getTracks());
        databaseService.logAction('Admin', `Deleted track ID ${id}`, 'delete');
        message.success('Track deleted successfully');
      }
    });
  };

  const handleFinish = (values: any) => {
    if (isEditMode) {
      const updatedTrack = { ...tracks.find(t => t.id === editingId), ...values };
      databaseService.updateTrack(updatedTrack);
      databaseService.logAction('Admin', `Updated track ${updatedTrack.name}`, 'edit');
      message.success('Track updated successfully');
    } else {
      const newTrack = { 
        ...values, 
        id: `TRK-${Date.now().toString().slice(-4)}`,
        teamsCount: 0,
        status: values.status || 'Active'
      };
      databaseService.addTrack(newTrack);
      databaseService.logAction('Admin', `Created new track ${newTrack.name}`, 'plus-circle');
      message.success('Track created successfully');
    }
    setTracks(databaseService.getTracks());
    setDrawerVisible(false);
  };

  const filteredTracks = tracks.filter(t => 
    t.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.mentor?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: 'TRACK NAME', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string) => <b>{text}</b>
    },
    { title: 'DESCRIPTION', dataIndex: 'desc', key: 'desc', ellipsis: true },
    { title: 'MENTOR', dataIndex: 'mentor', key: 'mentor', render: (text: string) => text || <Text type="secondary">Unassigned</Text> },
    { title: 'TEAMS', dataIndex: 'teamsCount', key: 'teamsCount', render: (val: number) => <Tag color="blue">{val || 0} Teams</Tag> },
    { 
      title: 'ACTIONS', 
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => showEditDrawer(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Track Management</Title>
          <Text type="secondary">Manage competition tracks, categories, and assign mentors.</Text>
        </div>
        <Space>
          <Input 
            placeholder="Search tracks or mentors..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: '20px' }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: '20px' }}>
            Create Track
          </Button>
        </Space>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ background: 'transparent' }}>
        <Table 
          columns={columns} 
          dataSource={filteredTracks} 
          pagination={{ pageSize: 10 }} 
          rowKey="id" 
        />
      </Card>

      <Drawer
        title={isEditMode ? "Edit Track" : "Create New Track"}
        placement="right"
        width={480}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {isEditMode ? 'Save Changes' : 'Create Track'}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="name" label="Track Name" rules={[{ required: true, message: 'Please enter track name' }]}>
            <Input placeholder="e.g., AI & Machine Learning" />
          </Form.Item>
          
          <Form.Item name="desc" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this track..." />
          </Form.Item>

          <Form.Item name="mentor" label="Assigned Mentor">
            <Input placeholder="e.g., Dr. Nguyen Van A" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
