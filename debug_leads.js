const mongoose = require('mongoose');
const Lead = require('./backend_v2/models/Lead');
const User = require('./backend_v2/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/fic_employee_portal', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const leads = await Lead.find({ status: { $in: ['success', 'converted'] } });
        console.log("Success/Converted Leads:", JSON.stringify(leads, null, 2));

        const employees = await User.find({ role: 'employee' });
        console.log("Employees:", JSON.stringify(employees, null, 2));

        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
