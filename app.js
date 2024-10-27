const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/parse-receipt', upload.single('receiptImage'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    try {
        const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
        const parsedData = parseReceiptText(text);
        res.json(parsedData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process the receipt' });
    }
});

function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];

    for (let line of lines) {
        const item = parseItemFromLine(line);
        if (item) items.push(item);
    }

    return { items };
}

function parseItemFromLine(line) {
    const itemPattern = /(.+?)\s+(\d+)\s+([\d.]+)/;
    const match = line.match(itemPattern);

    if (match) {
        return {
            name: match[1].trim(),
            quantity: parseInt(match[2], 10),
            price: parseFloat(match[3]),
        };
    }
    return null;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
