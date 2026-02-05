let leads = [];

const app = {
    csvFile: null,

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        this.csvFile = file;
        this.readCSV(file);
    },

    readCSV(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            this.parseCSV(text);
        };
        reader.readAsText(file);
    },

    parseCSV(text) {
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.replace(/"/g,'').trim());
        leads = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g,'').trim());
            let obj = {};
            headers.forEach((h, i) => obj[h] = values[i] || '');
            obj.combinedAddress = `${obj['Address'] || ''} ${obj['City, State'] || ''}`.trim();
            obj.status = 'Open';
            obj.email = '';
            return obj;
        });

        document.getElementById('totalLeads').innerText = leads.length;
        this.renderLeads();
    },

    renderLeads() {
        const container = document.getElementById('leadsList');
        container.innerHTML = '';
        leads.forEach((lead, index) => {
            const div = document.createElement('div');
            div.className = 'lead-item';
            div.innerHTML = `
                <strong>${lead['Business Name']}</strong><br>
                ${lead.combinedAddress}<br>
                Website: ${lead['Website']}<br>
                Status: ${lead.status} 
                <button onclick="app.promptEmail(${index})">Has Email</button>
            `;
            container.appendChild(div);
        });
    },

    promptEmail(index) {
        const email = prompt(`Enter email for ${leads[index]['Business Name']}:`);
        if (email) {
            leads[index].email = email;
            this.updateStats();
        }
    },

    async processLeads() {
        if (!leads.length) return alert('Upload CSV first!');
        const loading = document.getElementById('loadingState');
        loading.style.display = 'block';

        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];

            // Simulate website check
            await new Promise(r => setTimeout(r, 200)); // simulate delay
            lead.status = Math.random() < 0.7 ? 'Open' : 'Closed';

            // update progress
            const progress = Math.round(((i+1)/leads.length)*100);
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressText').innerText = `${i+1}/${leads.length}`;
            this.renderLeads();
            this.updateStats();
        }

        loading.style.display = 'none';
        alert('Processing complete!');
    },

    updateStats() {
        const open = leads.filter(l => l.status === 'Open').length;
        const emailFound = leads.filter(l => l.email).length;

        document.getElementById('openLeads').innerText = open;
        document.getElementById('emailFoundCount').innerText = emailFound;
    },

    exportToExcel() {
        if (!leads.length) return alert('No leads to export!');
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ['Business Name', 'combinedAddress', 'Website', 'Status', 'Email'];
        csvContent += headers.join(',') + '\n';
        leads.forEach(l => {
            csvContent += `${l['Business Name']},${l.combinedAddress},${l['Website']},${l.status},${l.email || ''}\n`;
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

// Event listeners
document.getElementById('csvFileInput').addEventListener('change', (e) => app.handleCSVUpload(e));
document.getElementById('processBtn').addEventListener('click', () => app.processLeads());
document.getElementById('exportBtn').addEventListener('click', () => app.exportToExcel());

document.getElementById('searchInput').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = leads.filter(l => l['Business Name'].toLowerCase().includes(search));
    const container = document.getElementById('leadsList');
    container.innerHTML = '';
    filtered.forEach((lead, index) => {
        const div = document.createElement('div');
        div.className = 'lead-item';
        div.innerHTML = `
            <strong>${lead['Business Name']}</strong><br>
            ${lead.combinedAddress}<br>
            Website: ${lead['Website']}<br>
            Status: ${lead.status} 
            <button onclick="app.promptEmail(${index})">Has Email</button>
        `;
        container.appendChild(div);
    });
});
