const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Receiver and content are required' });
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content
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

        const users = await User.find({ _id: { $in: Array.from(chatPartners) } }).select('name role');

        const result = users.map(user => {
            const lastMsg = latestMessages.find(m => m.sender.toString() === user._id.toString() || m.receiver.toString() === user._id.toString());
            return {
                _id: user._id,
                name: user.name,
                role: user.role,
                lastMessage: lastMsg.content,
                lastMessageTime: lastMsg.createdAt,
                isUnread: lastMsg.receiver.toString() === myId.toString() && !lastMsg.isRead
            };
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
