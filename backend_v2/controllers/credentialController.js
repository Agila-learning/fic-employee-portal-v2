const CredentialProject = require('../models/CredentialProject');
const { encrypt, decrypt } = require('../services/credentialService');
const User = require('../models/User');

// Create a new project with credentials
const createProject = async (req, res) => {
    try {
        const { projectName, credentials, ...rest } = req.body;
        
        // Encrypt all passwords in credentials
        const processedCredentials = credentials?.map(cred => ({
            ...cred,
            password: encrypt(cred.password),
            // Mask confirmPassword if it exists or just ignore it
        })) || [];

        const projectData = {
            ...rest,
            projectName,
            credentials: processedCredentials,
            createdBy: req.user._id,
        };

        const project = await CredentialProject.create(projectData);
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all projects (summary view - no decryption)
const getProjects = async (req, res) => {
    try {
        const projects = await CredentialProject.find({})
            .populate('createdBy', 'name')
            .sort({ updatedAt: -1 });
            
        // Return without sensitive credential details for the list
        const summary = projects.map(p => ({
            ...p._doc,
            credentialCount: p.credentials?.length || 0,
            credentials: [] // Don't send credentials in list view for security
        }));

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single project with decrypted credentials
const getProject = async (req, res) => {
    try {
        const project = await CredentialProject.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Decrypt passwords before sending
        const decryptedCredentials = project.credentials.map(cred => ({
            ...cred._doc,
            password: decrypt(cred.password)
        }));

        res.json({
            ...project._doc,
            credentials: decryptedCredentials
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update project
const updateProject = async (req, res) => {
    try {
        const project = await CredentialProject.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const { credentials, ...rest } = req.body;

        // Process credentials: if password is changed (length might be different than encrypted format or just check dirty)
        // For simplicity in this implementation, we assume if password doesn't contain ":" it's a new password
        const processedCredentials = credentials?.map(cred => {
            const isPlaintext = cred.password && !cred.password.includes(':');
            return {
                ...cred,
                password: isPlaintext ? encrypt(cred.password) : cred.password
            };
        }) || [];

        Object.assign(project, {
            ...rest,
            credentials: processedCredentials,
            updatedBy: req.user._id
        });

        const updatedProject = await project.save();
        
        // Return decrypted for immediate UI update
        const decrypted = updatedProject.credentials.map(cred => ({
            ...cred._doc,
            password: decrypt(cred.password)
        }));

        res.json({ ...updatedProject._doc, credentials: decrypted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete project
const deleteProject = async (req, res) => {
    try {
        const project = await CredentialProject.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        await project.deleteOne();
        res.json({ message: 'Project and all credentials removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject
};
