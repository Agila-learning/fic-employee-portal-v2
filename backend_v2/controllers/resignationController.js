const Resignation = require('../models/Resignation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email Helper
const sendEmail = async (to, subject, text, attachments = []) => {
    try {
        console.log(`[EMAIL] Attempting to send email to ${to}...`);
        console.log(`[EMAIL] SMTP Config: host=${process.env.SMTP_HOST}, port=${process.env.SMTP_PORT}, user=${process.env.SMTP_USER}`);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT == 465, 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Verify connection before sending
        await transporter.verify();
        console.log('[EMAIL] SMTP Connection verified successfully');

        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'FIC Admin'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            attachments
        });
        
        console.log(`[EMAIL] Success: Message sent to ${to}. ID: ${info.messageId}`);
    } catch (error) {
        console.error('[EMAIL] CRITICAL ERROR sending email:', error.message);
        console.error('[EMAIL] Full Error Details:', error);
    }
};

const notifyUser = async (userId, type, message, link) => {
    try {
        await Notification.create({ userId, type, message, link });
    } catch (err) {
        console.error('Failed to notify:', err);
    }
};

const submitResignation = async (req, res) => {
    try {
        const existing = await Resignation.findOne({ employee: req.user._id, status: { $ne: 'Completed' } });
        if (existing) {
            return res.status(400).json({ message: 'You already have an active resignation request.' });
        }

        const resignation = new Resignation({
            ...req.body,
            employee: req.user._id,
            status: req.user.role === 'hr_manager' ? 'HR Approved' : 'Submitted', // HR Manager skips HR approval
            timeline: [{
                status: 'Submitted',
                remarks: 'Resignation application submitted.',
                changedBy: req.user._id
            }]
        });

        const saved = await resignation.save();
        
        await notifyUser(req.user._id, 'RESIGNATION', 'Your resignation has been submitted successfully.', '/employee/resignation-status');

        // Notify HR Managers (unless it is HR resigning)
        if (req.user.role !== 'hr_manager') {
            const hrs = await User.find({ role: 'hr_manager' });
            for (let hr of hrs) {
                await notifyUser(hr._id, 'RESIGNATION', `New resignation request from ${req.user.name}`, '/admin/resignations');
            }
        } else {
            // Notify Admins
            const admins = await User.find({ role: { $in: ['admin', 'md'] } });
            for (let a of admins) {
                await notifyUser(a._id, 'RESIGNATION', `HR Manager ${req.user.name} submitted resignation (Direct CEO Approval)`, '/admin/resignations');
            }
        }

        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyResignation = async (req, res) => {
    try {
        const resignation = await Resignation.findOne({ employee: req.user._id }).sort({ createdAt: -1 });
        if (!resignation) return res.status(404).json({ message: 'No resignation record found' });
        res.json(resignation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// For HR and Admin to view
const getAllResignations = async (req, res) => {
    try {
        const role = req.user.role;
        let query = {};
        
        // If HR manager, only see Submitted or those they approved. Cannot see Admin clearances unless needed.
        if (role === 'hr_manager') {
            query = { status: { $in: ['Submitted', 'HR Approved', 'Rejected'] } };
        }
        
        const resignations = await Resignation.find(query)
                .populate('employee', 'name email employee_id department')
                .populate('timeline.changedBy', 'name role')
                .sort({ createdAt: -1 });
                
        res.json(resignations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateResignationStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const resignation = await Resignation.findById(req.params.id).populate('employee');
        
        if (!resignation) return res.status(404).json({ message: 'Not found' });

        resignation.status = status;
        resignation.timeline.push({
            status,
            remarks,
            changedBy: req.user._id
        });
        
        // CEO Approval Automation
        if (status === 'CEO Approved') {
            // Notice period starts now. Calculate expected LWD.
            // Default to 1 month from now or use notice period setting
            const noticeDays = resignation.noticePeriod?.totalDays || 30;
            const expectedLWD = new Date();
            expectedLWD.setDate(expectedLWD.getDate() + noticeDays);
            
            resignation.noticePeriod.expectedLastWorkingDate = expectedLWD;
            resignation.status = 'Notice Active'; // Automatically advance to active notice period
            
            // Add a timeline entry for auto-transition
            resignation.timeline.push({
                status: 'Notice Active',
                remarks: `Automated: Notice period started upon CEO approval. Expected LWD: ${expectedLWD.toLocaleDateString()}`,
                changedBy: req.user._id
            });

            // Send notification email to employee
            const emailContent = `Dear ${resignation.employee.name},

Your resignation request has been APPROVED by the CEO.

NOTICE PERIOD DETAILS:
- Start Date: ${new Date().toLocaleDateString()}
- Notice Duration: ${noticeDays} days
- Expected Last Working Date: ${expectedLWD.toLocaleDateString()}

Please complete the handover process and asset clearance as scheduled.

Best Regards,
HR Department
Forge India Connect`;

            sendEmail(
                resignation.employee.email,
                'Resignation Approved & Notice Period Started - Forge India Connect',
                emailContent
            );
        }

        if (status === 'Notice Active' && !resignation.noticePeriod.expectedLastWorkingDate) {
            resignation.noticePeriod.expectedLastWorkingDate = resignation.proposedLastWorkingDate;
        }

        await resignation.save();

        await notifyUser(
            resignation.employee._id, 
            'RESIGNATION_UPDATE', 
            `Your resignation status updated to: ${resignation.status}`, 
            '/employee/resignation-status'
        );

        if (status === 'HR Approved') {
            const admins = await User.find({ role: { $in: ['admin', 'md'] } });
            for (let a of admins) {
                await notifyUser(a._id, 'RESIGNATION', `Resignation approved by HR, pending your action: ${resignation.employee.name}`, '/admin/resignations');
            }
        }

        res.json(resignation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAssets = async (req, res) => {
    try {
        const { assets } = req.body;
        const resignation = await Resignation.findById(req.params.id);
        if (!resignation) return res.status(404).json({ message: 'Not found' });

        resignation.assets = assets; // Expecting array of asset objects
        await resignation.save();

        res.json(resignation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const generateRelievingLetterPDF = async (resignation) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const fileName = `Relieving_Letter_${resignation.employee.employee_id}.pdf`;
            const dir = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }
            const filePath = path.join(dir, fileName);
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Add Company Header
            doc.fontSize(20).text('FORGE INDIA CONNECT', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text('RELIEVING LETTER', { align: 'center', underline: true });
            doc.moveDown(2);

            doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
            doc.moveDown();

            doc.text(`To,`);
            doc.text(`${resignation.employee.name}`);
            doc.text(`Employee ID: ${resignation.employee.employee_id}`);
            doc.text(`Department: ${resignation.employee.department}`);
            doc.moveDown();

            doc.text(`Sub: Relieving Letter`, { underline: true });
            doc.moveDown();

            doc.text(`Dear ${resignation.employee.name},`);
            doc.moveDown();
            
            doc.text(`This has reference to your resignation letter dated ${resignation.appliedDate.toLocaleDateString()}. We would like to inform you that your resignation has been accepted and you are relieved from the services of Forge India Connect with effect from the close of working hours of ${resignation.noticePeriod.expectedLastWorkingDate ? resignation.noticePeriod.expectedLastWorkingDate.toLocaleDateString() : '_____'}.`);
            doc.moveDown();

            doc.text(`Your full and final settlement will be processed within the stipulated timeframe as per company policy.`);
            doc.moveDown();
            doc.text(`We thank you for your contribution to the organization and wish you all the best in your future endeavors.`);
            doc.moveDown(3);

            doc.text(`For Forge India Connect,`);
            doc.moveDown(2);
            doc.text(`________________________`);
            doc.text(`Authorized Signatory`);

            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

const finalizeResignation = async (req, res) => {
    try {
        const resignation = await Resignation.findById(req.params.id).populate('employee');
        if (!resignation) return res.status(404).json({ message: 'Not found' });

        resignation.status = 'Completed';
        resignation.timeline.push({
            status: 'Completed',
            remarks: 'Final settlement and relieving letter generated.',
            changedBy: req.user._id
        });

        // Generate PDF
        let filePath;
        try {
            filePath = await generateRelievingLetterPDF(resignation);
            resignation.relievingLetterUrl = `/uploads/${path.basename(filePath)}`;
        } catch (pdfErr) {
            console.error('PDF generation error', pdfErr);
        }

        await resignation.save();

        await notifyUser(
            resignation.employee._id, 
            'RESIGNATION_COMPLETE', 
            `Your exit process is complete. Your relieving letter is available.`, 
            '/employee/resignation-status'
        );

        if (filePath) {
            console.log(`[RESIGNATION] Triggering Finalized email with PDF: ${filePath}`);
            sendEmail(
                resignation.employee.email, 
                'Relieving Letter - Forge India Connect', 
                `Dear ${resignation.employee.name},\n\nPlease find attached your formal relieving letter.\n\nBest Regards,\nForge India Connect HR`,
                [{ filename: path.basename(filePath), path: filePath }]
            );
        } else {
            console.error('[RESIGNATION] Skipping email: Relieving letter PDF path not found.');
        }

        res.json(resignation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitResignation,
    getMyResignation,
    getAllResignations,
    updateResignationStatus,
    updateAssets,
    finalizeResignation
};
