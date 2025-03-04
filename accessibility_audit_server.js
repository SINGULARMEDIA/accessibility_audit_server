const express = require('express');
const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.post('/audit', async (req, res) => {
    const { url } = req.body;
    
    if (!url || !url.startsWith('http')) {
        return res.status(400).json({ error: 'URL no válida' });
    }

    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const results = await new AxePuppeteer(page).analyze();
        await browser.close();

        res.json({
            score: (1 - (results.violations.length / 10)) * 100,
            issues: results.violations.map(issue => ({
                id: issue.id,
                description: issue.description,
                impact: issue.impact,
                help: issue.help,
                helpUrl: issue.helpUrl
            }))
        });
    } catch (error) {
        console.error('Error en la auditoría:', error);
        res.status(500).json({ error: 'Error al analizar la URL' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});