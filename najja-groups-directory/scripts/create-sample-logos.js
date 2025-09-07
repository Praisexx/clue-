const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createSampleLogos() {
    try {
        console.log('🎨 Creating sample logos for groups...');
        
        const logoDir = path.join(__dirname, '..', 'public', 'uploads', 'logos');
        
        // Ensure directory exists
        if (!fs.existsSync(logoDir)) {
            fs.mkdirSync(logoDir, { recursive: true });
        }
        
        // Church logos - Cross and religious symbols
        const churchColors = [
            '#8B4513', // Brown
            '#4169E1', // Royal Blue  
            '#228B22', // Forest Green
            '#DC143C', // Crimson
            '#800080'  // Purple
        ];
        
        for (let i = 1; i <= 5; i++) {
            const color = churchColors[i - 1];
            
            // Create SVG with cross symbol
            const svgBuffer = Buffer.from(`
                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="200" fill="${color}"/>
                    <rect x="90" y="40" width="20" height="120" fill="white"/>
                    <rect x="60" y="80" width="80" height="20" fill="white"/>
                    <circle cx="100" cy="100" r="60" fill="none" stroke="white" stroke-width="3"/>
                </svg>
            `);
            
            await sharp(svgBuffer)
                .jpeg({ quality: 90 })
                .toFile(path.join(logoDir, `church-${i}.jpg`));
        }
        
        // School logos - Graduation cap and books
        const schoolColors = [
            '#003366', // Navy Blue
            '#990000', // Maroon
            '#006600', // Dark Green
            '#FF8C00', // Dark Orange
            '#4B0082'  // Indigo
        ];
        
        for (let i = 1; i <= 5; i++) {
            const color = schoolColors[i - 1];
            
            // Create SVG with graduation cap
            const svgBuffer = Buffer.from(`
                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="200" fill="${color}"/>
                    <polygon points="100,60 140,80 100,100 60,80" fill="white"/>
                    <rect x="95" y="100" width="10" height="40" fill="white"/>
                    <circle cx="105" cy="105" r="3" fill="white"/>
                    <rect x="70" y="130" width="60" height="8" fill="white"/>
                    <rect x="75" y="145" width="50" height="6" fill="white"/>
                    <rect x="80" y="157" width="40" height="6" fill="white"/>
                </svg>
            `);
            
            await sharp(svgBuffer)
                .jpeg({ quality: 90 })
                .toFile(path.join(logoDir, `school-${i}.jpg`));
        }
        
        // Organization logos - Various symbols
        const orgColors = [
            '#FF6347', // Tomato
            '#20B2AA', // Light Sea Green  
            '#9370DB', // Medium Purple
            '#FF4500', // Orange Red
            '#32CD32'  // Lime Green
        ];
        
        for (let i = 1; i <= 5; i++) {
            const color = orgColors[i - 1];
            
            // Create SVG with organizational symbol
            const svgBuffer = Buffer.from(`
                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="200" fill="${color}"/>
                    <circle cx="100" cy="100" r="70" fill="none" stroke="white" stroke-width="4"/>
                    <circle cx="100" cy="70" r="15" fill="white"/>
                    <circle cx="75" cy="110" r="15" fill="white"/>
                    <circle cx="125" cy="110" r="15" fill="white"/>
                    <circle cx="100" cy="130" r="15" fill="white"/>
                    <line x1="100" y1="85" x2="75" y2="95" stroke="white" stroke-width="3"/>
                    <line x1="100" y1="85" x2="125" y2="95" stroke="white" stroke-width="3"/>
                    <line x1="75" y1="125" x2="125" y2="125" stroke="white" stroke-width="3"/>
                    <line x1="90" y1="120" x2="100" y2="115" stroke="white" stroke-width="3"/>
                    <line x1="110" y1="120" x2="100" y2="115" stroke="white" stroke-width="3"/>
                </svg>
            `);
            
            await sharp(svgBuffer)
                .jpeg({ quality: 90 })
                .toFile(path.join(logoDir, `org-${i}.jpg`));
        }
        
        console.log('✅ Created sample logos:');
        console.log('  📿 5 church logos with cross symbols');
        console.log('  🎓 5 school logos with graduation caps');
        console.log('  🏢 5 organization logos with network symbols');
        
    } catch (error) {
        console.error('❌ Error creating logos:', error.message);
        process.exit(1);
    }
}

createSampleLogos();