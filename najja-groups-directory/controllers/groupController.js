const Group = require('../models/Group');

exports.getGroupBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        // Get group by slug from database
        const group = await Group.getBySlug(slug);
        
        if (!group) {
            // Group not found - render 404 page
            return res.status(404).render('error', { 
                title: 'Group Not Found',
                error: 'The group you are looking for does not exist.' 
            });
        }

        // Render the group profile page with the group data
        res.render('group-profile', {
            title: `${group.name} - Najja Groups`,
            group: group
        });

    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).render('error', { 
            title: 'Server Error',
            error: 'Unable to load group profile. Please try again later.' 
        });
    }
};