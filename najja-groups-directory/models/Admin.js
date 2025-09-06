const db = require('../config/database');
const bcrypt = require('bcrypt');

class Admin {
    static async authenticate(username, password) {
        try {
            const result = await db.query(
                'SELECT * FROM admin_users WHERE username = $1',
                [username]
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const admin = result.rows[0];
            const isValid = await bcrypt.compare(password, admin.password_hash);
            
            if (isValid) {
                // Update last login
                await db.query(
                    'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                    [admin.id]
                );
                
                // Return admin without password hash
                const { password_hash, ...adminData } = admin;
                return adminData;
            }
            
            return null;
        } catch (error) {
            throw new Error('Error authenticating admin: ' + error.message);
        }
    }
    
    static async getPendingGroups() {
        try {
            const result = await db.query(`
                SELECT 
                    id, slug, name, description, city, country, 
                    categories, email, phone, website, created_at
                FROM groups 
                WHERE status = 'pending' 
                ORDER BY created_at DESC
            `);
            
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching pending groups: ' + error.message);
        }
    }
    
    static async getAllGroups(status = null) {
        try {
            let query = `
                SELECT 
                    id, slug, name, description, city, country, 
                    categories, status, featured, created_at, approved_at
                FROM groups
            `;
            let params = [];
            
            if (status) {
                query += ' WHERE status = $1';
                params.push(status);
            }
            
            query += ' ORDER BY created_at DESC';
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching groups: ' + error.message);
        }
    }
    
    static async approveGroup(groupId, adminId) {
        try {
            const result = await db.query(`
                UPDATE groups 
                SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `, [adminId, groupId]);
            
            return result.rows[0];
        } catch (error) {
            throw new Error('Error approving group: ' + error.message);
        }
    }
    
    static async rejectGroup(groupId, reason) {
        try {
            const result = await db.query(`
                UPDATE groups 
                SET status = 'rejected', rejection_reason = $1
                WHERE id = $2
                RETURNING *
            `, [reason, groupId]);
            
            return result.rows[0];
        } catch (error) {
            throw new Error('Error rejecting group: ' + error.message);
        }
    }
    
    static async deleteGroup(groupId) {
        try {
            const result = await db.query(
                'DELETE FROM groups WHERE id = $1 RETURNING *',
                [groupId]
            );
            
            return result.rows[0];
        } catch (error) {
            throw new Error('Error deleting group: ' + error.message);
        }
    }
    
    static async toggleFeatured(groupId) {
        try {
            const result = await db.query(`
                UPDATE groups 
                SET featured = NOT featured
                WHERE id = $1
                RETURNING *
            `, [groupId]);
            
            return result.rows[0];
        } catch (error) {
            throw new Error('Error toggling featured status: ' + error.message);
        }
    }
}

module.exports = Admin;