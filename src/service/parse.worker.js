const { parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { parse: parseCsv } = require('csv-parse/sync');

const { connectDB, mongoose } = require('../config/db'); 
const Agent = require('../model/agent.model');
const User = require('../model/user.model');
const Account = require('../model/account.model');
const LOB = require('../model/lob.model');
const Carrier = require('../model/carrier.model');
const Policy = require('../model/policy.model');

function normalizeRow(r) {
  return {
    agentName: r['Agent'] || r['Agent Name'] || r['agent'],
    firstName: r['User - first name'] || r['first_name'] || r['firstName'] || r['First Name'],
    dob: r['DOB'] || r['dob'],
    address: r['address'] || r['Address'],
    phone: r['phone number'] || r['phone'],
    state: r['state'] || r['State'],
    zip: r['zip code'] || r['zip'],
    email: r['email'] || r['Email'],
    gender: r['gender'] || r['Gender'],
    userType: r['userType'] || r['user_type'],
    accountName: r["Account Name"] || r['account_name'],
    lob: r['Policy Category(LOB) - category_name'] || r['category_name'] || r['lob'],
    carrier: r['Policy Carrier - company_name'] || r['company_name'] || r['carrier'],
    policy_number: r['policy number'] || r['policy_number'],
    policy_start_date: r['policy start date'] || r['policy_start_date'],
    policy_end_date: r['policy end date'] || r['policy_end_date'],
    category_collection_id: r['policy category- collection id'] || r['category_collection_id'],
    company_collection_id: r['company collection id'] || r['company_collection_id']
  };
}

async function processRows(rows) {
  let created = 0;
  for (const raw of rows) {
    const d = normalizeRow(raw);
    // minimal validation
    if (!d.policy_number) continue;

    // Agent upsert
    let agentDoc = null;
    if (d.agentName) {
      agentDoc = await Agent.findOneAndUpdate(
        { name: d.agentName },
        { name: d.agentName },
        { upsert: true, new: true }
      ).exec();
    }

    // User upsert (prefer email)
    const userQuery = d.email ? { email: d.email } : { firstName: d.firstName, phone: d.phone };
    const userUpdate = {
      firstName: d.firstName,
      dob: d.dob ? new Date(d.dob) : undefined,
      address: d.address,
      phone: d.phone,
      state: d.state,
      zip: d.zip,
      email: d.email,
      gender: d.gender,
      userType: d.userType
    };
    const userDoc = await User.findOneAndUpdate(userQuery, userUpdate, { upsert: true, new: true }).exec();

    // Account upsert
    let accountDoc = null;
    if (d.accountName) {
      accountDoc = await Account.findOneAndUpdate(
        { accountName: d.accountName, user: userDoc._id },
        { accountName: d.accountName, user: userDoc._id },
        { upsert: true, new: true }
      ).exec();
    }

    // LOB upsert
    let lobDoc = null;
    if (d.lob) {
      lobDoc = await LOB.findOneAndUpdate({ category_name: d.lob }, { category_name: d.lob }, { upsert: true, new: true }).exec();
    }

    // Carrier upsert
    let carrierDoc = null;
    if (d.carrier) {
      carrierDoc = await Carrier.findOneAndUpdate({ company_name: d.carrier }, { company_name: d.carrier }, { upsert: true, new: true }).exec();
    }

    // Policy upsert (avoid duplicates by policy_number + company_collection_id)
    const policyQuery = { policy_number: d.policy_number, company_collection_id: d.company_collection_id || null };
    const policyPayload = {
      policy_number: d.policy_number,
      policy_start_date: d.policy_start_date ? new Date(d.policy_start_date) : undefined,
      policy_end_date: d.policy_end_date ? new Date(d.policy_end_date) : undefined,
      category_collection_id: d.category_collection_id,
      company_collection_id: d.company_collection_id,
      user: userDoc._id,
      account: accountDoc ? accountDoc._id : undefined,
      agent: agentDoc ? agentDoc._id : undefined,
      lob: lobDoc ? lobDoc._id : undefined,
      carrier: carrierDoc ? carrierDoc._id : undefined
    };

    await Policy.findOneAndUpdate(policyQuery, policyPayload, { upsert: true, new: true }).exec();
    created++;
  }
  return created;
}

async function run() {
  try {
    // Reuse connectDB to ensure same config
    await connectDB();

    const filepath = workerData.filepath;
    const ext = path.extname(filepath).toLowerCase();
    let rows = [];
    if (ext === '.xlsx' || ext === '.xls') {
      const wb = xlsx.readFile(filepath);
      const sheet = wb.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(wb.Sheets[sheet], { defval: null });
    } else if (ext === '.csv' || ext === '.txt') {
      const text = fs.readFileSync(filepath, 'utf8');
      rows = parseCsv(text, { columns: true, skip_empty_lines: true });
    } else {
      parentPort.postMessage({ error: `Unsupported file type ${ext}` });
      return;
    }

    const inserted = await processRows(rows);

    parentPort.postMessage({ ok: true, inserted });
    // close mongoose connection for cleanliness
    try { await mongoose.connection.close(); } catch {}
  } catch (err) {
    parentPort.postMessage({ error: err.message || String(err) });
    try { await mongoose.connection.close(); } catch {}
  }
}

run();
