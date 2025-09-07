const Group = require('../models/Group');

exports.getGroupBySlug = async (req, res) => {
    console.log('🚀 GROUP CONTROLLER HIT! Slug:', req.params.slug);
    
    try {
        const { slug } = req.params;
        
        // Get group by slug from database
        const group = await Group.getBySlug(slug);
        
        console.log('🔍 Group Controller Debug:');
        console.log('Slug:', slug);
        console.log('Group found:', !!group);
        if (group) {
            console.log('Group name:', group.name);
            console.log('Logo URL field exists:', 'logo_url' in group);
            console.log('Logo URL value:', group.logo_url);
            console.log('Logo URL type:', typeof group.logo_url);
        }
        
        if (!group) {
            // Group not found - render 404 page
            return res.status(404).render('error', { 
                title: 'Group Not Found',
                error: 'The group you are looking for does not exist.' 
            });
        }

        // Render the group profile page with the group data
        res.render('groups/profile', {
            title: `${group.name} - Naija Groups`,
            group: group,
            success: req.query.success === '1'
        });

    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).render('error', { 
            title: 'Server Error',
            error: 'Unable to load group profile. Please try again later.' 
        });
    }
};