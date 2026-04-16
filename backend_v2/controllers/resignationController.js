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

        // Initial Email to Employee
        sendEmail(
            req.user.email,
            'Resignation Initiated - Forge India Connect',
            `Dear ${req.user.name},\n\nWe have successfully received your formal resignation request. Your proposed last working date (${new Date(req.body.proposedLastWorkingDate).toLocaleDateString()}) has been noted.\n\nOur HR and Management teams will review your request. You will be notified automatically with notice period details upon CEO approval.\n\nBest Regards,\nHR Department\nForge India Connect`
        );

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
            const filePath = path.join(dir, fileName);
            const stream = fs.createWriteStream(filePath);
            
            // Standard A4 sizes and margins
            const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
            doc.pipe(stream);

            const logoPath = path.join(__dirname, '../../frontend/src/assets/fic-logo.jpeg');
            let hasLogo = fs.existsSync(logoPath);

            // Watermark (Center)
            if (hasLogo) {
                doc.save(); 
                doc.opacity(0.1);
                // Center the watermark on standard A4 (595.28 x 841.89)
                doc.image(logoPath, (doc.page.width - 300) / 2, (doc.page.height - 300) / 2, { width: 300 });
                doc.restore();
            }

            // Header Section
            if (hasLogo) {
                doc.image(logoPath, 50, 45, { width: 80 }); 
            }
            
            // Company Name
            doc.fillColor('#0b4c92'); 
            doc.fontSize(22).font('Helvetica-Bold').text('FORGE INDIA CONNECT', 145, 50);
            
            // Company Address
            doc.fillColor('#666666');
            doc.fontSize(10).font('Helvetica').text('RK Towers, Opposite to HP Petrol Bunk, Wahab Nagar,', 145, 75);
            doc.text('Rayakottai road, Krishnagiri.', 145, 88);
            
            // Separator Line
            doc.moveTo(50, 115).lineTo(545, 115).lineWidth(2).strokeColor('#e5e7eb').stroke();

            // Document Title
            doc.fillColor('#000000');
            doc.fontSize(15).font('Helvetica-Bold').text('RELIEVING LETTER', 50, 145, { align: 'center' });
            
            doc.moveDown(2);
            doc.fontSize(11).font('Helvetica');
            doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
            doc.moveDown();

            doc.font('Helvetica-Bold').text('To,');
            doc.text(`${resignation.employee.name}`);
            doc.font('Helvetica').text(`Employee ID: ${resignation.employee.employee_id}`);
            doc.text(`Department: ${resignation.employee.department}`);
            doc.moveDown(1.5);

            doc.font('Helvetica-Bold').text('Sub: Relieving Letter', { underline: true });
            doc.moveDown(1.5);

            doc.font('Helvetica').text(`Dear ${resignation.employee.name},`);
            doc.moveDown();
            
            let lwd = resignation.noticePeriod && resignation.noticePeriod.expectedLastWorkingDate 
                      ? new Date(resignation.noticePeriod.expectedLastWorkingDate).toLocaleDateString() 
                      : '_____';

            doc.text(`This has reference to your resignation letter dated ${new Date(resignation.appliedDate).toLocaleDateString()}. We would like to inform you that your resignation has been accepted and you are relieved from the services of Forge India Connect with effect from the close of working hours of ${lwd}.`, { align: 'justify', lineGap: 4 });
            doc.moveDown();

            doc.text(`Your full and final settlement will be processed within the stipulated timeframe as per company policy.`, { align: 'justify', lineGap: 4 });
            doc.moveDown();
            doc.text(`We thank you for your contribution to the organization and wish you all the best in your future endeavors.`, { align: 'justify', lineGap: 4 });
            doc.moveDown(4);

            doc.font('Helvetica-Bold').fillColor('#0b4c92').text(`For Forge India Connect,`);
            doc.moveDown(3);
            doc.fillColor('#000000').font('Helvetica').text(`________________________`);
            doc.text(`Authorized Signatory`);

            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

const revokeResignation = async (req, res) => {
    try {
        const resignation = await Resignation.findById(req.params.id);
        if (!resignation) return res.status(404).json({ message: 'Not found' });
        
        // Allow admin testing the revocation regardless of complete status
        // Ensure only the employee who created it or an admin can delete it
        if (resignation.employee.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'hr_manager') {
             return res.status(403).json({ message: 'Not authorized to revoke this resignation' });
        }

        await Resignation.findByIdAndDelete(req.params.id);
        
        await notifyUser(req.user._id, 'RESIGNATION_REVOKED', 'Your resignation process has been revoked and removed from records.', '/employee/dashboard');

        res.json({ message: 'Resignation revoked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
    revokeResignation,
    finalizeResignation
};
