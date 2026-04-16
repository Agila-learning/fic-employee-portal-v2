import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    requirements?: string;
    attachments: CredentialAttachment[];
    credentials: CredentialEntry[];
    createdBy?: any;
    createdAt?: string;
    updatedAt?: string;
}

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('fic-user') || '{}');
    return { headers: { Authorization: `Bearer ${user.token}` } };
};

export const credentialService = {
    getProjects: async (): Promise<CredentialProject[]> => {
        const response = await axios.get(`${API_URL}/credentials`, getAuthHeader());
        return response.data;
    },

    getProject: async (id: string): Promise<CredentialProject> => {
        const response = await axios.get(`${API_URL}/credentials/${id}`, getAuthHeader());
        return response.data;
    },

    createProject: async (data: Partial<CredentialProject>): Promise<CredentialProject> => {
        const response = await axios.post(`${API_URL}/credentials`, data, getAuthHeader());
        return response.data;
    },

    updateProject: async (id: string, data: Partial<CredentialProject>): Promise<CredentialProject> => {
        const response = await axios.put(`${API_URL}/credentials/${id}`, data, getAuthHeader());
        return response.data;
    },

    deleteProject: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/credentials/${id}`, getAuthHeader());
    }
};
