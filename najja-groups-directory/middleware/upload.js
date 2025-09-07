const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.memoryStorage(); // Store in memory for processing

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Process and save image
async function processGroupLogo(req, res, next) {
    if (!req.file) {
        return next(); // No file uploaded, continue
    }

    try {
        // Generate unique filename
        const filename = `logo-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'logos', filename);

        // Process image with sharp
        await sharp(req.file.buffer)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({
                quality: 85,
                progressive: true
            })
            .toFile(uploadPath);

        // Add logo URL to request body
        req.body.logo_url = `/uploads/logos/${filename}`;
        
        next();
    } catch (error) {
        console.error('Image processing error:', error);
        next(new Error('Failed to process image'));
    }
}

// Delete old logo file
async function deleteOldLogo(logoUrl) {
    if (!logoUrl || !logoUrl.startsWith('/uploads/')) {
        return; // Not a local file or no logo
    }

    try {
        const filePath = path.join(__dirname, '..', 'public', logoUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted old logo:', logoUrl);
        }
    } catch (error) {
        console.error('Error deleting old logo:', error);
    }
}

module.exports = {
    upload,
    processGroupLogo,
    deleteOldLogo
};