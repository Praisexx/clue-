const Group = require('../models/Group');
const whatsappService = require('../services/whatsappService');

// Helper function to generate slug from group name
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
}

// Helper function to validate required fields
function validateGroupData(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Group name must be at least 2 characters long');
    }
    
    if (!data.description || data.description.trim().length < 10) {
        errors.push('Description must be at least 10 characters long');
    }
    
    if (!data.city && !data.country) {
        errors.push('Please provide at least city or country');
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Please provide a valid email address');
    }
    
    if (data.website && !data.website.startsWith('http')) {
        errors.push('Website must start with http:// or https://');
    }
    
    if (data.whatsapp_phone) {
        const whatsappValidation = whatsappService.validatePhoneNumber(data.whatsapp_phone);
        if (!whatsappValidation.isValid) {
            errors.push(whatsappValidation.message);
        }
    }
    
    return errors;
}

exports.getAddGroupForm = async (req, res) => {
    try {
        console.log('GET /add-group accessed');
        res.render('add-group', {
            title: 'Add Your Group - Naija Groups',
            errors: [],
            formData: {}
        });
    } catch (error) {
        console.error('Error loading add group form:', error);
        res.status(500).send('Unable to load the add group form: ' + error.message);
    }
};

exports.submitGroup = async (req, res) => {
    console.log('🔄 Form submission started');
    console.log('📝 Form data received:', req.body);
    console.log('📎 File uploaded:', req.file ? req.file.originalname : 'No file');
    
    try {
        const formData = {
            name: req.body.name?.trim(),
            description: req.body.description?.trim(),
            city: req.body.city?.trim(),
            country: req.body.country?.trim(),
            address: req.body.address?.trim(),
            email: req.body.email?.trim(),
            phone: req.body.phone?.trim(),
            whatsapp_phone: req.body.whatsapp_phone?.trim(),
            website: req.body.website?.trim(),
            facebook_url: req.body.facebook_url?.trim(),
            instagram_url: req.body.instagram_url?.trim(),
            twitter_url: req.body.twitter_url?.trim(),
            linkedin_url: req.body.linkedin_url?.trim(),
            youtube_url: req.body.youtube_url?.trim(),
            categories: req.body.categories ? req.body.categories.split(',').map(c => c.trim()) : [],
            founded_year: req.body.founded_year ? parseInt(req.body.founded_year) : null,
            member_size: req.body.member_size ? parseInt(req.body.member_size) : null,
            membership_type: req.body.membership_type?.trim(),
            meeting_days: req.body.meeting_days ? 
                (Array.isArray(req.body.meeting_days) ? req.body.meeting_days : [req.body.meeting_days]) 
                : [],
            logo_url: req.body.logo_url || null // From upload middleware
        };

        // Validate the form data
        const errors = validateGroupData(formData);
        
        if (errors.length > 0) {
            return res.render('add-group', {
                title: 'Add Your Group - Naija Groups',
                errors: errors,
                formData: formData
            });
        }

        // Generate unique slug
        let slug = generateSlug(formData.name);
        let slugExists = await Group.getBySlug(slug);
        let counter = 1;
        
        while (slugExists) {
            slug = generateSlug(formData.name) + '-' + counter;
            slugExists = await Group.getBySlug(slug);
            counter++;
        }

        // Create the group in database with pending status
        const result = await Group.createGroup({
            slug: slug,
            name: formData.name,
            description: formData.description,
            city: formData.city,
            country: formData.country,
            address: formData.address,
            email: formData.email,
            phone: formData.phone,
            whatsapp_phone: formData.whatsapp_phone,
            website: formData.website,
            categories: formData.categories,
            founded_year: formData.founded_year,
            member_size: formData.member_size,
            membership_type: formData.membership_type,
            meeting_days: formData.meeting_days,
            featured: false, // New groups are not featured by default
            status: 'pending', // New groups require admin approval
            lat: null, // Will be geocoded later if needed
            lng: null, // Will be geocoded later if needed
            logo_url: formData.logo_url
        });

        console.log('✅ Group created successfully:', result);
        
        // Redirect to a success page instead of the group page (since it's pending)
        console.log('🎉 Rendering success page for:', formData.name);
        res.render('add-group-success', {
            title: 'Group Submitted - Naija Groups',
            groupName: formData.name
        });

    } catch (error) {
        console.error('❌ Error creating group:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Check if it's a database constraint error (duplicate slug, etc.)
        if (error.code === '23505') {
            return res.render('add-group', {
                title: 'Add Your Group - Naija Groups',
                errors: ['A group with this name already exists. Please choose a different name.'],
                formData: req.body
            });
        }
        
        res.status(500).render('error', { 
            title: 'Submission Error',
            error: 'Unable to create the group. Please try again later.' 
        });
    }
};