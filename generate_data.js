import fs from 'fs';
import crypto from 'crypto';

const today = new Date();
const entries = [];
const sources = ['Data labeling', 'Tutoring', 'Freelance', 'Other'];
const otherSources = ['Gift', 'Sold old phone', 'Refund', 'Cashback'];

// Generate past 365 days of data
for (let i = 365; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    
    // 60% chance to log something on any given day
    if (Math.random() < 0.6) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        
        // Random amount between $5.00 and $100.00
        const amount = parseFloat((Math.random() * 95 + 5).toFixed(2));
        
        // Pick a random source
        const source = sources[Math.floor(Math.random() * sources.length)];
        let sourceCustom = '';
        if (source === 'Other') {
            sourceCustom = otherSources[Math.floor(Math.random() * otherSources.length)];
        }
        
        entries.push({
            id: crypto.randomUUID(),
            date: dateKey,
            amount: amount,
            note: Math.random() > 0.5 ? 'Dummy entry' : '',
            source: source,
            sourceCustom: sourceCustom
        });
    }
}

const totalSaved = entries.reduce((sum, e) => sum + e.amount, 0);

const dummyData = {
    entries: entries,
    targets: {
        weekly: 200,
        monthly: 800
    },
    goals: [
        {
            id: crypto.randomUUID(),
            name: 'New Laptop',
            amount: 2500,
            saved: Math.min(totalSaved, 1800), // simulate partial progress
            deadline: '2026-12-31',
            completed: false,
            isPriority: true
        },
        {
            id: crypto.randomUUID(),
            name: 'Vacation',
            amount: 1000,
            saved: 1000,
            deadline: '2026-03-01',
            completed: true,
            archived: true,
            isPriority: false
        }
    ],
    preferences: {
        currency: '$'
    }
};

fs.writeFileSync('savetrack_year_data.json', JSON.stringify(dummyData, null, 2));
console.log('Successfully generated savetrack_year_data.json with ' + entries.length + ' entries.');
