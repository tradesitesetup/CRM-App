let app = {
    leads: [],
    filteredLeads: [],
    csvData: null,

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            this.csvData = this.parseCSV(text);
            this.filteredLeads = [...this.csvData];
            this.updateStats();
            this.renderLeads();
        };
        reader.readAsText(file);
    },

    parseCSV(csvText) {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const cols = line.split(',');
            let obj = {};
            headers.forEach((h, idx) => {
                obj[h] = cols[idx] ? cols[idx].trim() : '';
            });
            return obj;
        });
    },

    processLeads() {
        if (!this.filteredLeads || !this.filteredLeads.length) return;

        document.getElementById('loadingState').style.display = 'block';
        const total = this.filteredLeads.length;

        this.filteredLeads.forEach((lead, idx) => {
            // Simulate website check
            lead.status = Math.random() > 0.5 ? 'Open' : 'Down';
            if (lead.status === 'Down') {
                const hasEmail = confirm(`Enter email for ${lead['Business Name']}?`);
                if (hasEmail) {
                    lead.email = prompt(`Email for ${lead['Business Name']}:`) || '';
                    lead.status = 'Email Found';
                } else {
                    lead.email = '';
                    lead.status = 'No Email';
                }
            }

            const progressPercent = Math.round(((idx + 1) / total) * 100);
            document.getElementById('progressFill').style.width = progressPercent + '%';
            document.getElementById('progressText').innerText = `Processing ${idx + 1}/${total}`;
        });

        document.getElementById('loadingState').style.display = 'none';
        this.updateStats();
        this.renderLeads();
    },

    updateStats() {
        const total = this.filteredLeads.length;
        const open = this.filteredLeads.filter(l => l.status === 'Open').length;
        const contacted = this.filteredLeads.filter(l => l.status === 'Contacted').length;
        const emailFound = this.filteredLeads.filter(l => l.status === 'Email Found').length;
        const noEmail = this.filteredLeads.filter(l => l.status === 'No Email').length;

        document.getElementById('totalLeads').innerText = total;
        document.getElementById('openLeads').innerText = open;
        document.getElementById('contactedCount').innerText = contacted;
        document.getElementById('emailFoundCount').innerText = emailFound;
        document.getElementById('noEmailCount').innerText = noEmail;
    },

    renderLeads() {
        const container = document.getElementById('leadsList');
        container.innerHTML = '';
        this.filteredLeads.forEach(lead => {
            const div = document.createElement('div');
            div.className = 'lead-item';
            div.innerHTML = `<span>${lead['Business Name']} - ${lead['Address']} ${lead['City, State']}</span><span>${lead.status}</span>`;
            container.appendChild(div);
        });
    },

    exportToExcel() {
        if (!this.filteredLeads || !this.filteredLeads.length) return;
        const csvContent = [
            Object.keys(this.filteredLeads[0]).join(','),
            ...this.filteredLeads.map(l => Object.values(l).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "leads_export.csv";
        link.click();
    }
};

// Event listeners
document.getElementById('csvFileInput').addEventListener('change', (e) => app.handleCSVUpload(e));
document.getElementById('processCSVBtn').addEventListener('click', () => app.processLeads());
document.getElementById('exportBtn').addEventListener('click', () => app.exportToExcel());
