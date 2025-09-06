const Group = require('../models/Group');

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
    
    return errors;
}

exports.getAddGroupForm = async (req, res) => {
    try {
        res.render('add-group', {
            title: 'Add Your Group - Naija Groups',
            errors: [],
            formData: {}
        });
    } catch (error) {
        console.error('Error loading add group form:', error);
        res.status(500).render('error', { 
            title: 'Form Error',
            error: 'Unable to load the add group form.' 
        });
    }
};

exports.submitGroup = async (req, res) => {
    try {
        const formData = {
            name: req.body.name?.trim(),
            description: req.body.description?.trim(),
            city: req.body.city?.trim(),
            country: req.body.country?.trim(),
            address: req.body.address?.trim(),
            email: req.body.email?.trim(),
            phone: req.body.phone?.trim(),
            website: req.body.website?.trim(),
            categories: req.body.categories ? req.body.categories.split(',').map(c => c.trim()) : [],
            founded_year: req.body.founded_year ? parseInt(req.body.founded_year) : null,
            member_size: req.body.member_size ? parseInt(req.body.member_size) : null,
            membership_type: req.body.membership_type?.trim(),
            meeting_days: req.body.meeting_days ? req.body.meeting_days : []
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
            website: formData.website,
            categories: formData.categories,
            founded_year: formData.founded_year,
            member_size: formData.member_size,
            membership_type: formData.membership_type,
            meeting_days: formData.meeting_days,
            featured: false, // New groups are not featured by default
            status: 'pending' // New groups require admin approval
        });

        // Redirect to a success page instead of the group page (since it's pending)
        res.render('add-group-success', {
            title: 'Group Submitted - Naija Groups',
            groupName: formData.name
        });

    } catch (error) {
        console.error('Error creating group:', error);
        
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