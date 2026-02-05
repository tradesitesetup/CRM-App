const app = {
    leads: [],
    currentTab: 'open',

    handleCSVUpload: async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            this.parseCSV(text);
            await this.processWebsites();
            this.renderLeads();
        };
        reader.readAsText(file);
    },

    parseCSV: function (csvText) {
        const rows = csvText.split(/\r?\n/).filter(Boolean);
        const headers = rows[0].split(',').map(h => h.trim());
        this.leads = rows.slice(1).map(row => {
            const values = row.split(',').map(v => v.trim());
            const lead = {};
            headers.forEach((h, i) => {
                lead[h] = values[i] || '';
            });
            lead['Business Address'] = `${lead['Address'] || ''}, ${lead['City, State'] || ''}`;
            lead.status = 'open';
            lead.email = '';
            return lead;
        });
    },

    processWebsites: async function () {
        const urls = this.leads.map(l => l['Website']).filter(Boolean);
        if (urls.length === 0) return;

        const response = await fetch('/api/checkWebsites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls })
        });

        const results = await response.json();
        this.leads.forEach(lead => {
            const result = results.find(r => r.url === lead['Website']);
            lead.websiteStatus = result ? (result.ok ? 'Working' : 'Down') : 'Unknown';
        });
    },

    renderLeads: function () {
        const container = document.getElementById('leadsList');
        container.innerHTML = '';

        this.leads.forEach((lead, index) => {
            const leadDiv = document.createElement('div');
            leadDiv.className = 'lead-item';

            leadDiv.innerHTML = `
                <div class="lead-main">
                    <strong>${lead['Business name']}</strong>
                    <span>${lead['Business Address']}</span>
                    <span>Website: ${lead['Website']} (${lead.websiteStatus || 'Unknown'})</span>
                </div>
                <div class="lead-actions">
                    <select onchange="app.updateStatus(${index}, this.value)">
                        <option value="open" ${lead.status==='open'?'selected':''}>Open</option>
                        <option value="contacted" ${lead.status==='contacted'?'selected':''}>Contacted</option>
                        <option value="email-found" ${lead.status==='email-found'?'selected':''}>Email Found</option>
                        <option value="no-email" ${lead.status==='no-email'?'selected':''}>No Email</option>
                        <option value="closed" ${lead.status==='closed'?'selected':''}>Closed</option>
                    </select>
                    <button onclick="app.promptEmail(${index})">Has Email</button>
                </div>
            `;
            container.appendChild(leadDiv);
        });

        this.updateStats();
    },

    updateStatus: function (index, status) {
        this.leads[index].status = status;
        this.renderLeads();
    },

    promptEmail: function (index) {
        const email = prompt("Enter email for " + this.leads[index]['Business name']);
        if (email) {
            this.leads[index].email = email;
            this.leads[index].status = 'email-found';
            this.renderLeads();
        }
    },

    updateStats: function () {
        const totalLeads = this.leads.length;
        const openLeads = this.leads.filter(l => l.status === 'open').length;
        const contactedCount = this.leads.filter(l => l.status === 'contacted').length;
        const emailFoundCount = this.leads.filter(l => l.status === 'email-found').length;
        const noEmailCount = this.leads.filter(l => l.status === 'no-email').length;
        const closedCount = this.leads.filter(l => l.status === 'closed').length;

        document.getElementById('totalLeads').textContent = totalLeads;
        document.getElementById('openLeads').textContent = openLeads;
        document.getElementById('contactedCount').textContent = contactedCount;
        document.getElementById('emailFoundCount').textContent = emailFoundCount;
        document.getElementById('noEmailCount').textContent = noEmailCount;
        document.getElementById('closedCount').textContent = closedCount;

        document.getElementById('openBadge').textContent = openLeads;
        document.getElementById('contactedBadge').textContent = contactedCount;
        document.getElementById('emailFoundBadge').textContent = emailFoundCount;
        document.getElementById('noEmailBadge').textContent = noEmailCount;
        document.getElementById('closedBadge').textContent = closedCount;
    },

    exportToExcel: function () {
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = Object.keys(this.leads[0] || {});
        csvContent += headers.join(",") + "\r\n";
        this.leads.forEach(lead => {
            const row = headers.map(h => lead[h] || '').join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "leads.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
