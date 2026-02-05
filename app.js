const app = {
    leads: [],

    handleCSVUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            this.parseCSV(csvText);
        };
        reader.readAsText(file);
    },

    parseCSV: function(csvText) {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        const websiteIndex = headers.indexOf('Website');
        const nameIndex = headers.indexOf('Business name');
        const addressIndex = headers.indexOf('Address');
        const cityStateIndex = headers.indexOf('City, State');

        if (websiteIndex === -1 || nameIndex === -1 || addressIndex === -1 || cityStateIndex === -1) {
            alert('CSV must contain columns: "Business name", "Address", "City, State", "Website"');
            return;
        }

        this.leads = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            return {
                name: values[nameIndex] || '',
                address: (values[addressIndex] || '') + ', ' + (values[cityStateIndex] || ''),
                website: values[websiteIndex] || '',
                status: 'open',
                email: ''
            };
        });

        // Automatically start processing CSV
        this.processWebsites();
    },

    processWebsites: async function() {
        if (this.leads.length === 0) return;

        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';

        for (let i = 0; i < this.leads.length; i++) {
            const lead = this.leads[i];

            // Simulated website check: if blank or invalid, mark as no-email
            if (!lead.website || !lead.website.includes('.')) {
                lead.status = 'no-email';
            } else {
                lead.status = 'open';
            }

            // Prompt for email if website is down / no email
            if (lead.status === 'no-email') {
                const email = prompt(`Enter email for ${lead.name}:`);
                lead.email = email || '';
            }

            this.updateProgress(i + 1, this.leads.length);
        }

        document.getElementById('loadingState').style.display = 'none';
        this.renderLeads();
        this.updateStats();
    },

    updateProgress: function(current, total) {
        const percent = Math.round((current / total) * 100);
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressText').innerText = `${current} of ${total} processed`;
    },

    renderLeads: function() {
        const leadsList = document.getElementById('leadsList');
        leadsList.innerHTML = '';

        const filteredLeads = this.leads.filter(lead => lead.status === 'open');

        if (filteredLeads.length === 0) {
            leadsList.innerHTML = '<p>No leads in this category.</p>';
            return;
        }

        filteredLeads.forEach((lead, idx) => {
            const div = document.createElement('div');
            div.className = 'lead-item';
            div.innerHTML = `
                <strong>${lead.name}</strong><br>
                ${lead.address}<br>
                Website: ${lead.website || 'N/A'}<br>
                Email: ${lead.email || 'N/A'}
            `;
            leadsList.appendChild(div);
        });
    },

    updateStats: function() {
        const total = this.leads.length;
        const open = this.leads.filter(l => l.status === 'open').length;
        const noEmail = this.leads.filter(l => l.status === 'no-email').length;
        const contacted = this.leads.filter(l => l.status === 'contacted').length;
        const emailFound = this.leads.filter(l => l.email).length;

        document.getElementById('totalLeads').innerText = total;
        document.getElementById('openLeads').innerText = open;
        document.getElementById('contactedCount').innerText = contacted;
        document.getElementById('emailFoundCount').innerText = emailFound;
        document.getElementById('noEmailCount').innerText = noEmail;

        // Update tab badges
        document.getElementById('openBadge').innerText = open;
        document.getElementById('contactedBadge').innerText = contacted;
        document.getElementById('emailFoundBadge').innerText = emailFound;
        document.getElementById('noEmailBadge').innerText = noEmail;
    },

    exportToExcel: function() {
        if (!this.leads.length) return alert('No leads to export!');

        const rows = [
            ['Business name', 'Address', 'Website', 'Email', 'Status']
        ];

        this.leads.forEach(lead => {
            rows.push([lead.name, lead.address, lead.website, lead.email, lead.status]);
        });

        const csvContent = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'leads_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
