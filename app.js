const app = {
    leads: [],
    currentTab: 'open',

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            this.parseCSV(text);
        };
        reader.readAsText(file);
    },

    parseCSV(csvText) {
        const lines = csvText.split('\\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',');
        const websiteIdx = headers.indexOf('Website');
        const businessIdx = headers.indexOf('Business name');
        const addressIdx = headers.indexOf('Address');
        const cityStateIdx = headers.indexOf('City, State');

        this.leads = lines.slice(1).map(line => {
            const cols = line.split(',');
            return {
                business: cols[businessIdx],
                website: cols[websiteIdx],
                address: cols[addressIdx] + ', ' + cols[cityStateIdx],
                status: 'open',
                email: ''
            };
        });

        this.updateUI();
    },

    updateUI() {
        document.getElementById('totalLeads').textContent = this.leads.length;
        this.renderLeads();
    },

    renderLeads() {
        const container = document.getElementById('leadsList');
        container.innerHTML = '';

        const filtered = this.leads.filter(lead => lead.status === this.currentTab);

        filtered.forEach((lead, idx) => {
            const div = document.createElement('div');
            div.className = 'lead-item';
            div.innerHTML = `
                <strong>${lead.business}</strong><br>
                ${lead.address}<br>
                <button onclick="app.addEmail(${idx})">Has email</button>
            `;
            container.appendChild(div);
        });
    },

    addEmail(index) {
        const email = prompt('Enter email for ' + this.leads[index].business + ':');
        if (email) {
            this.leads[index].email = email;
        }
    },

    exportToExcel() {
        let csv = 'Business Name,Address,Website,Email\\n';
        this.leads.forEach(lead => {
            csv += `"${lead.business}","${lead.address}","${lead.website}","${lead.email || ''}"\\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
};
