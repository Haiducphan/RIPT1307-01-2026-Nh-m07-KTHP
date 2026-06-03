import { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Image,
  message,
  Modal,
  Row,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCategories } from '@/services/categories';
import { createDevice, deleteDevice, getDevices, toggleDeviceStatus, updateDevice, updateDeviceStock } from '@/services/equipment';
import type { Device } from '@/types';

type DeviceTier = 'S' | 'A' | 'B' | 'C';
type StatusFilter = 'active' | 'inactive' | 'all';

interface AdminDevice extends Device {
  code: string;
  tier: DeviceTier;
  active: boolean;
}

interface DeviceFormValues {
  name: string;
  code: string;
  categoryId: string;
  tier: DeviceTier;
  totalQuantity: number;
  availableQuantity: number;
  description?: string;
  images?: UploadFile[];
}

interface DeviceUploadFile extends UploadFile {
  imageId?: string;
  existingUrl?: string;
}

const TIER_OPTIONS: DeviceTier[] = ['S', 'A', 'B', 'C'];
const TIER_COLORS: Record<DeviceTier, { color: string; bg: string }> = {
  S: { color: '#8B6A1F', bg: '#F5EBD0' },
  A: { color: '#B05A4D', bg: '#F7E8DF' },
  B: { color: '#355D8E', bg: '#DCE4F0' },
  C: { color: '#2F6F3E', bg: '#E1EFE3' }
};
function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function getDeviceIcon(device: Pick<Device, 'name' | 'category'>) {
  const text = normalizeText(`${device.name} ${device.category}`);
  if (text.includes('micro')) return '🎤';
  if (text.includes('loa') || text.includes('am thanh')) return '🔊';
  if (text.includes('may chieu') || text.includes('trinh chieu')) return '📽️';
  if (text.includes('may anh') || text.includes('camera') || text.includes('canon') || text.includes('sony')) return '📷';
  if (text.includes('tripod') || text.includes('chan may')) return '🎬';
  if (text.includes('den') || text.includes('led')) return '💡';
  if (text.includes('tai nghe')) return '🎧';
  if (text.includes('mixer')) return '🎚️';
  return '📦';
}

function getDeviceTier(device: Pick<Device, 'name' | 'category'>): DeviceTier {
  const text = normalizeText(`${device.name} ${device.category}`);
  if (text.includes('epson') || text.includes('canon') || text.includes('may chieu')) return 'S';
  if (text.includes('shure') || text.includes('jbl') || text.includes('mixer') || text.includes('micro')) return 'A';
  if (text.includes('tripod') || text.includes('den') || text.includes('loa')) return 'B';
  return 'C';
}

function getNormalizedTier(device: Device): DeviceTier {
  return TIER_OPTIONS.includes(device.tier as DeviceTier) ? (device.tier as DeviceTier) : getDeviceTier(device);
}

function getDeviceCode(device: Device, index: number) {
  if (device.code?.trim()) return device.code;

  const numericId = device.id.replace(/\D/g, '');
  return numericId ? `TB-${numericId.padStart(3, '0').slice(-3)}` : `TB-${String(index + 1).padStart(3, '0')}`;
}

function toAdminDevice(device: Device, index: number): AdminDevice {
  return {
    ...device,
    code: getDeviceCode(device, index),
    tier: getNormalizedTier(device),
    active: device.isActive !== false
  };
}

function DeviceThumbnail({ device }: { device: AdminDevice }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(device.image) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [device.image]);

  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        background: '#EFE9DD',
        display: 'grid',
        placeItems: 'center',
        fontSize: 22,
        overflow: 'hidden',
        flex: '0 0 auto'
      }}
    >
      {showImage ? (
        <img
          src={device.image}
          alt={device.name}
          onError={() => setImageFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span aria-hidden="true">{getDeviceIcon(device)}</span>
      )}
    </div>
  );
}

function DeviceDetailModal({ device, open, onClose }: { device?: AdminDevice; open: boolean; onClose: () => void }) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const imageUrls = (device?.images?.length ? device.images : device?.image ? [device.image] : []).filter((url) => !failedImages[url]);

  useEffect(() => {
    setFailedImages({});
  }, [device?.id, device?.images?.join('|')]);

  return (
    <Modal title="Chi tiết thiết bị" open={open} onCancel={onClose} footer={<Button onClick={onClose}>Đóng</Button>} width={860}>
      {device && (
        <div style={{ display: 'grid', gap: 20 }}>
          {imageUrls.length > 0 ? (
            <Image.PreviewGroup>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 12 }}>
                {imageUrls.map((url) => (
                  <div key={url} style={{ aspectRatio: '4 / 3', borderRadius: 12, overflow: 'hidden', background: '#EFE9DD' }}>
                    <Image
                      src={url}
                      alt={device.name}
                      width="100%"
                      height="100%"
                      style={{ objectFit: 'cover' }}
                      onError={() => setFailedImages((current) => ({ ...current, [url]: true }))}
                    />
                  </div>
                ))}
              </div>
            </Image.PreviewGroup>
          ) : (
            <div style={{ height: 180, borderRadius: 12, background: '#EFE9DD', display: 'grid', placeItems: 'center', fontSize: 48 }}>
              {getDeviceIcon(device)}
            </div>
          )}

          <div style={{ display: 'grid', gap: 8 }}>
            <Typography.Title level={3} style={{ margin: 0, color: '#1A1F1B' }}>
              {device.name}
            </Typography.Title>
            <Typography.Text style={{ color: '#6B6F6C' }}>{device.code}</Typography.Text>
          </div>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}><InfoBox label="Loại" value={device.category} /></Col>
            <Col xs={24} md={8}><InfoBox label="Hạng" value={device.tier} /></Col>
            <Col xs={24} md={8}><InfoBox label="Trạng thái" value={device.active ? 'Đang hoạt động' : 'Đã dừng hoạt động'} /></Col>
            <Col xs={24} md={8}><InfoBox label="Tổng số lượng" value={String(device.totalQuantity)} /></Col>
            <Col xs={24} md={8}><InfoBox label="Còn sẵn" value={String(device.availableQuantity)} /></Col>
            <Col xs={24} md={8}><InfoBox label="Đang mượn" value={String(device.borrowingQuantity ?? 0)} /></Col>
          </Row>

          <Card variant="borderless" style={{ border: '1px solid #E5DECB', borderRadius: 12 }}>
            <Typography.Text style={{ color: '#6B6F6C', fontSize: 12 }}>Mô tả</Typography.Text>
            <Typography.Paragraph style={{ margin: '8px 0 0', color: '#1A1F1B' }}>
              {device.description?.trim() || 'Chưa có mô tả từ hệ thống.'}
            </Typography.Paragraph>
          </Card>
        </div>
      )}
    </Modal>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #EFEADA', borderRadius: 12, padding: 14, background: '#FFFFFF', height: '100%' }}>
      <div style={{ color: '#6B6F6C', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#1A1F1B', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function StatCard({ title, value, meta, featured }: { title: string; value: number; meta: string; featured?: boolean }) {
  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 14,
        border: featured ? '1px solid #2D4A3E' : '1px solid #E5DECB',
        background: featured ? '#2D4A3E' : '#FFFFFF'
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ color: featured ? 'rgba(255,255,255,0.72)' : '#6B6F6C', fontSize: 11, letterSpacing: 0, textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, color: featured ? '#FFFFFF' : '#1A1F1B', marginTop: 8 }}>
        {value.toLocaleString('vi-VN')}
      </div>
      <div style={{ color: featured ? 'rgba(255,255,255,0.72)' : '#6B6F6C', fontSize: 12 }}>{meta}</div>
    </Card>
  );
}

function getExistingImageFiles(device: AdminDevice): DeviceUploadFile[] {
  const imageItems = device.imageItems?.length
    ? device.imageItems
    : (device.images ?? []).map((url, index) => ({ id: undefined, url, sortOrder: index }));

  return imageItems.map((image, index) => ({
    uid: image.id ? `existing-${image.id}` : `existing-url-${index}`,
    name: image.url.split('/').pop() || `Ảnh ${index + 1}`,
    status: 'done',
    url: image.url,
    thumbUrl: image.url,
    imageId: image.id,
    existingUrl: image.url
  }));
}

function getUploadImageId(file: UploadFile) {
  const fileWithImage = file as DeviceUploadFile;
  if (fileWithImage.imageId) return fileWithImage.imageId;
  if (file.uid.startsWith('existing-') && !file.uid.startsWith('existing-url-')) return file.uid.replace('existing-', '');
  return undefined;
}

export default function AdminDevicesPage() {
  const [form] = Form.useForm<DeviceFormValues>();
  const { data, loading, refresh } = useAsyncData(() => getDevices({ limit: 1000, includeInactive: true }));
  const { data: categories = [], loading: categoriesLoading, refresh: refreshCategories } = useAsyncData(getCategories);
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<DeviceTier | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<AdminDevice>();
  const [detailDevice, setDetailDevice] = useState<AdminDevice>();
  const [saving, setSaving] = useState(false);
  const [statusChangingId, setStatusChangingId] = useState<string>();
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  useEffect(() => {
    const nextDevices = Array.isArray(data) ? data : [];
    setDevices(nextDevices.map(toAdminDevice));
  }, [data]);

  const activeDevices = useMemo(() => devices.filter((device) => device.active), [devices]);

  const stats = useMemo(() => {
    const borrowed = activeDevices.reduce(
      (total, device) => total + (device.borrowingQuantity ?? Math.max(device.totalQuantity - device.availableQuantity - (device.brokenQuantity ?? 0), 0)),
      0
    );
    return {
      totalTypes: activeDevices.length,
      borrowed,
      lowStock: activeDevices.filter((device) => device.availableQuantity <= 2 && device.availableQuantity > 0).length,
      active: activeDevices.length
    };
  }, [activeDevices]);

  const filteredDevices = useMemo(() => {
    const keyword = normalizeText(searchText.trim());
    const devicesByStatus =
      statusFilter === 'active'
        ? activeDevices
        : statusFilter === 'inactive'
          ? devices.filter((device) => !device.active)
          : devices;

    return devicesByStatus.filter((device) => {
      const matchesSearch =
        !keyword ||
        normalizeText(`${device.name} ${device.code} ${device.category} ${device.description ?? ''}`).includes(keyword);
      const matchesCategory = categoryFilter === 'all' || String(device.categoryId ?? '') === categoryFilter;
      const matchesTier = tierFilter === 'all' || device.tier === tierFilter;
      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [activeDevices, categoryFilter, devices, searchText, statusFilter, tierFilter]);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  );

  const getInitialCategoryId = () => categories[0]?.id ?? '';

  const openAddModal = () => {
    setEditingDevice(undefined);
    setDeletedImageIds([]);
    form.resetFields();
    form.setFieldsValue({ categoryId: getInitialCategoryId(), tier: 'C', totalQuantity: 1, availableQuantity: 1, images: [] });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDevice(undefined);
    setDeletedImageIds([]);
    form.resetFields();
  };

  const openEditModal = (device: AdminDevice) => {
    const matchedCategory = categories.find((category) => category.name === device.category);

    setEditingDevice(device);
    setDeletedImageIds([]);
    form.resetFields();
    form.setFieldsValue({
      name: device.name,
      code: device.code,
      categoryId: device.categoryId ? String(device.categoryId) : matchedCategory?.id ?? getInitialCategoryId(),
      tier: device.tier,
      totalQuantity: device.totalQuantity,
      availableQuantity: device.availableQuantity,
      description: device.description,
      images: getExistingImageFiles(device)
    });
    setModalOpen(true);
  };

  const getSelectedFiles = (files?: UploadFile[]) =>
    (files ?? [])
      .map((file) => file.originFileObj)
      .filter((file): file is File => Boolean(file));

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) return response.data.message;
    }

    return fallback;
  };

  const getResponseField = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      return (error as { response?: { data?: { field?: string } } }).response?.data?.field;
    }

    return undefined;
  };

  const getResponseStatus = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      return (error as { response?: { status?: number } }).response?.status;
    }

    return undefined;
  };

  const handleSave = async (values: DeviceFormValues) => {
    const isEditing = Boolean(editingDevice);
    const code = values.code.trim();
    const categoryId = Number(values.categoryId);

    if (!categoryId) {
      const errorMessage = 'Chưa có danh mục thiết bị hợp lệ từ hệ thống.';
      form.setFields([{ name: 'categoryId', errors: [errorMessage] }]);
      message.error(errorMessage, 4);
      return;
    }

    const payload = {
      code,
      name: values.name.trim(),
      categoryId,
      tier: values.tier,
      totalQuantity: values.totalQuantity,
      description: values.description?.trim(),
      conditionStatus: 'good',
      images: getSelectedFiles(values.images),
      deletedImageIds: isEditing ? deletedImageIds : undefined
    };

    setSaving(true);
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, payload);
        if (values.totalQuantity !== editingDevice.totalQuantity) {
          await updateDeviceStock(editingDevice.id, values.totalQuantity);
        }
        message.success('Đã cập nhật thiết bị', 2);
      } else {
        await createDevice(payload);
        message.success('Đã thêm thiết bị', 2);
      }
      await refresh();
      await refreshCategories();
      closeModal();
    } catch (error) {
      console.error('Save device failed:', error);
      const errorMessage = getErrorMessage(error, `Không thể ${isEditing ? 'cập nhật' : 'thêm'} thiết bị. Vui lòng thử lại.`);
      if (getResponseField(error) === 'code' || getResponseStatus(error) === 409) {
        form.setFields([{ name: 'code', errors: [errorMessage] }]);
      }
      message.error(errorMessage, 4);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (device: AdminDevice) => {
    Modal.confirm({
      title: 'Xác nhận xoá thiết bị',
      content: 'Bạn có chắc muốn xoá thiết bị này? Hành động không thể hoàn tác.',
      okText: 'Đồng ý xoá',
      cancelText: 'Huỷ',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteDevice(device.id);
          await refresh();
          message.success('Đã xoá', 2);
        } catch (error) {
          console.error('Delete device failed:', error);
          message.error(getErrorMessage(error, 'Không thể xoá thiết bị. Vui lòng thử lại.'), 3);
        }
      }
    });
  };

  const handleToggleStatus = async (device: AdminDevice) => {
    setStatusChangingId(device.id);
    try {
      const response = await toggleDeviceStatus(device.id);
      await refresh();
      message.success(response.message || (device.active ? 'Đã dừng hoạt động thiết bị' : 'Đã bật lại thiết bị'), 2);
    } catch (error) {
      console.error('Toggle device status failed:', error);
      message.error(getErrorMessage(error, 'Không thể cập nhật trạng thái thiết bị. Vui lòng thử lại.'), 3);
    } finally {
      setStatusChangingId(undefined);
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 500, margin: '0 0 8px', color: '#1A1F1B' }}>
            Quản lý kho thiết bị
          </h1>
          <p style={{ color: '#6B6F6C', margin: 0 }}>Thêm, sửa, xoá thiết bị và quản lý số lượng tồn kho</p>
        </div>
        <Button type="primary" onClick={openAddModal} style={{ background: '#2D4A3E', borderColor: '#2D4A3E' }}>
          + Thêm thiết bị
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="TỔNG THIẾT BỊ" value={stats.totalTypes} meta="loại thiết bị" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="ĐANG CHO MƯỢN" value={stats.borrowed} meta="đơn đang hoạt động" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="SẮP HẾT" value={stats.lowStock} meta="loại tồn kho thấp" featured />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="HOẠT ĐỘNG" value={stats.active} meta="đang bật cho mượn" />
        </Col>
      </Row>

      <Card variant="borderless" style={{ borderRadius: 14, border: '1px solid #E5DECB' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <Input.Search
            allowClear
            placeholder="Tìm thiết bị..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 300, maxWidth: '100%' }}
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            loading={categoriesLoading}
            options={[{ value: 'all', label: 'Tất cả loại' }, ...categoryOptions]}
          />
          <Select
            value={tierFilter}
            onChange={setTierFilter}
            style={{ width: 150 }}
            options={[{ value: 'all', label: 'Tất cả hạng' }, ...TIER_OPTIONS.map((tier) => ({ value: tier, label: tier }))]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 170 }}
            options={[
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'inactive', label: 'Đã ngừng hoạt động' },
              { value: 'all', label: 'Tất cả trạng thái' }
            ]}
          />
        </div>

        <Table<AdminDevice>
          rowKey="id"
          loading={{ spinning: loading, tip: 'Đang tải thiết bị...' }}
          dataSource={filteredDevices}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: activeDevices.length === 0 && statusFilter === 'active' ? (
              <Empty
                image={<div style={{ fontSize: 80 }}>📦</div>}
                styles={{ image: { height: 96, marginBottom: 16 } }}
                description={
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chưa có thiết bị trong kho</h3>
                    <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                      Thêm thiết bị đầu tiên để CLB bắt đầu cho mượn.
                    </p>
                  </div>
                }
                style={{ padding: '64px 0' }}
              >
                <Button type="primary" onClick={openAddModal} style={{ background: '#2D4A3E', borderColor: '#2D4A3E' }}>
                  + Thêm thiết bị
                </Button>
              </Empty>
            ) : (
              <Empty
                image={<div style={{ fontSize: 64 }}>🔍</div>}
                styles={{ image: { height: 84, marginBottom: 14 } }}
                description={
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Không tìm thấy thiết bị nào</h3>
                    <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                      Thử thay đổi từ khoá, bộ lọc hoặc chuyển sang mục đã ngừng hoạt động.
                    </p>
                  </div>
                }
                style={{ padding: '60px 0' }}
              />
            )
          }}
          columns={[
            {
              title: 'Tên thiết bị',
              render: (_, device) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <DeviceThumbnail device={device} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#1A1F1B' }}>{device.name}</div>
                    <div style={{ color: '#9A9D98', fontSize: 12 }}>{device.code}</div>
                  </div>
                </div>
              )
            },
            {
              title: 'Loại',
              dataIndex: 'category',
              render: (category: string) => <Tag color="default">{category}</Tag>
            },
            {
              title: 'Hạng',
              dataIndex: 'tier',
              render: (tier: DeviceTier) => (
                <Tag style={{ border: 'none', color: TIER_COLORS[tier].color, background: TIER_COLORS[tier].bg, fontWeight: 700 }}>
                  {tier}
                </Tag>
              )
            },
            {
              title: 'Số lượng',
              render: (_, device) => (
                <div>
                  <div>
                    Còn <strong>{device.availableQuantity}</strong> / Tổng {device.totalQuantity}
                  </div>
                  {device.availableQuantity <= 2 && device.availableQuantity > 0 && <Badge color="#B05A4D" text="Sắp hết" />}
                </div>
              )
            },
            {
              title: 'Tình trạng',
              render: (_, device) => (
                <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
                  <Switch
                    checked={device.active}
                    loading={statusChangingId === device.id}
                    onChange={() => handleToggleStatus(device)}
                  />
                  <Badge color={device.active ? '#2F6F3E' : '#8A8E88'} text={device.active ? 'Đang hoạt động' : 'Đã dừng hoạt động'} />
                </div>
              )
            },
            {
              title: 'Hành động',
              align: 'right',
              render: (_, device) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button icon={<EditOutlined />} onClick={() => openEditModal(device)} />
                  <Button icon={<EyeOutlined />} onClick={() => setDetailDevice(device)}>Xem chi tiết</Button>
                  <Tooltip title={device.active ? 'Ẩn thiết bị khỏi danh sách đang quản lý' : 'Thiết bị đã dừng hoạt động'}>
                    <span>
                      <Button danger icon={<DeleteOutlined />} disabled={!device.active} onClick={() => handleDelete(device)} />
                    </span>
                  </Tooltip>
                </div>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editingDevice ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
        open={modalOpen}
        width={600}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Huỷ
          </Button>,
          <Button key="save" type="primary" loading={saving} onClick={() => form.submit()} style={{ background: '#2D4A3E', borderColor: '#2D4A3E' }}>
            Lưu thiết bị
          </Button>
        ]}
      >
        <Form<DeviceFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={(changedValues) => {
            if (!editingDevice && Object.prototype.hasOwnProperty.call(changedValues, 'totalQuantity')) {
              form.setFieldValue('availableQuantity', changedValues.totalQuantity ?? 1);
            }
          }}
        >
          <Row gutter={14}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Tên thiết bị" rules={[{ required: true, message: 'Nhập tên thiết bị' }]}>
                <Input placeholder="VD: Micro Shure SM58" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="code" label="Mã thiết bị" rules={[{ required: true, message: 'Nhập mã thiết bị' }]}>
                <Input placeholder="TB-001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={14}>
            <Col xs={24} md={12}>
              <Form.Item name="categoryId" label="Loại" rules={[{ required: true, message: 'Chọn loại thiết bị' }]}>
                <Select loading={categoriesLoading} options={categoryOptions} placeholder="Chọn danh mục thiết bị" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="tier" label="Hạng" rules={[{ required: true }]}>
                <Select options={TIER_OPTIONS.map((tier) => ({ value: tier, label: tier }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={14}>
            <Col xs={24} md={12}>
              <Form.Item name="totalQuantity" label="Tổng số lượng" rules={[{ required: true, message: 'Nhập tổng số lượng' }]}>
                <InputNumber min={1} disabled={Boolean(editingDevice && !editingDevice.active)} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="availableQuantity"
                label="Số lượng còn"
                rules={[
                  { required: true, message: 'Nhập số lượng còn' },
                  ({ getFieldValue }) => ({
                    validator(_, value: number) {
                      const total = getFieldValue('totalQuantity') as number | undefined;
                      if (value === undefined || total === undefined || value <= total) return Promise.resolve();
                      return Promise.reject(new Error('Số lượng còn không được vượt tổng số'));
                    }
                  })
                ]}
              >
                <InputNumber min={0} disabled style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Thông tin chi tiết, hướng dẫn sử dụng, lưu ý..." />
          </Form.Item>
          <Form.Item
            name="images"
            label="Hình ảnh"
            valuePropName="fileList"
            getValueFromEvent={(event) => (Array.isArray(event) ? event : event?.fileList)}
          >
            <Upload
              listType="picture-card"
              maxCount={5}
              beforeUpload={() => false}
              accept="image/*"
              onRemove={(file) => {
                const imageId = getUploadImageId(file);
                if (imageId) {
                  setDeletedImageIds((current) => (current.includes(imageId) ? current : [...current, imageId]));
                }
                return true;
              }}
            >
              Chọn ảnh
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <DeviceDetailModal device={detailDevice} open={Boolean(detailDevice)} onClose={() => setDetailDevice(undefined)} />
    </div>
  );
}
