const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content, messageType, fileUrl, fileName, fileSize, duration } = req.body;
        const senderId = req.user.id;

        if (!receiverId || (!content && !fileUrl)) {
            return res.status(400).json({ message: 'Receiver and content are required' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        // Employee can only chat with Admin
        if (req.user.role === 'employee' && receiver.role !== 'admin') {
            return res.status(403).json({ message: 'Employees can only message Admin users' });
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content: content || (messageType === 'voice' ? 'Voice Message' : fileName || 'Attachment'),
            messageType: messageType || 'text',
            fileUrl,
            fileName,
            fileSize,
            duration
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get message history between two users
exports.getMessages = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const myId = req.user.id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: otherUserId },
                { sender: otherUserId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { sender: otherUserId, receiver: myId, isRead: false },
            { isRead: true }
        );

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get chat list (users you have chatted with)
exports.getChatList = async (req, res) => {
    try {
        const myId = req.user.id;

        // Find all unique users I have exchanged messages with
        const messages = await Message.find({
            $or: [{ sender: myId }, { receiver: myId }]
        }).sort({ createdAt: -1 });

        const chatPartners = new Set();
        const latestMessages = [];

        messages.forEach(msg => {
            const partnerId = msg.sender.toString() === myId.toString() ? msg.receiver.toString() : msg.sender.toString();
            if (!chatPartners.has(partnerId)) {
                chatPartners.add(partnerId);
                latestMessages.push(msg);
            }
        });
        
        let users = await User.find({ _id: { $in: Array.from(chatPartners) } }).select('name role');

        // If employee, filter out non-admin partners
        if (req.user.role === 'employee') {
            users = users.filter(user => ['admin', 'md', 'sub-admin'].includes(user.role));
        }

        const result = await Promise.all(users.map(async (user) => {
            const lastMsg = latestMessages.find(m => 
                m.sender.toString() === user._id.toString() || 
                m.receiver.toString() === user._id.toString()
            );
            
            const unreadCount = await Message.countDocuments({
                sender: user._id,
                receiver: myId,
                isRead: false
            });

            return {
                _id: user._id,
                name: user.name,
                role: user.role,
                lastMessage: lastMsg.content,
                lastMessageTime: lastMsg.createdAt,
                isUnread: unreadCount > 0,
                unreadCount
            };
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only sender or admin can delete
        if (message.sender.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
