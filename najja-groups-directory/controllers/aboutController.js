exports.getAboutPage = async (req, res) => {
    try {
        res.render('about', {
            title: 'About Us - Naija Groups',
            description: 'Learn about our mission to connect Nigerian diaspora organizations worldwide'
        });
    } catch (error) {
        console.error('Error loading about page:', error);
        res.status(500).send('Unable to load the about page: ' + error.message);
    }
};