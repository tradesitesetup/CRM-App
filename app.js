const app = {
    leads: [],
    filteredLeads: [],
    currentTab: 'open',

    init: function() {
        document.getElementById('csvFileInput').addEventListener('change', this.handleCSVUpload.bind(this));
        document.getElementById('exportBtn').addEventListener('click', this.exportToExcel.bind(this));
        document.getElementById('searchInput').addEventListener('input', this.handleSearch.bind(this));
        this.updateStats();
        this.bindTabs();
    },

    bindTabs: function() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                this.renderLeads();
            });
        });
    },

    handleCSVUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target.result;
            this.parseCSV(text);
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

        this.processWebsites();
    },

    processWebsites: async function() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';

        const total = this.leads.length;
        for (let i = 0; i < total; i++) {
            const lead = this.leads[i];
            try {
                await this.checkWebsite(lead.website);
            } catch {
                lead.status = 'no-email';
            }
            this.updateProgress(i + 1, total);

            // Prompt for email if website is down
            if (lead.status === 'no-email') {
                const email = prompt(`Enter email for ${lead.name}:`);
                lead.email = email || '';
            }
        }

        document.getElementById('loadingState').style.display = 'none';
        this.renderLeads();
        this.updateStats();
    },

    checkWebsite: function(url) {
        return new Promise(resolve => {
            if (!url) return resolve(false);

            // Simple fetch to test website (CORS may block in browser)
            fetch(url, { mode: 'no-cors' }).then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
            });
        });
    },

    updateProgress: function(current, total) {
        const percent = Math.round((current / total) * 100);
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressText').innerText = `${current} / ${total}`;
    },

    renderLeads: function() {
        const leadsList = document.getElementById('leadsList');
        leadsList.innerHTML = '';

        const filtered = this.leads.filter(lead => lead.status === this.currentTab);
        if (filtered.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
        } else {
            document.getElementById('emptyState').style.display = 'none';
        }

        filtered.forEach(lead => {
            const div = document.createElement('div');
            div.className = 'lead-item';
            div.innerHTML = `
                <strong>${lead.name}</strong><br>
                ${lead.address}<br>
                <a href="${lead.website}" target="_blank">${lead.website}</a><br>
                Email: ${lead.email || 'N/A'}
            `;
            leadsList.appendChild(div);
        });
    },

    handleSearch: function(event) {
        const query = event.target.value.toLowerCase();
        this.leads.forEach(lead => {
            lead.visible = lead.name.toLowerCase().includes(query);
        });
        this.renderLeads();
    },

    updateStats: function() {
        const totalLeads = this.leads.length;
        const openLeads = this.leads.filter(l => l.status === 'open').length;
        const contacted = this.leads.filter(l => l.status === 'contacted').length;
        const emailFound = this.leads.filter(l => l.email).length;
        const noEmail = this.leads.filter(l => !l.email).length;
        const closed = this.leads.filter(l => l.status === 'closed').length;

        document.getElementById('totalLeads').innerText = totalLeads;
        document.getElementById('openLeads').innerText = openLeads;
        document.getElementById('contactedCount').innerText = contacted;
        document.getElementById('emailFoundCount').innerText = emailFound;
        document.getElementById('noEmailCount').innerText = noEmail;
        document.getElementById('closedCount').innerText = closed;
    },

    exportToExcel: function() {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Business name,Address,Website,Email,Status\n";
        this.leads.forEach(l => {
            csvContent += `"${l.name}","${l.address}","${l.website}","${l.email}","${l.status}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "leads_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

window.addEventListener('DOMContentLoaded', () => app.init());
