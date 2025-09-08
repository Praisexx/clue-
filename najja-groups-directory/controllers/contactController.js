exports.getContactPage = async (req, res) => {
    try {
        res.render('contact', {
            title: 'Contact Us - Naija Groups',
            description: 'Get in touch with the Naija Groups team',
            errors: [],
            formData: {},
            success: false
        });
    } catch (error) {
        console.error('Error loading contact page:', error);
        res.status(500).send('Unable to load the contact page: ' + error.message);
    }
};

exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Basic validation
        const errors = [];
        if (!name || name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Please provide a valid email address');
        }
        if (!subject || subject.trim().length < 3) {
            errors.push('Subject must be at least 3 characters long');
        }
        if (!message || message.trim().length < 10) {
            errors.push('Message must be at least 10 characters long');
        }
        
        if (errors.length > 0) {
            return res.render('contact', {
                title: 'Contact Us - Naija Groups',
                description: 'Get in touch with the Naija Groups team',
                errors: errors,
                formData: { name, email, subject, message },
                success: false
            });
        }
        
        // For now, just log the message (in production, you'd send an email or save to database)
        console.log('📧 Contact form submission:', {
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            timestamp: new Date().toISOString()
        });
        
        // Show success message
        res.render('contact', {
            title: 'Contact Us - Naija Groups',
            description: 'Get in touch with the Naija Groups team',
            errors: [],
            formData: {},
            success: true
        });
        
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).render('contact', {
            title: 'Contact Us - Naija Groups',
            description: 'Get in touch with the Naija Groups team',
            errors: ['An error occurred while sending your message. Please try again.'],
            formData: req.body,
            success: false
        });
    }
};

// API endpoint for group contact form
const db = require('../config/database');

// Store rate limiting data in memory (in production, use Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 requests per minute per IP

// Simple rate limiting function
function isRateLimited(ip) {
    const now = Date.now();
    const key = `contact_${ip}`;
    
    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
    }
    
    const data = rateLimitStore.get(key);
    
    // Reset if window expired
    if (now > data.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
    }
    
    // Increment counter
    data.count++;
    
    // Check if rate limit exceeded
    return data.count > RATE_LIMIT_MAX_REQUESTS;
}

exports.submitContactMessage = async (req, res) => {
    try {
        const { groupId, groupName, name, email, phone, message } = req.body;
        
        // Get client IP
        const clientIP = req.headers['x-forwarded-for'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        // Rate limiting check
        if (isRateLimited(clientIP)) {
            return res.status(429).json({
                error: 'Too many requests. Please wait before sending another message.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }
        
        // Validate required fields
        if (!groupId || !name || !email || !message) {
            return res.status(400).json({
                error: 'Missing required fields. Name, email, and message are required.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Please provide a valid email address.',
                code: 'INVALID_EMAIL'
            });
        }
        
        // Validate message length
        if (message.trim().length < 10) {
            return res.status(400).json({
                error: 'Message must be at least 10 characters long.',
                code: 'MESSAGE_TOO_SHORT'
            });
        }
        
        if (message.length > 2000) {
            return res.status(400).json({
                error: 'Message is too long. Please keep it under 2000 characters.',
                code: 'MESSAGE_TOO_LONG'
            });
        }
        
        // Check if group exists
        const groupCheck = await db.query(
            'SELECT id, name, email FROM groups WHERE id = $1',
            [groupId]
        );
        
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Group not found.',
                code: 'GROUP_NOT_FOUND'
            });
        }
        
        const group = groupCheck.rows[0];
        
        // Store contact message in database
        const result = await db.query(`
            INSERT INTO contact_messages (
                group_id, name, email, phone, message, ip, user_agent, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id, created_at
        `, [
            groupId,
            name.trim(),
            email.toLowerCase().trim(),
            phone ? phone.trim() : null,
            message.trim(),
            clientIP,
            req.headers['user-agent'] || null
        ]);
        
        const contactMessage = result.rows[0];
        
        // Log successful submission
        console.log(`📧 New contact message received:`, {
            messageId: contactMessage.id,
            groupId: groupId,
            groupName: group.name,
            senderEmail: email,
            timestamp: contactMessage.created_at
        });
        
        // In a production environment, you would:
        // 1. Send email notification to the group's email address
        // 2. Send confirmation email to the sender
        // 3. Optionally send notification to admin
        
        // For now, we'll just return success
        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully!',
            messageId: contactMessage.id,
            data: {
                groupName: group.name,
                sentAt: contactMessage.created_at
            }
        });
        
    } catch (error) {
        console.error('❌ Contact form submission error:', error);
        
        // Handle specific database errors
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({
                error: 'Duplicate submission detected. Please wait before sending another message.',
                code: 'DUPLICATE_SUBMISSION'
            });
        }
        
        res.status(500).json({
            error: 'Failed to send message. Please try again later.',
            code: 'INTERNAL_ERROR'
        });
    }
};