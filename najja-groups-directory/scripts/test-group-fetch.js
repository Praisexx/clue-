const Group = require('../models/Group');

async function testGroupFetch() {
    try {
        console.log('🔍 Testing Group.getBySlug() method...');
        
        const group = await Group.getBySlug('hausa-community-abuja-99');
        
        if (group) {
            console.log('✅ Group found:');
            console.log('Name:', group.name);
            console.log('Slug:', group.slug);
            console.log('Logo URL:', group.logo_url);
            console.log('All fields:', Object.keys(group));
            console.log('\nFull group object:');
            console.log(JSON.stringify(group, null, 2));
        } else {
            console.log('❌ Group not found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

testGroupFetch();