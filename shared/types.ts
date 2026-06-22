export interface User {
  id: string;
  name: string;
  role: 'developer' | 'leader' | 'admin';
  groupId: string;
}

export interface Component {
  id: string;
  name: string;
  description: string;
  ownerGroupId: string;
  createdAt: string;
  latestVersion: string;
  status: 'active' | 'deprecated' | 'archived';
}

export interface Branch {
  id: string;
  componentId: string;
  componentName: string;
  name: string;
  version: string;
  createdBy: string;
  createdAt: string;
  status: 'developing' | 'testing' | 'ready' | 'published';
  compatibilityChecked: boolean;
  lastCommitMessage: string;
}

export interface DevGroup {
  id: string;
  name: string;
  memberCount: number;
  memberIds: string[];
}

export interface Permission {
  groupId: string;
  componentId: string;
  canRead: boolean;
  canWrite: boolean;
  canPublish: boolean;
}

export interface PublishRecord {
  id: string;
  branchId: string;
  componentName: string;
  branchName: string;
  environment: 'test' | 'prod';
  status: 'pending' | 'success' | 'failed';
  operator: string;
  operatedAt: string;
  message: string;
}

export interface OperationLog {
  id: string;
  type: 'create_branch' | 'commit' | 'publish_test' | 'publish_prod' | 'update_permission' | 'create_group' | 'permission_denied' | 'duplicate_branch';
  operator: string;
  operatorRole: string;
  target: string;
  detail: string;
  success: boolean;
  timestamp: string;
}

export type PermissionType = 'canRead' | 'canWrite' | 'canPublish';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface Stats {
  totalComponents: number;
  activeComponents: number;
  totalBranches: number;
  developingBranches: number;
  testingBranches: number;
  publishedBranches: number;
  totalPublishRecords: number;
  testPublishCount: number;
  prodPublishCount: number;
}

export interface CompatibilityCheckResult {
  passed: boolean;
  branch: Branch | undefined;
  issues: string[];
  details: string;
}

export interface PermissionMatrixRow {
  component: Component;
  permission: Permission;
  isOwner: boolean;
}

export interface PermissionMatrixGroup {
  group: DevGroup;
  components: PermissionMatrixRow[];
}

export interface PermissionMatrixData {
  groups: DevGroup[];
  components: Component[];
  matrix: PermissionMatrixGroup[];
}
