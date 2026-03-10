// debug_api.js
const http = require('http');

const makeRequest = (path) => {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:5000/api${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
};

async function check() {
    try {
        const leads = await makeRequest('/leads');
        const employees = await makeRequest('/users'); // Or wherever employees are

        // We expect leads to have a structure where status='success' or 'converted'
        const successLeads = leads.filter(l => l.status === 'success' || l.status === 'converted');
        console.log(`Found ${successLeads.length} successful leads total`);

        if (successLeads.length > 0) {
            console.log('Sample success lead:', JSON.stringify(successLeads[0], null, 2));
        }

        const emps = Array.isArray(employees) ? employees : employees.users || [];
        console.log(`Found ${emps.length} employees`);
        if (emps.length > 0) {
            console.log('Sample employee:', JSON.stringify(emps[0], null, 2));
        }

    } catch (err) {
        console.error("API Error:", err.message);
    }
}

check();
