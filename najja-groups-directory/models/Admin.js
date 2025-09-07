const db = require('../config/database');
const bcrypt = require('bcrypt');

class Admin {
    static async authenticate(usernameOrEmail, password) {
        try {
            // Try to find admin by username or email
            const result = await db.query(
                'SELECT * FROM admins WHERE username = $1 OR email = $1',
                [usernameOrEmail]
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const admin = result.rows[0];
            const isValid = await bcrypt.compare(password, admin.password_hash);
            
            if (isValid) {
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
            const query = `
                SELECT 
                    id, slug, name, description, city, country, 
                    categories, featured, status, created_at
                FROM groups
                WHERE status = 'pending'
                ORDER BY created_at DESC
            `;
            
            const result = await db.query(query);
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
                    categories, featured, status, created_at
                FROM groups
            `;
            
            let params = [];
            if (status) {
                query += ` WHERE status = $1`;
                params.push(status);
            }
            
            query += ` ORDER BY created_at DESC`;
            
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
                SET status = 'approved'
                WHERE id = $1
                RETURNING *
            `, [groupId]);
            
            return result.rows[0];
        } catch (error) {
            throw new Error('Error approving group: ' + error.message);
        }
    }
    
    static async rejectGroup(groupId, reason) {
        try {
            const result = await db.query(`
                UPDATE groups 
                SET status = 'rejected'
                WHERE id = $1
                RETURNING *
            `, [groupId]);
            
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