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

export type OperationLogType =
  | 'create_branch'
  | 'update_branch'
  | 'delete_branch'
  | 'commit'
  | 'publish_test'
  | 'publish_prod'
  | 'update_permission'
  | 'create_group'
  | 'update_group'
  | 'delete_group'
  | 'create_component'
  | 'update_component'
  | 'delete_component'
  | 'permission_denied'
  | 'duplicate_branch'
  | 'user_login';

export interface OperationLog {
  id: string;
  type: OperationLogType;
  operator: string;
  operatorRole: string;
  target: string;
  detail: string;
  success: boolean;
  timestamp: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

type EntityKey = 'users' | 'groups' | 'components' | 'branches' | 'permissions' | 'publishRecords' | 'logs';

const INITIAL_GROUPS: DevGroup[] = [
  { id: 'g1', name: '支付业务组', memberCount: 5, memberIds: ['u1', 'u2'] },
  { id: 'g2', name: '订单业务组', memberCount: 4, memberIds: ['u3'] },
  { id: 'g3', name: '用户中心组', memberCount: 6, memberIds: ['u4'] },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: '张三', role: 'admin', groupId: 'g1' },
  { id: 'u2', name: '李四', role: 'developer', groupId: 'g1' },
  { id: 'u3', name: '王五', role: 'leader', groupId: 'g2' },
  { id: 'u4', name: '赵六', role: 'developer', groupId: 'g3' },
];

const INITIAL_COMPONENTS: Component[] = [
  { id: 'c1', name: 'PayButton', description: '支付按钮组件', ownerGroupId: 'g1', createdAt: '2025-01-15T10:00:00.000Z', latestVersion: '2.1.0', status: 'active' },
  { id: 'c2', name: 'OrderCard', description: '订单卡片组件', ownerGroupId: 'g2', createdAt: '2025-01-20T14:30:00.000Z', latestVersion: '1.5.2', status: 'active' },
  { id: 'c3', name: 'UserAvatar', description: '用户头像组件', ownerGroupId: 'g3', createdAt: '2025-02-01T09:15:00.000Z', latestVersion: '3.0.0', status: 'active' },
  { id: 'c4', name: 'FormValidator', description: '表单校验组件', ownerGroupId: 'g1', createdAt: '2025-02-10T16:45:00.000Z', latestVersion: '1.0.0', status: 'active' },
];

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', componentId: 'c1', componentName: 'PayButton', name: 'feature-new-ui', version: '2.2.0-dev', createdBy: 'u2', createdAt: '2025-03-01T10:00:00.000Z', status: 'developing', compatibilityChecked: false, lastCommitMessage: '重构按钮样式' },
  { id: 'b2', componentId: 'c2', componentName: 'OrderCard', name: 'hotfix-discount', version: '1.5.3-hotfix', createdBy: 'u3', createdAt: '2025-03-05T14:00:00.000Z', status: 'testing', compatibilityChecked: true, lastCommitMessage: '修复优惠计算bug' },
  { id: 'b3', componentId: 'c3', componentName: 'UserAvatar', name: 'feature-animate', version: '3.1.0-alpha', createdBy: 'u4', createdAt: '2025-03-10T09:00:00.000Z', status: 'ready', compatibilityChecked: true, lastCommitMessage: '增加动画效果' },
];

const INITIAL_PERMISSIONS: Permission[] = [
  { groupId: 'g1', componentId: 'c1', canRead: true, canWrite: true, canPublish: true },
  { groupId: 'g1', componentId: 'c2', canRead: true, canWrite: false, canPublish: false },
  { groupId: 'g1', componentId: 'c4', canRead: true, canWrite: true, canPublish: true },
  { groupId: 'g2', componentId: 'c1', canRead: true, canWrite: false, canPublish: false },
  { groupId: 'g2', componentId: 'c2', canRead: true, canWrite: true, canPublish: true },
  { groupId: 'g3', componentId: 'c3', canRead: true, canWrite: true, canPublish: true },
  { groupId: 'g3', componentId: 'c4', canRead: true, canWrite: false, canPublish: false },
];

const INITIAL_LOGS: OperationLog[] = [
  {
    id: 'l1',
    type: 'create_branch',
    operator: 'u2',
    operatorRole: 'developer',
    target: 'b1',
    detail: '创建分支 PayButton/feature-new-ui',
    success: true,
    timestamp: '2025-03-01T10:00:00.000Z',
  },
  {
    id: 'l2',
    type: 'create_branch',
    operator: 'u3',
    operatorRole: 'leader',
    target: 'b2',
    detail: '创建分支 OrderCard/hotfix-discount',
    success: true,
    timestamp: '2025-03-05T14:00:00.000Z',
  },
  {
    id: 'l3',
    type: 'create_branch',
    operator: 'u4',
    operatorRole: 'developer',
    target: 'b3',
    detail: '创建分支 UserAvatar/feature-animate',
    success: true,
    timestamp: '2025-03-10T09:00:00.000Z',
  },
];

const idCounters: Record<string, number> = {
  u: 4,
  g: 3,
  c: 4,
  b: 3,
  p: 0,
  l: 3,
};

const prefixMap: Record<EntityKey, string> = {
  users: 'u',
  groups: 'g',
  components: 'c',
  branches: 'b',
  permissions: 'p',
  publishRecords: 'pr',
  logs: 'l',
};

interface DataStore {
  users: User[];
  groups: DevGroup[];
  components: Component[];
  branches: Branch[];
  permissions: Permission[];
  publishRecords: PublishRecord[];
  logs: OperationLog[];
}

const data: DataStore = {
  users: [...INITIAL_USERS],
  groups: [...INITIAL_GROUPS],
  components: [...INITIAL_COMPONENTS],
  branches: [...INITIAL_BRANCHES],
  permissions: [...INITIAL_PERMISSIONS],
  publishRecords: [],
  logs: [...INITIAL_LOGS],
};

let currentOperator: User | null = null;

export function setCurrentOperator(user: User | null): void {
  currentOperator = user;
}

export function getCurrentOperator(): User | null {
  return currentOperator;
}

function generateId(entity: EntityKey): string {
  const prefix = prefixMap[entity];
  if (!(prefix in idCounters)) {
    idCounters[prefix] = 0;
  }
  idCounters[prefix] += 1;
  return `${prefix}${idCounters[prefix]}`;
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function addLog(
  type: OperationLogType,
  target: string,
  detail: string,
  success: boolean = true,
): void {
  const operator = currentOperator;
  const log: OperationLog = {
    id: generateId('logs'),
    type,
    operator: operator?.id ?? 'system',
    operatorRole: operator?.role ?? 'system',
    target,
    detail,
    success,
    timestamp: getTimestamp(),
  };
  data.logs.unshift(log);
}

type ListFilter<T> = Partial<T> | ((item: T) => boolean);

function applyFilter<T>(list: T[], filter?: ListFilter<T>): T[] {
  if (!filter) return list;
  if (typeof filter === 'function') {
    return list.filter(filter);
  }
  return list.filter((item) => {
    return Object.entries(filter).every(([key, value]) => {
      return (item as Record<string, unknown>)[key] === value;
    });
  });
}

export function createStore() {
  return {
    users: {
      list(filter?: ListFilter<User>): User[] {
        return applyFilter(data.users, filter);
      },
      get(id: string): User | undefined {
        return data.users.find((u) => u.id === id);
      },
      create(input: Omit<User, 'id'>): User {
        const id = generateId('users');
        const user: User = { ...input, id };
        data.users.push(user);
        const group = data.groups.find((g) => g.id === user.groupId);
        if (group && !group.memberIds.includes(user.id)) {
          group.memberIds.push(user.id);
          group.memberCount = group.memberIds.length;
        }
        addLog('user_login', user.id, `创建用户: ${user.name}`, true);
        return user;
      },
      update(id: string, patch: Partial<Omit<User, 'id'>>): User | undefined {
        const idx = data.users.findIndex((u) => u.id === id);
        if (idx === -1) return undefined;
        const oldGroupId = data.users[idx].groupId;
        const newGroupId = patch.groupId;
        data.users[idx] = { ...data.users[idx], ...patch };
        if (newGroupId && oldGroupId !== newGroupId) {
          const oldGroup = data.groups.find((g) => g.id === oldGroupId);
          if (oldGroup) {
            oldGroup.memberIds = oldGroup.memberIds.filter((m) => m !== id);
            oldGroup.memberCount = oldGroup.memberIds.length;
          }
          const newGroup = data.groups.find((g) => g.id === newGroupId);
          if (newGroup && !newGroup.memberIds.includes(id)) {
            newGroup.memberIds.push(id);
            newGroup.memberCount = newGroup.memberIds.length;
          }
        }
        addLog('user_login', id, `更新用户信息: ${data.users[idx].name}`, true);
        return data.users[idx];
      },
      remove(id: string): boolean {
        const idx = data.users.findIndex((u) => u.id === id);
        if (idx === -1) return false;
        const user = data.users[idx];
        const group = data.groups.find((g) => g.id === user.groupId);
        if (group) {
          group.memberIds = group.memberIds.filter((m) => m !== id);
          group.memberCount = group.memberIds.length;
        }
        data.users.splice(idx, 1);
        addLog('user_login', id, `删除用户: ${user.name}`, true);
        return true;
      },
    },

    groups: {
      list(filter?: ListFilter<DevGroup>): DevGroup[] {
        return applyFilter(data.groups, filter);
      },
      get(id: string): DevGroup | undefined {
        return data.groups.find((g) => g.id === id);
      },
      create(input: Omit<DevGroup, 'id' | 'memberCount' | 'memberIds'> & { memberIds?: string[] }): DevGroup {
        const id = generateId('groups');
        const memberIds = input.memberIds ?? [];
        const group: DevGroup = {
          id,
          name: input.name,
          memberIds,
          memberCount: memberIds.length,
        };
        data.groups.push(group);
        memberIds.forEach((uid) => {
          const user = data.users.find((u) => u.id === uid);
          if (user) user.groupId = id;
        });
        addLog('create_group', id, `创建开发组: ${group.name}`, true);
        return group;
      },
      update(id: string, patch: Partial<Omit<DevGroup, 'id'>>): DevGroup | undefined {
        const idx = data.groups.findIndex((g) => g.id === id);
        if (idx === -1) return undefined;
        const oldMemberIds = data.groups[idx].memberIds;
        data.groups[idx] = { ...data.groups[idx], ...patch };
        if (patch.memberIds) {
          data.groups[idx].memberCount = patch.memberIds.length;
          const added = patch.memberIds.filter((m) => !oldMemberIds.includes(m));
          const removed = oldMemberIds.filter((m) => !patch.memberIds!.includes(m));
          added.forEach((uid) => {
            const user = data.users.find((u) => u.id === uid);
            if (user) user.groupId = id;
          });
          removed.forEach((uid) => {
            const user = data.users.find((u) => u.id === uid);
            if (user && user.groupId === id) {
              user.groupId = '';
            }
          });
        }
        addLog('update_group', id, `更新开发组: ${data.groups[idx].name}`, true);
        return data.groups[idx];
      },
      remove(id: string): boolean {
        const idx = data.groups.findIndex((g) => g.id === id);
        if (idx === -1) return false;
        const group = data.groups[idx];
        group.memberIds.forEach((uid) => {
          const user = data.users.find((u) => u.id === uid);
          if (user) user.groupId = '';
        });
        data.groups.splice(idx, 1);
        data.permissions = data.permissions.filter((p) => p.groupId !== id);
        addLog('delete_group', id, `删除开发组: ${group.name}`, true);
        return true;
      },
    },

    components: {
      list(filter?: ListFilter<Component>): Component[] {
        return applyFilter(data.components, filter);
      },
      get(id: string): Component | undefined {
        return data.components.find((c) => c.id === id);
      },
      create(input: Omit<Component, 'id' | 'createdAt'>): Component {
        const id = generateId('components');
        const component: Component = {
          ...input,
          id,
          createdAt: getTimestamp(),
        };
        data.components.push(component);
        addLog('create_component', id, `创建组件: ${component.name}`, true);
        return component;
      },
      update(id: string, patch: Partial<Omit<Component, 'id' | 'createdAt'>>): Component | undefined {
        const idx = data.components.findIndex((c) => c.id === id);
        if (idx === -1) return undefined;
        data.components[idx] = { ...data.components[idx], ...patch };
        addLog('update_component', id, `更新组件: ${data.components[idx].name}`, true);
        return data.components[idx];
      },
      remove(id: string): boolean {
        const idx = data.components.findIndex((c) => c.id === id);
        if (idx === -1) return false;
        const component = data.components[idx];
        data.components.splice(idx, 1);
        data.branches = data.branches.filter((b) => b.componentId !== id);
        data.permissions = data.permissions.filter((p) => p.componentId !== id);
        addLog('delete_component', id, `删除组件: ${component.name}`, true);
        return true;
      },
    },

    branches: {
      list(filter?: ListFilter<Branch>): Branch[] {
        return applyFilter(data.branches, filter);
      },
      get(id: string): Branch | undefined {
        return data.branches.find((b) => b.id === id);
      },
      findByComponentAndName(componentId: string, name: string): Branch | undefined {
        return data.branches.find((b) => b.componentId === componentId && b.name === name);
      },
      create(input: Omit<Branch, 'id' | 'createdAt'>): Branch {
        const component = data.components.find((c) => c.id === input.componentId);
        const componentName = component?.name ?? input.componentName ?? '';
        const id = generateId('branches');
        const branch: Branch = {
          ...input,
          componentName,
          id,
          createdAt: getTimestamp(),
        };
        data.branches.push(branch);
        addLog('create_branch', id, `创建分支 ${componentName}/${branch.name}`, true);
        return branch;
      },
      update(id: string, patch: Partial<Omit<Branch, 'id' | 'createdAt'>>): Branch | undefined {
        const idx = data.branches.findIndex((b) => b.id === id);
        if (idx === -1) return undefined;
        data.branches[idx] = { ...data.branches[idx], ...patch };
        addLog('update_branch', id, `更新分支: ${data.branches[idx].name}`, true);
        return data.branches[idx];
      },
      remove(id: string): boolean {
        const idx = data.branches.findIndex((b) => b.id === id);
        if (idx === -1) return false;
        const branch = data.branches[idx];
        data.branches.splice(idx, 1);
        addLog('delete_branch', id, `删除分支: ${branch.componentName}/${branch.name}`, true);
        return true;
      },
    },

    permissions: {
      list(filter?: ListFilter<Permission>): Permission[] {
        return applyFilter(data.permissions, filter);
      },
      get(groupId: string, componentId: string): Permission | undefined {
        return data.permissions.find((p) => p.groupId === groupId && p.componentId === componentId);
      },
      set(input: Permission): Permission {
        const idx = data.permissions.findIndex(
          (p) => p.groupId === input.groupId && p.componentId === input.componentId,
        );
        if (idx === -1) {
          data.permissions.push(input);
          addLog('update_permission', `${input.groupId}-${input.componentId}`, `设置权限: group=${input.groupId}, component=${input.componentId}`, true);
          return input;
        }
        data.permissions[idx] = { ...input };
        addLog('update_permission', `${input.groupId}-${input.componentId}`, `更新权限: group=${input.groupId}, component=${input.componentId}`, true);
        return data.permissions[idx];
      },
      bulkUpdate(permissions: Permission[]): Permission[] {
        permissions.forEach((p) => {
          const idx = data.permissions.findIndex(
            (ep) => ep.groupId === p.groupId && ep.componentId === p.componentId,
          );
          if (idx === -1) {
            data.permissions.push(p);
          } else {
            data.permissions[idx] = { ...p };
          }
        });
        addLog('update_permission', 'bulk', `批量更新 ${permissions.length} 条权限配置`, true);
        return [...data.permissions];
      },
      remove(groupId: string, componentId: string): boolean {
        const idx = data.permissions.findIndex(
          (p) => p.groupId === groupId && p.componentId === componentId,
        );
        if (idx === -1) return false;
        data.permissions.splice(idx, 1);
        addLog('update_permission', `${groupId}-${componentId}`, `删除权限: group=${groupId}, component=${componentId}`, true);
        return true;
      },
    },

    publishRecords: {
      list(filter?: ListFilter<PublishRecord>): PublishRecord[] {
        return applyFilter(data.publishRecords, filter);
      },
      get(id: string): PublishRecord | undefined {
        return data.publishRecords.find((r) => r.id === id);
      },
      create(input: Omit<PublishRecord, 'id' | 'operatedAt'>): PublishRecord {
        const id = generateId('publishRecords');
        const record: PublishRecord = {
          ...input,
          id,
          operatedAt: getTimestamp(),
        };
        data.publishRecords.push(record);
        const logType: OperationLogType =
          input.environment === 'prod' ? 'publish_prod' : 'publish_test';
        addLog(
          logType,
          id,
          `发布到${input.environment === 'prod' ? '生产' : '测试'}环境: ${record.componentName}/${record.branchName} - ${record.status}`,
          record.status === 'success',
        );
        if (record.status === 'success' && record.environment === 'prod') {
          const branchIdx = data.branches.findIndex((b) => b.id === record.branchId);
          if (branchIdx !== -1) {
            data.branches[branchIdx].status = 'published';
          }
        }
        return record;
      },
    },

    logs: {
      list(filter?: ListFilter<OperationLog>): OperationLog[] {
        return applyFilter(data.logs, filter);
      },
      get(id: string): OperationLog | undefined {
        return data.logs.find((l) => l.id === id);
      },
      add(
        type: OperationLogType,
        target: string,
        detail: string,
        success: boolean = true,
      ): OperationLog {
        const operator = currentOperator;
        const log: OperationLog = {
          id: generateId('logs'),
          type,
          operator: operator?.id ?? 'system',
          operatorRole: operator?.role ?? 'system',
          target,
          detail,
          success,
          timestamp: getTimestamp(),
        };
        data.logs.unshift(log);
        return log;
      },
    },
  };
}

export const store = createStore();

export default store;
