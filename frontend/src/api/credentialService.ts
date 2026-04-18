import apiClient from './apiClient';

// apiClient uses baseURL: "/api"

export interface CredentialEntry {
    _id?: string;
    title: string;
    loginType: 'Email login' | 'Mobile login' | 'Username login' | 'Custom login';
    email?: string;
    mobile?: string;
    username?: string;
    password: string;
    url?: string;
    role?: string;
    notes?: string;
    recoveryMail?: string;
    recoveryMobile?: string;
    isImportant?: boolean;
    customFields?: Record<string, string>;
}

export interface CredentialAttachment {
    _id?: string;
    name: string;
    type: string;
    url: string;
    public_id?: string;
    uploadDate: string;
    uploadedBy?: any;
}

export interface CredentialProject {
    _id?: string;
    projectName: string;
    clientName?: string;
    companyName?: string;
    projectType?: string;
    department?: string;
    status: 'Active' | 'On Hold' | 'Completed' | 'Archived';
    developerName?: string;
    requirements?: string;
    attachments: CredentialAttachment[];
    credentials: CredentialEntry[];
    createdBy?: any;
    createdAt?: string;
    updatedAt?: string;
}

// Auth is handled by apiClient interceptor

export const credentialService = {
    getProjects: async (): Promise<CredentialProject[]> => {
        const response = await apiClient.get('/credentials');
        return response.data;
    },

    getProject: async (id: string): Promise<CredentialProject> => {
        const response = await apiClient.get(`/credentials/${id}`);
        return response.data;
    },

    createProject: async (data: Partial<CredentialProject>): Promise<CredentialProject> => {
        const response = await apiClient.post('/credentials', data);
        return response.data;
    },

    updateProject: async (id: string, data: Partial<CredentialProject>): Promise<CredentialProject> => {
        const response = await apiClient.put(`/credentials/${id}`, data);
        return response.data;
    },

    deleteProject: async (id: string): Promise<void> => {
        await apiClient.delete(`/credentials/${id}`);
    }
};
