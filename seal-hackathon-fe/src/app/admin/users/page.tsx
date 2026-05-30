"use client";
import { useState, useEffect } from "react";
import { Users, UserPlus, CheckCircle, XCircle, Mail, Shield, Building2 } from "lucide-react";
import { App, Table, Tag, Button, Modal, Form, Input, Select, DatePicker } from "antd";
import { apiRequest } from "@/lib/api";

export default function UsersPage() {
  const { message } = App.useApp();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>("/admin/users");
      setUsers(data.map((user) => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        type: user.studentType ?? user.roles?.join(", ") ?? "Member",
        status: user.isApproved ? "Approved" : "Pending",
        uni: user.schoolName ?? "-",
      })));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === "Admin") setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const handleApprove = async (id: string) => {
    try {
      await apiRequest(`/admin/users/${id}/approve`, { method: "PUT" });
      message.success("User approved successfully");
      await loadUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not approve user.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/admin/users/${id}/reject`, { method: "PUT" });
      message.success("User rejected successfully");
      await loadUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not reject user.");
    }
  };

  const handleCreateJudge = (values: any) => {
    message.success(`Guest Judge ${values.name} created! Email sent with temporary credentials.`);
    setIsModalOpen(false);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (t: string) => <b>{t}</b> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => (
      <Tag color={t.includes("FPT") ? "orange" : "blue"}>{t}</Tag>
    )},
    { title: 'University', dataIndex: 'uni', key: 'uni' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (t: string) => (
      <Tag color={t === "Pending" ? "warning" : "success"}>{t}</Tag>
    )},
    {
      title: 'Action', key: 'action', render: (_: any, record: any) => (
        record.status === "Pending" ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="small" type="primary" onClick={() => handleApprove(record.id)} icon={<CheckCircle size={14} />}>Approve</Button>
            <Button size="small" danger onClick={() => handleReject(record.id)} icon={<XCircle size={14} />}>Reject</Button>
          </div>
        ) : <span style={{ color: "var(--color-text-3)" }}>No actions</span>
      )
    }
  ];

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Shield size={48} style={{ color: "var(--color-danger)", marginBottom: 16 }} />
        <h2>Access Denied</h2>
        <p>This page is restricted to Event Administrators only.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title"><Users size={28} /> User Management</h1>
          <p className="page-subtitle">Approve participants and manage guest judges</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={16} /> Create Guest Judge
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button className={`btn ${activeTab === "pending" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("pending")}>
          Pending Approvals
        </button>
        <button className={`btn ${activeTab === "approved" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("approved")}>
          Approved Users
        </button>
      </div>

      <div className="card">
        <Table 
          dataSource={activeTab === "pending" ? users.filter(u => u.status === "Pending") : users.filter(u => u.status === "Approved")} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={false}
        />
      </div>

      <Modal 
        title={<><Shield size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Create Guest Judge Account</>}
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateJudge} style={{ marginTop: 20 }}>
          <Form.Item name="name" label="Judge Name" rules={[{ required: true }]}>
            <Input prefix={<Users size={16} />} placeholder="Dr. John Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<Mail size={16} />} placeholder="judge@example.com" />
          </Form.Item>
          <Form.Item name="company" label="Company / University" rules={[{ required: true }]}>
            <Input prefix={<Building2 size={16} />} placeholder="Tech Corp" />
          </Form.Item>
          <Form.Item name="expiration" label="Account Expiration" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem", marginBottom: 20 }}>
            * Temporary credentials will be emailed securely. The account will only have access to assigned judging rounds.
          </div>
          <Button type="primary" htmlType="submit" block>Generate Account</Button>
        </Form>
      </Modal>
    </div>
  );
}
