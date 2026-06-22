import type {
  User,
  Component,
  Branch,
  DevGroup,
  Permission,
  PublishRecord,
  OperationLog,
  ApiResponse,
  Stats,
  CompatibilityCheckResult,
  PermissionMatrixData,
} from '../../shared/types'

class ApiClient {
  private userId: string = 'u1'

  setUserId(userId: string) {
    this.userId = userId
  }

  getUserId(): string {
    return this.userId
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.userId,
    }
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.headers(),
        ...(options.headers ?? {}),
      },
    })
    return (await res.json()) as ApiResponse<T>
  }

  async login(userId: string): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/me')
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/api/auth/users')
  }

  async getComponents(params?: { status?: string; ownerGroupId?: string }): Promise<ApiResponse<Component[]>> {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.request<Component[]>(`/api/components${query ? `?${query}` : ''}`)
  }

  async getComponentStats(): Promise<ApiResponse<Stats>> {
    return this.request<Stats>('/api/components/stats')
  }

  async getComponent(id: string): Promise<ApiResponse<Component>> {
    return this.request<Component>(`/api/components/${id}`)
  }

  async createComponent(data: Partial<Component>): Promise<ApiResponse<Component>> {
    return this.request<Component>('/api/components', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateComponent(id: string, data: Partial<Component>): Promise<ApiResponse<Component>> {
    return this.request<Component>(`/api/components/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteComponent(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/api/components/${id}`, {
      method: 'DELETE',
    })
  }

  async getBranches(params?: { componentId?: string; status?: string }): Promise<ApiResponse<Branch[]>> {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.request<Branch[]>(`/api/branches${query ? `?${query}` : ''}`)
  }

  async getBranch(id: string): Promise<ApiResponse<Branch>> {
    return this.request<Branch>(`/api/branches/${id}`)
  }

  async checkBranchUnique(componentId: string, branchName: string): Promise<ApiResponse<{ unique: boolean; exists: boolean; message: string }>> {
    return this.request('/api/branches/check', {
      method: 'POST',
      body: JSON.stringify({ componentId, branchName }),
    })
  }

  async createBranch(data: { componentId: string; branchName: string; version: string; lastCommitMessage: string }): Promise<ApiResponse<Branch | null>> {
    return this.request<Branch | null>('/api/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBranch(id: string, data: Partial<Branch>): Promise<ApiResponse<Branch>> {
    return this.request<Branch>(`/api/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteBranch(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/api/branches/${id}`, {
      method: 'DELETE',
    })
  }

  async getGroups(): Promise<ApiResponse<DevGroup[]>> {
    return this.request<DevGroup[]>('/api/groups')
  }

  async getGroup(id: string): Promise<ApiResponse<DevGroup & { members: User[] }>> {
    return this.request(`/api/groups/${id}`)
  }

  async createGroup(data: { name: string; memberIds?: string[] }): Promise<ApiResponse<DevGroup>> {
    return this.request<DevGroup>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateGroup(id: string, data: Partial<DevGroup>): Promise<ApiResponse<DevGroup>> {
    return this.request<DevGroup>(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGroup(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/api/groups/${id}`, {
      method: 'DELETE',
    })
  }

  async getPermissions(params?: { groupId?: string; componentId?: string }): Promise<ApiResponse<Permission[]>> {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.request<Permission[]>(`/api/permissions${query ? `?${query}` : ''}`)
  }

  async getPermissionMatrix(): Promise<ApiResponse<PermissionMatrixData>> {
    return this.request<PermissionMatrixData>('/api/permissions/matrix')
  }

  async getGroupPermissions(groupId: string): Promise<ApiResponse<Permission[]>> {
    return this.request<Permission[]>(`/api/permissions/group/${groupId}`)
  }

  async updatePermission(data: { groupId: string; componentId: string; canRead: boolean; canWrite: boolean; canPublish: boolean }): Promise<ApiResponse<Permission | null>> {
    return this.request<Permission | null>('/api/permissions', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async bulkUpdatePermissions(permissions: Permission[]): Promise<ApiResponse<Permission[]>> {
    return this.request<Permission[]>('/api/permissions/bulk', {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    })
  }

  async getPublishRecords(params?: { environment?: string; branchId?: string; status?: string }): Promise<ApiResponse<PublishRecord[]>> {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.request<PublishRecord[]>(`/api/publish/records${query ? `?${query}` : ''}`)
  }

  async runCompatibilityCheck(branchId: string): Promise<ApiResponse<CompatibilityCheckResult>> {
    return this.request<CompatibilityCheckResult>('/api/publish/compatibility-check', {
      method: 'POST',
      body: JSON.stringify({ branchId }),
    })
  }

  async publishTest(branchId: string): Promise<ApiResponse<{ success: boolean; record: PublishRecord | null; message: string }>> {
    return this.request('/api/publish/test', {
      method: 'POST',
      body: JSON.stringify({ branchId }),
    })
  }

  async publishProd(branchId: string): Promise<ApiResponse<{ success: boolean; record: PublishRecord | null; compatibilityCheck?: CompatibilityCheckResult; message: string }>> {
    return this.request('/api/publish/prod', {
      method: 'POST',
      body: JSON.stringify({ branchId }),
    })
  }

  async getLogs(params?: { type?: string; operator?: string; success?: boolean; limit?: number }): Promise<ApiResponse<OperationLog[]>> {
    const query = params ? new URLSearchParams(params as unknown as Record<string, string>).toString() : ''
    return this.request<OperationLog[]>(`/api/logs${query ? `?${query}` : ''}`)
  }

  async simulateDuplicateBranch(): Promise<ApiResponse<unknown>> {
    return this.request('/api/logs/simulate/duplicate-branch', {
      method: 'POST',
    })
  }

  async simulatePermissionDenied(): Promise<ApiResponse<unknown>> {
    return this.request('/api/logs/simulate/permission-denied', {
      method: 'POST',
    })
  }

  async simulatePublishWithoutCompat(): Promise<ApiResponse<unknown>> {
    return this.request('/api/logs/simulate/publish-without-compat', {
      method: 'POST',
    })
  }
}

export const api = new ApiClient()
export default api
