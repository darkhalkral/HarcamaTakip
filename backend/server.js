const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Parse month from date string (DD/MM/YYYY -> YYYY-MM)
function parseMonth(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}`;
}

// Upload and process PDF
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { bank } = req.body;
    const pdfPath = req.file.path;
    
    if (!bank) {
      return res.status(400).json({ error: 'Bank selection is required' });
    }

    // Run Python parser based on bank
    const parserPath = path.join(__dirname, '..', 'parsers', `${bank}.py`);
    
    if (!fs.existsSync(parserPath)) {
      return res.status(400).json({ error: `Parser for ${bank} not found` });
    }

    const python = spawn('python', [parserPath, pdfPath]);
    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', async (code) => {
      // Clean up uploaded file
      fs.unlinkSync(pdfPath);

      if (code !== 0) {
        return res.status(500).json({ error: 'Failed to parse PDF', details: error });
      }

      try {
        const transactions = JSON.parse(output);
        
        // Insert transactions into database
        const insertedTransactions = [];
        for (const txn of transactions) {
          const expense = await prisma.expense.create({
            data: {
              date: txn.tarih,
              description: txn.aciklama,
              amount: txn.tutar,
              bank: bank,
              month: parseMonth(txn.tarih)
            }
          });
          insertedTransactions.push(expense);
        }

        res.json({
          success: true,
          message: `${insertedTransactions.length} transactions imported successfully`,
          transactions: insertedTransactions
        });

      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse transaction data', details: parseError.message });
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expenses by month
app.get('/api/expenses/month/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const expenses = await prisma.expense.findMany({
      where: { month },
      include: { category: true },
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly expenses' });
  }
});

// Get monthly summary by categories
app.get('/api/summary/month/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const expenses = await prisma.expense.findMany({
      where: { month },
      include: { category: true }
    });

    const summary = expenses.reduce((acc, expense) => {
      const categoryName = expense.category?.name || 'Kategorisiz';
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, count: 0, color: expense.category?.color };
      }
      acc[categoryName].total += expense.amount;
      acc[categoryName].count += 1;
      return acc;
    }, {});

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
});

// Categories CRUD
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, color } = req.body;
    const category = await prisma.category.create({
      data: { name, color }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update expense category
app.put('/api/expenses/:id/category', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;
    
    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: { categoryId: categoryId ? parseInt(categoryId) : null },
      include: { category: true }
    });
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense category' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});